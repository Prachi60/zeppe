import mongoose from "mongoose";
import SubscriptionPlan from "../models/subscriptionPlan.js";
import UserSubscription from "../models/userSubscription.js";

const PLAN_PUBLIC_FIELDS = {
  _id: 1,
  targetRole: 1,
  role: 1,
  name: 1,
  price: 1,
  duration: 1,
  features: 1,
  isActive: 1,
  createdAt: 1,
  updatedAt: 1,
};

export function normalizeRole(role) {
  return String(role || "").trim().toLowerCase();
}

export function resolvePlanRole(input = {}) {
  return normalizeRole(input.targetRole || input.role);
}

export function resolveRoleForRequest(req, queryRole) {
  const userRole = normalizeRole(req?.user?.role);
  if (userRole === "seller" || userRole === "delivery") {
    const requestedRole = normalizeRole(queryRole);
    if (requestedRole && requestedRole !== userRole) {
      const err = new Error("Access denied");
      err.statusCode = 403;
      throw err;
    }
    return userRole;
  }
  if (userRole === "admin") {
    return normalizeRole(queryRole);
  }
  const err = new Error("Access denied");
  err.statusCode = 403;
  throw err;
}

export async function createPlan(input) {
  const role = resolvePlanRole(input);
  return SubscriptionPlan.create({
    ...input,
    targetRole: role,
    role,
  });
}

export async function updatePlan(planId, updatePayload) {
  const nextPayload = { ...updatePayload };
  const role = resolvePlanRole(nextPayload);
  if (role) {
    nextPayload.targetRole = role;
    nextPayload.role = role;
  }
  return SubscriptionPlan.findOneAndUpdate(
    { _id: planId, deletedAt: null },
    nextPayload,
    { new: true },
  );
}

export async function deletePlan(planId) {
  return SubscriptionPlan.findOneAndUpdate(
    { _id: planId, deletedAt: null },
    { isActive: false, deletedAt: new Date() },
    { new: true },
  );
}

export async function getAllPlansForAdmin() {
  return SubscriptionPlan.find({ deletedAt: null }, PLAN_PUBLIC_FIELDS).sort({ createdAt: -1 });
}

export async function getPlansByRole(role, { isActive = true } = {}) {
  const filter = {
    targetRole: role,
    deletedAt: null,
  };
  if (typeof isActive === "boolean") {
    filter.isActive = isActive;
  }
  return SubscriptionPlan.find(filter, PLAN_PUBLIC_FIELDS).sort({ createdAt: -1 });
}

export async function markExpiredSubscriptions() {
  const now = new Date();
  await UserSubscription.updateMany(
    {
      status: "active",
      endDate: { $lt: now },
    },
    {
      $set: { status: "expired" },
    },
  );
}

export async function getUserSubscriptionsForAdmin() {
  await markExpiredSubscriptions();
  return UserSubscription.find()
    .populate("userId")
    .populate("subscriptionPlanId")
    .sort({ createdAt: -1 });
}

export async function getMySubscriptions({ userId, role }) {
  if (!mongoose.Types.ObjectId.isValid(userId)) return [];
  await markExpiredSubscriptions();
  return UserSubscription.find({ userId, role })
    .populate("subscriptionPlanId")
    .sort({ createdAt: -1 });
}

export async function updateUserSubscriptionStatus({ subscriptionId, status, actorRole }) {
  const update = {
    status,
  };
  if (status === "cancelled") {
    update.cancelledAt = new Date();
    update.cancelledBy = actorRole || "system";
  }
  return UserSubscription.findByIdAndUpdate(subscriptionId, { $set: update }, { new: true })
    .populate("subscriptionPlanId");
}

