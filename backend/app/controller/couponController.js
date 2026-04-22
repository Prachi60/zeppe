import Coupon from "../models/coupon.js";
import { createAdminController } from "../utils/controllerFactory.js";
import { handleResponse } from "../utils/helper.js";
import Order from "../models/order.js";

const baseController = createAdminController(Coupon, {
    searchFields: ['code', 'title', 'description'],
    defaultSort: { createdAt: -1 }
});

export const listCoupons = baseController.getAll;
export const createCoupon = baseController.create;
export const updateCoupon = baseController.update;
export const deleteCoupon = baseController.delete;

// Public validation engine kept intact
export const validateCoupon = async (req, res) => {
    try {
        const { code, cartTotal, items, customerId } = req.body;
        if (!code) return handleResponse(res, 400, "Coupon code is required");

        const now = new Date();
        const coupon = await Coupon.findOne({ code: code.toUpperCase() });
        if (!coupon) return handleResponse(res, 404, "Invalid coupon code");

        if (!coupon.isActive || coupon.validFrom > now || coupon.validTill < now) {
            return handleResponse(res, 400, "This coupon is not active");
        }

        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
            return handleResponse(res, 400, "This coupon has reached its usage limit");
        }

        let monthlyVolume = 0;
        if (customerId) {
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const userOrders = await Order.find({
                customer: customerId,
                createdAt: { $gte: monthStart, $lte: now },
            }).lean();
            monthlyVolume = userOrders.reduce((sum, o) => sum + (o.pricing?.total || 0), 0);
        }

        if (coupon.couponType === "monthly_volume" && coupon.monthlyVolumeThreshold && monthlyVolume < coupon.monthlyVolumeThreshold) {
            return handleResponse(res, 400, "This coupon is for high‑volume buyers only");
        }

        if (coupon.minOrderValue && cartTotal < coupon.minOrderValue) {
            return handleResponse(res, 400, `Minimum order value should be ₹${coupon.minOrderValue}`);
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

        if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) discountAmount = coupon.maxDiscount;

        return handleResponse(res, 200, "Coupon applied", {
            couponId: coupon._id,
            code: coupon.code,
            discountAmount,
            freeDelivery,
        });
    } catch (error) {
        return handleResponse(res, 500, error.message);
    }
};
