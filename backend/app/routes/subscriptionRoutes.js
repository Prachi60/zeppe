import express from "express";
import {
  createPlan,
  updatePlan,
  getAllPlansAdmin,
  getPlansByRole,
} from "../controller/subscriptionController.js";
import { verifyToken, allowRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// Admin routes
router.post("/admin/subscriptions", verifyToken, allowRoles("admin"), createPlan);
router.put("/admin/subscriptions/:id", verifyToken, allowRoles("admin"), updatePlan);
router.get("/admin/subscriptions", verifyToken, allowRoles("admin"), getAllPlansAdmin);

// Public/User routes
router.get("/subscriptions", verifyToken, getPlansByRole);

export default router;
