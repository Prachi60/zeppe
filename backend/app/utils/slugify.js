export const slugify = (text) => {
    if (!text) return "";
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')     // Replace spaces with -
        .replace(/[^\w\-]+/g, '') // Remove all non-word chars
        .replace(/\-\-+/g, '-');   // Replace multiple - with single -
};

/**
 * Generates a unique slug for a given model and name.
 * If the slug already exists for a DIFFERENT seller, it appends a suffix.
 * If the slug already exists for the SAME seller, it returns an error flag.
 */
export const generateUniqueSlug = async ({ 
    Model, 
    name, 
    sellerId = null, 
    sellerIdField = 'sellerId',
    excludeId = null 
}) => {
    const baseSlug = slugify(name);
    let currentSlug = baseSlug;
    let counter = 1;

    while (true) {
        const query = { slug: currentSlug };
        if (excludeId) query._id = { $ne: excludeId };

        const existing = await Model.findOne(query);

        if (!existing) {
            return { success: true, slug: currentSlug };
        }

        // Check if it belongs to the same seller
        if (sellerId && existing[sellerIdField]?.toString() === sellerId.toString()) {
            return { 
                success: false, 
                error: "You already have a product or store with this name.",
                slug: currentSlug 
            };
        }

        // Belongs to someone else, try next suffix
        currentSlug = `${baseSlug}-${counter}`;
        counter++;
    }
};

