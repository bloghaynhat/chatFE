import { useMemo, useState, useEffect, useCallback } from "react";
import { FiArchive, FiUser, FiSearch } from "react-icons/fi";
import { userService, conversationService } from "../../services";
import { socketService } from "../../services/socketService";
import { ConversationItem } from "./ChatList/ConversationItem";
import { GlobalUserItem } from "./ChatList/GlobalUserItem";

export const ChatList = ({
  searchQuery = "",
  filterMode = "all",
  isCollapsed = false,
  activeChatId = null,
  openingChatId = null,
  isGlobalSearchEnabled = false,
  onSelectChat,
}: any) => {
  const [chats, setChats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchChats = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const response: any = await conversationService.getConversations();
      const data = response?.data || response || [];
      setChats(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch conversations error:", err);
      setChats([]);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // Reset unread count when chat is opened
  useEffect(() => {
    if (activeChatId) {
      setChats((prevChats) => prevChats.map((c) => (c.id === activeChatId ? { ...c, unreadCount: 0 } : c)));
    }
  }, [activeChatId]);

  useEffect(() => {
    const unsubscribe = socketService.onNewMessage((payload) => {
      const message = payload?.message || payload;
      let msgConvId = message.conversationId || payload?.conversationId;
      if (msgConvId && typeof msgConvId === "object") {
        msgConvId = msgConvId._id || msgConvId.id;
      }

      if (!msgConvId) return;

      setChats((prevChats) => {
        const idx = prevChats.findIndex((c) => c.id === msgConvId);

        const newLastMessage = {
          messageId: message.id || message._id,
          createdAt: message.createdAt || new Date().toISOString(),
          senderId: message.senderId || message.sender?.id || message.sender?._id || message.id_sender,
          textPreview:
            message.textPreview ||
            message.text ||
            message.content ||
            (message.type === "media" ? "Sent a media file" : "No messages"),
          type: message.type || "text",
        };

        if (idx !== -1) {
          const chat = prevChats[idx];
          const isCurrentlyActive = activeChatId === msgConvId || openingChatId === msgConvId;

          const updatedChat = {
            ...chat,
            lastMessage: newLastMessage,
            lastMessageTimeFormatted: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            unreadCount: isCurrentlyActive ? 0 : (chat.unreadCount || 0) + 1,
            lastMessageAt: newLastMessage.createdAt,
          };

          // Filter out the old chat and put the updated one at the top
          const filteredChats = prevChats.filter((c) => c.id !== msgConvId);
          return [updatedChat, ...filteredChats];
        } else {
          // If the chat doesn't exist in the list, fetch the updated list from the server silently
          fetchChats(false);
          return prevChats;
        }
      });
    });

    return () => {
      // Call the unsubscribe function returned by our event manager
      unsubscribe();
    };
  }, [activeChatId, openingChatId, fetchChats]);

  const [globalUsers, setGlobalUsers] = useState([]);
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  useEffect(() => {
    if (!isGlobalSearchEnabled) return;

    const isPossiblePhone = /^0\d{9}$/.test(normalizedQuery);

    if (!normalizedQuery || !isPossiblePhone) {
      setGlobalUsers([]);
      setIsSearchingGlobal(false);
      return;
    }

    const fetchGlobalSearch = async () => {
      setIsSearchingGlobal(true);
      try {
        const response: any = await userService.searchUsers(normalizedQuery);
        const results = response?.users || response || [];
        setGlobalUsers(Array.isArray(results) ? results : results.id || results._id ? [results] : []);
      } catch (err) {
        console.error("Global search error:", err);
        setGlobalUsers([]);
      } finally {
        setIsSearchingGlobal(false);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchGlobalSearch();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [normalizedQuery, isGlobalSearchEnabled]);

  const visibleChats = useMemo(() => {
    let baseList = chats;

    if (filterMode === "archived") {
      baseList = chats.filter((chat) => chat.archived);
    }

    if (!normalizedQuery) {
      return baseList;
    }

    return baseList.filter(
      (chat) =>
        chat.name?.toLowerCase().includes(normalizedQuery) ||
        chat.lastMessage?.textPreview?.toLowerCase().includes(normalizedQuery),
    );
  }, [chats, filterMode, normalizedQuery]);

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex-1 overflow-y-auto pb-20">
        {normalizedQuery && (
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">
            Recent Chats
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        ) : visibleChats.length === 0 && !normalizedQuery ? (
          <div className="h-full min-h-[240px] flex flex-col items-center justify-center text-center px-6 text-gray-500 dark:text-gray-400">
            {!isCollapsed && (
              <>
                <p className="font-semibold text-gray-700 dark:text-gray-200 mb-1">No matching conversations found</p>
                <p className="text-sm">Try a different keyword or start a new message from the + button.</p>
              </>
            )}
            {isCollapsed && <FiSearch className="text-xl text-gray-400" />}
          </div>
        ) : (
          visibleChats.map((chat) => (
            <ConversationItem
              key={chat.id}
              chat={chat}
              isCollapsed={isCollapsed}
              activeChatId={activeChatId}
              openingChatId={openingChatId}
              onSelectChat={onSelectChat}
            />
          ))
        )}

        {isGlobalSearchEnabled && normalizedQuery && (
          <div className="mt-2">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400 border-t dark:border-slate-700">
              Global Users
            </div>

            {isSearchingGlobal ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
            ) : globalUsers.length === 0 ? (
              <div className="py-4 text-center text-sm text-gray-500">No users found</div>
            ) : (
              globalUsers.map((user) => (
                <GlobalUserItem
                  key={`global-${user.id || user._id}`}
                  user={user}
                  isCollapsed={isCollapsed}
                  onSelectChat={onSelectChat}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
