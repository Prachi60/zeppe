import handleResponse from "../utils/helper.js";
import { validateSchema } from "../validation/paymentValidation.js";
import {
  createPlanSchema,
  plansQuerySchema,
  updatePlanSchema,
  updateSubscriptionStatusSchema,
} from "../validation/subscriptionValidation.js";
import {
  createPlan as createPlanService,
  deletePlan as deletePlanService,
  getAllPlansForAdmin,
  getMySubscriptions,
  getPlansByRole as getPlansByRoleService,
  getUserSubscriptionsForAdmin,
  resolveRoleForRequest,
  updatePlan as updatePlanService,
  updateUserSubscriptionStatus,
} from "../services/subscriptionService.js";

// --- Admin APIs ---

export const createPlan = async (req, res) => {
  try {
    const payload = validateSchema(createPlanSchema, req.body || {});
    const plan = await createPlanService(payload);
    return handleResponse(res, 201, "Subscription plan created successfully", plan);
  } catch (error) {
    return handleResponse(res, error.statusCode || 500, error.message);
  }
};

export const updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = validateSchema(updatePlanSchema, req.body || {});
    const plan = await updatePlanService(id, payload);
    if (!plan) return handleResponse(res, 404, "Plan not found");
    return handleResponse(res, 200, "Subscription plan updated successfully", plan);
  } catch (error) {
    return handleResponse(res, error.statusCode || 500, error.message);
  }
};

export const getAllPlansAdmin = async (req, res) => {
  try {
    const plans = await getAllPlansForAdmin();
    return handleResponse(res, 200, "All subscription plans fetched", plans);
  } catch (error) {
    return handleResponse(res, 500, error.message);
  }
};

export const deletePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await deletePlanService(id);
    if (!plan) return handleResponse(res, 404, "Plan not found");
    return handleResponse(res, 200, "Subscription plan deleted successfully", plan);
  } catch (error) {
    return handleResponse(res, error.statusCode || 500, error.message);
  }
};

export const getUserSubscriptions = async (req, res) => {
  try {
    const subscriptions = await getUserSubscriptionsForAdmin();
    return handleResponse(res, 200, "User subscriptions fetched successfully", subscriptions);
  } catch (error) {
    return handleResponse(res, 500, error.message);
  }
};

export const updateSubscriptionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = validateSchema(updateSubscriptionStatusSchema, req.body || {});
    const updated = await updateUserSubscriptionStatus({
      subscriptionId: id,
      status: payload.status,
      actorRole: req.user?.role,
    });
    if (!updated) return handleResponse(res, 404, "Subscription not found");
    return handleResponse(res, 200, "Subscription status updated successfully", updated);
  } catch (error) {
    return handleResponse(res, error.statusCode || 500, error.message);
  }
};

// --- Public/User APIs ---

export const getPlansByRole = async (req, res) => {
  try {
    const query = validateSchema(plansQuerySchema, req.query || {});
    const role = resolveRoleForRequest(req, query.targetRole || query.role);
    if (!role) {
      return handleResponse(res, 400, "Role is required");
    }
    const plans = await getPlansByRoleService(role, { isActive: true });
    return handleResponse(res, 200, `Subscription plans for ${role} fetched`, plans);
  } catch (error) {
    return handleResponse(res, error.statusCode || 500, error.message);
  }
};

export const getMySubscriptionHistory = async (req, res) => {
  try {
    const role = String(req.user?.role || "").toLowerCase();
    if (role !== "seller" && role !== "delivery") {
      return handleResponse(res, 403, "Access denied");
    }
    const subscriptions = await getMySubscriptions({
      userId: req.user?.id,
      role,
    });
    return handleResponse(res, 200, "Subscription history fetched successfully", subscriptions);
  } catch (error) {
    return handleResponse(res, error.statusCode || 500, error.message);
  }
};
