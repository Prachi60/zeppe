import Review from "../../models/review.js";
import { createAdminController } from "../../utils/controllerFactory.js";

const controller = createAdminController(Review, {
    searchFields: ['comment'],
    populateFields: [
        { path: 'customer', select: 'name phone' },
        { path: 'product', select: 'name' }
    ],
    defaultSort: { createdAt: -1 }
});

export const getReviews = controller.getAll;
export const updateReview = controller.update;
export const deleteReview = controller.delete;
