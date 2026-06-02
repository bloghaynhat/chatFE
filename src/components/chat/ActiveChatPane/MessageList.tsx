import { FiRefreshCw } from "react-icons/fi";
import { PhotoProvider } from "react-photo-view";
import { MessageItem } from "./MessageItem";
import { getDateLabel, groupMediaMessages, getMessageTime } from "../../../utils/chatUtils";
import {
  DEFAULT_CHAT_WALLPAPER_CLASS,
  getWallpaperPresetByValue,
  getWallpaperPresetTheme,
} from "../../../constants/wallpaperPresets";
import { useLanguage } from "../../../context";

const getProfileId = (profile: any) =>
  profile?.userId ||
  profile?.id ||
  profile?._id ||
  profile?.user?.id ||
  profile?.user?._id ||
  profile?.user?.userId ||
  null;

const getSenderId = (message: any) => {
  const senderId =
    message?.senderId ||
    message?.sender?.id ||
    message?.sender?._id ||
    message?.id_sender ||
    message?.user_id;

  return typeof senderId === "object" ? getProfileId(senderId) : senderId || (message?.isMine ? "me" : null);
};

const normalizeMemberProfile = (member: any) => {
  const user = member?.user || member?.profile || member;

  return {
    id: getProfileId(member) || getProfileId(user),
    displayName:
      member?.displayName ||
      user?.displayName ||
      member?.name ||
      user?.name ||
      member?.username ||
      user?.username,
    name: member?.name || user?.name,
    username: member?.username || user?.username,
    avatarUrl:
      member?.avatarUrl ||
      user?.avatarUrl ||
      member?.avatar ||
      user?.avatar ||
      member?.profilePicture ||
      user?.profilePicture,
    avatar: member?.avatar || user?.avatar,
    profilePicture: member?.profilePicture || user?.profilePicture,
  };
};

const buildGroupSenderMap = (selectedChat: any) => {
  const rawMembers = [
    ...(selectedChat?.members || []),
    ...(selectedChat?.participants || []),
    ...(selectedChat?.conversation?.members || []),
    ...(selectedChat?.conversation?.participants || []),
  ];

  return rawMembers.reduce((map: Map<string, any>, member: any) => {
    const profile = normalizeMemberProfile(member);
    if (profile.id) map.set(String(profile.id), profile);
    return map;
  }, new Map<string, any>());
};

export const MessageList = ({
  isLoading,
  error,
  messages,
  visibleMessages,
  hasMoreMessages = false,
  isLoadingOlderMessages = false,
  onRetry,
  currentUserId,
  typingUsers,
  selectedChat,
  wallpaperUrl,
  firstMessageRef,
  messagesEndRef,
  handleContextMenu,
  activeContextMessageId,
  setPreviewVideoUrl,
  onNavigateToMessage,
  onPollUpdated,
  onOpenChat,
  onChatInteractionRead,
}: any) => {
  const { t } = useLanguage();
  const wallpaperPreset = getWallpaperPresetByValue(wallpaperUrl);
  const wallpaperTheme = getWallpaperPresetTheme(wallpaperUrl);
  const hasUploadedWallpaper = Boolean(wallpaperUrl && !wallpaperPreset);
  const containerClassName =
    `chat-scrollbar flex-1 overflow-y-auto px-4 lg:px-6 pt-4 pb-24 transition-[background-image,background-color] duration-500 ${DEFAULT_CHAT_WALLPAPER_CLASS}`;
  const wallpaperStyle = wallpaperUrl
    ? {
        backgroundImage:
          wallpaperPreset?.backgroundImage || `url(${wallpaperUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: wallpaperPreset ? "scroll" : "fixed",
      }
    : undefined;
  const overlayClassName = wallpaperUrl
    ? "min-h-full -mx-4 lg:-mx-6 -mt-4 -mb-24 px-4 lg:px-6 pt-4 pb-24 bg-white/30 dark:bg-black/35 backdrop-blur-[1px]"
    : "";
  const handleContainerContextMenu = (event: any) => {
    const target = event.target as HTMLElement;
    if (target.closest("[data-message-row='true']")) return;

    const rows = Array.from(
      event.currentTarget.querySelectorAll("[data-message-row='true']"),
    ) as HTMLElement[];
    const matchingRow = rows.find((row) => {
      const rect = row.getBoundingClientRect();
      return event.clientY >= rect.top && event.clientY <= rect.bottom;
    });
    if (!matchingRow) return;

    const messageId = matchingRow.dataset.messageId;
    const message = visibleMessages.find((item: any) => {
      const itemId = item?.id || item?._id || item?.messageId;
      return String(itemId) === String(messageId);
    });
    if (!message) return;

    handleContextMenu(event, message);
  };

  if (isLoading) {
    return (
      <div className={containerClassName} style={wallpaperStyle}>
        <div className="h-full flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
          Opening conversation...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={containerClassName} style={wallpaperStyle}>
        <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
          <p className="text-sm text-red-600 dark:text-red-400">Couldn’t open this conversation</p>
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm transition"
          >
            <FiRefreshCw className="text-sm" />
            {t("chat.tryAgain")}
          </button>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className={containerClassName} style={wallpaperStyle}>
        <div className={`h-full flex flex-col items-center justify-center ${overlayClassName}`}>
          <div className="bg-black/15 dark:bg-black/30 rounded-[20px] p-6 px-8 flex flex-col items-center justify-center text-center max-w-[300px] backdrop-blur-md border border-white/10 shadow-sm">
            <span className="text-white dark:text-white/90 font-semibold text-[15px] mb-1">
              {t("chat.noMessagesYet")}
            </span>
            <span className="text-white/90 dark:text-white/70 text-[14px] mb-5">
              {t("chat.sendGreeting")}
            </span>
            <div className="text-[70px] drop-shadow-md hover:scale-110 transition-transform cursor-pointer">👋</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={containerClassName}
      style={wallpaperStyle}
      data-chat-container
      onPointerDown={onChatInteractionRead}
      onContextMenu={handleContainerContextMenu}
    >
      <div className={overlayClassName}>
      {visibleMessages.length > 0 && (
        <PhotoProvider maskOpacity={0.8}>
          <div className="flex flex-col gap-0 items-start max-w-4xl mx-auto w-full">
            <div className="mx-auto px-3 py-1 rounded-full text-xs font-semibold bg-white/80 dark:bg-slate-800/80 text-gray-600 dark:text-gray-300 shadow-sm transition-all duration-300 ease-in-out">
              {isLoadingOlderMessages ? (
                <div className="flex items-center gap-2">
                  <FiRefreshCw className="animate-spin" />
                  {t("chat.loadingOlder")}
                </div>
              ) : hasMoreMessages ? (
                t("chat.loadMoreHint")
              ) : (
                getDateLabel(visibleMessages[0]?.createdAt) || "Today"
              )}
            </div>

            {(() => {
              const groupedMessages = groupMediaMessages(visibleMessages);
              const senderMap = buildGroupSenderMap(selectedChat);

              return groupedMessages.map((message, index) => {
                const currentSenderId = getSenderId(message);
                const mine = Boolean(
                  message?.isMine ||
                    message?.sender?.isMe ||
                    (currentUserId && currentSenderId && String(currentSenderId) === String(currentUserId)),
                );
                const prevMessage = index > 0 ? groupedMessages[index - 1] : null;
                const nextMessage = index < groupedMessages.length - 1 ? groupedMessages[index + 1] : null;
                const senderFallback = currentSenderId ? senderMap.get(String(currentSenderId)) : null;
                const isFirstInSequence =
                  !prevMessage ||
                  getSenderId(prevMessage) !== currentSenderId ||
                  (getMessageTime(prevMessage) !== getMessageTime(message) &&
                    Math.abs(new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime()) > 300000);
                const isLastInSequence =
                  !nextMessage ||
                  getSenderId(nextMessage) !== currentSenderId ||
                  (getMessageTime(nextMessage) !== getMessageTime(message) &&
                    Math.abs(new Date(nextMessage.createdAt).getTime() - new Date(message.createdAt).getTime()) > 300000);

                const isGroup =
                  selectedChat?.type === "group" ||
                  selectedChat?.type === "GROUP" ||
                  selectedChat?.isGroup === true;

                return (
                  <MessageItem
                    key={message.id || message._id || index}
                    message={message}
                    messages={visibleMessages}
                    index={index}
                    isFirst={index === 0}
                    firstMessageRef={firstMessageRef}
                    mine={mine}
                    isGroup={isGroup}
                    isFirstInSequence={isFirstInSequence}
                    isLastInSequence={isLastInSequence}
                    handleContextMenu={handleContextMenu}
                    activeContextMessageId={activeContextMessageId}
                    setPreviewVideoUrl={setPreviewVideoUrl}
                    currentUserId={currentUserId}
                    onNavigateToMessage={onNavigateToMessage}
                    onPollUpdated={onPollUpdated}
                    onOpenChat={onOpenChat}
                    senderFallback={senderFallback}
                    wallpaperTheme={wallpaperTheme}
                    hasUploadedWallpaper={hasUploadedWallpaper}
                  />
                );
              });
            })()}

            {/* Typing Indicator */}
            {typingUsers.size > 0 &&
              (selectedChat?.targetUserId ? typingUsers.has(selectedChat.targetUserId) : true) && (
                <div className="w-fit self-start bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm flex flex-col gap-1 mt-2">
                  <div className="flex items-center gap-1.5 h-4">
                    <div
                      className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    ></div>
                    <div
                      className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    ></div>
                    <div
                      className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    ></div>
                  </div>
                </div>
              )}
            <div ref={messagesEndRef} />
          </div>
        </PhotoProvider>
      )}
      </div>
    </div>
  );
};
