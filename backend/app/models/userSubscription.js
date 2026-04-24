import mongoose from "mongoose";

const userSubscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "userModel",
    },
    userModel: {
      type: String,
      required: true,
      enum: ["Seller", "Delivery"],
    },
    role: {
      type: String,
      enum: ["seller", "delivery"],
      required: true,
    },
    subscriptionPlanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
      required: true,
    },
    paymentId: {
      type: String, // Razorpay payment ID
    },
    orderId: {
      type: String, // Razorpay order ID
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "expired", "pending", "failed", "cancelled"],
      default: "pending",
      index: true,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancelledBy: {
      type: String,
      enum: ["admin", "seller", "delivery", "system", null],
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for quick lookup of active subscriptions
userSubscriptionSchema.index({ userId: 1, status: 1 });
userSubscriptionSchema.index({ role: 1, status: 1, endDate: 1 });

const UserSubscription = mongoose.model("UserSubscription", userSubscriptionSchema);

export default UserSubscription;
