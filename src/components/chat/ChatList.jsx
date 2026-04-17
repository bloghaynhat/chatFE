import { useMemo, useState, useEffect } from "react";
import { FiArchive, FiUser, FiSearch } from "react-icons/fi";
import { userService } from "../../services";
import { ChatListItem } from "./ChatList/ChatListItem";
import { GlobalUserItem } from "./ChatList/GlobalUserItem";

export const ChatList = ({
  searchQuery = "",
  filterMode = "all",
  isCollapsed = false,
  activeChatId = null,
  openingChatId = null,
  isGlobalSearchEnabled = false,
  onSelectChat,
}) => {
  const [chats] = useState([
    {
      id: "00000000-0000-0000-0000-000000000001",
      targetUserId: null,
      avatar: <FiArchive className="text-2xl" />,
      name: "Archived chats",
      message: "9 chats",
      time: "3:20 PM",
      unread: 9,
      archived: true,
    },
    {
      id: "00000000-0000-0000-0000-000000000004",
      targetUserId: "00000000-0000-0000-0000-000000000000",
      avatarUrl: "",
      avatar: <FiUser className="text-2xl" />,
      name: "Phương IUH",
      message: "Sticker",
      time: "3/23/2026",
    },
  ]);

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
        const response = await userService.searchUsers(normalizedQuery);
        const results = response?.users || response || [];
        setGlobalUsers(
          Array.isArray(results)
            ? results
            : results.id || results._id
              ? [results]
              : [],
        );
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
        chat.message?.toLowerCase().includes(normalizedQuery),
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

        {visibleChats.length === 0 && !normalizedQuery ? (
          <div className="h-full min-h-[240px] flex flex-col items-center justify-center text-center px-6 text-gray-500 dark:text-gray-400">
            {!isCollapsed && (
              <>
                <p className="font-semibold text-gray-700 dark:text-gray-200 mb-1">
                  No matching conversations found
                </p>
                <p className="text-sm">
                  Try a different keyword or start a new message from the + button.
                </p>
              </>
            )}
            {isCollapsed && <FiSearch className="text-xl text-gray-400" />}
          </div>
        ) : (
          visibleChats.map((chat) => (
            <ChatListItem
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
              <div className="py-4 text-center text-sm text-gray-500">
                No users found
              </div>
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
