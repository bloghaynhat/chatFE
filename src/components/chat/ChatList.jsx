import { useMemo, useState, useEffect } from "react";
import { FiUser, FiSearch, FiXCircle, FiCheck, FiEye } from "react-icons/fi";
import { userService, conversationService, socketService } from "../../services";
import { useAuth } from "../../hooks";

export const ChatList = ({
  searchQuery = "",
  filterMode = "all",
  isCollapsed = false,
  activeChatId = null,
  openingChatId = null,
  isGlobalSearchEnabled = false,
  onSelectChat,
}) => {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Helper function to format conversations from API response
  const formatConversations = (data) => {
    if (!Array.isArray(data)) {
      console.warn("[ChatList] formatConversations - data is not array:", typeof data, data);
      return [];
    }
    return data.map((conv) => {
      return {
        id: conv.id || conv._id,
        targetUserId: conv.pairKey ? conv.pairKey.split("_").find((id) => id !== user?.id) : null,
        avatarUrl: conv.avatarUrl,
        avatar: <FiUser className="text-2xl" />,
        name: conv.name || "Unknown",
        message:
          conv.lastMessage?.textPreview || (conv.lastMessage?.type === "system" ? "System message" : "Media object"),
        time: conv.lastMessageTimeFormatted || "",
        unread: 0,
        archived: false,
        lastMessageStatus: (conv.lastMessage?.status || conv.lastMessageStatus || "SENT").toUpperCase(),
        isOwnLastMessage:
          String(conv.lastMessage?.senderId?._id || conv.lastMessage?.senderId || conv.lastMessage?.sender) ===
          String(user?.id),
      };
    });
  };

  // Fetch conversations from API
  const fetchConversations = async () => {
    try {
      const response = await conversationService.getConversations({ page: 1, limit: 100 });
      console.log("[ChatList] /conversations API response:", {
        rawResponse: response,
        data: response?.data?.conversations || response?.conversations || response,
        firstConversation: (response?.data?.conversations || response?.conversations || response)?.[0],
      });
      const data = response?.data?.conversations || response?.conversations || response || [];
      const formattedChats = formatConversations(data);
      setChats(formattedChats);
      return formattedChats;
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
    }
  };

  // Fetch initial conversations
  useEffect(() => {
    const initFetch = async () => {
      setIsLoading(true);
      await fetchConversations();
      setIsLoading(false);
    };

    initFetch();
  }, [user?.id]);

  // Listen to socket events and refetch conversations to sync unreadCount from API
  useEffect(() => {
    let unsubs = {};

    const handleNewMessage = (payload) => {
      const message = payload?.message || payload;
      if (!message || (!message._id && !message.id)) return;

      // Fetch conversations to update list (move to top, update last message)
      fetchConversations();

      // Move the conversation with new message to the top
      setChats((prevChats) => {
        const conversationId = message.conversationId || payload?.conversationId;
        const index = prevChats.findIndex((c) => c.id === conversationId);

        if (index === -1) {
          return prevChats;
        }

        // Move to top if not already first
        if (index > 0) {
          const newChats = [...prevChats];
          const [chat] = newChats.splice(index, 1);
          chat.message =
            message.textPreview || (message.type === "system" ? "System message" : message.text || "Media object");
          chat.time = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
          chat.lastMessageStatus = "SENT";
          const senderIdStr = message.senderId?._id || message.senderId;
          chat.isOwnLastMessage = String(senderIdStr) === String(user?.id);
          newChats.unshift(chat);
          return newChats;
        }

        return prevChats;
      });
    };

    const handleMessageAdded = (event) => {
      // When message is sent from MainLayout, refetch conversations
      fetchConversations();
    };

    let isSubscribed = true;
    socketService.connect().then(() => {
      if (isSubscribed) {
        unsubs.unsubNewMessage = socketService.onNewMessage(handleNewMessage);
      }
    });

    // Listen to custom event from MainLayout when message is sent
    window.addEventListener("messageAdded", handleMessageAdded);

    return () => {
      isSubscribed = false;
      Object.values(unsubs).forEach((unsub) => unsub && unsub());
      window.removeEventListener("messageAdded", handleMessageAdded);
    };
  }, [user?.id]);

  const [globalUsers, setGlobalUsers] = useState([]);
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  useEffect(() => {
    // Chỉ gọi API nếu được phép
    if (!isGlobalSearchEnabled) return;

    // API backend chỉ chấp nhận tìm kiếm phone hợp lệ (đủ 10 số, bắt đầu bằng 0)
    // Ngăn chặn việc gọi API liên tục với các chuỗi gõ dở dang hoặc từ khóa không phải số điện thoại
    const isPossiblePhone = /^0\d{9}$/.test(normalizedQuery);

    if (!normalizedQuery || !isPossiblePhone) {
      setGlobalUsers([]);
      setIsSearchingGlobal(false);
      return;
    }

    const fetchGlobalSearch = async () => {
      setIsSearchingGlobal(true);
      try {
        const response = await userService.searchUsers(normalizedQuery);
        // Do axios interceptor trả về payload.data nên response chính là object/array chứa data
        const results = response?.users || response || [];
        setGlobalUsers(Array.isArray(results) ? results : results.id || results._id ? [results] : []);
      } catch (err) {
        console.error("Global search error:", err);
        setGlobalUsers([]);
      } finally {
        setIsSearchingGlobal(false);
      }
    };

    // Thêm một lớp debounce nhỏ 500ms riêng cho Global Search để chống spam API nếu gõ rất nhanh
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
      console.log(
        "[ChatList] Visible chats (no filter):",
        baseList.map((c) => ({ id: c.id, name: c.name, unread: c.unread })),
      );
      return baseList;
    }

    const filtered = baseList.filter(
      (chat) =>
        chat.name?.toLowerCase().includes(normalizedQuery) || chat.message?.toLowerCase().includes(normalizedQuery),
    );
    console.log(
      "[ChatList] Visible chats (filtered):",
      filtered.map((c) => ({ id: c.id, name: c.name, unread: c.unread })),
    );
    return filtered;
  }, [chats, filterMode, normalizedQuery]);

  return (
    <div className="flex flex-col h-full w-full">
      {/* Chats List */}
      <div className="flex-1 overflow-y-auto pb-20">
        {normalizedQuery && (
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">
            Recent Chats
          </div>
        )}

        {visibleChats.length === 0 && !normalizedQuery ? (
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
            <div
              key={chat.id}
              onClick={() => {
                if (chat.archived || openingChatId === chat.id) return;
                onSelectChat?.(chat);
              }}
              className={`flex items-center border-b dark:border-slate-700 transition relative ${
                isCollapsed ? "justify-center py-3" : "gap-3 px-3 py-3"
              } ${chat.archived ? "opacity-80" : "cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700"} ${
                activeChatId === chat.id ? "bg-blue-50 dark:bg-blue-900/20" : ""
              } ${openingChatId === chat.id ? "pointer-events-none" : ""}`}
            >
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl flex-shrink-0 relative overflow-hidden">
                {chat.avatarUrl ? (
                  <img src={chat.avatarUrl} alt={chat.name} className="w-full h-full object-cover" />
                ) : (
                  chat.avatar
                )}

                {/* Unread Badge (Collapsed Mode) */}
                {isCollapsed && chat.unread > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 border border-white dark:border-slate-900 rounded-full flex items-center justify-center text-white text-[10px] font-bold z-10">
                    {chat.unread}
                  </div>
                )}
              </div>

              {!isCollapsed && (
                <>
                  {/* Chat Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">{chat.name}</h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0 flex items-center gap-1">
                        {chat.isOwnLastMessage && chat.lastMessageStatus === "SEEN" && (
                          <FiEye className="text-[12px] text-blue-500" />
                        )}
                        {chat.isOwnLastMessage && chat.lastMessageStatus === "DELIVERED" && (
                          <div className="flex items-center w-5 -mr-1">
                            <svg
                              className="w-3 h-3 text-gray-400"
                              viewBox="0 0 16 16"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M1 8L5.5 12.5L15 3"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M6 8L10.5 12.5L14 9"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                        )}
                        {chat.isOwnLastMessage && chat.lastMessageStatus === "SENT" && (
                          <FiCheck className="text-[12px] text-gray-400" />
                        )}
                        {chat.time}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{chat.message}</p>
                  </div>

                  {/* Unread Badge (Normal Mode) */}
                  {chat.unread > 0 && (
                    <>
                      {console.log(`[ChatList] Rendering badge for ${chat.name}: unread=${chat.unread}`)}
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {chat.unread}
                      </div>
                    </>
                  )}

                  {openingChatId === chat.id && (
                    <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">Opening...</span>
                  )}
                </>
              )}
            </div>
          ))
        )}

        {/* Global Search Results */}
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
                <div
                  key={`global-${user.id || user._id}`}
                  onClick={() => {
                    const mappedChat = {
                      id: `temp-${user.id || user._id}`,
                      targetUserId: user.id || user._id,
                      name: user.displayName || user.username || "User",
                      avatarUrl: user.avatarUrl,
                      avatar: <FiUser className="text-2xl" />,
                    };
                    onSelectChat?.(mappedChat);
                  }}
                  className={`flex items-center transition relative ${
                    isCollapsed ? "justify-center py-3" : "gap-3 px-3 py-3"
                  } cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700`}
                >
                  <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-slate-600 flex items-center justify-center overflow-hidden flex-shrink-0 flex-none relative">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-500 text-lg dark:text-gray-300 font-bold uppercase">
                        {(user.displayName || user.username || "U").charAt(0)}
                      </span>
                    )}
                  </div>

                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {user.displayName || user.username}
                      </h3>
                      {user.phone && <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.phone}</p>}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
