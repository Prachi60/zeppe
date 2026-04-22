import FAQ from '../models/faq.js';
import { createAdminController } from '../utils/controllerFactory.js';
import { handleResponse } from '../utils/helper.js';

const baseController = createAdminController(FAQ, {
    searchFields: ['question', 'answer'],
    defaultSort: { createdAt: -1 }
});

export const getFAQs = baseController.getAll;
export const createFAQ = baseController.create;
export const updateFAQ = baseController.update;
export const deleteFAQ = baseController.delete;

// You can still add custom methods if needed
export const incrementViews = async (req, res) => {
    try {
        const { id } = req.params;
        await FAQ.findByIdAndUpdate(id, { $inc: { views: 1 } });
        return handleResponse(res, 200, "Views incremented");
    } catch (error) {
        return handleResponse(res, 500, error.message);
    }
};
