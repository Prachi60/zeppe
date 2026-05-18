import { createAdminController } from "../utils/controllerFactory.js";
import Review from "../models/review.js";
import Product from "../models/product.js";
import User from "../models/customer.js";
import Seller from "../models/seller.js";

const reviewController = createAdminController(Review, {
    searchFields: ["comment", "rating"],
    populateFields: [
        { 
            path: "productId", 
            select: "name mainImage sellerId",
            populate: { path: "sellerId", select: "shopName" }
        },
        { path: "userId", select: "name email avatar" }
    ],
    beforeCreate: (req, data) => {
        data.userId = req.user.id;
        return data;
    }
});

export const submitReview = async (req, res) => {
    try {
        const { productId, rating, comment } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ 
                success: false, 
                message: "Please log in to submit a review." 
            });
        }

        if (!productId) {
            return res.status(400).json({ 
                success: false, 
                message: "Product information is missing." 
            });
        }

        // Check if review already exists
        const existingReview = await Review.findOne({ userId, productId });
        if (existingReview) {
            return res.status(400).json({ 
                success: false, 
                message: "You have already submitted a review for this product." 
            });
        }

        const review = await Review.create({
            userId,
            productId,
            rating,
            comment,
            status: "pending"
        });

        return res.status(201).json({ 
            success: true, 
            message: "Review submitted for moderation.",
            result: review 
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ 
                success: false, 
                message: "You have already submitted a review for this product." 
            });
        }
        // Handle Mongoose validation errors more cleanly
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ 
                success: false, 
                message: messages.join(', ')
            });
        }
        return res.status(500).json({ success: false, message: error.message });
    }
};
export const getReviews = reviewController.getAll;
export const updateReview = reviewController.update;
export const deleteReview = reviewController.delete;

export const getProductReviews = async (req, res) => {
    const { productId } = req.params;
    try {
        const reviews = await Review.find({ 
            productId, 
            status: "approved" 
        })
        .populate({ path: "userId", select: "name email avatar" })
        .sort({ createdAt: -1 })
        .lean();

        return res.status(200).json({ 
            success: true, 
            result: reviews 
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getPendingReviews = async (req, res) => {
    req.query.status = "pending";

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
