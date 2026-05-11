import Product from "../models/product.js";
import StockHistory from "../models/stockHistory.js";
import handleResponse from "../utils/helper.js";

/* ===============================
   ADJUST STOCK MANUALLY
================================ */
export const adjustStock = async (req, res) => {
    try {
        const { productId, variantId, type, quantity, note } = req.body;
        const sellerId = req.user.id;

        const product = await Product.findOne({ _id: productId, sellerId });
        if (!product) {
            return handleResponse(res, 404, "Product not found or unauthorized");
        }

        const qtyChange = Number(quantity);
        let variantName = "";

        if (variantId && product.variants && product.variants.length > 0) {
            const variant = product.variants.id(variantId);
            if (!variant) {
                return handleResponse(res, 404, "Variant not found");
            }
            variantName = variant.name || "Unnamed Variant";
            const finalVariantStock = type === 'Restock' ? (variant.stock || 0) + qtyChange : (variant.stock || 0) - qtyChange;
            
            if (finalVariantStock < 0) {
                return handleResponse(res, 400, "Variant stock cannot be negative");
            }
            variant.stock = finalVariantStock;
        } else {
            const finalStock = type === 'Restock' ? (product.stock || 0) + qtyChange : (product.stock || 0) - qtyChange;
            if (finalStock < 0) {
                return handleResponse(res, 400, "Stock cannot be negative");
            }
            product.stock = finalStock;
        }

        // 1. Save Product
        await product.save();

        // 2. Create History Entry
        const historyEntry = new StockHistory({
            product: productId,
            seller: sellerId,
            type, // Restock, Correction
            quantity: type === 'Restock' ? qtyChange : -qtyChange,
            note: note || `Manual ${type} adjustment${variantName ? ` for ${variantName}` : ""}`
        });

        await historyEntry.save();

        return handleResponse(res, 200, "Stock adjusted successfully", {
            newStock: product.stock,
            historyEntry
        });

    } catch (error) {
        return handleResponse(res, 500, error.message);
    }
};

/* ===============================
   GET STOCK HISTORY LOG
================================ */
export const getStockHistory = async (req, res) => {
    try {
        const sellerId = req.user.id;

        const history = await StockHistory.find({ seller: sellerId })
            .sort({ createdAt: -1 })
            .populate("product", "name sku mainImage");

        return handleResponse(res, 200, "Stock history fetched", history.map(item => ({
            id: item._id,
            productName: item.product?.name || "Deleted Product",
            sku: item.product?.sku || "N/A",
            type: item.type,
            quantity: item.quantity > 0 ? `+${item.quantity}` : `${item.quantity}`,
            date: item.createdAt.toISOString().split('T')[0],
            time: item.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            note: item.note
        })));

    } catch (error) {
        return handleResponse(res, 500, error.message);
    }
};
