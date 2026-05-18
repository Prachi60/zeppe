import Order from "../../models/order.js";
import { createSellerController } from "../../utils/controllerFactory.js";

const sellerOrderController = createSellerController(Order, {
    populateFields: ['customer', 'items.product', 'deliveryBoy'],
    sellerField: 'seller', // Field in Order model is 'seller'
    defaultSort: { createdAt: -1 },
    projection: {
        orderId: 1, status: 1, workflowStatus: 1, createdAt: 1,
        customer: 1, items: 1, address: 1, payment: 1, timeSlot: 1,
        "pricing.productSubtotal": 1,
        "pricing.deliveryFeeCharged": 1,
        "pricing.handlingFeeCharged": 1,
        "pricing.discountTotal": 1,
        "pricing.taxTotal": 1,
        "pricing.tipTotal": 1,
        "pricing.grandTotal": 1,
        "pricing.sellerPayoutTotal": 1,
        "pricing.total": 1,
        checkoutGroupId: 1, returnStatus: 1, returnReason: 1
    },
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
                        $sum: {
                            $cond: [
                                { $ne: ["$status", "cancelled"] },
                                {
                                    $ifNull: [
                                        "$pricing.productSubtotal",
                                        { $ifNull: ["$pricing.subtotal", { $ifNull: ["$pricing.sellerPayoutTotal", 0] }] }
                                    ]
                                },
                                0
                            ]
                        }
                    }
                }
            }
        ]);
        return stats[0] || { totalPending: 0, totalConfirmed: 0, totalDelivered: 0, totalRevenue: 0 };
    }
});

export default sellerOrderController;
