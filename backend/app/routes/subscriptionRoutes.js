import express from "express";
import {
  createPlan,
  deletePlan,
  updatePlan,
  getAllPlansAdmin,
  getPlansByRole,
  getUserSubscriptions,
  updateSubscriptionStatus,
  getMySubscriptionHistory,
} from "../controller/subscriptionController.js";
import { 
  createSubscriptionOrder, 
  verifySubscriptionPayment 
} from "../controller/paymentController.js";
import { verifyToken, allowRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// Admin routes
router.post("/admin/subscriptions", verifyToken, allowRoles("admin"), createPlan);
router.put("/admin/subscriptions/:id", verifyToken, allowRoles("admin"), updatePlan);
router.delete("/admin/subscriptions/:id", verifyToken, allowRoles("admin"), deletePlan);
router.get("/admin/subscriptions", verifyToken, allowRoles("admin"), getAllPlansAdmin);
router.get("/admin/user-subscriptions", verifyToken, allowRoles("admin"), getUserSubscriptions);
router.patch("/admin/user-subscriptions/:id/status", verifyToken, allowRoles("admin"), updateSubscriptionStatus);

// Public/User routes
router.get("/subscriptions", verifyToken, getPlansByRole);
router.get("/subscriptions/me", verifyToken, allowRoles("seller", "delivery"), getMySubscriptionHistory);
router.post("/subscriptions/create-order", verifyToken, allowRoles("seller", "delivery"), createSubscriptionOrder);
router.post("/subscriptions/verify", verifyToken, allowRoles("seller", "delivery"), verifySubscriptionPayment);

export default router;
