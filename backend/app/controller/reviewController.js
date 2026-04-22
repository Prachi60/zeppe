import { createAdminController } from "../utils/controllerFactory.js";
import Review from "../models/review.js";

const reviewController = createAdminController(Review, {
    searchFields: ["comment", "rating"],
    populateFields: [
        { path: "productId", select: "name mainImage" },
        { path: "userId", select: "name email avatar" }
    ]
});

export const submitReview = reviewController.create;
export const getReviews = reviewController.getAll;
export const updateReview = reviewController.update;
export const deleteReview = reviewController.delete;

export const getProductReviews = async (req, res) => {
    req.query = {
        ...req.query,
        productId: req.params.productId,
        status: "approved",
    };

    return reviewController.getAll(req, res);
};

export const getPendingReviews = async (req, res) => {
    req.query = {
        ...req.query,
        status: "pending",
    };

    return reviewController.getAll(req, res);
};

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
