import { useMemo, useState, useEffect } from "react";
import { FiArchive, FiUser, FiSearch, FiXCircle } from "react-icons/fi";
import { userService } from "../../services";

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
                <p className="font-semibold text-gray-700 dark:text-gray-200 mb-1">
                  No matching conversations found
                </p>
                <p className="text-sm">
                  Try a different keyword or start a new message from the +
                  button.
                </p>
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
              } ${
                chat.archived
                  ? "opacity-80"
                  : "cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700"
              } ${
                activeChatId === chat.id ? "bg-blue-50 dark:bg-blue-900/20" : ""
              } ${openingChatId === chat.id ? "pointer-events-none" : ""}`}
            >
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl flex-shrink-0 relative">
                {chat.avatar}

                {/* Unread Badge (Collapsed Mode) */}
                {isCollapsed && chat.unread && (
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
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {chat.name}
                      </h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">
                        {chat.time}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {chat.message}
                    </p>
                  </div>

                  {/* Unread Badge (Normal Mode) */}
                  {chat.unread && (
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {chat.unread}
                    </div>
                  )}

                  {openingChatId === chat.id && (
                    <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                      Opening...
                    </span>
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
              <div className="py-4 text-center text-sm text-gray-500">
                No users found
              </div>
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
                      <img
                        src={user.avatarUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
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
                      {user.phone && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {user.phone}
                        </p>
                      )}
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
