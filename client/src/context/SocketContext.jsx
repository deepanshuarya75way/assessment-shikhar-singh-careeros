import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within a SocketProvider");
  return ctx;
}

// This app's auth is localStorage-based with no login event to hook into,
// so we re-check localStorage on route changes (cheap) and only reconnect
// the socket if the logged-in user actually changed.
export function SocketProvider({ children }) {
  const location = useLocation();
  const socketRef = useRef(null);
  const registeredUserIdRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(() => new Set());
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "null");
    const userId = storedUser?._id || null;
    setCurrentUserId(userId);

    if (!userId) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      registeredUserIdRef.current = null;
      return;
    }

    if (socketRef.current && registeredUserIdRef.current === userId) return; // already connected as this user

    socketRef.current?.disconnect();

    const socket = io(import.meta.env.VITE_API_URL, { withCredentials: true });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("register_user", { userId, role: storedUser.role });
      registeredUserIdRef.current = userId;
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", () => setConnected(false));

    socket.on("user_online", ({ userId: uid }) => setOnlineUsers((prev) => new Set(prev).add(uid)));
    socket.on("user_offline", ({ userId: uid }) =>
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(uid);
        return next;
      })
    );
  }, [location.pathname]);

  useEffect(() => () => socketRef.current?.disconnect(), []);

  const sendMessage = useCallback((receiverId, content) => {
    socketRef.current?.emit("send_message", { receiverId, content });
  }, []);

  const sendTyping = useCallback((receiverId, isTyping) => {
    socketRef.current?.emit(isTyping ? "typing_start" : "typing_stop", { receiverId });
  }, []);

  const markRead = useCallback((otherUserId) => {
    socketRef.current?.emit("mark_read", { otherUserId });
  }, []);

  const value = { socket: socketRef.current, connected, onlineUsers, currentUserId, sendMessage, sendTyping, markRead };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}