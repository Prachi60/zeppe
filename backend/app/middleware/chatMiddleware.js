import Conversation from "../models/conversation.js";
import handleResponse from "../utils/helper.js";

/**
 * Middleware to verify if the authenticated user is a participant in the conversation
 */
export const isConversationParticipant = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return handleResponse(res, 404, "Conversation not found");
    }

    const isParticipant = conversation.participants.some(
      (p) => p.participantId.toString() === userId.toString()
    );

    if (!isParticipant && req.user.role !== "admin") {
      return handleResponse(res, 403, "You are not a participant in this conversation");
    }

    req.conversation = conversation;
    next();
  } catch (error) {
    console.error("[ChatMiddleware] Error:", error);
    return handleResponse(res, 500, "Internal server error during chat validation");
  }
};

/**
 * Helper to get the correct participant model name based on user role
 */
export const getParticipantModel = (role) => {
  const roleMap = {
    customer: "User",
    user: "User",
    seller: "Seller",
    admin: "Admin",
  };
  return roleMap[role.toLowerCase()] || "User";
};
