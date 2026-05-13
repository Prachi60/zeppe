import mongoose from "mongoose";
import crypto from "crypto";
import Order from "../models/order.js";
import DeliveryAssignment from "../models/deliveryAssignment.js";
import OrderOtp from "../models/orderOtp.js";
import Seller from "../models/seller.js";
import User from "../models/customer.js";
import {
  WORKFLOW_STATUS,
  legacyStatusFromWorkflow,
  workflowFromLegacyStatus,
  DEFAULT_SELLER_TIMEOUT_MS,
  DEFAULT_DELIVERY_TIMEOUT_MS,
} from "../constants/orderWorkflow.js";
import { compensateOrderCancellation } from "./orderCompensation.js";
import {
  sellerTimeoutQueue,
  deliveryTimeoutQueue,
  JOB_NAMES,
} from "../queues/orderQueues.js";
import { getRedisClient } from "../config/redis.js";
import {
  emitOrderStatusUpdate,
  emitToSeller,
  emitDeliveryBroadcastForSeller,
  emitToCustomer,
  retractDeliveryBroadcastForOrder,
} from "./orderSocketEmitter.js";
import { distanceMeters } from "../utils/geoUtils.js";
import { applyDeliveredSettlement } from "./orderSettlement.js";
import { requireCanonicalOrderId } from "../utils/orderLookup.js";
import { emitNotificationEvent } from "../modules/notifications/notification.emitter.js";
import { NOTIFICATION_EVENTS } from "../modules/notifications/notification.constants.js";

const DELIVERY_SEARCH_MAX_ATTEMPTS = () =>
  parseInt(process.env.DELIVERY_SEARCH_MAX_ATTEMPTS || "3", 10);

const DELIVERY_RADIUS_MULTIPLIER = () =>
  parseFloat(process.env.DELIVERY_RADIUS_MULTIPLIER || "1.5");
const INITIAL_DELIVERY_RADIUS_M = () =>
  parseInt(process.env.INITIAL_DELIVERY_RADIUS_METERS || "5000", 10);

/** Payload for `delivery:broadcast` + Notification.data — lets the app show a modal without relying on GET /available alone. */
function deliveryBroadcastPayloadFromOrder(order, extra = {}) {
  const seller =
    order.seller && typeof order.seller === "object" && order.seller !== null
      ? order.seller
      : null;
  const pickup = seller?.shopName || "Seller";
  const drop =
    typeof order.address?.address === "string" && order.address.address.trim()
      ? order.address.address.trim()
      : "Customer address";
  const meta = order.deliverySearchMeta || {};
  const sid = seller?._id ?? order.seller;
  return {
    orderId: order.orderId,
    workflowStatus: order.workflowStatus || WORKFLOW_STATUS.DELIVERY_SEARCH,
    sellerId: sid != null ? String(sid) : undefined,
    radiusMeters: meta.radiusMeters ?? INITIAL_DELIVERY_RADIUS_M(),
    preview: {
      pickup,
      drop,
      total: order.pricing?.total ?? 0,
    },
    deliverySearchExpiresAt: order.deliverySearchExpiresAt,
    ...extra,
  };
}
const PICKUP_RADIUS_M = () =>
  parseInt(process.env.PICKUP_RADIUS_METERS || "150", 10);
const OTP_RADIUS_M = () =>
  parseInt(process.env.DELIVERY_OTP_RADIUS_METERS || "150", 10);
const OTP_EXPIRY_MS = () =>
  parseInt(process.env.DELIVERY_OTP_EXPIRY_MS || "300000", 10);

export function resolveWorkflowStatus(order) {
  if (order.workflowVersion >= 2 && order.workflowStatus) {
    return order.workflowStatus;
  }
  return workflowFromLegacyStatus(order.status);
}

/**
 * After creating a new order document (v2), schedule seller timeout and emit.
 */
export async function afterPlaceOrderV2(orderDoc) {
  const orderId = orderDoc.orderId;
  await scheduleSellerTimeoutJob(orderId);
  emitToSeller(orderDoc.seller?.toString(), {
    event: "order:new",
    payload: {
      orderId,
      workflowStatus: WORKFLOW_STATUS.SELLER_PENDING,
      sellerPendingExpiresAt: orderDoc.sellerPendingExpiresAt,
    },
  });
}

const BULL_ADD_TIMEOUT_MS = () =>
  parseInt(process.env.BULL_ADD_TIMEOUT_MS || "10000", 10);

export async function scheduleSellerTimeoutJob(orderId) {
  const delay = DEFAULT_SELLER_TIMEOUT_MS();
  const addPromise = sellerTimeoutQueue
    .add(
      JOB_NAMES.SELLER_TIMEOUT,
      { orderId },
      {
        delay,
        jobId: `order:${orderId}:seller`,
        removeOnComplete: true,
      },
    )
    .catch((err) => {
      console.warn("[scheduleSellerTimeoutJob] add failed", orderId, err.message);
    });
  const timeoutMs = BULL_ADD_TIMEOUT_MS();
  try {
    await Promise.race([
      addPromise,
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error(`seller-timeout queue add exceeded ${timeoutMs}ms`)),
          timeoutMs,
        ),
      ),
    ]);
  } catch (e) {
    console.warn("[scheduleSellerTimeoutJob]", orderId, e.message);
  }
}

export async function removeSellerTimeoutJob(orderId) {
  const timeoutMs = BULL_ADD_TIMEOUT_MS();
  const work = (async () => {
    const job = await sellerTimeoutQueue.getJob(`order:${orderId}:seller`);
    if (job) await job.remove();
  })().catch((err) => {
    console.warn("[removeSellerTimeoutJob] get/remove failed", orderId, err.message);
  });
  try {
    await Promise.race([
      work,
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error(`remove seller job exceeded ${timeoutMs}ms`)),
          timeoutMs,
        ),
      ),
    ]);
  } catch (e) {
    console.warn("[removeSellerTimeoutJob]", orderId, e.message);
  }
}

export async function scheduleDeliveryTimeoutJob(orderId, attempt = 1) {
  const delay = DEFAULT_DELIVERY_TIMEOUT_MS();
  const jobId = `order:${orderId}:delivery:${attempt}`;
  const addPromise = deliveryTimeoutQueue
    .add(
      JOB_NAMES.DELIVERY_TIMEOUT,
      { orderId, attempt },
      {
        delay,
        jobId,
        removeOnComplete: true,
      },
    )
    .catch((err) => {
      console.warn(
        "[scheduleDeliveryTimeoutJob] add failed",
        orderId,
        err.message,
      );
    });
  const timeoutMs = BULL_ADD_TIMEOUT_MS();
  try {
    await Promise.race([
      addPromise,
      new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(`delivery-timeout queue add exceeded ${timeoutMs}ms`),
            ),
          timeoutMs,
        ),
      ),
    ]);
  } catch (e) {
    console.warn("[scheduleDeliveryTimeoutJob]", orderId, e.message);
  }
}

export async function removeDeliveryTimeoutJob(orderId, attempt = 1) {
  const timeoutMs = BULL_ADD_TIMEOUT_MS();
  const jobKey = `order:${orderId}:delivery:${attempt}`;
  const work = (async () => {
    const job = await deliveryTimeoutQueue.getJob(jobKey);
    if (job) await job.remove();
  })().catch((err) => {
    console.warn("[removeDeliveryTimeoutJob] get/remove failed", orderId, err.message);
  });
  try {
    await Promise.race([
      work,
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error(`remove delivery job exceeded ${timeoutMs}ms`)),
          timeoutMs,
        ),
      ),
    ]);
  } catch (e) {
    console.warn("[removeDeliveryTimeoutJob]", orderId, e.message);
  }
}

/**
 * Seller accepts: SELLER_PENDING -> DELIVERY_SEARCH (atomic).
 */
export async function sellerAcceptAtomic(sellerId, orderId) {
  orderId = await requireCanonicalOrderId(orderId);
  const now = new Date();
  const sellerMs = DEFAULT_SELLER_TIMEOUT_MS();
  const deliveryMs = DEFAULT_DELIVERY_TIMEOUT_MS();

  const updated = await Order.findOneAndUpdate(
    {
      orderId,
      seller: sellerId,
      workflowVersion: { $gte: 2 },
      workflowStatus: WORKFLOW_STATUS.SELLER_PENDING,
      sellerPendingExpiresAt: { $gt: now },
      $or: [
        { paymentMode: { $ne: "ONLINE" } },
        { paymentStatus: "PAID" },
      ],
    },
    {
      $set: {
        workflowStatus: WORKFLOW_STATUS.DELIVERY_SEARCH,
        status: legacyStatusFromWorkflow(WORKFLOW_STATUS.DELIVERY_SEARCH),
        sellerAcceptedAt: now,
        deliverySearchExpiresAt: new Date(now.getTime() + deliveryMs),
        deliverySearchMeta: {
          radiusMeters: INITIAL_DELIVERY_RADIUS_M(),
          attempt: 1,
          lastBroadcastAt: now,
        },
      },
      // CRITICAL FIX: Remove expiresAt to prevent TTL index from auto-deleting the order
      $unset: { expiresAt: 1 },
    },
    { new: true },
  )
    .populate("customer", "name phone")
    .populate("seller", "shopName address name location serviceRadius");

  if (!updated) {
    const err = new Error("Order not available for acceptance or expired");
    err.statusCode = 409;
    throw err;
  }

  await removeSellerTimeoutJob(orderId);
  await scheduleDeliveryTimeoutJob(orderId, 1);

  await DeliveryAssignment.create({
    orderMongoId: updated._id,
    orderId: updated.orderId,
    status: "broadcasting",
    radiusMeters: INITIAL_DELIVERY_RADIUS_M(),
    attempt: 1,
    expiresAt: updated.deliverySearchExpiresAt,
  });

  emitOrderStatusUpdate(
    updated.orderId,
    {
      workflowStatus: WORKFLOW_STATUS.DELIVERY_SEARCH,
      deliverySearchExpiresAt: updated.deliverySearchExpiresAt,
    },
    updated.customer?._id || updated.customer,
  );
  await emitDeliveryBroadcastForSeller(
    updated.seller,
    deliveryBroadcastPayloadFromOrder(updated),
  );

  emitNotificationEvent(NOTIFICATION_EVENTS.ORDER_CONFIRMED, {
    orderId: updated.orderId,
    customerId: updated.customer?._id || updated.customer,
    userId: updated.customer?._id || updated.customer,
    sellerId: updated.seller?._id || updated.seller,
  });

  return updated;
}

/**
 * Seller rejects: SELLER_PENDING -> CANCELLED + compensation.
 */
export async function sellerRejectAtomic(sellerId, orderId) {
  orderId = await requireCanonicalOrderId(orderId);
  const now = new Date();
  const order = await Order.findOneAndUpdate(
    {
      orderId,
      seller: sellerId,
      workflowVersion: { $gte: 2 },
      workflowStatus: { $ne: WORKFLOW_STATUS.CANCELLED }, // Prevent double cancellation
    },
    {
      $set: {
        workflowStatus: WORKFLOW_STATUS.SELLER_CANCELLED,
        status: "cancelled",
        cancelledBy: "SELLER",
        cancelReason: "Rejected by seller",
        cancelledAt: now,
        isBroadcastStopped: true,
      },
    },
    { new: true },
  );

  if (!order) {
    const err = new Error("Order not available to reject or already cancelled");
    err.statusCode = 409;
    throw err;
  }

  await removeSellerTimeoutJob(orderId);
  await removeDeliveryTimeoutJob(orderId, order.deliverySearchMeta?.attempt || 1);
  await retractDeliveryBroadcastForOrder(order.orderId, null, "CANCELLED"); // Stop broadcast for everyone
  
  await compensateOrderCancellation(order, orderId);

  emitOrderStatusUpdate(order.orderId, {
    workflowStatus: WORKFLOW_STATUS.SELLER_CANCELLED,
    isBroadcastStopped: true,
    cancelledBy: "SELLER",
    cancelledAt: order.cancelledAt,
  }, order.customer);

  // Notify seller panel too
  emitToSeller(sellerId, {
    event: "order:cancelled",
    payload: { orderId: order.orderId, status: WORKFLOW_STATUS.SELLER_CANCELLED }
  });

  emitNotificationEvent(NOTIFICATION_EVENTS.ORDER_CANCELLED, {
    orderId: order.orderId,
    customerId: order.customer,
    userId: order.customer,
    sellerId: order.seller,
    customerMessage: "Your order was cancelled by the seller.",
    sellerMessage: `Order #${order.orderId} was cancelled.`,
  });
  return order;
}

function toDeliveryObjectId(deliveryId) {
  if (deliveryId == null) return null;
  try {
    const s = String(deliveryId);
    if (!mongoose.Types.ObjectId.isValid(s)) return null;
    return new mongoose.Types.ObjectId(s);
  } catch {
    return null;
  }
}

/**
 * First delivery partner to accept wins (atomic).
 */
export async function deliveryAcceptAtomic(deliveryId, orderId, idempotencyKey) {
  orderId = await requireCanonicalOrderId(orderId);
  const deliveryOid = toDeliveryObjectId(deliveryId);
  if (!deliveryOid) {
    const err = new Error("Invalid delivery account");
    err.statusCode = 400;
    throw err;
  }

  if (idempotencyKey) {
    try {
      const redis = getRedisClient();
      if (redis) {
        const cacheKey = `idem:delivery_accept:${orderId}:${idempotencyKey}`;
        const hit = await redis.get(cacheKey);
        if (hit) {
          const order = await Order.findOne({ orderId }).lean();
          return { order, duplicate: true };
        }
      }
    } catch {
      /* idempotency optional if Redis unavailable */
    }
  }

  const now = new Date();
  const updated = await Order.findOneAndUpdate(
    {
      orderId,
      workflowVersion: { $gte: 2 },
      workflowStatus: WORKFLOW_STATUS.DELIVERY_SEARCH,
      deliveryBoy: null,
      isBroadcastStopped: { $ne: true },
      deliverySearchExpiresAt: { $gt: now },
      skippedBy: { $nin: [deliveryOid] },
    },
    {
      $set: {
        deliveryBoy: deliveryOid,
        workflowStatus: WORKFLOW_STATUS.DELIVERY_ASSIGNED,
        status: legacyStatusFromWorkflow(WORKFLOW_STATUS.DELIVERY_ASSIGNED),
        assignedAt: now,
        deliveryRiderStep: 1,
      },
      $inc: { assignmentVersion: 1 },
    },
    { new: true },
  );

  if (!updated) {
    const o = await Order.findOne({ orderId }).lean();
    if (!o) {
      const err = new Error("Order not found");
      err.statusCode = 404;
      throw err;
    }
    let msg = "Order already assigned or not available";
    if (o.deliverySearchExpiresAt && new Date(o.deliverySearchExpiresAt) <= now) {
      msg =
        "Accept window has expired. Wait for the next delivery request.";
    } else if (o.deliveryBoy) {
      msg = "Another rider already accepted this order.";
    } else if (
      (o.skippedBy || []).some((id) => id.toString() === deliveryOid.toString())
    ) {
      msg =
        "You rejected this order earlier, so it cannot be accepted now.";
    } else if (o.workflowStatus !== WORKFLOW_STATUS.DELIVERY_SEARCH) {
      msg = "This order is no longer open for delivery.";
    }
    const err = new Error(msg);
    err.statusCode = 409;
    throw err;
  }

  await removeDeliveryTimeoutJob(orderId, updated.deliverySearchMeta?.attempt || 1);

  const lastBroadcast = await DeliveryAssignment.findOne({
    orderId,
    status: "broadcasting",
  }).sort({ createdAt: -1 });
  if (lastBroadcast) {
    lastBroadcast.status = "assigned";
    lastBroadcast.winnerDeliveryId = deliveryOid;
    await lastBroadcast.save();
  }

  if (idempotencyKey) {
    try {
      const redis = getRedisClient();
      if (redis) {
        await redis.set(
          `idem:delivery_accept:${orderId}:${idempotencyKey}`,
          "1",
          "EX",
          86400,
        );
      }
    } catch {
      /* ignore */
    }
  }

  emitNotificationEvent(NOTIFICATION_EVENTS.DELIVERY_ASSIGNED, {
    orderId: updated.orderId,
    deliveryId: deliveryOid,
    customerId: updated.customer,
    sellerId: updated.seller,
  });

  await retractDeliveryBroadcastForOrder(updated.orderId, deliveryOid);

  emitOrderStatusUpdate(
    updated.orderId,
    {
      workflowStatus: WORKFLOW_STATUS.DELIVERY_ASSIGNED,
      deliveryBoyId: deliveryOid.toString(),
    },
    updated.customer,
  );

  return { order: updated, duplicate: false };
}

export async function processSellerTimeoutJob({ orderId }) {
  const now = new Date();
  const order = await Order.findOne({ orderId, workflowVersion: { $gte: 2 } });
  if (!order || order.workflowStatus !== WORKFLOW_STATUS.SELLER_PENDING) return;

  if (order.sellerPendingExpiresAt && order.sellerPendingExpiresAt > now) {
    return;
  }

  const updated = await Order.findOneAndUpdate(
    {
      orderId,
      workflowVersion: { $gte: 2 },
      workflowStatus: WORKFLOW_STATUS.SELLER_PENDING,
    },
    {
      $set: {
        workflowStatus: WORKFLOW_STATUS.SYSTEM_CANCELLED,
        status: "cancelled",
        cancelledBy: "SYSTEM",
        cancelReason: "Seller timeout (5m)",
        cancelledAt: now,
        isBroadcastStopped: true,
      },
    },
    { new: true },
  );

  if (!updated) return;

  await compensateOrderCancellation(updated, orderId);

  emitOrderStatusUpdate(orderId, {
    workflowStatus: WORKFLOW_STATUS.SYSTEM_CANCELLED,
    isBroadcastStopped: true,
    cancelledBy: "SYSTEM",
    cancelledAt: updated.cancelledAt,
  }, updated.customer);
  emitNotificationEvent(NOTIFICATION_EVENTS.ORDER_CANCELLED, {
    orderId: updated.orderId,
    customerId: updated.customer,
    userId: updated.customer,
    sellerId: updated.seller,
    customerMessage: "Your order was cancelled because seller did not accept in time.",
    sellerMessage: `Order #${updated.orderId} was cancelled due to timeout.`,
  });
}

export async function processDeliveryTimeoutJob({ orderId, attempt }) {
  logger.info("SELLER_IN_COMMAND: Automated delivery timeout suppressed.", { orderId, attempt });
  return;
}

async function _legacy_processDeliveryTimeoutJob({ orderId, attempt }) {
  // Logic disabled in favor of seller manual control.
  return;
}

export async function customerCancelV2(customerId, orderId, reason) {
  orderId = await requireCanonicalOrderId(orderId);
  const now = new Date();
  const order = await Order.findOne({ orderId, customer: customerId });
  if (!order) {
    const err = new Error("Order not found");
    err.statusCode = 404;
    throw err;
  }

  // Window validation (3 minutes)
  if (order.cancelWindowExpiresAt && order.cancelWindowExpiresAt < now) {
    const err = new Error("Cancellation window has expired (3 minutes limit)");
    err.statusCode = 400;
    throw err;
  }

  const ws = resolveWorkflowStatus(order);
  const ALLOWED_WS_FOR_CANCEL = [
    WORKFLOW_STATUS.CREATED,        // freshly placed, seller not yet notified
    WORKFLOW_STATUS.SELLER_PENDING, // seller hasn't accepted yet
    WORKFLOW_STATUS.SELLER_ACCEPTED, // seller accepted but still within cancel window
    WORKFLOW_STATUS.DELIVERY_SEARCH,  // finding a rider
    WORKFLOW_STATUS.DELIVERY_ASSIGNED, // rider assigned but not picked up
    WORKFLOW_STATUS.PICKUP_READY, // seller marked ready; still allow within window
  ];

  if (!ALLOWED_WS_FOR_CANCEL.includes(ws)) {
    const err = new Error("Order cannot be cancelled at this stage");
    err.statusCode = 400;
    throw err;
  }

  // Atomic update — also handles null/missing workflowStatus (legacy orders still in pending)
  const updated = await Order.findOneAndUpdate(
    {
      orderId,
      customer: customerId,
      $or: [
        { workflowStatus: { $in: ALLOWED_WS_FOR_CANCEL } },
        // Null workflowStatus means order was placed but workflow not yet initialised
        { workflowStatus: { $exists: false } },
        { workflowStatus: null },
      ],
    },
    {
      $set: {
        workflowStatus: WORKFLOW_STATUS.USER_CANCELLED,
        status: "cancelled",
        cancelledBy: "USER",
        cancelReason: reason || "Cancelled by customer",
        cancelledAt: now,
        isBroadcastStopped: true,
      },
    },
    { new: true },
  );

  if (!updated) {
    const err = new Error("Unable to cancel order. It might have progressed or already been cancelled.");
    err.statusCode = 400;
    throw err;
  }

  // Cleanup & Notifications
  await removeSellerTimeoutJob(orderId);
  await removeDeliveryTimeoutJob(orderId, updated.deliverySearchMeta?.attempt || 1);
  await retractDeliveryBroadcastForOrder(updated.orderId, null, "CANCELLED"); // Invalidate all active broadcasts

  await compensateOrderCancellation(updated, orderId);

  // Real-time updates
  emitOrderStatusUpdate(orderId, {
    workflowStatus: WORKFLOW_STATUS.USER_CANCELLED,
    isBroadcastStopped: true,
    cancelledBy: "USER",
    cancelledAt: updated.cancelledAt,
  }, updated.customer);

  // Notify seller panel instantly
  emitToSeller(updated.seller, {
    event: "order:cancelled",
    payload: {
      orderId: updated.orderId,
      status: WORKFLOW_STATUS.USER_CANCELLED,
      message: "User Cancelled Order"
    }
  });

  // Note: retractDeliveryBroadcastForOrder (called above) already emits 'delivery:broadcast:withdrawn'
  // to all relevant delivery partner sockets — no extra step needed here.

  emitNotificationEvent(NOTIFICATION_EVENTS.ORDER_CANCELLED, {
    orderId: updated.orderId,
    customerId: updated.customer,
    userId: updated.customer,
    sellerId: updated.seller,
    customerMessage: "Your order has been cancelled successfully.",
    sellerMessage: `Order #${updated.orderId} was cancelled by customer.`,
  });

  return updated;
}

/**
 * Rider at seller location — step 1 → 2 (DELIVERY_ASSIGNED → PICKUP_READY).
 */
export async function markArrivedAtStoreAtomic(deliveryId, orderId, lat, lng) {
  orderId = await requireCanonicalOrderId(orderId);
  if (
    typeof lat !== "number" ||
    typeof lng !== "number" ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  ) {
    const err = new Error("Valid lat/lng required");
    err.statusCode = 400;
    throw err;
  }

  const order = await Order.findOne({
    orderId,
    deliveryBoy: deliveryId,
    workflowVersion: { $gte: 2 },
  });

  if (!order || order.workflowStatus !== WORKFLOW_STATUS.DELIVERY_ASSIGNED) {
    const err = new Error("Invalid state: arrive at store first");
    err.statusCode = 409;
    throw err;
  }

  const seller = await Seller.findById(order.seller).select("location").lean();
  const coords = seller?.location?.coordinates;
  if (!Array.isArray(coords) || coords.length < 2) {
    const err = new Error("Seller location not configured");
    err.statusCode = 400;
    throw err;
  }
  const [slng, slat] = coords;
  const d = distanceMeters(lat, lng, slat, slng);
  console.log(`[markArrivedAtStoreAtomic] Rider distance: ${d.toFixed(2)}m (Target: ${slat},${slng})`);
  /*
  if (d > PICKUP_RADIUS_M()) {
    const err = new Error(`Too far from store (>${PICKUP_RADIUS_M()}m)`);
    err.statusCode = 400;
    throw err;
  }
  */

  const now = new Date();
  const updated = await Order.findOneAndUpdate(
    {
      orderId,
      workflowStatus: WORKFLOW_STATUS.DELIVERY_ASSIGNED,
      deliveryBoy: deliveryId,
    },
    {
      $set: {
        workflowStatus: WORKFLOW_STATUS.PICKUP_READY,
        status: legacyStatusFromWorkflow(WORKFLOW_STATUS.PICKUP_READY),
        pickupReadyAt: now,
        deliveryRiderStep: 2,
      },
    },
    { new: true },
  );

  if (!updated) {
    const err = new Error("Could not mark arrived at store");
    err.statusCode = 409;
    throw err;
  }

  emitOrderStatusUpdate(
    orderId,
    { workflowStatus: WORKFLOW_STATUS.PICKUP_READY },
    updated.customer,
  );
  emitNotificationEvent(NOTIFICATION_EVENTS.ORDER_PACKED, {
    orderId: updated.orderId,
    customerId: updated.customer,
    userId: updated.customer,
    sellerId: updated.seller,
    deliveryId: updated.deliveryBoy,
  });
  emitNotificationEvent(NOTIFICATION_EVENTS.ORDER_READY, {
    orderId: updated.orderId,
    deliveryId: updated.deliveryBoy,
    sellerId: updated.seller,
  });
  return updated;
}

export async function confirmPickupAtomic(deliveryId, orderId, lat, lng) {
  orderId = await requireCanonicalOrderId(orderId);
  if (
    typeof lat !== "number" ||
    typeof lng !== "number" ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  ) {
    const err = new Error("Valid lat/lng required");
    err.statusCode = 400;
    throw err;
  }

  const order = await Order.findOne({
    orderId,
    deliveryBoy: deliveryId,
    workflowVersion: { $gte: 2 },
  });

  const prePickup = new Set([
    WORKFLOW_STATUS.DELIVERY_ASSIGNED,
    WORKFLOW_STATUS.PICKUP_READY,
  ]);
  if (!order || !prePickup.has(order.workflowStatus)) {
    const err = new Error("Invalid state for pickup confirmation");
    err.statusCode = 409;
    throw err;
  }

  const seller = await Seller.findById(order.seller).select("location").lean();
  const coords = seller?.location?.coordinates;
  if (!Array.isArray(coords) || coords.length < 2) {
    const err = new Error("Seller location not configured");
    err.statusCode = 400;
    throw err;
  }
  const [slng, slat] = coords;
  const d = distanceMeters(lat, lng, slat, slng);
  console.log(`[confirmPickupAtomic] Rider distance: ${d.toFixed(2)}m (Target: ${slat},${slng})`);
  /*
  if (d > PICKUP_RADIUS_M()) {
    const err = new Error(`Too far from store (>${PICKUP_RADIUS_M()}m)`);
    err.statusCode = 400;
    throw err;
  }
  */

  const now = new Date();
  const updated = await Order.findOneAndUpdate(
    {
      orderId,
      workflowStatus: { $in: [...prePickup] },
      deliveryBoy: deliveryId,
    },
    {
      $set: {
        workflowStatus: WORKFLOW_STATUS.OUT_FOR_DELIVERY,
        status: legacyStatusFromWorkflow(WORKFLOW_STATUS.OUT_FOR_DELIVERY),
        pickupConfirmedAt: now,
        outForDeliveryAt: now,
        deliveryRiderStep: 3,
      },
    },
    { new: true },
  );

  if (!updated) {
    const err = new Error("Pickup confirm failed");
    err.statusCode = 409;
    throw err;
  }

  emitOrderStatusUpdate(
    orderId,
    {
      workflowStatus: WORKFLOW_STATUS.OUT_FOR_DELIVERY,
    },
    updated.customer,
  );
  emitNotificationEvent(NOTIFICATION_EVENTS.OUT_FOR_DELIVERY, {
    orderId: updated.orderId,
    customerId: updated.customer,
    userId: updated.customer,
    deliveryId: updated.deliveryBoy,
    sellerId: updated.seller,
  });
  return updated;
}

/**
 * OUT_FOR_DELIVERY (or legacy out_for_delivery): advance UI step 3 → 4 (near customer / ready for OTP).
 */
export async function advanceDeliveryRiderUiAtomic(deliveryId, orderId) {
  orderId = await requireCanonicalOrderId(orderId);
  const order = await Order.findOne({
    orderId,
    deliveryBoy: deliveryId,
  });

  if (!order) {
    const err = new Error("Order not found");
    err.statusCode = 404;
    throw err;
  }

  const v2 = order.workflowVersion >= 2;
  if (v2) {
    if (order.workflowStatus !== WORKFLOW_STATUS.OUT_FOR_DELIVERY) {
      const err = new Error("Order is not out for delivery");
      err.statusCode = 409;
      throw err;
    }
  } else if (order.status !== "out_for_delivery") {
    const err = new Error("Order is not out for delivery");
    err.statusCode = 409;
    throw err;
  }

  const updated = await Order.findOneAndUpdate(
    {
      _id: order._id,
      deliveryBoy: order.deliveryBoy,
    },
    { $set: { deliveryRiderStep: 4 } },
    { new: true },
  );

  if (!updated) {
    const err = new Error("Could not update progress");
    err.statusCode = 409;
    throw err;
  }

  return updated;
}

export async function requestHandoffOtpAtomic(deliveryId, orderId, lat, lng) {
  orderId = await requireCanonicalOrderId(orderId);
  if (
    typeof lat !== "number" ||
    typeof lng !== "number" ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  ) {
    const err = new Error("Valid lat/lng required");
    err.statusCode = 400;
    throw err;
  }

  const order = await Order.findOne({
    orderId,
    deliveryBoy: deliveryId,
    workflowVersion: { $gte: 2 },
  });

  if (!order || order.workflowStatus !== WORKFLOW_STATUS.OUT_FOR_DELIVERY) {
    const err = new Error("Order not ready for OTP");
    err.statusCode = 409;
    throw err;
  }

  const cust = order.address?.location;
  const hasCoordinates = 
    typeof cust?.lat === "number" &&
    typeof cust?.lng === "number" &&
    Number.isFinite(cust.lat) &&
    Number.isFinite(cust.lng);

  if (hasCoordinates) {
    const d = distanceMeters(lat, lng, cust.lat, cust.lng);
    if (d > OTP_RADIUS_M()) {
      const err = new Error(`Too far from customer (>${OTP_RADIUS_M()}m)`);
      err.statusCode = 400;
      err.code = "PROXIMITY_OUT_OF_RANGE";
      err.details = { currentDistance: Math.round(d), requiredRange: `0-${OTP_RADIUS_M()}m` };
      throw err;
    }
  } else {
    console.warn(`[OTP] Skipping proximity check for order ${orderId} - customer coordinates missing`);
  }

  const redis = getRedisClient();
  if (redis) {
    try {
      const key = `otp_req:${orderId}`;
      const n = await redis.incr(key);
      if (n === 1) await redis.expire(key, 300);
      if (n > 3) {
        const err = new Error("OTP request rate limit exceeded");
        err.statusCode = 429;
        throw err;
      }
    } catch (e) {
      if (e.statusCode === 429) throw e;
    }
  }

  const code = String(crypto.randomInt(1000, 10000));
  const codeHash = OrderOtp.hashCode(code);

  await OrderOtp.updateMany({
    orderId,
    type: 'delivery',
    consumedAt: null,
  }, { consumedAt: new Date() });

  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS());
  await OrderOtp.create({
    orderId,
    orderMongoId: order._id,
    type: 'delivery',
    codeHash,
    expiresAt,
    lastGeneratedAt: new Date(),
  });

  emitToCustomer(order.customer.toString(), {
    event: "order:otp",
    payload: { orderId, code, expiresAt },
  });

  // Emitting the specialized event that DeliveryOtpDisplay expects
  emitToCustomer(order.customer.toString(), {
    event: "delivery:otp:generated",
    payload: {
      orderId,
      otp: code,
      expiresAt,
      deliveryPersonNearby: true
    },
  });
  emitOrderStatusUpdate(orderId, { otpSent: true }, order.customer);

  return { expiresAt, message: "OTP sent to customer" };
}

export async function verifyHandoffOtpAndDeliver(deliveryId, orderId, code) {
  orderId = await requireCanonicalOrderId(orderId);
  const order = await Order.findOne({
    orderId,
    deliveryBoy: deliveryId,
    workflowVersion: { $gte: 2 },
  });

  if (!order) {
    const err = new Error("Order not found or not assigned to you");
    err.statusCode = 404;
    throw err;
  }

  if (order.workflowStatus === WORKFLOW_STATUS.DELIVERED) {
    console.log(`[OTP] Order ${orderId} already delivered, returning success (idempotent)`);
    return order;
  }

  if (order.workflowStatus !== WORKFLOW_STATUS.OUT_FOR_DELIVERY) {
    const err = new Error("Invalid state for delivery completion");
    err.statusCode = 409;
    throw err;
  }

  const otp = await OrderOtp.findOne({
    orderId,
    type: 'delivery',
    consumedAt: null,
  }).sort({ createdAt: -1 });

  let match = false;
  if (otp) {
    if (otp.expiresAt >= new Date() && otp.attempts < otp.maxAttempts) {
      match = OrderOtp.hashCode(String(code)) === otp.codeHash;
      if (!match) {
        await OrderOtp.updateOne({ _id: otp._id }, { $inc: { attempts: 1 } });
      }
    }
  }

  // Fallback to static OTP if dynamic match failed or no dynamic OTP exists
  if (!match) {
    const customer = await User.findById(order.customer);
    if (customer?.deliveryStaticOtp && String(customer.deliveryStaticOtp) === String(code)) {
      console.log(`[OTP] Static OTP match for order ${orderId}`);
      match = true;
    }
  }

  if (!match) {
    const err = new Error("Invalid OTP");
    err.statusCode = 400;
    err.code = "OTP_MISMATCH";
    throw err;
  }

  if (otp && match) {
    await OrderOtp.updateOne(
      { _id: otp._id },
      { $set: { consumedAt: new Date() } },
    );
  }

  const now = new Date();
  const updated = await Order.findOneAndUpdate(
    {
      orderId,
      workflowStatus: WORKFLOW_STATUS.OUT_FOR_DELIVERY,
      deliveryBoy: deliveryId,
    },
    {
      $set: {
        workflowStatus: WORKFLOW_STATUS.DELIVERED,
        status: "delivered",
        deliveredAt: now,
      },
    },
    { new: true },
  );

  if (!updated) {
    const err = new Error("Could not finalize delivery");
    err.statusCode = 409;
    throw err;
  }

  // BUGFIX: Verify customer field is preserved after update
  if (!updated.customer) {
    console.error(`[ORDER_BUG] Customer field lost during delivery completion`, {
      orderId,
      _id: updated._id,
      timestamp: new Date().toISOString(),
    });
    const err = new Error("Order data integrity error: customer reference lost during update");
    err.statusCode = 500;
    throw err;
  }

  await applyDeliveredSettlement(updated, orderId);

  // Assign scratch card if eligible
  try {
    const { assignScratchCard } = await import("./scratchCardService.js");
    await assignScratchCard(updated.customer, updated._id, updated.pricing?.total || updated.paymentBreakdown?.grandTotal || 0);
  } catch (err) {
    console.error("Error in assignScratchCard hook:", err);
  }

  emitOrderStatusUpdate(orderId, { workflowStatus: WORKFLOW_STATUS.DELIVERED }, updated.customer);
  emitNotificationEvent(NOTIFICATION_EVENTS.ORDER_DELIVERED, {
    orderId: updated.orderId,
    customerId: updated.customer,
    userId: updated.customer,
    deliveryId: updated.deliveryBoy,
    sellerId: updated.seller,
  });
  return updated;
}
