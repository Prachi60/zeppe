import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    sender: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: "sender.model",
      },
      model: {
        type: String,
        required: true,
        enum: ["User", "Seller", "Admin"],
      },
    },
    content: {
      text: {
        type: String,
        required: function () {
          return !this.content.attachments || this.content.attachments.length === 0;
        },
      },
      attachments: [
        {
          url: String,
          fileType: String,
          name: String,
        },
      ],
    },
    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
    },
    readBy: [
      {
        user: { type: mongoose.Schema.Types.ObjectId },
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Index for pagination and sorting
messageSchema.index({ conversationId: 1, createdAt: -1 });

export default mongoose.model("Message", messageSchema);
