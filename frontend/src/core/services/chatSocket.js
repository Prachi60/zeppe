import { getOrderSocket } from "./orderSocket";

/**
 * Chat Socket Service
 */

export function joinChatRoom(conversationId, getToken) {
  const s = getOrderSocket(getToken);
  if (!s || !conversationId) return;
  s.emit("chat:join_room", { conversationId });
}

export function leaveChatRoom(conversationId, getToken) {
  const s = getOrderSocket(getToken);
  if (!s || !conversationId) return;
  s.emit("chat:leave_room", { conversationId });
}

export function sendChatMessage(conversationId, text, attachments, getToken) {
  const s = getOrderSocket(getToken);
  if (!s || !conversationId) return;
  s.emit("chat:send_message", { conversationId, text, attachments });
}

export function sendTypingStatus(conversationId, isTyping, getToken) {
  const s = getOrderSocket(getToken);
  if (!s || !conversationId) return;
  s.emit("chat:typing", { conversationId, isTyping });
}

export function onReceiveMessage(getToken, handler) {
  const s = getOrderSocket(getToken);
  if (!s || typeof handler !== "function") return () => {};
  s.on("chat:receive_message", handler);
  return () => s.off("chat:receive_message", handler);
}

export function onUserTyping(getToken, handler) {
  const s = getOrderSocket(getToken);
  if (!s || typeof handler !== "function") return () => {};
  s.on("chat:user_typing", handler);
  return () => s.off("chat:user_typing", handler);
}

export function onMessagesRead(getToken, handler) {
  const s = getOrderSocket(getToken);
  if (!s || typeof handler !== "function") return () => {};
  s.on("chat:messages_read", handler);
  return () => s.off("chat:messages_read", handler);
}
