import mongoose from "mongoose";

const donationSchema = new mongoose.Schema(
  {
    donorName: {
      type: String,
      default: "Anonymous",
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
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
  },
  { timestamps: true }
);

donationSchema.index({ createdAt: -1 });

export default mongoose.model("Donation", donationSchema);
