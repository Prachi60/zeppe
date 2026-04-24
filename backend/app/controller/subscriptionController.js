import SubscriptionPlan from "../models/subscriptionPlan.js";
import UserSubscription from "../models/userSubscription.js";
import handleResponse from "../utils/helper.js";

// --- Admin APIs ---

export const createPlan = async (req, res) => {
  try {
    const { role, name, price, duration, features, isActive } = req.body;
    const plan = await SubscriptionPlan.create({
      role,
      name,
      price,
      duration,
      features,
      isActive,
    });
    return handleResponse(res, 201, "Subscription plan created successfully", plan);
  } catch (error) {
    return handleResponse(res, 500, error.message);
  }
};

export const updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await SubscriptionPlan.findByIdAndUpdate(id, req.body, { new: true });
    if (!plan) return handleResponse(res, 404, "Plan not found");
    return handleResponse(res, 200, "Subscription plan updated successfully", plan);
  } catch (error) {
    return handleResponse(res, 500, error.message);
  }
};

export const getAllPlansAdmin = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find().sort({ createdAt: -1 });
    return handleResponse(res, 200, "All subscription plans fetched", plans);
  } catch (error) {
    return handleResponse(res, 500, error.message);
  }
};

// --- Public/User APIs ---

export const getPlansByRole = async (req, res) => {
  try {
    const { role } = req.query;
    if (!role) return handleResponse(res, 400, "Role is required");
    const plans = await SubscriptionPlan.find({ role, isActive: true });
    return handleResponse(res, 200, `Subscription plans for ${role} fetched`, plans);
  } catch (error) {
    return handleResponse(res, 500, error.message);
  }
};
