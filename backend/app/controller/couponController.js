import Coupon from "../models/coupon.js";
import { createAdminController } from "../utils/controllerFactory.js";
import { handleResponse } from "../utils/helper.js";
import Order from "../models/order.js";
import { validateAndComputeCoupon } from "../services/couponService.js";

const baseController = createAdminController(Coupon, {
    searchFields: ['code', 'title', 'description'],
    defaultSort: { createdAt: -1 }
});

export const listCoupons = baseController.getAll;
export const createCoupon = baseController.create;
export const updateCoupon = baseController.update;
export const deleteCoupon = baseController.delete;

// Public validation engine kept intact
// Validation engine — uses authenticated user identity, never trusts client-supplied customerId
export const validateCoupon = async (req, res) => {
    try {
        const { code, cartTotal } = req.body;
        // C-3 FIX: Always derive customerId from JWT, never from req.body
        const customerId = req.user?.id || null;

        if (!code) return handleResponse(res, 400, "Coupon code is required");

        const result = await validateAndComputeCoupon({
            code,
            cartTotal,
            customerId,
        });

        return handleResponse(res, 200, "Coupon applied", result);
    } catch (error) {
        return handleResponse(res, error.statusCode || 400, error.message);
    }
};
