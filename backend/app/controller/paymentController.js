import handleResponse from "../utils/helper.js";
import {
  createPaymentOrderForOrderRef,
  verifyPhonePePaymentStatus,
  processPhonePeWebhook,
} from "../services/paymentService.js";
import {
  createPaymentOrderSchema,
  verifyPaymentClientSchema,
  validateSchema,
} from "../validation/paymentValidation.js";
import SubscriptionPlan from "../models/subscriptionPlan.js";
import Subscription from "../models/subscription.js";
import UserSubscription from "../models/userSubscription.js";
import razorpay from "../config/razorpay.js";
import crypto from "crypto";

export const createPaymentOrder = async (req, res) => {
  try {
    // If planId is provided, handle as subscription order
    if (req.body.planId) {
      return createSubscriptionOrder(req, res);
    }

    const payload = validateSchema(createPaymentOrderSchema, req.body || {});
    const result = await createPaymentOrderForOrderRef({
      orderRef: payload.orderId || payload.orderRef,
      userId: req.user?.id,
      idempotencyKey: req.headers["idempotency-key"] || null,
      correlationId: req.correlationId || null,
    });

    return handleResponse(
      res,
      result.duplicate ? 200 : 201,
      result.duplicate ? "Re-using existing payment" : "Payment initiated",
      {
        payment: result.payment,
        redirectUrl: result.redirectUrl,
        merchantOrderId: result.payment.gatewayOrderId,
      },
    );
  } catch (error) {
    return handleResponse(res, error.statusCode || 500, error.message);
  }
};

export const verifyPaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const merchantOrderId = id || req.query.merchantOrderId;
    
    if (!merchantOrderId) {
        return handleResponse(res, 400, "merchantOrderId is required");
    }

    const verification = await verifyPhonePePaymentStatus({
      merchantOrderId,
      userId: req.user?.id,
      correlationId: req.correlationId || null,
    });

    return handleResponse(res, 200, "Payment status verified", {
      status: verification.status,
      payment: verification.payment,
    });
  } catch (error) {
    return handleResponse(res, error.statusCode || 500, error.message);
  }
};

export const handlePhonePeWebhook = async (req, res) => {
  try {
    const authorization = req.headers["x-verify"] || req.headers["authorization"];
    const rawBody = req.body;

    if (!authorization) {
        console.warn("[PhonePeWebhook] Missing verification header");
        return res.status(401).send("Unauthorized");
    }

    const result = await processPhonePeWebhook({
      rawBody,
      authorization,
      correlationId: req.correlationId || null,
    });

    if (result.accepted) {
      return res.status(200).send("OK");
    }
    
    return res.status(400).send("Bad Request");
  } catch (error) {
    console.error("[PhonePeWebhook] Error processing webhook:", error.message);
    return res.status(500).send("Internal Server Error");
  }
};

export const getPaymentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const merchantOrderId = id;
    
        const verification = await verifyPhonePePaymentStatus({
          merchantOrderId,
          userId: req.user?.id,
          correlationId: req.correlationId || null,
        });
    
        return handleResponse(res, 200, "Payment status retrieved", {
          status: verification.status,
          merchantOrderId: verification.payment.gatewayOrderId,
          amount: verification.payment.amount,
          currency: verification.payment.currency,
        });
      } catch (error) {
        return handleResponse(res, error.statusCode || 500, error.message);
      }
};

// --- Razorpay Subscription APIs ---

export const createSubscriptionOrder = async (req, res) => {
  try {
    if (!razorpay) {
      return handleResponse(
        res,
        500,
        "Razorpay is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET",
      );
    }

    const { planId } = req.body;
    if (!planId) return handleResponse(res, 400, "planId is required");

    const plan = await SubscriptionPlan.findOne({ _id: planId, deletedAt: null });
    if (!plan || !plan.isActive) {
      return handleResponse(res, 404, "Active subscription plan not found");
    }

    const requesterRole = String(req.user?.role || "").toLowerCase();
    const planRole = String(plan.targetRole || plan.role || "").toLowerCase();
    if (requesterRole !== planRole) {
      return handleResponse(res, 403, "This subscription plan is not available for your role");
    }

    const options = {
      amount: Math.round(plan.price * 100), // Amount in paise
      currency: "INR",
      receipt: `sub_${Date.now()}`,
      notes: {
        planId: plan._id.toString(),
        userId: req.user?.id,
        role: plan.role,
      },
    };

    const order = await razorpay.orders.create(options);

    await Subscription.create({
      planId: plan._id,
      userId: req.user?.id,
      userModel: planRole === "seller" ? "Seller" : "Delivery",
      role: planRole,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency || "INR",
      status: "pending",
    });

    return handleResponse(res, 201, "Razorpay order created for subscription", {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      planId: plan._id,
    });
  } catch (error) {
    console.error("[Razorpay] Error creating subscription order:", error);
    return handleResponse(res, 500, error.message);
  }
};

export const verifySubscriptionPayment = async (req, res) => {
  try {
    const razorpaySecret = (process.env.RAZORPAY_KEY_SECRET || "").trim();
    if (!razorpaySecret) {
      return handleResponse(
        res,
        500,
        "Razorpay is not configured. Please set RAZORPAY_KEY_SECRET",
      );
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !planId) {
      return handleResponse(res, 400, "Missing required payment details");
    }

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", razorpaySecret)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return handleResponse(res, 400, "Invalid payment signature");
    }

    const plan = await SubscriptionPlan.findOne({ _id: planId, deletedAt: null });
    if (!plan) return handleResponse(res, 404, "Plan not found");

    const requesterRole = String(req.user?.role || "").toLowerCase();
    const planRole = String(plan.targetRole || plan.role || "").toLowerCase();
    if (requesterRole !== planRole) {
      return handleResponse(res, 403, "This subscription plan is not available for your role");
    }

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    if (plan.duration.unit === "months") {
      endDate.setMonth(endDate.getMonth() + plan.duration.value);
    } else {
      endDate.setDate(endDate.getDate() + plan.duration.value);
    }

    // Determine user model based on role
    const userModel = planRole === "seller" ? "Seller" : "Delivery";

    await UserSubscription.updateMany(
      {
        userId: req.user.id,
        role: planRole,
        status: { $in: ["active", "pending"] },
      },
      {
        $set: {
          status: "cancelled",
          cancelledAt: new Date(),
          cancelledBy: requesterRole || "system",
        },
      },
    );

    // Create UserSubscription
    const userSubscription = await UserSubscription.create({
      userId: req.user.id,
      userModel: userModel,
      role: planRole,
      subscriptionPlanId: plan._id,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      startDate,
      endDate,
      status: "active",
    });

    await Subscription.findOneAndUpdate(
      { orderId: razorpay_order_id },
      {
        $set: {
          userSubscriptionId: userSubscription._id,
          paymentId: razorpay_payment_id,
          status: "active",
          startsAt: startDate,
          endsAt: endDate,
        },
      },
      { new: true },
    );

    return handleResponse(res, 200, "Subscription activated successfully", {
      subscription: userSubscription,
      plan: {
        name: plan.name,
        role: planRole,
        endDate: userSubscription.endDate,
      }
    });
  } catch (error) {
    try {
      if (req.body?.razorpay_order_id) {
        await Subscription.findOneAndUpdate(
          { orderId: req.body.razorpay_order_id },
          { $set: { status: "failed" } },
        );
      }
    } catch (_err) {
      // Ignore tracking update failures.
    }
    console.error("[Razorpay] Error verifying subscription payment:", error);
    return handleResponse(res, 500, error.message);
  }
};
