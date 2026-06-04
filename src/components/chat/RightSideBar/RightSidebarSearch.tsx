import React, { useEffect, useState, useRef } from "react";
import { FiX, FiSearch, FiMessageSquare } from "react-icons/fi";
import { conversationService } from "../../../services/conversationService";
import { toast } from "sonner";
import { useLanguage } from "../../../context";
import { Message } from "../../../types/conversation";
import { getMessageText } from "../../../utils/chatUtils";

interface RightSidebarSearchProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  initialQuery: string;
  onNavigateToMessage: (messageId: string) => void;
  selectedChat?: any;
  currentUserId?: string;
}

export const RightSidebarSearch: React.FC<RightSidebarSearchProps> = ({
  isOpen,
  onClose,
  conversationId,
  initialQuery,
  onNavigateToMessage,
  selectedChat,
  currentUserId,
}) => {
  const { t } = useLanguage();
  const [query, setQuery] = useState(initialQuery);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const getSenderName = (msg: any) => {
    const senderId = msg.senderId || msg.id_sender || msg.sender?.id || msg.sender?._id;
    
    if (senderId && currentUserId && (String(senderId) === String(currentUserId))) {
      return t("app.you") || "Bạn";
    }

    if (msg.sender?.displayName || msg.sender?.name || msg.sender?.username || msg.senderName) {
      return msg.sender?.displayName || msg.sender?.name || msg.sender?.username || msg.senderName;
    }

    if (selectedChat) {
      if (selectedChat.type === "private" && senderId && String(senderId) !== String(currentUserId)) {
        return selectedChat.name || selectedChat.displayName || t("app.user") || "Người dùng";
      }

      const rawMembers = [
        ...(selectedChat.members || []),
        ...(selectedChat.participants || []),
        ...(selectedChat.conversation?.members || []),
        ...(selectedChat.conversation?.participants || []),
      ];

      const member = rawMembers.find(
        (m: any) => String(m.userId || m.id || m._id || m.user?.id || m.user?._id) === String(senderId)
      );

      if (member) {
        const user = member.user || member.profile || member;
        return user.displayName || user.name || user.username || t("app.user") || "Người dùng";
      }
    }

    return t("app.user") || "Người dùng";
  };

  useEffect(() => {
    if (isOpen && initialQuery) {
      setQuery(initialQuery);
      handleSearch(initialQuery);
    }
  }, [isOpen, initialQuery, conversationId]);

  const handleSearch = async (searchQuery: string, cursor?: string) => {
    if (!searchQuery.trim() || !conversationId) return;

    try {
      setIsLoading(true);
      const res = await conversationService.searchMessages(conversationId, {
        query: searchQuery,
        cursor,
        limit: 20,
      });

      if (cursor) {
        setMessages((prev) => [...prev, ...res.messages]);
      } else {
        setMessages(res.messages);
      }
      setNextCursor(res.nextCursor);
      setHasMore(res.hasMore);
    } catch (error) {
      console.error("Search failed:", error);
      toast.error(t("chat.searchMessagesFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleScroll = () => {
    if (!listRef.current || isLoading || !hasMore) return;
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    if (scrollHeight - scrollTop - clientHeight < 50) {
      handleSearch(query, nextCursor || undefined);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-[64px] right-0 bottom-0 w-[320px] lg:w-[360px] bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-slate-700 shadow-xl z-[60] flex flex-col animate-in slide-in-from-right-4 duration-300">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700 flex flex-col gap-3 shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {t("chat.searchMessagesTitle")}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 transition"
          >
            <FiX className="text-lg" />
          </button>
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition border border-transparent dark:border-slate-700"
            placeholder={t("search.placeholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch(query);
              }
            }}
          />
        </div>
      </div>

      <div
        ref={listRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-2"
      >
        {isLoading && messages.length === 0 ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
            <FiMessageSquare className="text-4xl opacity-50" />
            <p className="text-sm">
              Không tìm thấy kết quả phù hợp
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {messages.map((msg) => (
              <div
                key={msg._id || msg.id}
                className="p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer transition border border-transparent hover:border-gray-200 dark:hover:border-slate-700"
                onClick={() => {
                  onNavigateToMessage(msg._id || msg.id as string);
                }}
              >
                <div className="flex justify-between items-baseline mb-1">
                  <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate pr-2">
                    {getSenderName(msg)}
                  </span>
                  <span className="text-xs text-gray-500 shrink-0">
                    {msg.createdAt
                      ? new Date(msg.createdAt).toLocaleDateString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                  {getMessageText(msg) || (msg.media && msg.media.length > 0 ? "[Media]" : "")}
                </p>
              </div>
            ))}
            {isLoading && hasMore && (
              <div className="flex justify-center py-4">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
