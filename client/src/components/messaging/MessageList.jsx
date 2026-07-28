import { useEffect, useMemo, useState } from "react";
import { Search } from "react-feather";
import { useSocket } from "../../context/SocketContext";

function timeAgo(dateString) {
  const mins = Math.floor((Date.now() - new Date(dateString).getTime()) / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return new Date(dateString).toLocaleDateString("en-US", { weekday: "short" });
  return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function initialsOf(name) {
  return (name || "?").split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

export default function MessageList({ currentUserId, currentUserRole, selectedChat, onSelectChat, refreshToken }) {
  const { onlineUsers } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [counsellors, setCounsellors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    setLoading(true);
    fetch(`${import.meta.env.VITE_API_URL}/api/messages/conversations/${currentUserId}`)
      .then((res) => (res.ok ? res.json() : []))
      .then(setConversations)
      .catch(() => setConversations([]))
      .finally(() => setLoading(false));
  }, [currentUserId, refreshToken]);

  useEffect(() => {
    if (currentUserRole !== "student") return;
    fetch(`${import.meta.env.VITE_API_URL}/api/users/counsellors/all`)
      .then((res) => (res.ok ? res.json() : []))
      .then(setCounsellors)
      .catch(() => setCounsellors([]));
  }, [currentUserRole]);

  const totalUnread = useMemo(() => conversations.reduce((s, c) => s + (c.unreadCount || 0), 0), [conversations]);

  const filteredConversations = useMemo(() => {
    let list = conversations;
    if (filter === "unread") list = list.filter((c) => c.unreadCount > 0);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((c) => c.otherUser.name?.toLowerCase().includes(q));
    }
    return list;
  }, [conversations, filter, search]);

  const conversationPartnerIds = useMemo(() => new Set(conversations.map((c) => c.otherUser.userId)), [conversations]);
  const discoverable = useMemo(
    () => counsellors.filter((c) => !conversationPartnerIds.has(String(c.userId))),
    [counsellors, conversationPartnerIds]
  );

  const openConversation = (otherUser) =>
    onSelectChat({
      userId: otherUser.userId,
      name: otherUser.name,
      role: otherUser.role,
      specialization: otherUser.specialization,
      initials: otherUser.initials,
    });

  const openWithCounsellor = (c) =>
    onSelectChat({
      userId: c.userId,
      name: c.fullName,
      role: "counselor",
      specialization: c.specialization,
      initials: initialsOf(c.fullName),
    });

  return (
    <div className="w-full max-w-sm flex flex-col bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-2xl font-bold text-gray-900">Messages</h2>
          {totalUnread > 0 && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600">{totalUnread}</span>
          )}
        </div>
        <p className="text-sm text-gray-500 mb-4">
          {currentUserRole === "counselor" ? "Conversations with your students" : "Chat with counsellors and keep every conversation in one place"}
        </p>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations or counsellors"
            className="w-full pl-9 pr-3 py-2 rounded-full bg-gray-50 border border-gray-100 text-sm outline-none focus:border-blue-300"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium ${filter === "all" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium ${filter === "unread" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}
          >
            Unread
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-gray-400">
            {conversations.length === 0 ? "No conversations yet" : "No conversations found"}
          </div>
        ) : (
          filteredConversations.map((c) => {
            const isSelected = selectedChat?.userId === c.otherUser.userId;
            const isOnline = onlineUsers.has(String(c.otherUser.userId));
            return (
              <button
                key={c.otherUser.userId}
                onClick={() => openConversation(c.otherUser)}
                className={`w-full text-left px-5 py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${isSelected ? "bg-blue-50/60" : ""}`}
              >
                <div className="flex gap-3">
                  <div className="relative shrink-0">
                    <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-700 font-semibold flex items-center justify-center">
                      {c.otherUser.initials}
                    </div>
                    {isOnline && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900 truncate">{c.otherUser.name}</span>
                      <span className="text-xs text-gray-400 shrink-0 ml-2">{timeAgo(c.lastMessage.createdAt)}</span>
                    </div>
                    <span className="inline-block mt-0.5 mb-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      {c.otherUser.role === "counselor" ? "Counsellor" : "Student"}
                    </span>
                    <p className="text-sm text-gray-500 truncate">{c.lastMessage.content}</p>
                  </div>
                  {c.unreadCount > 0 && (
                    <span className="self-center shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-blue-600 text-white text-xs font-semibold flex items-center justify-center">
                      {c.unreadCount}
                    </span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>

      {currentUserRole === "student" && (
        <div className="border-t border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900">Discover Counsellors</h3>
            <span className="text-xs text-gray-400">Start a new conversation</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {discoverable.length === 0 ? (
              <p className="text-xs text-gray-400">You're already talking to every available counsellor.</p>
            ) : (
              discoverable.map((c) => (
                <button
                  key={c.userId}
                  onClick={() => openWithCounsellor(c)}
                  className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold flex items-center justify-center">
                    {initialsOf(c.fullName)}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-gray-900">{c.fullName}</p>
                    <p className="text-[10px] text-gray-400">{c.specialization}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}