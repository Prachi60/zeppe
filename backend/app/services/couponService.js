import Coupon from "../models/coupon.js";
import Order from "../models/order.js";

/**
 * Validates a coupon and computes the discount server-side.
 * Never trust client-side discount calculations.
 */
export async function validateAndComputeCoupon({ code, cartTotal, customerId, session = null }) {
    const now = new Date();
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (session) coupon.session(session);

    if (!coupon) {
        throw new Error("Invalid coupon code");
    }

    if (!coupon.isActive || coupon.validFrom > now || coupon.validTill < now) {
        throw new Error("This coupon is not active");
    }

    // Global usage limit check
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        throw new Error("This coupon has reached its usage limit");
    }

    // Per-user limit enforcement (C-2 FIX)
    if (coupon.perUserLimit && customerId) {
        const userUsageCount = await Order.countDocuments({
            customer: customerId,
            "appliedCoupon.code": coupon.code,
            status: { $nin: ["cancelled"] },
        });
        if (userUsageCount >= coupon.perUserLimit) {
            throw new Error(`You have already used this coupon ${coupon.perUserLimit} time(s)`);
        }
    }

    // Monthly volume eligibility check
    if (coupon.couponType === "monthly_volume" && coupon.monthlyVolumeThreshold && customerId) {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const userOrders = await Order.find({
            customer: customerId,
            createdAt: { $gte: monthStart, $lte: now },
        }).lean();
        const monthlyVolume = userOrders.reduce((sum, o) => sum + (o.pricing?.total || 0), 0);
        
        if (monthlyVolume < coupon.monthlyVolumeThreshold) {
            throw new Error("This coupon is for high‑volume buyers only");
        }
    }

    if (coupon.minOrderValue && cartTotal < coupon.minOrderValue) {
        throw new Error(`Minimum order value should be ₹${coupon.minOrderValue}`);
    }

    let discountAmount = 0;
    let freeDelivery = false;

    if (coupon.discountType === "free_delivery") {
        freeDelivery = true;
    } else if (coupon.discountType === "percentage") {
        discountAmount = Math.round((cartTotal * coupon.discountValue) / 100);
    } else if (coupon.discountType === "fixed") {
        discountAmount = coupon.discountValue;
    }

    if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
    }

    return {
        couponId: coupon._id,
        code: coupon.code,
        discountAmount,
        freeDelivery,
    };
}

export async function incrementCouponUsage(couponId, { session = null } = {}) {
    await Coupon.findByIdAndUpdate(couponId, { $inc: { usedCount: 1 } }, { session });
}

export default {
    validateAndComputeCoupon,
    incrementCouponUsage,
};
