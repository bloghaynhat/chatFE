import React from "react";
import { Conversation } from "../../../types/conversation";

interface ConversationItemProps {
  chat: Conversation;
  isCollapsed?: boolean;
  activeChatId?: string;
  openingChatId?: string;
  onSelectChat: (chat: Conversation) => void;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({
  chat,
  isCollapsed,
  activeChatId,
  openingChatId,
  onSelectChat,
}) => {
  const isActive = activeChatId === chat.id || openingChatId === chat.id;

  return (
    <div
      onClick={() => onSelectChat(chat)}
      className={`group flex items-center p-3 mb-1 cursor-pointer rounded-xl transition-all duration-200
        ${isActive ? "bg-blue-50 hover:bg-blue-100" : "hover:bg-gray-100"}
      `}
    >
      <div className="relative flex-shrink-0">
        {chat.avatarUrl ? (
          <img src={chat.avatarUrl} alt={chat.name} className="w-12 h-12 rounded-full object-cover shadow-sm" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-lg shadow-sm">
            {chat.name ? chat.name.charAt(0).toUpperCase() : "?"}
          </div>
        )}

        {/* Unread badge for collapsed mode */}
        {isCollapsed && chat.unreadCount && chat.unreadCount > 0 ? (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white px-[4px]">
            {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
          </span>
        ) : null}
      </div>

      {!isCollapsed && (
        <div className="ml-3 flex-1 overflow-hidden min-w-0">
          <div className="flex justify-between items-center mb-0.5">
            <h3
              className={`text-sm truncate font-semibold duration-200 ${chat.unreadCount ? "text-gray-900" : "text-gray-800"}`}
            >
              {chat.name}
            </h3>
            {chat.lastMessageTimeFormatted && (
              <span className="text-[11px] ml-2 whitespace-nowrap text-gray-500 font-medium">
                {chat.lastMessageTimeFormatted}
              </span>
            )}
          </div>
          <div className="flex justify-between items-center mt-0.5">
            <p
              className={`text-sm truncate transition-colors duration-200 ${chat.unreadCount ? "text-gray-900 font-medium" : "text-gray-500"}`}
            >
              {chat.lastMessage?.textPreview ||
                (chat.lastMessage?.type === "media" ? "Sent a media file" : "No messages")}
            </p>
            {chat.unreadCount && chat.unreadCount > 0 ? (
              <span className="flex h-[18px] w-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm px-1 ml-2 flex-shrink-0 leading-none">
                {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
              </span>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
