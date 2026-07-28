function formatTime(dateString) {
  return new Date(dateString).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function MessageBubble({ message, isOwn }) {
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${
          isOwn ? "bg-blue-600 text-white rounded-br-sm" : "bg-white text-gray-900 border border-gray-200 rounded-bl-sm"
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <div className={`mt-1 flex items-center gap-1 text-[10px] ${isOwn ? "text-blue-100 justify-end" : "text-gray-400"}`}>
          <span>{formatTime(message.createdAt)}</span>
          {isOwn && <span>{message.read ? "· Read" : "· Sent"}</span>}
        </div>
      </div>
    </div>
  );
}