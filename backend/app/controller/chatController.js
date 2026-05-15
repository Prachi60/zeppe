import Conversation from "../models/conversation.js";
import Message from "../models/message.js";
import handleResponse from "../utils/helper.js";
import { getParticipantModel } from "../middleware/chatMiddleware.js";
import Admin from "../models/admin.js";
import { getIO } from "../socket/socketManager.js";

/**
 * Get or Create a conversation (1:1)
 * Used by Customer/Seller to start a chat with Admin
 */
export const initiateConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const participantModel = getParticipantModel(userRole);

    // For simplicity, we'll route all user/seller chats to a primary admin or a pool
    // In a real system, you might assign to a specific online admin.
    // Here we find the first admin for demonstration, or use a fixed "Support" ID if available.
    const admin = await Admin.findOne({ role: "admin" });
    if (!admin) {
      return handleResponse(res, 404, "No support agents available at the moment");
    }

    const adminId = admin._id;
    const type = participantModel === "User" ? "user-admin" : "seller-admin";

    // Prevent duplicate conversations
    let conversation = await Conversation.findOne({
      type,
      "participants.participantId": { $all: [userId, adminId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        type,
        participants: [
          { participantId: userId, participantModel },
          { participantId: adminId, participantModel: "Admin" },
        ],
      });
    }

    return handleResponse(res, 200, "Conversation initiated", conversation);
  } catch (error) {
    console.error("[ChatController] Initiate Error:", error);
    return handleResponse(res, 500, "Failed to initiate conversation");
  }
};

/**
 * Get all conversations for the logged-in user
 */
export const getMyConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = await Conversation.find({
      "participants.participantId": userId,
    })
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    return handleResponse(res, 200, "Conversations fetched", conversations);
  } catch (error) {
    console.error("[ChatController] GetConversations Error:", error);
    return handleResponse(res, 500, "Failed to fetch conversations");
  }
};

/**
 * Get messages for a specific conversation with pagination
 */
export const getConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Message.countDocuments({ conversationId });

    return handleResponse(res, 200, "Messages fetched", {
      messages: messages.reverse(), // Return in chronological order
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[ChatController] GetMessages Error:", error);
    return handleResponse(res, 500, "Failed to fetch messages");
  }
};

/**
 * Mark messages as read in a conversation
 */
export const markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    // Update unread count for this user in the conversation
    await Conversation.findByIdAndUpdate(conversationId, {
      [`unreadCounts.${userId}`]: 0,
    });

    // Mark all messages as read by this user
    await Message.updateMany(
      { conversationId, "readBy.user": { $ne: userId } },
      { $push: { readBy: { user: userId, at: new Date() } } }
    );

    // Notify other participants via Socket
    try {
      const io = getIO();
      io.to(`chat:${conversationId}`).emit("chat:messages_read", {
        conversationId,
        userId,
        at: new Date(),
      });
    } catch (socketError) {
      console.warn("[ChatController] Socket notification failed:", socketError.message);
    }

    return handleResponse(res, 200, "Messages marked as read");
  } catch (error) {
    console.error("[ChatController] MarkRead Error:", error);
    return handleResponse(res, 500, "Failed to mark messages as read");
  }
};
