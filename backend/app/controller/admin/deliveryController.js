import Delivery from "../../models/delivery.js";
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

        return handleResponse(res, 200, "Deliverys fetched successfully", {
            items,
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
