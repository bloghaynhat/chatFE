import { useState, useMemo } from "react";
import { FiSearch, FiX, FiMapPin, FiChevronRight, FiClock } from "react-icons/fi";
import { getMessageText } from "../../../utils/chatUtils";
import type { Message } from "../../../types/conversation";

// Simple Vietnamese relative time function
const getRelativeTime = (timestamp: string): string => {
  try {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffInSeconds < 60) return "vừa xong";
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} phút trước`;
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} giờ trước`;
    }
    if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ngày trước`;
    }

    // For older messages, show date
    return past.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "Không xác định";
  }
};

interface PinnedListProps {
  pinnedMessages: Message[];
  currentUserId: string;
  isOpen: boolean;
  onClose: () => void;
  onUnpin: (messageId: string) => Promise<void>;
  onNavigateToMessage: (messageId: string) => void;
}

export const PinnedList: React.FC<PinnedListProps> = ({
  pinnedMessages,
  currentUserId,
  isOpen,
  onClose,
  onUnpin,
  onNavigateToMessage,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return pinnedMessages;

    const query = searchQuery.toLowerCase();
    return pinnedMessages.filter((msg) => {
      const text = getMessageText(msg);
      const senderName = msg?.sender?.displayName || msg?.senderName || "";
      return text?.toLowerCase().includes(query) || senderName.toLowerCase().includes(query);
    });
  }, [pinnedMessages, searchQuery]);

  const handleMessageClick = (messageId: string) => {
    onNavigateToMessage(messageId);
    onClose();
  };

  const handleUnpin = async (e: React.MouseEvent, messageId: string) => {
    e.stopPropagation();
    try {
      await onUnpin(messageId);
    } catch (error) {
      console.error("Failed to unpin:", error);
    }
  };

  // Format pin time
  const formatPinTime = (timestamp: string) => {
    return getRelativeTime(timestamp);
  };

  // Get sender name
  const getSenderName = (msg: any) => {
    return msg?.sender?.displayName || msg?.senderName || "Unknown";
  };

  // Get sender avatar
  const getSenderAvatar = (msg: any) => {
    return msg?.sender?.avatar || msg?.sender?.avatarUrl || msg?.sender?.profilePicture || null;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 dark:bg-black/70 z-40 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <FiMapPin className="text-blue-500" strokeWidth={2.5} />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Pinned Messages ({pinnedMessages.length})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <FiX className="text-xl text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search pinned messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Pinned Messages List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
          {filteredMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <FiMapPin className="text-5xl mb-3 opacity-50" />
              <p>{searchQuery ? "No matching messages" : "No pinned messages"}</p>
            </div>
          ) : (
            filteredMessages.map((msg) => {
              const messageId = msg.id || msg._id;
              const senderName = getSenderName(msg);
              const senderAvatar = getSenderAvatar(msg);
              const messageText = getMessageText(msg);

              return (
                <div
                  key={messageId}
                  onClick={() => handleMessageClick(messageId)}
                  className="flex gap-3 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer transition-colors group border border-transparent hover:border-blue-200 dark:hover:border-blue-900/50"
                >
                  {/* Sender Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                    {senderAvatar ? (
                      <img src={senderAvatar} alt={senderName} className="w-full h-full object-cover" />
                    ) : (
                      senderName.charAt(0).toUpperCase()
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {senderName}
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5 line-clamp-2">
                          {messageText || "(No content)"}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {/* Pin Time */}
                        <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                          <FiClock className="text-[10px]" />
                          <span>{formatPinTime(msg.pinnedAt || msg.createdAt)}</span>
                        </div>
                        <FiChevronRight className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                      </div>
                    </div>

                    {/* Message Type Badge */}
                    {["image", "file", "video", "voice", "sticker", "gif"].includes(String(msg.type || "").toLowerCase()) || msg.files || msg.media ? (
                      <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium rounded">
                        📎 Media
                      </div>
                    ) : null}
                  </div>

                  {/* Unpin Button (show on hover) */}
                  <button
                    onClick={(e) => handleUnpin(e, messageId)}
                    className="self-start p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 rounded-full transition-all"
                    title="Unpin message"
                  >
                    <FiX />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
};

export default PinnedList;
