import Product from "../../models/product.js";
import { createSellerController } from "../../utils/controllerFactory.js";
import { slugify } from "../../utils/slugify.js";
import { uploadToCloudinary } from "../../services/mediaService.js";
import { enqueueProductIndex, enqueueProductRemoval } from "../../services/searchSyncService.js";
import { invalidate } from "../../services/cacheService.js";

const makeProductSku = (name, index = 1) => {
    const prefix = String(name || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "item";
    return `${prefix}-${String(index).padStart(3, "0")}`;
};

const normalizeUrl = (value) => {
    const normalized = String(value || "").trim();
    if (!/^https?:\/\//i.test(normalized)) return "";
    return normalized;
};

const parseImageList = (input) => {
    if (!input) return [];
    if (Array.isArray(input)) return input.map(normalizeUrl).filter(Boolean);
    if (typeof input === "string") {
        if (input.startsWith("[")) {
            try { return JSON.parse(input).map(normalizeUrl).filter(Boolean); } catch(e) { return []; }
        }
        return input.split(",").map(normalizeUrl).filter(Boolean);
    }
    return [];
};

const applyMediaFields = (productData) => {
    const explicitMainImage = normalizeUrl(productData.mainImage || productData.mainImageUrl);
    const galleryImages = parseImageList(productData.galleryImages);
    const genericImages = parseImageList(productData.images);

    const mergedGallery = [...galleryImages, ...genericImages].filter(Boolean);
    if (explicitMainImage) {
        productData.mainImage = explicitMainImage;
    } else if (mergedGallery.length > 0) {
        productData.mainImage = mergedGallery[0];
        mergedGallery.shift();
    }

    productData.galleryImages = mergedGallery;
};

const prepareProductData = async (req, data) => {
    // 1. Handle Files
    const files = req.files || [];
    if (files.length > 0) {
        const galleryUrls = [];
        for (const file of files) {
            try {
                const url = await uploadToCloudinary(file.buffer, "products");
                if (file.fieldname === "mainImage") data.mainImage = url;
                else if (file.fieldname === "galleryImages") galleryUrls.push(url);
            } catch (err) {
                console.error("Cloudinary upload failed:", err);
            }
        }
        if (galleryUrls.length > 0) data.galleryImages = galleryUrls;
    }

    // 2. Parse JSON fields
    if (typeof data.variants === "string") {
        try { data.variants = JSON.parse(data.variants); } catch (e) {}
    }
    if (typeof data.tags === "string" && data.tags.startsWith("[")) {
        try { data.tags = JSON.parse(data.tags); } catch (e) {}
    }

    // 3. Slug & SKU
    if (data.name) {
        if (!data.slug) data.slug = slugify(data.name);
        if (!data.sku) data.sku = makeProductSku(data.name, Date.now() % 1000);
    }

    applyMediaFields(data);

    // 4. Tags
    if (typeof data.tags === "string") {
        data.tags = data.tags.split(",").map(t => t.trim());
    }

    // 5. Variants SKU
    if (Array.isArray(data.variants)) {
        data.variants = data.variants.map((v, i) => ({
            ...v,
            sku: v.sku || makeProductSku(data.name || "var", i + 1)
        }));
    }

    return data;
};

const sellerProductController = createSellerController(Product, {
    populateFields: ['headerId', 'categoryId', 'subcategoryId'],
    sellerField: 'sellerId',
    beforeCreate: prepareProductData,
    beforeUpdate: prepareProductData,
    afterCreate: async (req, product) => {
        await enqueueProductIndex(product._id.toString());
        await invalidate(`cache:catalog:product:${product._id.toString()}`);
    },
    afterUpdate: async (req, product) => {
        await enqueueProductIndex(product._id.toString());
        await invalidate(`cache:catalog:product:${product._id.toString()}`);
    },
    afterDelete: async (req, product) => {
        await enqueueProductRemoval(product._id.toString());
        await invalidate(`cache:catalog:product:${product._id.toString()}`);
    }
});

export default sellerProductController;
