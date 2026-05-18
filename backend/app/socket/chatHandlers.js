import Message from "../models/message.js";
import Conversation from "../models/conversation.js";
import { getParticipantModel } from "../middleware/chatMiddleware.js";

export const registerChatHandlers = (io, socket) => {
  const { id: userId, role } = socket.user || {};

  /**
   * Join a specific conversation room
   */
  socket.on("chat:join_room", async ({ conversationId }) => {
    if (!conversationId) return;

    // Optional: Verify if user is actually a participant before joining
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return;

    const isParticipant = conversation.participants.some(
      (p) => p.participantId.toString() === userId.toString()
    );

    if (isParticipant || role === "admin") {
      socket.join(`chat:${conversationId}`);
      console.log(`[Socket] User ${userId} joined chat room: chat:${conversationId}`);
    }
  });

  /**
   * Handle sending a new message
   */
  socket.on("chat:send_message", async ({ conversationId, text, attachments }) => {
    try {
      if (!conversationId || (!text && (!attachments || attachments.length === 0))) return;

      const participantModel = getParticipantModel(role);

      // Save message to database
      const newMessage = await Message.create({
        conversationId,
        sender: {
          id: userId,
          model: participantModel,
        },
        content: {
          text,
          attachments: attachments || [],
        },
      });

      // Update last message in conversation and increment unread counts for others
      const conversation = await Conversation.findById(conversationId);
      if (conversation) {
        conversation.lastMessage = newMessage._id;
        
        // Increment unread count for all participants except sender
        conversation.participants.forEach(p => {
          if (p.participantId.toString() !== userId.toString()) {
            const currentCount = conversation.unreadCounts.get(p.participantId.toString()) || 0;
            conversation.unreadCounts.set(p.participantId.toString(), currentCount + 1);
          }
        });

        await conversation.save();
      }

      // Broadcast message to the room
      io.to(`chat:${conversationId}`).emit("chat:receive_message", newMessage);

    } catch (error) {
      console.error("[Socket] Chat Send Message Error:", error);
      socket.emit("chat:error", { message: "Failed to send message" });
    }
  });

  /**
   * Handle typing indicators
   */
  socket.on("chat:typing", ({ conversationId, isTyping }) => {
    if (!conversationId) return;
    socket.to(`chat:${conversationId}`).emit("chat:user_typing", {
      userId,
      isTyping,
    });
  });

  /**
   * Leave conversation room
   */
  socket.on("chat:leave_room", ({ conversationId }) => {
    if (!conversationId) return;
    socket.leave(`chat:${conversationId}`);
    console.log(`[Socket] User ${userId} left chat room: chat:${conversationId}`);
  });
};
