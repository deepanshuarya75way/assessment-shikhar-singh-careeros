import { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Grid, MessageSquare } from "react-feather";
import MessageList from "../components/messaging/MessageList";
import ChatInterface from "../components/messaging/ChatInterface";
import { useSocket } from "../context/SocketContext";

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
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">🎓</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">CareerOS</h1>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate(dashboardPath)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-gray-900 text-sm font-semibold border border-gray-200 shadow-sm hover:bg-gray-50 transition-all duration-200"
              >
                <Grid className="w-4 h-4" />
                Dashboard
              </button>
              <button className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 text-white text-sm font-semibold shadow-sm shadow-blue-200">
                <MessageSquare className="w-4 h-4" />
                Messages
              </button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-bold">
                {user.name?.charAt(0).toUpperCase() || "U"}
              </div>
            </div>
          </div>
        </div>
      </header>

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