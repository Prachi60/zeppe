import { handleResponse } from "./helper.js";
import { buildQuery, buildSort, getPaginationOptions } from "./queryBuilder.js";

/**
 * Creates a set of standard CRUD handlers for a Mongoose model.
 */
export const createAdminController = (Model, options = {}) => {
    const { 
        populateFields = [], 
        searchFields = ['name'],
        defaultSort = { createdAt: -1 }
    } = options;

    return {
        // GET ALL
        getAll: async (req, res) => {
            try {
                const query = buildQuery(req.query, Model.schema);
                const sort = buildSort(req.query.sort, defaultSort);
                const { page, limit, skip } = getPaginationOptions(req);

                let dbQuery = Model.find(query).sort(sort).skip(skip).limit(limit).lean();

                if (populateFields.length > 0) {
                    populateFields.forEach(field => {
                        dbQuery = dbQuery.populate(field);
                    });
                }

                const [items, total] = await Promise.all([
                    dbQuery,
                    Model.countDocuments(query)
                ]);

                return handleResponse(res, 200, `${Model.modelName}s fetched successfully`, {
                    items,
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit) || 1
                });
            } catch (error) {
                return handleResponse(res, 500, error.message);
            }
        },

        // GET BY ID
        getById: async (req, res) => {
            try {
                let dbQuery = Model.findById(req.params.id).lean();
                
                if (populateFields.length > 0) {
                    populateFields.forEach(field => {
                        dbQuery = dbQuery.populate(field);
                    });
                }

                const item = await dbQuery;
                if (!item) return handleResponse(res, 404, `${Model.modelName} not found`);

                return handleResponse(res, 200, `${Model.modelName} details fetched`, item);
            } catch (error) {
                return handleResponse(res, 500, error.message);
            }
        },

        // CREATE
        create: async (req, res) => {
            try {
                const item = await Model.create(req.body);
                return handleResponse(res, 201, `${Model.modelName} created successfully`, item);
            } catch (error) {
                if (error.code === 11000) {
                    return handleResponse(res, 400, "Duplicate key error: " + Object.keys(error.keyValue).join(", "));
                }
                return handleResponse(res, 500, error.message);
            }
        },

        // UPDATE
        update: async (req, res) => {
            try {
                const item = await Model.findByIdAndUpdate(
                    req.params.id, 
                    { $set: req.body }, 
                    { new: true, runValidators: true }
                );
                if (!item) return handleResponse(res, 404, `${Model.modelName} not found`);
                
                return handleResponse(res, 200, `${Model.modelName} updated successfully`, item);
            } catch (error) {
                return handleResponse(res, 500, error.message);
            }
        },

        // DELETE
        delete: async (req, res) => {
            try {
                const item = await Model.findByIdAndDelete(req.params.id);
                if (!item) return handleResponse(res, 404, `${Model.modelName} not found`);
                
                return handleResponse(res, 200, `${Model.modelName} deleted successfully`);
            } catch (error) {
                return handleResponse(res, 500, error.message);
            }
        }
    };
};
