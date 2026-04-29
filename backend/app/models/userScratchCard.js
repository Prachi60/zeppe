import mongoose from "mongoose";

const userScratchCardSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        campaign: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ScratchCampaign",
            required: true,
        },
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
        },
        status: {
            type: String,
            enum: ["unused", "scratched", "expired", "claimed"],
            default: "unused",
            index: true,
        },
        rewardType: {
            type: String,
            enum: ["cash", "discount", "points", "freebie"],
        },
        rewardValue: {
            type: mongoose.Schema.Types.Mixed,
        },
        isWinner: {
            type: Boolean,
            default: false,
        },
        scratchedAt: {
            type: Date,
        },
        claimedAt: {
            type: Date,
        },
        expiresAt: {
            type: Date,
            required: true,
        },
    },
    { timestamps: true }
);

userScratchCardSchema.index({ user: 1, status: 1 });
userScratchCardSchema.index({ campaign: 1 });

export default mongoose.model("UserScratchCard", userScratchCardSchema);
