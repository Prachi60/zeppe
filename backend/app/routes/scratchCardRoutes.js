import express from "express";
import { 
    adminListCampaigns, 
    adminGetCampaign, 
    adminCreateCampaign, 
    adminUpdateCampaign, 
    adminDeleteCampaign,
    adminToggleCampaignStatus,
    myScratchCards,
    handleScratchCard
} from "../controller/scratchCardController.js";
import { verifyToken, allowRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// Admin routes
router.get("/admin/scratch-cards/campaigns", verifyToken, allowRoles("admin"), adminListCampaigns);
router.get("/admin/scratch-cards/campaigns/:id", verifyToken, allowRoles("admin"), adminGetCampaign);
router.post("/admin/scratch-cards/campaigns", verifyToken, allowRoles("admin"), adminCreateCampaign);
router.put("/admin/scratch-cards/campaigns/:id", verifyToken, allowRoles("admin"), adminUpdateCampaign);
router.delete("/admin/scratch-cards/campaigns/:id", verifyToken, allowRoles("admin"), adminDeleteCampaign);
router.patch("/admin/scratch-cards/campaigns/:id/toggle", verifyToken, allowRoles("admin"), adminToggleCampaignStatus);

// User routes
router.get("/customer/scratch-cards", verifyToken, allowRoles("customer", "user"), myScratchCards);
router.post("/customer/scratch-cards/:cardId/scratch", verifyToken, allowRoles("customer", "user"), handleScratchCard);

export default router;
