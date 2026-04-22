import Delivery from "../../models/delivery.js";
import { createAdminController } from "../../utils/controllerFactory.js";

const controller = createAdminController(Delivery, {
    searchFields: ['name', 'phone', 'email'],
    defaultSort: { createdAt: -1 }
});

export const getDeliveryBoys = controller.getAll;
export const getDeliveryBoyById = controller.getById;
export const updateDeliveryBoy = controller.update;
export const deleteDeliveryBoy = controller.delete;
