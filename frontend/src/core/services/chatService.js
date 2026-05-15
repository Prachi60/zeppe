import axiosInstance from "@core/api/axios";

/**
 * Shared Chat Service for all roles
 */
const chatService = {
  /**
   * Initiate or get existing conversation with Admin
   */
  initiateConversation: async () => {
    try {
      const response = await axiosInstance.post("/chat/initiate");
      return response.data;
    } catch (error) {
      console.error("[ChatService] Initiate Error:", error);
      throw error;
    }
  },

  /**
   * Get all conversations for the logged-in user
   */
  getConversations: async () => {
    try {
      const response = await axiosInstance.get("/chat/conversations");
      return response.data;
    } catch (error) {
      console.error("[ChatService] GetConversations Error:", error);
      throw error;
    }
  },

  /**
   * Get paginated messages for a conversation
   */
  getMessages: async (conversationId, page = 1, limit = 50) => {
    try {
      const response = await axiosInstance.get(`/chat/messages/${conversationId}`, {
        params: { page, limit },
      });
      return response.data;
    } catch (error) {
      console.error("[ChatService] GetMessages Error:", error);
      throw error;
    }
  },

  /**
   * Mark messages as read
   */
  markAsRead: async (conversationId) => {
    try {
      const response = await axiosInstance.put(`/chat/read/${conversationId}`);
      return response.data;
    } catch (error) {
      console.error("[ChatService] MarkRead Error:", error);
      throw error;
    }
  },
};

export default chatService;
