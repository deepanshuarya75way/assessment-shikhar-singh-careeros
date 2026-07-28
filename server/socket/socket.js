import * as messageService from "../services/message.service.js";

const userSocketMap = new Map(); // userId -> Set<socketId>, supports multiple tabs

function addSocket(userId, socketId) {
  if (!userSocketMap.has(userId)) userSocketMap.set(userId, new Set());
  userSocketMap.get(userId).add(socketId);
}

function removeSocket(userId, socketId) {
  const set = userSocketMap.get(userId);
  if (!set) return;
  set.delete(socketId);
  if (set.size === 0) userSocketMap.delete(userId);
}

function emitToUser(io, userId, event, payload) {
  const set = userSocketMap.get(String(userId));
  if (!set) return false;
  set.forEach((socketId) => io.to(socketId).emit(event, payload));
  return true;
}

export default function initSocket(io) {
  io.on("connection", (socket) => {
    console.log("🔌 socket connected:", socket.id);

    socket.on("register_user", ({ userId }) => {
      if (!userId) return;
      socket.userId = String(userId);
      addSocket(socket.userId, socket.id);
      socket.emit("registered", { userId: socket.userId });
      io.emit("user_online", { userId: socket.userId });
    });

    // senderId always comes from the registered socket, never the payload —
    // a client cannot spoof another user's messages this way.
    socket.on("send_message", async ({ receiverId, content }) => {
      const senderId = socket.userId;
      if (!senderId) return socket.emit("error", { message: "Not registered" });
      if (!receiverId) return socket.emit("error", { message: "receiverId is required" });

      try {
        const message = await messageService.createMessage({ senderId, receiverId, content });
        socket.emit("message_sent", message);
        emitToUser(io, receiverId, "receive_message", message);
      } catch (err) {
        socket.emit("error", { message: err.message || "Failed to send message" });
      }
    });

    socket.on("mark_read", async ({ otherUserId }) => {
      const userId = socket.userId;
      if (!userId || !otherUserId) return;
      try {
        await messageService.markConversationRead(userId, otherUserId);
        emitToUser(io, otherUserId, "messages_read", { readerId: userId });
      } catch (err) {
        socket.emit("error", { message: err.message || "Failed to mark as read" });
      }
    });

    socket.on("typing_start", ({ receiverId }) => {
      if (!socket.userId || !receiverId) return;
      emitToUser(io, receiverId, "typing_start", { senderId: socket.userId });
    });

    socket.on("typing_stop", ({ receiverId }) => {
      if (!socket.userId || !receiverId) return;
      emitToUser(io, receiverId, "typing_stop", { senderId: socket.userId });
    });

    socket.on("disconnect", () => {
      if (socket.userId) {
        removeSocket(socket.userId, socket.id);
        if (!userSocketMap.has(socket.userId)) io.emit("user_offline", { userId: socket.userId });
      }
      console.log("❌ socket disconnected:", socket.id);
    });
  });
}