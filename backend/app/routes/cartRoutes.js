import express from "express";
import {
    getCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart
} from "../controller/cartController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { cartRouteRateLimiter } from "../middleware/securityMiddlewares.js";

const router = express.Router();

router.use(verifyToken, cartRouteRateLimiter); // All cart routes require auth + rate limiting

router.get("/", getCart);
router.post("/add", addToCart);
router.put("/update", updateQuantity);
router.delete("/remove/:productId", removeFromCart);
router.delete("/clear", clearCart);

export default router;
