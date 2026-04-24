import axiosInstance from "../api/axios";

export const fetchPlansByRole = async (role) => {
  const response = await axiosInstance.get(`/subscriptions?role=${role}`);
  return response.data.results || response.data.result || [];
};

export const createSubscriptionOrder = async (planId) => {
  const response = await axiosInstance.post("/subscriptions/create-order", { planId });
  return response.data.result;
};

export const verifySubscriptionPayment = async (paymentData) => {
  const response = await axiosInstance.post("/subscriptions/verify", paymentData);
  return response.data.result;
};

// Admin methods
export const fetchAllPlansAdmin = async () => {
  const response = await axiosInstance.get("/admin/subscriptions");
  return response.data.results || response.data.result || [];
};

export const fetchUserSubscriptionsAdmin = async () => {
  const response = await axiosInstance.get("/admin/user-subscriptions");
  return response.data.results || response.data.result || [];
};

export const createPlanAdmin = async (planData) => {
  const response = await axiosInstance.post("/admin/subscriptions", planData);
  return response.data.result;
};

export const updatePlanAdmin = async (id, planData) => {
  const response = await axiosInstance.put(`/admin/subscriptions/${id}`, planData);
  return response.data.result;
};
