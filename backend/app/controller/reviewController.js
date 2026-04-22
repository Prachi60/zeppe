import { createAdminController } from "../utils/controllerFactory.js";
import Review from "../models/review.js";

export const {
    getAll: getReviews,
    update: updateReview,
    delete: deleteReview
} = createAdminController(Review, {
    searchFields: ["comment", "rating"],
    populate: [
        { path: "productId", select: "name mainImage" },
        { path: "userId", select: "name email avatar" }
    ]
});

// Admin Review Actions
export const updateReviewStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        const review = await Review.findByIdAndUpdate(id, { status }, { new: true });
        res.status(200).json({ success: true, result: review });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
