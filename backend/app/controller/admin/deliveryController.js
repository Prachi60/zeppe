import mongoose from "mongoose";
import Delivery from "../../models/delivery.js";
import Order from "../../models/order.js";
import Wallet from "../../models/wallet.js";
import Transaction from "../../models/transaction.js";
import { createAdminController } from "../../utils/controllerFactory.js";
import { handleResponse } from "../../utils/helper.js";
import { buildQuery, buildSort, getPaginationOptions } from "../../utils/queryBuilder.js";

const controller = createAdminController(Delivery, {
    searchFields: ['name', 'phone', 'email'],
    defaultSort: { createdAt: -1 }
});

export const getDeliveryBoys = async (req, res) => {
    try {
        const query = buildQuery(req.query, Delivery.schema);
        const sort = buildSort(req.query.sort, { createdAt: -1 });
        const { page, limit, skip } = getPaginationOptions(req);

        // Backward compatibility: old riders may not have applicationStatus.
        if (String(req.query?.applicationStatus || "").toLowerCase() === "pending") {
            delete query.applicationStatus;
            query.$or = [
                { applicationStatus: "pending" },
                { applicationStatus: { $exists: false }, isVerified: { $ne: true } },
            ];
        }

        const [items, total] = await Promise.all([
            Delivery.find(query).sort(sort).skip(skip).limit(limit).lean(),
            Delivery.countDocuments(query),
        ]);

        // Enrich with stats
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const enrichedItems = await Promise.all(items.map(async (rider) => {
            const riderId = new mongoose.Types.ObjectId(rider._id);
            const [totalDeliveries, wallet, earningResults, totalEarningResults] = await Promise.all([
                Order.countDocuments({ 
                    deliveryBoy: riderId, 
                    $or: [
                        { status: 'delivered' },
                        { workflowStatus: 'delivered' }
                    ]
                }),
                Wallet.findOne({ ownerId: riderId, ownerType: 'DELIVERY_PARTNER' }),
                Transaction.aggregate([
                    {
                        $match: {
                            user: riderId,
                            userModel: 'Delivery',
                            status: 'Settled',
                            type: { $in: ['Delivery Earning', 'Incentive', 'Bonus'] },
                            createdAt: { $gte: startOfToday }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            todayEarnings: { $sum: '$amount' }
                        }
                    }
                ]),
                Transaction.aggregate([
                    {
                        $match: {
                            user: riderId,
                            userModel: 'Delivery',
                            status: 'Settled',
                            type: { $in: ['Delivery Earning', 'Incentive', 'Bonus'] }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            totalEarnings: { $sum: '$amount' }
                        }
                    }
                ])
            ]);

            const earningResult = earningResults[0];
            const totalEarningResult = totalEarningResults[0];
            
            // Debug logs
            console.log(`[Admin Stats] Rider: ${rider.name} (${riderId})`);
            console.log(`[Admin Stats] Total Deliveries: ${totalDeliveries}`);
            console.log(`[Admin Stats] Total Earnings: ${totalEarningResult?.totalEarnings || 0}`);

            return {
                ...rider,
                totalDeliveries,
                totalEarnings: totalEarningResult?.totalEarnings || 0,
                walletBalance: wallet?.availableBalance || 0,
                todayEarnings: earningResult?.todayEarnings || 0,
                rating: 4.5, 
            };
        }));

        return handleResponse(res, 200, "Deliverys fetched successfully", {
            items: enrichedItems,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 1,
            stats: null,
        });
    } catch (error) {
        return handleResponse(res, 500, error.message);
    }
};

export const getDeliveryBoyById = controller.getById;

export const updateDeliveryBoy = async (req, res) => {
    try {
        const rider = await Delivery.findByIdAndUpdate(
            req.params.id,
            {
                $set: {
                    isVerified: true,
                    isOnline: false,
                    applicationStatus: "approved",
                    rejectionReason: "",
                    reviewedAt: new Date(),
                },
            },
            { new: true, runValidators: true }
        );

        if (!rider) return handleResponse(res, 404, "Delivery not found");
        return handleResponse(res, 200, "Delivery approved successfully", rider);
    } catch (error) {
        return handleResponse(res, 500, error.message);
    }
};

export const deleteDeliveryBoy = async (req, res) => {
    try {
        const reason = String(req.body?.reason || "").trim();
        const rider = await Delivery.findByIdAndUpdate(
            req.params.id,
            {
                $set: {
                    isVerified: false,
                    isOnline: false,
                    applicationStatus: "rejected",
                    rejectionReason: reason,
                    reviewedAt: new Date(),
                },
            },
            { new: true, runValidators: true }
        );
        if (!rider) return handleResponse(res, 404, "Delivery not found");
        return handleResponse(res, 200, "Delivery application rejected", rider);
    } catch (error) {
        return handleResponse(res, 500, error.message);
    }
};

export const updateRider = controller.update;
export const deleteRider = controller.delete;
export const createRider = controller.create;

export const getActiveFleet = async (req, res) => {
    try {
        const { page, limit, skip } = getPaginationOptions(req);
        
        const query = {
            deliveryBoy: { $exists: true, $ne: null },
            status: { $in: ["confirmed", "packed", "out_for_delivery"] }
        };

        const [items, total] = await Promise.all([
            Order.find(query)
                .populate("deliveryBoy", "name phone vehicleType avatar")
                .populate("seller", "shopName phone")
                .populate("customer", "name phone")
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Order.countDocuments(query),
        ]);

        const mappedItems = items.map(order => ({
            id: order.orderId,
            deliveryBoy: {
                id: order.deliveryBoy?._id,
                name: order.deliveryBoy?.name || "Unknown",
                phone: order.deliveryBoy?.phone || "N/A",
                vehicle: order.deliveryBoy?.vehicleType || "bike",
                avatar: order.deliveryBoy?.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                rating: 4.5,
                joined: "2024",
            },
            seller: {
                name: order.seller?.shopName || "N/A",
                phone: order.seller?.phone || "N/A"
            },
            customer: {
                name: order.customer?.name || "N/A",
                phone: order.customer?.phone || "N/A"
            },
            status: order.status === "out_for_delivery" ? "On the Way" : 
                    order.status === "packed" ? "At Pickup" : "Confirmed",
            lastUpdate: order.updatedAt,
        }));

        return handleResponse(res, 200, "Active fleet fetched successfully", {
            items: mappedItems,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 1,
        });
    } catch (error) {
        console.error("getActiveFleet error:", error);
        return handleResponse(res, 500, error.message);
    }
};
