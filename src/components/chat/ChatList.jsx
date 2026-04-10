import { useMemo, useState } from "react";
import { FiArchive, FiUser, FiSearch, FiXCircle } from "react-icons/fi";

export const ChatList = ({
  searchQuery = "",
  filterMode = "all",
  isCollapsed = false,
  activeChatId = null,
  openingChatId = null,
  onSelectChat,
}) => {
  const [chats] = useState([
    {
      id: 1,
      targetUserId: null,
      avatar: <FiArchive className="text-2xl" />,
      name: "Archived chats",
      message: "9 chats",
      time: "3:20 PM",
      unread: 9,
      archived: true,
    },
    {
      id: 4,
      targetUserId: 4,
      avatarUrl: "",
      avatar: <FiUser className="text-2xl" />,
      name: "Phương IUH",
      message: "Sticker",
      time: "3/23/2026",
    },
  ]);

  const normalizedQuery = searchQuery.trim().toLowerCase();

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
      <div className="flex-1 overflow-y-auto">
        {visibleChats.length === 0 ? (
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
      </div>
    </div>
  );
};
