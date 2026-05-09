import Seller from "../../models/seller.js";
import { createAdminController } from "../../utils/controllerFactory.js";
import { generateUniqueSlug } from "../../utils/slugify.js";

const controller = createAdminController(Seller, {
    searchFields: ['shopName', 'name', 'phone', 'email'],
    populateFields: [],
    defaultSort: { createdAt: -1 },
    beforeUpdate: async (req, data) => {
        try {
            // Whitelist of fields allowed in the database
            const allowedFields = [
                'name', 'shopName', 'email', 'phone', 'category', 'description', 
                'shopLogo', 'shopBanner', 'address', 'locality', 'pincode', 
                'city', 'state', 'location', 'serviceRadius', 'isActive', 
                'isVerified', 'applicationStatus', 'bankDetails', 'subscriptionStatus',
                'slug'
            ];

            const sanitizedData = {};
            
            // Map ownerName to name
            if (data.ownerName) {
                sanitizedData.name = data.ownerName;
            }

            // Copy allowed fields from data to sanitizedData
            allowedFields.forEach(field => {
                if (data[field] !== undefined) {
                    sanitizedData[field] = data[field];
                }
            });

            // Handle Slug Generation if shopName changed
            if (sanitizedData.shopName) {
                // We need to fetch the current seller to check if name actually changed
                const existingSeller = await Seller.findById(req.params.id);
                if (existingSeller && existingSeller.shopName !== sanitizedData.shopName) {
                    const slugResult = await generateUniqueSlug({
                        Model: Seller,
                        name: sanitizedData.shopName,
                        sellerId: null,
                        excludeId: req.params.id
                    });
                    if (slugResult.success) {
                        sanitizedData.slug = slugResult.slug;
                    }
                }
            }

            // Handle serviceRadius conversion
            if (sanitizedData.serviceRadius !== undefined) {
                sanitizedData.serviceRadius = Number(sanitizedData.serviceRadius);
            }

            // Handle location mapping (frontend 'location' string -> database 'address')
            if (typeof data.location === 'string') {
                sanitizedData.address = data.location;
                // Don't set the database 'location' field to a string
                delete sanitizedData.location;
            }

            // Format GeoJSON location from latitude/longitude
            if (data.latitude != null && data.longitude != null && data.latitude !== "" && data.longitude !== "") {
                const lat = Number(data.latitude);
                const lng = Number(data.longitude);
                
                if (!isNaN(lat) && !isNaN(lng)) {
                    sanitizedData.location = {
                        type: 'Point',
                        coordinates: [lng, lat]
                    };
                }
            }
            
            return sanitizedData;
        } catch (err) {
            console.error('Error in seller beforeUpdate hook:', err);
            throw err;
        }
    }
});

export const getSellers = controller.getAll;
export const getSellerById = controller.getById;
export const updateSeller = controller.update;
export const deleteSeller = controller.delete;
