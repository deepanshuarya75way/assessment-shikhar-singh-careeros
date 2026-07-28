import { useEffect, useRef, useState, useCallback } from "react";
import { MessageCircle, MoreVertical } from "react-feather";
import { useSocket } from "../../context/SocketContext";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";

export default function ChatInterface({ selectedChat, currentUserId, onConversationUpdate }) {
  const { socket, connected, onlineUsers, sendMessage, sendTyping, markRead } = useSocket();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const bottomRef = useRef(null);
  const activeChatIdRef = useRef(null); // guards against stale fetch races
  const typingHideTimeoutRef = useRef(null);

  const otherUserId = selectedChat?.userId;

  useEffect(() => {
    if (!otherUserId) {
      setMessages([]);
      return;
    }

    activeChatIdRef.current = otherUserId;
    setLoading(true);
    setOtherTyping(false);

    fetch(`${import.meta.env.VITE_API_URL}/api/messages/${currentUserId}/${otherUserId}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed to load"))))
      .then((history) => {
        if (activeChatIdRef.current !== otherUserId) return; // user switched chats mid-fetch
        setMessages(history);
        markRead(otherUserId);
        onConversationUpdate?.(otherUserId, { unreadCount: 0 });
      })
      .catch((err) => {
        if (activeChatIdRef.current === otherUserId) {
          console.error("Error loading conversation:", err);
          setMessages([]);
        }
      })
      .finally(() => {
        if (activeChatIdRef.current === otherUserId) setLoading(false);
      });
  }, [otherUserId, currentUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, otherTyping]);

  useEffect(() => {
    if (!socket) return;

    const belongsToOpenChat = (msg) => {
      const otherId = activeChatIdRef.current;
      if (!otherId) return false;
      return (
        (String(msg.senderId) === String(otherId) && String(msg.receiverId) === String(currentUserId)) ||
        (String(msg.senderId) === String(currentUserId) && String(msg.receiverId) === String(otherId))
      );
    };

    const appendUnique = (msg) => {
      setMessages((prev) => (prev.some((m) => String(m._id) === String(msg._id)) ? prev : [...prev, msg]));
    };

    const handleMessageSent = (msg) => belongsToOpenChat(msg) && appendUnique(msg);

    const handleReceiveMessage = (msg) => {
      onConversationUpdate?.(String(msg.senderId), { lastMessage: msg, bump: true });
      if (!belongsToOpenChat(msg)) return;
      appendUnique(msg);
      markRead(String(msg.senderId));
    };

    const handleTypingStart = ({ senderId }) => {
      if (String(senderId) !== String(activeChatIdRef.current)) return;
      setOtherTyping(true);
      if (typingHideTimeoutRef.current) clearTimeout(typingHideTimeoutRef.current);
      typingHideTimeoutRef.current = setTimeout(() => setOtherTyping(false), 4000);
    };

    const handleTypingStop = ({ senderId }) => {
      if (String(senderId) === String(activeChatIdRef.current)) setOtherTyping(false);
    };

    const handleMessagesRead = ({ readerId }) => {
      if (String(readerId) !== String(activeChatIdRef.current)) return;
      setMessages((prev) =>
        prev.map((m) => (String(m.senderId) === String(currentUserId) ? { ...m, read: true } : m))
      );
    };

    socket.on("message_sent", handleMessageSent);
    socket.on("receive_message", handleReceiveMessage);
    socket.on("typing_start", handleTypingStart);
    socket.on("typing_stop", handleTypingStop);
    socket.on("messages_read", handleMessagesRead);

    return () => {
      socket.off("message_sent", handleMessageSent);
      socket.off("receive_message", handleReceiveMessage);
      socket.off("typing_start", handleTypingStart);
      socket.off("typing_stop", handleTypingStop);
      socket.off("messages_read", handleMessagesRead);
    };
  }, [socket, currentUserId, markRead, onConversationUpdate]);

  const handleSend = useCallback((content) => otherUserId && sendMessage(otherUserId, content), [otherUserId, sendMessage]);
  const handleTyping = useCallback((isTyping) => otherUserId && sendTyping(otherUserId, isTyping), [otherUserId, sendTyping]);

  if (!selectedChat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-2xl border border-gray-100">
        <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
          <MessageCircle className="w-7 h-7 text-blue-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-1">Select a conversation</h3>
        <p className="text-gray-500 text-sm mb-4">Choose a conversation from the list or start a new one with a counsellor</p>
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 text-xs text-gray-500">
          {connected ? "Connected to CareerOS messaging" : "Connecting..."}
        </span>
      </div>
    );
  }

  const isOnline = onlineUsers.has(String(otherUserId));

  return (
    <div className="flex-1 flex flex-col bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-semibold flex items-center justify-center">
              {selectedChat.initials}
            </div>
            {isOnline && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">{selectedChat.name}</span>
              <span className="text-xs text-gray-400">{isOnline ? "Online" : "Offline"}</span>
            </div>
            <p className="text-xs text-gray-500">
              {selectedChat.role === "counselor" ? "Career Counsellor" : "Student"}
              {selectedChat.specialization ? ` · ${selectedChat.specialization}` : ""}
            </p>
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-gray-50">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-8">No messages yet. Say hello to start the conversation.</p>
        ) : (
          messages.map((m) => (
            <MessageBubble key={m._id} message={m} isOwn={String(m.senderId) === String(currentUserId)} />
          ))
        )}
        {otherTyping && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-white border border-gray-200 px-4 py-2 text-xs text-gray-400">
              {selectedChat.name} is typing...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <MessageInput onSend={handleSend} onTyping={handleTyping} disabled={!connected} />
    </div>
  );
}