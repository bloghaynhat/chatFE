export const ChatListItem = ({ chat, isCollapsed, activeChatId, openingChatId, onSelectChat }) => {
  return (
    <div
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
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl flex-shrink-0 relative">
        {chat.avatar}

        {isCollapsed && chat.unread && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 border border-white dark:border-slate-900 rounded-full flex items-center justify-center text-white text-[10px] font-bold z-10">
            {chat.unread}
          </div>
        )}
      </div>

      {!isCollapsed && (
        <>
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
  );
};
