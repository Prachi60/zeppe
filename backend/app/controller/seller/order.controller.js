import Order from "../../models/order.js";
import { createSellerController } from "../../utils/controllerFactory.js";

const sellerOrderController = createSellerController(Order, {
    populateFields: ['customer', 'items.product', 'deliveryBoy'],
    sellerField: 'seller', // Field in Order model is 'seller'
    defaultSort: { createdAt: -1 },
    getStats: async (query) => {
        const stats = await Order.aggregate([
            { $match: query },
            {
                $group: {
                    _id: null,
                    totalPending: { 
                        $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } 
                    },
                    totalConfirmed: { 
                        $sum: { $cond: [{ $eq: ["$status", "confirmed"] }, 1, 0] } 
                    },
                    totalDelivered: { 
                        $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] } 
                    },
                    totalRevenue: { 
                        $sum: { $cond: [{ $ne: ["$status", "cancelled"] }, "$pricing.total", 0] } 
                    }
                }
            }
        ]);
        return stats[0] || { totalPending: 0, totalConfirmed: 0, totalDelivered: 0, totalRevenue: 0 };
    }
});

export default sellerOrderController;
