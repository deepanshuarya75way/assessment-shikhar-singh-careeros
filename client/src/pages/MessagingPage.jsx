import { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Grid, MessageSquare } from "react-feather";
import MessageList from "../components/messaging/MessageList";
import ChatInterface from "../components/messaging/ChatInterface";
import { useSocket } from "../context/SocketContext";
import Navbar from "../components/Navbar";

export default function MessagingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { connected } = useSocket();

  const [user] = useState(() => JSON.parse(localStorage.getItem("user")) || null);
  const [selectedChat, setSelectedChat] = useState(location.state?.preSelectedChat || null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    if (location.state?.preSelectedChat) window.history.replaceState({}, document.title);
  }, [location.state]);

  const handleConversationUpdate = useCallback(() => setRefreshToken((t) => t + 1), []);

  if (!user?._id) {
    navigate("/");
    return null;
  }

  const dashboardPath = user.role === "counselor" ? "/counselor-dashboard" : "/student-dashboard";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar user={user} />

      {!connected && (
        <div className="bg-yellow-50 border-b border-yellow-200 text-yellow-800 text-sm text-center py-2">
          Reconnecting... you're currently offline
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex gap-6 min-h-0">
        <MessageList
          currentUserId={user._id}
          currentUserRole={user.role}
          selectedChat={selectedChat}
          onSelectChat={setSelectedChat}
          refreshToken={refreshToken}
        />
        <ChatInterface selectedChat={selectedChat} currentUserId={user._id} onConversationUpdate={handleConversationUpdate} />
      </main>
    </div>
  );
}