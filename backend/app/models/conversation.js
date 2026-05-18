import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        participantId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          refPath: "participants.participantModel",
        },
        participantModel: {
          type: String,
          required: true,
          enum: ["User", "Seller", "Admin"],
        },
        lastRead: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    type: {
      type: String,
      enum: ["user-admin", "seller-admin"],
      required: true,
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    unreadCounts: {
      type: Map,
      of: Number,
      default: {},
    },
    metadata: {
      subject: String,
      status: {
        type: String,
        enum: ["active", "closed"],
        default: "active",
      },
    },
  },
  { timestamps: true }
);

// Index for finding conversations by participants
conversationSchema.index({ "participants.participantId": 1 });

export default mongoose.model("Conversation", conversationSchema);
