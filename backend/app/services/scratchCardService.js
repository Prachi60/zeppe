import ScratchCampaign from "../models/scratchCampaign.js";
import UserScratchCard from "../models/userScratchCard.js";
import Transaction from "../models/transaction.js";
import { creditWallet } from "./finance/walletService.js";
import { OWNER_TYPE } from "../constants/finance.js";
import { roundCurrency } from "../utils/money.js";
import mongoose from "mongoose";

/**
 * Assign a scratch card to a user if eligible.
 */
export const assignScratchCard = async (userId, orderId, orderAmount) => {
    try {
        const now = new Date();
        // Find active campaigns that match the minOrderAmount and date range
        const campaigns = await ScratchCampaign.find({
            isActive: true,
            minOrderAmount: { $lte: orderAmount },
            startDate: { $lte: now },
            endDate: { $gte: now },
        });

        for (const campaign of campaigns) {
            // Check total limit
            if (campaign.totalCardsLimit > 0 && campaign.stats.issued >= campaign.totalCardsLimit) {
                continue;
            }

            // Check per user limit
            const userCardsCount = await UserScratchCard.countDocuments({
                user: userId,
                campaign: campaign._id,
            });

            if (campaign.perUserLimit > 0 && userCardsCount >= campaign.perUserLimit) {
                continue;
            }

            // Determine if this card is a winner based on probability
            const isWinner = Math.random() * 100 <= campaign.winningProbability;

            // Create the card
            const expiresAt = campaign.endDate; // Or a fixed offset from now
            const card = await UserScratchCard.create({
                user: userId,
                campaign: campaign._id,
                order: orderId,
                status: "unused",
                isWinner,
                expiresAt,
                rewardType: campaign.rewardType,
                rewardValue: campaign.rewardValue, // This can be a range or fixed value
            });

            // Update campaign stats
            await ScratchCampaign.findByIdAndUpdate(campaign._id, {
                $inc: { "stats.issued": 1 }
            });

            console.log(`Assigned scratch card ${card._id} to user ${userId} for order ${orderId}`);
        }
    } catch (error) {
        console.error("Error assigning scratch card:", error);
    }
};

/**
 * Handle the scratching of a card.
 */
export const scratchCard = async (userId, cardId) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const card = await UserScratchCard.findOne({ _id: cardId, user: userId }).populate("campaign");

        if (!card) throw new Error("Scratch card not found");
        if (card.status !== "unused") throw new Error("Card already scratched or expired");
        if (new Date() > card.expiresAt) {
            card.status = "expired";
            await card.save({ session });
            await session.commitTransaction();
            return { status: "expired" };
        }

        // Determine reward value if it's a range
        let finalRewardValue = 0;
        if (card.isWinner) {
            if (typeof card.rewardValue === "object" && card.rewardValue.min !== undefined && card.rewardValue.max !== undefined) {
                // Random between min and max
                finalRewardValue = Math.floor(Math.random() * (card.rewardValue.max - card.rewardValue.min + 1)) + card.rewardValue.min;
            } else {
                finalRewardValue = Number(card.rewardValue);
            }
        }

        card.status = "scratched";
        card.scratchedAt = new Date();
        card.rewardValue = finalRewardValue; // Save the actual determined value

        if (card.isWinner && finalRewardValue > 0) {
            // Credit the reward
            if (card.rewardType === "cash") {
                await creditWallet({
                    ownerType: OWNER_TYPE.CUSTOMER,
                    ownerId: userId,
                    amount: finalRewardValue,
                    session
                });

                // Create transaction log
                await Transaction.create([{
                    user: userId,
                    userModel: "User",
                    type: "Incentive",
                    amount: finalRewardValue,
                    status: "Settled",
                    reference: `SCRATCH_${card._id}`,
                    meta: { cardId: card._id, campaignId: card.campaign._id }
                }], { session });

                card.status = "claimed";
                card.claimedAt = new Date();
            } else if (card.rewardType === "points") {
                // Handle points logic if available
                // For now, just mark as claimed
                card.status = "claimed";
                card.claimedAt = new Date();
            }
            // Add other reward types here (discount coupons, etc.)

            // Update campaign stats
            await ScratchCampaign.findByIdAndUpdate(card.campaign._id, {
                $inc: { "stats.scratched": 1, "stats.redeemed": card.status === "claimed" ? 1 : 0 }
            }, { session });
        } else {
            // Not a winner
            await ScratchCampaign.findByIdAndUpdate(card.campaign._id, {
                $inc: { "stats.scratched": 1 }
            }, { session });
        }

        await card.save({ session });
        await session.commitTransaction();
        return card;
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};
