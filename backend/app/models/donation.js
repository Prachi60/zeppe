import mongoose from "mongoose";

const donationSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    donorName: {
      type: String,
      default: "Anonymous",
    },
    donorEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
      index: true,
    },
    checkoutGroupId: {
      type: String,
      default: null,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED"],
      default: "PAID",
      index: true,
    },
    source: {
      type: String,
      enum: ["ROUND_OFF", "DIRECT", "FIXED"],
      default: "DIRECT",
    },
    causeId: {
      type: String,
      required: true,
      index: true,
    },
    causeTitle: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },
    transactionId: {
      type: String,
      default: null,
      index: true,
    },
    donatedAt: {
      type: Date,
      default: null,
      index: true,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

donationSchema.index({ createdAt: -1 });
donationSchema.index({ customer: 1, createdAt: -1 });
donationSchema.index({ status: 1, donatedAt: -1 });
donationSchema.index({ checkoutGroupId: 1, createdAt: -1 });

export default mongoose.model("Donation", donationSchema);
