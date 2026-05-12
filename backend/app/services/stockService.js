import Product from "../models/product.js";
import StockHistory from "../models/stockHistory.js";

const ONLINE_RESERVATION_MS = () =>
  parseInt(process.env.ONLINE_STOCK_RESERVATION_MS || "900000", 10);

export function computeStockReservationWindow(paymentMode) {
  const now = new Date();
  if (String(paymentMode || "").toUpperCase() !== "ONLINE") {
    return {
      status: "COMMITTED",
      reservedAt: now,
      expiresAt: null,
      releasedAt: null,
    };
  }
  return {
    status: "RESERVED",
    reservedAt: now,
    expiresAt: new Date(now.getTime() + ONLINE_RESERVATION_MS()),
    releasedAt: null,
  };
}

export async function reserveStockForItems({
  items,
  sellerId,
  orderId,
  session,
  paymentMode = "COD",
}) {
  const stockType = String(paymentMode || "").toUpperCase() === "ONLINE" ? "Reservation" : "Sale";

  for (const item of items) {
    const variantId = item.variantSku || item.variantSlot;
    let updated;

    if (variantId) {
      // Update specific variant stock
      updated = await Product.findOneAndUpdate(
        {
          _id: item.productId,
          "variants.sku": variantId,
          "variants.stock": { $gte: item.quantity },
        },
        {
          $inc: { "variants.$.stock": -item.quantity },
        },
        {
          new: true,
          session,
        }
      );

      // Fallback: If variant SKU not found, try matching by variant name or slot
      if (!updated) {
        updated = await Product.findOneAndUpdate(
          {
            _id: item.productId,
            variants: {
              $elemMatch: {
                name: variantId,
                stock: { $gte: item.quantity }
              }
            }
          },
          {
            $inc: { "variants.$.stock": -item.quantity }
          },
          {
            new: true,
            session
          }
        );
      }
    } else {
      // Update top-level master stock
      updated = await Product.findOneAndUpdate(
        {
          _id: item.productId,
          stock: { $gte: item.quantity },
        },
        {
          $inc: { stock: -item.quantity },
        },
        {
          new: true,
          session,
        },
      );
    }

    if (!updated) {
      const err = new Error(`Insufficient stock for product: ${item.productName || 'Item'}`);
      err.statusCode = 409;
      throw err;
    }

    await StockHistory.create(
      [
        {
          product: item.productId,
          seller: sellerId,
          type: stockType,
          quantity: -item.quantity,
          note: `Order #${orderId} ${stockType.toLowerCase()}${variantId ? ` (Variant: ${variantId})` : ''}`,
        },
      ],
      { session },
    );
  }
}

export async function releaseReservedStockForOrder(order, { session = null, reason = "Reservation released" } = {}) {
  if (!order || !Array.isArray(order.items) || order.items.length === 0) {
    return false;
  }

  const reservation = order.stockReservation || {};
  if (reservation.status === "RELEASED") {
    return false;
  }

  for (const item of order.items) {
    const variantId = item.variantSku || item.variantSlot;
    
    if (variantId) {
      await Product.updateOne(
        { 
          _id: item.product,
          $or: [
            { "variants.sku": variantId },
            { "variants.name": variantId }
          ]
        },
        { $inc: { "variants.$.stock": item.quantity } },
        session ? { session } : {}
      );
    } else {
      await Product.updateOne(
        { _id: item.product },
        { $inc: { stock: item.quantity } },
        session ? { session } : {},
      );
    }

    await StockHistory.create(
      [
        {
          product: item.product,
          seller: order.seller,
          type: "Release",
          quantity: item.quantity,
          note: `Order #${order.orderId} ${reason}${variantId ? ` (Variant: ${variantId})` : ''}`,
          order: order._id,
        },
      ],
      session ? { session } : {},
    );
  }

  order.stockReservation = {
    ...(order.stockReservation || {}),
    status: "RELEASED",
    releasedAt: new Date(),
  };

  return true;
}
