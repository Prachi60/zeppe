import express from "express";
import * as chatController from "../controller/chatController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { isConversationParticipant } from "../middleware/chatMiddleware.js";

const router = express.Router();

// All chat routes require authentication
router.use(verifyToken);

// Conversation endpoints
router.post("/initiate", chatController.initiateConversation);
router.get("/conversations", chatController.getMyConversations);

// Message endpoints
router.get(
  "/messages/:conversationId",
  isConversationParticipant,
  chatController.getConversationMessages
);
router.put(
  "/read/:conversationId",
  isConversationParticipant,
  chatController.markAsRead
);

export default router;
