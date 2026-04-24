import mongoose from "mongoose";

const subscriptionPlanSchema = new mongoose.Schema(
  {
    targetRole: {
      type: String,
      enum: ["seller", "delivery"],
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["seller", "delivery"],
      default: undefined,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    duration: {
      value: {
        type: Number,
        required: true,
        min: 1,
      },
      unit: {
        type: String,
        enum: ["days", "months"],
        required: true,
      },
    },
    features: [
      {
        type: String,
        trim: true,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

subscriptionPlanSchema.pre("validate", function normalizePlanRole(next) {
  if (!this.targetRole && this.role) {
    this.targetRole = this.role;
  }
  if (!this.role && this.targetRole) {
    this.role = this.targetRole;
  }
  if (this.role && this.targetRole && this.role !== this.targetRole) {
    this.role = this.targetRole;
  }
  next();
});

subscriptionPlanSchema.index({ targetRole: 1, isActive: 1, deletedAt: 1, createdAt: -1 });

const SubscriptionPlan = mongoose.model("SubscriptionPlan", subscriptionPlanSchema);

export default SubscriptionPlan;
