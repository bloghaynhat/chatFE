import React from "react";
import { FiBookmark, FiCheck, FiEye } from "react-icons/fi";
import { BsPinAngleFill } from "react-icons/bs";
import { Conversation } from "../../../types/conversation";
import { useAuth } from "../../../hooks";
import { getChatMessagePreview } from "../../../utils/chatPreview";

interface ConversationItemProps {
  chat: Conversation;
  isCollapsed?: boolean;
  activeChatId?: string;
  openingChatId?: string;
  onSelectChat: (chat: Conversation) => void;
  onContextMenu?: (event: React.MouseEvent, chat: Conversation) => void;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({
  chat,
  isCollapsed,
  activeChatId,
  openingChatId,
  onSelectChat,
  onContextMenu,
}) => {
  const { user } = useAuth();
  const isActive = activeChatId === chat.id || openingChatId === chat.id;
  const isMine = chat.lastMessage?.senderId === user?.id || chat.lastMessage?.senderId === "me";
  const isSavedMessages = chat.type === "saved_messages" || chat.isSavedMessages || chat.isSelfChat;
  const chatType = (chat as any).type;
  const isGroup = chatType === "group" || chatType === "GROUP" || (chat as any).isGroup === true;
  const showOnlineDot = !isSavedMessages && !isGroup && Boolean((chat as any).isOnline);
  const isPinned = Boolean((chat as any).pinned || (chat as any).isPinned);
  const isLastMessageSeen =
    chat.lastMessageStatus === "seen" ||
    (chat as any).lastMessageStatus === "read" ||
    chat.lastMessage?.status === "seen" ||
    (chat.lastMessage as any)?.status === "read";

  return (
    <div
      onClick={() => {
        if (isActive) return;
        onSelectChat(chat);
      }}
      onContextMenu={(event) => onContextMenu?.(event, chat)}
      className={`group flex items-center p-3 mb-1 cursor-pointer rounded-xl transition-all duration-200 active:scale-[0.98]
        ${isActive ? "bg-blue-500 shadow-md text-white" : "hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-800 dark:text-gray-200"}
      `}
    >
      <div className="relative flex-shrink-0">
        {isSavedMessages ? (
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm ${
              isActive ? "bg-blue-400 text-white" : "bg-blue-500 text-white"
            }`}
          >
            <FiBookmark className="text-[22px]" />
          </div>
        ) : chat.avatarUrl ? (
          <img src={chat.avatarUrl} alt={chat.name} className="w-12 h-12 rounded-full object-cover shadow-sm" />
        ) : (
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold text-lg shadow-sm ${isActive ? "bg-blue-400 text-white" : "bg-blue-100 text-blue-600"}`}
          >
            {chat.name ? chat.name.charAt(0).toUpperCase() : "?"}
          </div>
        )}

        {/* Unread badge for collapsed mode */}
        {isCollapsed && chat.unreadCount && chat.unreadCount > 0 ? (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white px-[4px]">
            {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
          </span>
        ) : null}

        {showOnlineDot && (
          <span
            className={`absolute right-0 bottom-0 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ${
              isActive ? "ring-blue-500" : "ring-white dark:ring-slate-900"
            }`}
            title="Online"
          />
        )}
      </div>

      {!isCollapsed && (
        <div className="ml-3 flex-1 overflow-hidden min-w-0">
          <div className="flex justify-between items-center mb-0.5">
            <h3
              className={`text-sm truncate duration-200 ${isActive ? "font-semibold text-white" : chat.unreadCount ? "font-bold text-gray-950 dark:text-white" : "font-semibold text-gray-800 dark:text-gray-200"}`}
            >
              {chat.name}
            </h3>
            <div className={`flex items-center ml-2 ${isActive ? "text-blue-100" : "text-gray-500"}`}>
              {isMine && chat.lastMessage && (
                <span className="mr-1 mt-[1px]">
                  {isLastMessageSeen ? (
                    <FiEye className="text-[11px]" />
                  ) : (
                    <FiCheck className="text-[11px]" />
                  )}
                </span>
              )}
              {chat.lastMessageTimeFormatted && (
                <span className="text-[11px] whitespace-nowrap font-medium">{chat.lastMessageTimeFormatted}</span>
              )}
            </div>
          </div>
          <div className="flex justify-between items-center mt-0.5">
            <p
              className={`text-sm truncate transition-colors duration-200 ${isActive ? "text-blue-100" : chat.unreadCount ? "font-bold text-gray-900 dark:text-gray-100" : "text-gray-500"}`}
            >
              {getChatMessagePreview(chat.lastMessage)}
            </p>
            <div className="ml-2 flex flex-shrink-0 items-center gap-1">
              {isPinned && (
                <BsPinAngleFill
                  className={`text-[12px] ${isActive ? "text-blue-100" : "text-gray-400 dark:text-gray-500"}`}
                  title="Pinned"
                />
              )}
              {chat.unreadCount && chat.unreadCount > 0 ? (
                <span
                  className={`flex h-[18px] w-[18px] min-w-[18px] items-center justify-center rounded-full text-[10px] font-bold shadow-sm px-1 flex-shrink-0 leading-none ${isActive ? "bg-white text-blue-500" : "bg-red-500 text-white"}`}
                >
                  {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
