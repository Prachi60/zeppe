import ScratchCampaign from "../models/scratchCampaign.js";
import UserScratchCard from "../models/userScratchCard.js";
import { createAdminController } from "../utils/controllerFactory.js";
import { handleResponse } from "../utils/helper.js";
import { scratchCard } from "../services/scratchCardService.js";

// Admin Controller for Campaigns
const campaignBase = createAdminController(ScratchCampaign, {
    searchFields: ['title', 'description'],
    defaultSort: { createdAt: -1 }
});

export const adminListCampaigns = campaignBase.getAll;
export const adminGetCampaign = campaignBase.getById;
export const adminCreateCampaign = campaignBase.create;
export const adminUpdateCampaign = campaignBase.update;
export const adminDeleteCampaign = campaignBase.delete;

export const adminToggleCampaignStatus = async (req, res) => {
    try {
        const campaign = await ScratchCampaign.findById(req.params.id);
        if (!campaign) return handleResponse(res, 404, "Campaign not found");
        campaign.isActive = !campaign.isActive;
        await campaign.save();
        return handleResponse(res, 200, `Campaign ${campaign.isActive ? "activated" : "deactivated"}`, campaign);
    } catch (error) {
        return handleResponse(res, 500, error.message);
    }
};

// User Controller for Scratch Cards
export const myScratchCards = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status } = req.query;
        const query = { user: userId };
        if (status) query.status = status;

        const cards = await UserScratchCard.find(query)
            .populate("campaign", "title description banner termsAndConditions")
            .sort({ createdAt: -1 });

        return handleResponse(res, 200, "Scratch cards fetched", cards);
    } catch (error) {
        return handleResponse(res, 500, error.message);
    }
};

export const handleScratchCard = async (req, res) => {
    try {
        const userId = req.user.id;
        const { cardId } = req.params;

        const result = await scratchCard(userId, cardId);
        return handleResponse(res, 200, "Card scratched", result);
    } catch (error) {
        return handleResponse(res, 400, error.message);
    }
};
