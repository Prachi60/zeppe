import Seller from "../../models/seller.js";
import { createAdminController } from "../../utils/controllerFactory.js";

const controller = createAdminController(Seller, {
    searchFields: ['shopName', 'name', 'phone', 'email'],
    populateFields: [],
    defaultSort: { createdAt: -1 }
});

export const getSellers = controller.getAll;
export const getSellerById = controller.getById;
export const updateSeller = controller.update;
export const deleteSeller = controller.delete;
