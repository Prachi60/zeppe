import mongoose from "mongoose";

const scratchCampaignSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        rewardType: {
            type: String,
            enum: ["cash", "discount", "points", "freebie"],
            required: true,
        },
        // For cash/points: value. For discount: coupon code template or object. For freebie: description.
        rewardValue: {
            type: mongoose.Schema.Types.Mixed,
            required: true,
        },
        minOrderAmount: {
            type: Number,
            default: 0,
        },
        startDate: {
            type: Date,
            required: true,
        },
        endDate: {
            type: Date,
            required: true,
        },
        totalCardsLimit: {
            type: Number,
            default: 0, // 0 means unlimited
        },
        perUserLimit: {
            type: Number,
            default: 1,
        },
        winningProbability: {
            type: Number,
            default: 100, // percentage 0-100
            min: 0,
            max: 100,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        banner: {
            type: String,
        },
        termsAndConditions: {
            type: String,
        },
        stats: {
            issued: { type: Number, default: 0 },
            scratched: { type: Number, default: 0 },
            redeemed: { type: Number, default: 0 },
        },
    },
    { timestamps: true }
);

scratchCampaignSchema.index({ isActive: 1, startDate: 1, endDate: 1 });

export default mongoose.model("ScratchCampaign", scratchCampaignSchema);
