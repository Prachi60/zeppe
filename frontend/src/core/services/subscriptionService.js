import axiosInstance from "../api/axios";

export const fetchPlansByRole = async (role) => {
  const response = await axiosInstance.get(`/api/subscriptions?role=${role}`);
  return response.data.results || response.data.result || [];
};

export const createSubscriptionOrder = async (planId) => {
  const response = await axiosInstance.post("/api/payments/create-order", { planId });
  return response.data.result;
};

export const verifySubscriptionPayment = async (paymentData) => {
  const response = await axiosInstance.post("/api/payments/verify", paymentData);
  return response.data.result;
};

// Admin methods
export const fetchAllPlansAdmin = async () => {
  const response = await axiosInstance.get("/api/admin/subscriptions");
  return response.data.results || response.data.result || [];
};

export const createPlanAdmin = async (planData) => {
  const response = await axiosInstance.post("/api/admin/subscriptions", planData);
  return response.data.result;
};

export const updatePlanAdmin = async (id, planData) => {
  const response = await axiosInstance.put(`/api/admin/subscriptions/${id}`, planData);
  return response.data.result;
};
