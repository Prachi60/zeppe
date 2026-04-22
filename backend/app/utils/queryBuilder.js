/**
 * Standardizes MongoDB queries from request parameters.
 * Supports filtering, searching, sorting, and pagination.
 */

export const buildQuery = (reqQuery, modelSchema) => {
    const query = {};
    const { search, page, limit, sort, ...filters } = reqQuery;

    // 1. Searching (Case-insensitive regex on name/title if they exist in schema)
    if (search) {
        const searchFields = ['name', 'title', 'sku', 'phone', 'email', 'shopName', 'orderId'];
        const orConditions = searchFields
            .filter(field => modelSchema.path(field))
            .map(field => ({ [field]: { $regex: search, $options: 'i' } }));

        if (orConditions.length > 0) {
            query.$or = orConditions;
        }
    }

    // 2. Filtering
    Object.keys(filters).forEach(key => {
        const value = filters[key];
        if (value === 'all' || value === '' || value === undefined || value === null) return;

        // Check if the field exists in the schema
        if (modelSchema.path(key)) {
            // Handle comma-separated values (IN query)
            if (typeof value === 'string' && value.includes(',')) {
                query[key] = { $in: value.split(',') };
            } else if (value === 'true' || value === 'false') {
                query[key] = value === 'true';
            } else {
                query[key] = value;
            }
        }
    });

    return query;
};

export const buildSort = (sortStr, defaultSort = { createdAt: -1 }) => {
    if (!sortStr) return defaultSort;

    const sortMap = {
        'newest': { createdAt: -1 },
        'oldest': { createdAt: 1 },
        'name-asc': { name: 1 },
        'name-desc': { name: -1 },
        'price-asc': { price: 1 },
        'price-desc': { price: -1 },
        'stock-asc': { stock: 1 },
        'stock-desc': { stock: -1 },
        'status-asc': { status: 1 },
        'status-desc': { status: -1 },
    };

    return sortMap[sortStr] || defaultSort;
};

export const getPaginationOptions = (req) => {
    const page = Math.abs(parseInt(req.query.page)) || 1;
    const limit = Math.abs(parseInt(req.query.limit)) || 25;
    const skip = (page - 1) * limit;

    return { page, limit, skip };
};
