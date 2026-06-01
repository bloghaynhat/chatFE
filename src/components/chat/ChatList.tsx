import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { conversationService, searchService, userService } from "../../services";
import {
  FiArchive,
  FiCopy,
  FiCornerUpRight,
  FiDownload,
  FiExternalLink,
  FiFile,
  FiImage,
  FiLink,
  FiMapPin,
  FiMessageCircle,
  FiMic,
  FiSearch,
  FiUser,
  FiVideo,
} from "react-icons/fi";
import { PhotoProvider, PhotoView } from "react-photo-view";
import { socketService } from "../../services/socketService";
import { ConversationItem } from "./ChatList/ConversationItem";
import { GlobalUserItem } from "./ChatList/GlobalUserItem";
import { ForwardModal } from "./ActiveChatPane/ForwardModal";
import { useAuth } from "../../hooks/useAuth";
import { useFriendManagement } from "../../hooks";
import { getChatMessagePreview } from "../../utils/chatPreview";
import type { Conversation } from "../../types/conversation";
import type { GroupRenamedPayload, GroupAvatarChangedPayload } from "../../types/socket";

const APP_TITLE = "ChatChit";
const TAB_LOGO_PATH = "/Logo_Tab.png";
const MEMBER_EVENT_DEDUPE_MS = 2500;

const getTimeValue = (value: any) => {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
};

const hasRealPreview = (message: any) => {
  if (!message) return false;
  return getChatMessagePreview(message) !== "No messages";
};

const mergeFetchedChats = (previousChats: any[], fetchedChats: any[]) => {
  const previousById = new Map(previousChats.map((chat) => [chat.id, chat]));

  return fetchedChats.map((fetchedChat) => {
    const previousChat = previousById.get(fetchedChat.id);
    if (!previousChat?.lastMessage) return fetchedChat;

    const previousUnread = Number(previousChat.unreadCount || 0);
    const fetchedUnread = Number(fetchedChat.unreadCount || 0);
    const unreadCount = Math.max(previousUnread, fetchedUnread);
    const fetchedPreviewIsMissing = !hasRealPreview(fetchedChat.lastMessage);
    const previousPreviewIsValid = hasRealPreview(previousChat.lastMessage);
    const fetchedTime = getTimeValue(fetchedChat.lastMessageAt || fetchedChat.lastMessage?.createdAt);
    const previousTime = getTimeValue(previousChat.lastMessageAt || previousChat.lastMessage?.createdAt);

    if (previousPreviewIsValid && (fetchedPreviewIsMissing || fetchedTime < previousTime)) {
      return {
        ...fetchedChat,
        unreadCount,
        lastMessage: previousChat.lastMessage,
        lastMessageAt: previousChat.lastMessageAt,
        lastMessageStatus: previousChat.lastMessageStatus,
        lastMessageTimeFormatted: previousChat.lastMessageTimeFormatted,
      };
    }

    return { ...fetchedChat, unreadCount };
  });
};

const getMessageId = (message: any) => message?.id || message?._id || message?.messageId;

const getMessageText = (message: any) =>
  message?.text || message?.content || message?.textPreview || "Matched message";

const isGroupChatItem = (chat: any) =>
  chat?.type === "group" || chat?.type === "GROUP" || chat?.isGroup === true;

const isSavedMessagesChat = (chat: any) =>
  chat?.type === "saved_messages" || chat?.isSavedMessages || chat?.isSelfChat;

const getPrivateChatTargetUserId = (chat: any, currentUserId?: string | null) => {
  if (!chat || isGroupChatItem(chat) || isSavedMessagesChat(chat)) return null;

  const target =
    chat.targetUser ||
    chat.participant ||
    chat.user ||
    chat.receiver ||
    chat.friend ||
    null;

  return (
    chat.targetUserId ||
    chat.participantId ||
    target?.id ||
    target?._id ||
    (chat.pairKey && currentUserId
      ? String(chat.pairKey)
          .split("_")
          .find((id: string) => id && id !== currentUserId && id !== "self")
      : null) ||
    null
  );
};

const isOwnLastMessage = (chat: any, currentUserId?: string | null) =>
  Boolean(currentUserId) &&
  String(chat?.lastMessage?.senderId || "") === String(currentUserId);

const getChatMessageId = (message: any) =>
  message?.id || message?._id || message?.messageId || null;

const isMessageCoveredBySeenId = (messageId: any, lastSeenMessageId: any) => {
  if (!messageId || !lastSeenMessageId) return false;
  if (String(messageId) === String(lastSeenMessageId)) return true;

  // Backend uses time-sortable message IDs, so lexicographic compare lets the
  // list item follow the same "messageId <= lastSeenMessageId" rule.
  return String(messageId) <= String(lastSeenMessageId);
};

const resolveLastMessageSeenStatus = async (chat: any, currentUserId?: string | null) => {
  if (!chat?.id || !isOwnLastMessage(chat, currentUserId)) return null;

  const lastMessageId = getChatMessageId(chat.lastMessage);
  if (!lastMessageId) return null;

  const messageResult = await conversationService.getConversationMessages(chat.id, {
    limit: 100,
  });
  const messages = sortMessagesForSeenCheck(messageResult.messages || []);
  const messageIndexById = new Map<string, number>();
  messages.forEach((message, index) => {
    const messageId = getChatMessageId(message);
    if (messageId) messageIndexById.set(String(messageId), index);
  });

  const lastMessageIndex = messageIndexById.get(String(lastMessageId));
  if (typeof lastMessageIndex !== "number") return null;

  const isSeen = Object.entries(messageResult.memberSeenMap || {}).some(
    ([userId, seenMessageId]) => {
      if (String(userId) === String(currentUserId)) return false;
      const seenIndex = messageIndexById.get(String(seenMessageId));
      return typeof seenIndex === "number" && seenIndex >= lastMessageIndex;
    },
  );

  return {
    conversationId: chat.id,
    isSeen,
  };
};

const sortMessagesForSeenCheck = (messages: any[]) =>
  [...messages].sort((a, b) => {
    const dateA = new Date(a?.createdAt || a?.updatedAt || 0).getTime();
    const dateB = new Date(b?.createdAt || b?.updatedAt || 0).getTime();
    return dateA - dateB;
  });

const formatSearchMessageTime = (value: any) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const normalizeSearchContextMessages = (message: any) => {
  const contextMessages = [
    ...(Array.isArray(message?.context?.before) ? message.context.before : []),
    ...(Array.isArray(message?.context?.after) ? message.context.after : []),
  ];

  return contextMessages
    .filter((item) => getMessageId(item))
    .map((item) => ({
      ...item,
      id: getMessageId(item),
      conversationId: item.conversationId || message.conversationId,
      type: item.type || "text",
    }));
};

const GlobalMessageItem = ({ message, chat, isCollapsed, onSelectChat }: any) => {
  const messageId = getMessageId(message);
  const displayName = chat?.name || message?.conversationName || "Conversation";
  const avatarUrl = chat?.avatarUrl || message?.conversationAvatarUrl;
  const initial = displayName.charAt(0).toUpperCase();
  const messageText = getMessageText(message);
  const messageTime = formatSearchMessageTime(message?.createdAt);

  const handleClick = () => {
    if (!message?.conversationId || !messageId) return;

    onSelectChat?.({
      ...(chat || {
        id: message.conversationId,
        name: displayName,
        type: message.conversationType,
        avatarUrl,
      }),
      id: message.conversationId,
      searchTargetMessageId: messageId,
      searchTargetMessage: {
        ...message,
        id: messageId,
        type: message.type || "text",
      },
      searchContextMessages: normalizeSearchContextMessages(message),
    });
  };

  return (
    <div
      onClick={handleClick}
      className={`group flex items-center p-3 mb-1 cursor-pointer rounded-xl transition-all duration-200 active:scale-[0.98] hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-800 dark:text-gray-200 ${
        isCollapsed ? "justify-center" : ""
      } animate-search-result`}
    >
      <div className="relative flex-shrink-0">
        {avatarUrl ? (
          <img src={avatarUrl} alt={displayName} className="w-12 h-12 rounded-full object-cover shadow-sm" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-lg shadow-sm">
            {initial || "?"}
          </div>
        )}
        <span className="absolute -right-0.5 -bottom-0.5 w-5 h-5 rounded-full bg-white dark:bg-slate-900 text-blue-500 flex items-center justify-center shadow-sm ring-1 ring-blue-100 dark:ring-slate-700">
          <FiMessageCircle className="text-[12px]" />
        </span>
      </div>

      {!isCollapsed && (
        <div className="ml-3 flex-1 overflow-hidden min-w-0">
          <div className="flex justify-between items-center mb-0.5">
            <h3 className="text-sm truncate font-semibold text-gray-900 dark:text-white">{displayName}</h3>
            {messageTime && (
              <span className="text-[11px] whitespace-nowrap font-medium text-gray-500 ml-2">{messageTime}</span>
            )}
          </div>
          <p className="text-sm truncate text-gray-500 dark:text-gray-400">{messageText}</p>
        </div>
      )}
    </div>
  );
};

const getSearchResultConversationName = (item: any, chat: any) =>
  chat?.name || item?.conversationName || "Conversation";

const buildSearchTargetPayload = (item: any, chat: any, targetMessage: any) => {
  const messageId = getMessageId(targetMessage);
  if (!item?.conversationId || !messageId) return null;

  return {
    ...(chat || {
      id: item.conversationId,
      name: getSearchResultConversationName(item, chat),
      type: item.conversationType,
      avatarUrl: item.conversationAvatarUrl,
    }),
    id: item.conversationId,
    searchTargetMessageId: messageId,
    searchTargetMessage: {
      ...targetMessage,
      id: messageId,
      conversationId: item.conversationId,
      senderId: targetMessage.senderId || item.senderId,
      createdAt: targetMessage.createdAt || item.createdAt,
      type: targetMessage.type || "text",
    },
    searchContextMessages: normalizeSearchContextMessages(targetMessage),
  };
};

const createSearchMediaMessage = (item: any) => {
  const mediaType = String(item?.type || "file").toLowerCase();
  const normalizedType =
    mediaType === "voice" || mediaType === "music" ? "audio" : mediaType;

  return {
    id: item?.messageId || item?.id,
    messageId: item?.messageId || item?.id,
    type: normalizedType,
    text: "",
    senderId: item?.senderId,
    createdAt: item?.createdAt,
    media: [
      {
        type: normalizedType,
        url: item?.url,
        name: item?.name,
        filename: item?.name,
      },
    ],
  };
};

const createSearchLinkMessage = (item: any) => ({
  id: item?.messageId || item?.id,
  messageId: item?.messageId || item?.id,
  type: "text",
  text: item?.url || "",
  senderId: item?.senderId,
  createdAt: item?.createdAt,
});

const downloadUrl = (url?: string, filename?: string) => {
  if (!url) return;
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename || "download";
  anchor.target = "_blank";
  anchor.rel = "noreferrer";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
};

const getMediaIcon = (type: string) => {
  switch (String(type || "").toLowerCase()) {
    case "image":
      return FiImage;
    case "video":
      return FiVideo;
    case "voice":
      return FiMic;
    default:
      return FiFile;
  }
};

const GlobalMediaItem = ({ item, chat, isCollapsed, onShowInChat, onContextMenu }: any) => {
  const messageId = item?.messageId || item?.id;
  const displayName = getSearchResultConversationName(item, chat);
  const MediaIcon = getMediaIcon(item?.type);
  const mediaName = item?.name || `${item?.type || "Media"} attachment`;
  const mediaType = String(item?.type || "file").toLowerCase();
  const messageTime = formatSearchMessageTime(item?.createdAt);
  const isImage = mediaType === "image" && item?.url;
  const isOpenableMedia = ["image", "video"].includes(mediaType);

  const handleClick = (event: any) => {
    if (isImage) return;
    event.preventDefault();
    if (isOpenableMedia && item?.url) {
      window.open(item.url, "_blank", "noopener,noreferrer");
      return;
    }
    downloadUrl(item?.url, item?.name);
  };

  const content = (
    <div
      onClick={handleClick}
      onContextMenu={(event) => onContextMenu?.(event, item, "media", createSearchMediaMessage(item), chat)}
      className={`group flex items-center p-3 mb-1 cursor-pointer rounded-xl transition-all duration-200 active:scale-[0.98] hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-800 dark:text-gray-200 ${
        isCollapsed ? "justify-center" : ""
      } animate-search-result`}
    >
      <div className="relative flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-blue-50 dark:bg-slate-800 flex items-center justify-center shadow-sm">
        {mediaType === "image" && item?.url ? (
          <img src={item.url} alt={mediaName} className="w-full h-full object-cover" />
        ) : (
          <MediaIcon className="text-xl text-blue-500" />
        )}
      </div>

      {!isCollapsed && (
        <div className="ml-3 flex-1 overflow-hidden min-w-0">
          <div className="flex justify-between items-center mb-0.5">
            <h3 className="text-sm truncate font-semibold text-gray-900 dark:text-white">{displayName}</h3>
            {messageTime && (
              <span className="text-[11px] whitespace-nowrap font-medium text-gray-500 ml-2">{messageTime}</span>
            )}
          </div>
          <p className="text-sm truncate text-gray-500 dark:text-gray-400">{mediaName}</p>
        </div>
      )}
    </div>
  );

  if (isImage) {
    return <PhotoView src={item.url}>{content}</PhotoView>;
  }

  return content;
};

const GlobalLinkItem = ({ item, chat, isCollapsed, onContextMenu }: any) => {
  const messageId = item?.messageId || item?.id;
  const displayName = getSearchResultConversationName(item, chat);
  const messageTime = formatSearchMessageTime(item?.createdAt);

  const handleClick = (event: any) => {
    event.preventDefault();
    if (item?.url) window.open(item.url, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      onClick={handleClick}
      onContextMenu={(event) => onContextMenu?.(event, item, "link", createSearchLinkMessage(item), chat)}
      className={`group flex items-center p-3 mb-1 cursor-pointer rounded-xl transition-all duration-200 active:scale-[0.98] hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-800 dark:text-gray-200 ${
        isCollapsed ? "justify-center" : ""
      } animate-search-result`}
    >
      <div className="relative flex-shrink-0 w-12 h-12 rounded-full bg-sky-100 dark:bg-slate-800 text-sky-600 flex items-center justify-center shadow-sm">
        <FiLink className="text-xl" />
      </div>

      {!isCollapsed && (
        <div className="ml-3 flex-1 overflow-hidden min-w-0">
          <div className="flex justify-between items-center mb-0.5">
            <h3 className="text-sm truncate font-semibold text-gray-900 dark:text-white">{displayName}</h3>
            {messageTime && (
              <span className="text-[11px] whitespace-nowrap font-medium text-gray-500 ml-2">{messageTime}</span>
            )}
          </div>
          <p className="text-sm truncate text-gray-500 dark:text-gray-400">{item?.url || "Link"}</p>
        </div>
      )}
    </div>
  );
};

const SearchResultContextMenu = ({
  contextMenu,
  onClose,
  onForward,
  onDownload,
  onShowInChat,
  onOpenLink,
  onCopyLink,
}: any) => {
  if (!contextMenu) return null;
  const isLink = contextMenu.kind === "link";

  return (
    <div
      className="fixed z-[9999] w-[190px] rounded-xl bg-white dark:bg-slate-800 shadow-[0_8px_30px_rgba(0,0,0,0.18)] border border-gray-100 dark:border-slate-700 py-1.5 text-sm text-gray-800 dark:text-gray-100"
      style={{ top: contextMenu.y, left: contextMenu.x }}
      onClick={(event) => event.stopPropagation()}
    >
      <button
        className="w-full px-3.5 py-2.5 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-slate-700 transition text-left"
        onClick={onForward}
      >
        <FiCornerUpRight className="text-[17px]" />
        <span>Forward</span>
      </button>
      {isLink ? (
        <>
          <button
            className="w-full px-3.5 py-2.5 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-slate-700 transition text-left"
            onClick={onOpenLink}
          >
            <FiExternalLink className="text-[17px]" />
            <span>Open link</span>
          </button>
          <button
            className="w-full px-3.5 py-2.5 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-slate-700 transition text-left"
            onClick={onCopyLink}
          >
            <FiCopy className="text-[17px]" />
            <span>Copy link</span>
          </button>
        </>
      ) : (
        <button
          className="w-full px-3.5 py-2.5 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-slate-700 transition text-left"
          onClick={onDownload}
        >
          <FiDownload className="text-[17px]" />
          <span>Download</span>
        </button>
      )}
      <button
        className="w-full px-3.5 py-2.5 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-slate-700 transition text-left"
        onClick={onShowInChat}
      >
        <FiMapPin className="text-[17px]" />
        <span>Show in chat</span>
      </button>
    </div>
  );
};

const extractSocketMessage = (payload: any) => {
  const candidates = [
    payload?.payload?.message,
    Array.isArray(payload?.message?.messages) ? payload.message.messages[0] : null,
    payload?.message?.message,
    Array.isArray(payload?.messages) ? payload.messages[0] : null,
    payload?.message,
    payload,
  ].filter(Boolean);

  const message =
    candidates.find((candidate) => {
      if (candidate?.success && Array.isArray(candidate?.messages)) return false;
      return (
        candidate?.id ||
        candidate?._id ||
        candidate?.messageId ||
        candidate?.text ||
        candidate?.content ||
        candidate?.textPreview ||
        candidate?.media ||
        candidate?.files ||
        candidate?.attachments
      );
    }) ||
    candidates.find((candidate) => Array.isArray(candidate?.messages))?.messages?.[0] ||
    payload;

  const conversationId =
    payload?.payload?.conversationId ||
    message?.conversationId ||
    message?.conversation?.id ||
    message?.conversation?._id ||
    payload?.conversationId;

  return { message, conversationId, candidates };
};

const setTabFavicon = (unreadCount: number) => {
  const link =
    document.querySelector<HTMLLinkElement>('link[rel="icon"]') ||
    document.createElement("link");

  link.rel = "icon";
  link.type = "image/png";

  if (unreadCount <= 0) {
    link.href = TAB_LOGO_PATH;
    document.head.appendChild(link);
    return;
  }

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(img, 0, 0, size, size);

    ctx.beginPath();
    ctx.arc(50, 14, 10, 0, Math.PI * 2);
    ctx.fillStyle = "#ef4444";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();

    link.href = canvas.toDataURL("image/png");
    document.head.appendChild(link);
  };
  img.onerror = () => {
    link.href = TAB_LOGO_PATH;
    document.head.appendChild(link);
  };
  img.src = TAB_LOGO_PATH;
};

export const ChatList = ({
  searchQuery = "",
  filterMode = "all",
  isCollapsed = false,
  activeChatId = null,
  openingChatId = null,
  isGlobalSearchEnabled = false,
  isSearchMode = false,
  isSearchClosing = false,
  onSelectChat,
  onForwardToTarget,
}: any) => {
  const { user } = useAuth();
  const { friends, fetchFriends } = useFriendManagement();
  const [chats, setChats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const recentMemberRemovalEvents = useRef<Map<string, number>>(new Map());
  const chatsRef = useRef<any[]>([]);

  useEffect(() => {
    chatsRef.current = chats;
  }, [chats]);

  const applyOnlineStatuses = useCallback(
    (statuses: any[]) => {
      const statusByUserId = new Map(
        statuses.map((status: any) => [String(status.userId), status]),
      );

      setChats((previousChats) =>
        previousChats.map((chat) => {
          const targetUserId = getPrivateChatTargetUserId(chat, user?.id);
          const status = targetUserId
            ? statusByUserId.get(String(targetUserId))
            : null;
          if (!status) return chat;

          return {
            ...chat,
            targetUserId,
            isOnline: Boolean(status.isOnline ?? status.online),
            lastSeen: status.lastSeen ?? chat.lastSeen,
            presenceVisibility: status.visibility,
          };
        }),
      );
    },
    [user?.id],
  );

  const refreshOnlineStatuses = useCallback(
    (sourceChats?: any[]) => {
      const chatsToRefresh = sourceChats || chatsRef.current;
      const targetUserIds = chatsToRefresh
        .map((chat) => getPrivateChatTargetUserId(chat, user?.id))
        .filter(Boolean);

      if (targetUserIds.length === 0) return;

      socketService
        .getBatchOnlineStatus(targetUserIds)
        .then(applyOnlineStatuses)
        .catch((err) => {
          console.warn("Failed to fetch online statuses", err);
        });
    },
    [applyOnlineStatuses, user?.id],
  );

  const touchConversationActivity = useCallback(
    (
      conversationId: string,
      message: any,
      options: { memberCountDelta?: number; fallbackText?: string } = {},
    ) => {
      if (!conversationId) return;

      const createdAt =
        message?.createdAt || message?.updatedAt || new Date().toISOString();
      const activityMessage = {
        ...(message || {}),
        messageId: message?.messageId || message?.id || message?._id,
        id: message?.id || message?._id || message?.messageId,
        createdAt,
        senderId: message?.senderId || message?.sender?.id || message?.sender?._id,
        textPreview:
          message?.textPreview ||
          message?.preview ||
          message?.text ||
          message?.content ||
          options.fallbackText ||
          "Group updated",
        type: message?.type || "system",
      };

      setChats((prevChats) => {
        const isCurrentlyActive =
          activeChatId === conversationId || openingChatId === conversationId;

        return prevChats.map((chat) => {
          if (chat.id !== conversationId) return chat;

          const currentCount = Number(chat.membersCount || chat.memberCount || 0);
          const memberCountDelta = options.memberCountDelta || 0;

          return {
            ...chat,
            membersCount:
              currentCount || memberCountDelta
                ? Math.max(0, currentCount + memberCountDelta)
                : chat.membersCount,
            lastMessage: activityMessage,
            lastMessageAt: createdAt,
            lastMessageTimeFormatted: new Date(createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            unreadCount: isCurrentlyActive ? 0 : Number(chat.unreadCount || 0) + 1,
          };
        });
      });
    },
    [activeChatId, openingChatId],
  );

  const shouldSkipDuplicateMemberRemoval = useCallback(
    (conversationId?: string, userId?: string) => {
      if (!conversationId || !userId) return false;

      const now = Date.now();
      const key = `${conversationId}:${userId}`;
      const lastSeenAt = recentMemberRemovalEvents.current.get(key);

      recentMemberRemovalEvents.current.forEach((seenAt, seenKey) => {
        if (now - seenAt > MEMBER_EVENT_DEDUPE_MS) {
          recentMemberRemovalEvents.current.delete(seenKey);
        }
      });

      recentMemberRemovalEvents.current.set(key, now);
      return Boolean(lastSeenAt && now - lastSeenAt < MEMBER_EVENT_DEDUPE_MS);
    },
    [],
  );
  const [activeSearchTab, setActiveSearchTab] = useState("chats");
  const [searchContextMenu, setSearchContextMenu] = useState<any>(null);
  const [forwardModalVisible, setForwardModalVisible] = useState(false);
  const [messageToForward, setMessageToForward] = useState<any>(null);

  const fetchChats = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const response: any = await conversationService.getConversations();
      const data = response?.data || response || [];
      const fetchedChats = Array.isArray(data) ? data : [];
      setChats((previousChats) => mergeFetchedChats(previousChats, fetchedChats));
      refreshOnlineStatuses(fetchedChats);

      const ownLastMessageChats = fetchedChats.filter((chat) =>
        isOwnLastMessage(chat, user?.id),
      );
      if (ownLastMessageChats.length > 0) {
        Promise.all(
          ownLastMessageChats.map((chat) =>
            resolveLastMessageSeenStatus(chat, user?.id).catch(() => null),
          ),
        ).then((statuses) => {
          const statusByConversationId = new Map(
            statuses
              .filter(Boolean)
              .map((status: any) => [String(status.conversationId), status]),
          );

          if (statusByConversationId.size === 0) return;

          setChats((previousChats) =>
            previousChats.map((chat) => {
              const status = statusByConversationId.get(String(chat.id));
              if (!status) return chat;

              return {
                ...chat,
                lastMessageStatus: status.isSeen ? "seen" : "sent",
                lastMessage: {
                  ...chat.lastMessage,
                  status: status.isSeen ? "seen" : "sent",
                },
              };
            }),
          );
        });
      }
    } catch (err) {
      console.error("Fetch conversations error:", err);
      setChats([]);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [refreshOnlineStatuses]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  useEffect(() => {
    const handlePresenceChanged = (payload: any) => {
      const presenceUserId = payload?.userId;
      if (!presenceUserId) return;

      setChats((previousChats) =>
        previousChats.map((chat) => {
          const targetUserId = getPrivateChatTargetUserId(chat, user?.id);
          if (String(targetUserId) !== String(presenceUserId)) return chat;

          return {
            ...chat,
            targetUserId,
            isOnline: Boolean(payload.isOnline ?? payload.online),
            lastSeen: payload.lastSeen ?? chat.lastSeen,
            presenceVisibility: payload.visibility ?? chat.presenceVisibility,
          };
        }),
      );
    };

    const cleanupPresence = socketService.on("presence:changed", handlePresenceChanged);
    const cleanupReady = socketService.on("presence:ready", () => {
      refreshOnlineStatuses();
    });

    return () => {
      cleanupPresence();
      cleanupReady();
    };
  }, [refreshOnlineStatuses, user?.id]);

  useEffect(() => {
    if (chats.length === 0) return;

    const intervalId = window.setInterval(() => {
      refreshOnlineStatuses();
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [chats.length, refreshOnlineStatuses]);

  // Listen for local trigger to refresh the chat list (e.g. when accepting friend request)
  useEffect(() => {
    const handleRefresh = () => fetchChats(false);
    const handleCurrentUserLeftGroup = (event: any) => {
      const conversationId = event?.detail?.conversationId;
      if (conversationId) {
        setChats((prev) => prev.filter((chat) => chat.id !== conversationId));
      }
      fetchChats(false);
    };
    const handleConversationDeletedForMe = (event: any) => {
      const conversationId = event?.detail?.conversationId;
      if (conversationId) {
        setChats((prev) => prev.filter((chat) => String(chat.id) !== String(conversationId)));
      }
      fetchChats(false);
    };
    window.addEventListener("chatList:refresh", handleRefresh);
    window.addEventListener("group:currentUserLeft", handleCurrentUserLeftGroup);
    window.addEventListener("conversation:deletedForMe", handleConversationDeletedForMe);

    // Also listen to socket event if the other party accepted our request
    const unsubFriendAccepted = socketService.on("friend_request:accepted", () => {
      fetchChats(false);
    });

    return () => {
      window.removeEventListener("chatList:refresh", handleRefresh);
      window.removeEventListener(
        "group:currentUserLeft",
        handleCurrentUserLeftGroup,
      );
      window.removeEventListener(
        "conversation:deletedForMe",
        handleConversationDeletedForMe,
      );
      if (unsubFriendAccepted) unsubFriendAccepted();
    };
  }, [fetchChats]);

  // Handle member removed from conversation (including self leave)
  useEffect(() => {
    const handleMemberRemoved = (data: any) => {
      const { conversationId, removedUserId, message, reason } = data;
      if (shouldSkipDuplicateMemberRemoval(conversationId, removedUserId)) {
        return;
      }

      // If current user was removed, remove the conversation from local state
      if (removedUserId === user?.id) {
        setChats((prev) => prev.filter((chat) => chat.id !== conversationId));
      } else {
        touchConversationActivity(conversationId, message, {
          memberCountDelta: -1,
          fallbackText:
            reason === "left"
              ? "Một thành viên đã rời khỏi nhóm"
              : "Một thành viên đã bị xoá khỏi nhóm",
        });
      }
    };

    const cleanup = socketService.on("conversation:member_removed", handleMemberRemoved);
    return () => cleanup();
  }, [user?.id, shouldSkipDuplicateMemberRemoval, touchConversationActivity]);

  // Handle conversation deleted
  useEffect(() => {
    const handleConversationDeleted = (data: any) => {
      const { conversationId } = data;
      setChats((prev) => prev.filter((chat) => chat.id !== conversationId));
    };

    const cleanup = socketService.on("conversation:deleted", handleConversationDeleted);
    return () => cleanup();
  }, []);

  // Handle group name/avatar updates
  useEffect(() => {
    const handleGroupRenamed = (data: GroupRenamedPayload) => {
      const { conversationId, newName } = data;
      if (!conversationId || !newName) return;

      // Optimistic update: update name immediately in UI
      setChats((prev) => prev.map((chat) => (chat.id === conversationId ? { ...chat, name: newName } : chat)));

      // Refetch to ensure consistency
      fetchChats(false);
    };

    const handleGroupAvatarChanged = (data: GroupAvatarChangedPayload) => {
      const { conversationId, avatarUrl } = data;
      if (!conversationId || !avatarUrl) return;

      // Optimistic update: update avatar immediately in UI
      setChats((prev) => prev.map((chat) => (chat.id === conversationId ? { ...chat, avatarUrl } : chat)));

      fetchChats(false);
    };

    const cleanupRenamed = socketService.on("group:renamed", handleGroupRenamed);
    const cleanupAvatar = socketService.on("group:avatar_changed", handleGroupAvatarChanged);

    return () => {
      if (cleanupRenamed) cleanupRenamed();
      if (cleanupAvatar) cleanupAvatar();
    };
  }, [fetchChats]);

  // Reset unread count when chat is opened
  useEffect(() => {
    if (activeChatId) {
      setChats((prevChats) => prevChats.map((c) => (c.id === activeChatId ? { ...c, unreadCount: 0 } : c)));
    }
  }, [activeChatId]);

  useEffect(() => {
    const totalUnread = chats.reduce((total, chat) => total + Number(chat.unreadCount || 0), 0);
    document.title = totalUnread > 0 ? `(${totalUnread > 99 ? "99+" : totalUnread}) ${APP_TITLE}` : APP_TITLE;
    setTabFavicon(totalUnread);
  }, [chats]);

  useEffect(() => {
    const unsubscribe = socketService.onNewMessage((payload) => {
      const { message, conversationId } = extractSocketMessage(payload);
      let msgConvId = conversationId;
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
          textPreview: getChatMessagePreview(message),
          type: message.type || "text",
          status: "sent",
        };

        if (idx !== -1) {
          const chat = prevChats[idx];
          const isCurrentlyActive = activeChatId === msgConvId || openingChatId === msgConvId;

          const updatedChat = {
            ...chat,
            lastMessage: newLastMessage,
            lastMessageStatus:
              String(newLastMessage.senderId || "") === String(user?.id || "")
                ? "sent"
                : chat.lastMessageStatus,
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
  }, [activeChatId, openingChatId, fetchChats, user?.id]);

  // Listen to seen/delivered events to update the status for the latest message
  // so the sender immediately sees the "eye" icon without refreshing
  useEffect(() => {
    const unsubSeen = socketService.onMessageStatusUpdate((payload) => {
      const convId = payload?.conversationId;
      const lastSeenId = payload?.lastSeenMessageId || payload?.messageId;
      const seenUserId = payload?.userId;

      if (!convId || !lastSeenId) return;
      if (seenUserId && String(seenUserId) === String(user?.id)) return;

      setChats((prev) =>
        prev.map((c) => {
          if (c.id === convId) {
            if (!isOwnLastMessage(c, user?.id)) return c;

            // Because the frontend only keeps the ID of the last message
            const currentLastMsgId = c.lastMessage?.messageId || c.lastMessage?.id;
            // Update if the seen message is the last message
            if (isMessageCoveredBySeenId(currentLastMsgId, lastSeenId)) {
              return {
                ...c,
                lastMessageStatus: "seen",
                lastMessage: {
                  ...c.lastMessage,
                  status: "seen",
                },
              };
            }
          }
          return c;
        }),
      );
    });

    const unsubDelivered = socketService.onMessageDelivered((payload) => {
      const convId = payload?.conversationId;
      const lastDeliveredId = payload?.lastDeliveredMessageId || payload?.messageId;

      if (!convId || !lastDeliveredId) return;

      setChats((prev) =>
        prev.map((c) => {
          if (c.id === convId) {
            const currentLastMsgId = c.lastMessage?.messageId || c.lastMessage?.id;
            if (currentLastMsgId && String(currentLastMsgId) === String(lastDeliveredId)) {
              // Only escalate to delivered if it is not already seen
              if (c.lastMessageStatus !== "seen" && c.lastMessage?.status !== "seen") {
                return {
                  ...c,
                  lastMessageStatus: "delivered",
                  lastMessage: {
                    ...c.lastMessage,
                    status: "delivered",
                  },
                };
              }
            }
          }
          return c;
        }),
      );
    });

    return () => {
      unsubSeen();
      unsubDelivered();
    };
  }, []);

  useEffect(() => {
    const unsubUpdated = socketService.on("conversation:updated", () => {
      fetchChats(false);
    });
    return () => unsubUpdated();
  }, [fetchChats, user?.id]);

  // Handle new conversation created (e.g., group creation)
  useEffect(() => {
    const handleConversationCreated = (payload: any) => {
      const conversation = payload?.conversation || payload;
      if (!conversation?.id) return;

      // Add new conversation to the top if not already present
      setChats((prev) => {
        const exists = prev.some((c) => c.id === conversation.id);
        if (exists) return prev;
        return [conversation, ...prev];
      });
    };

    const cleanup = socketService.on("conversation:created", handleConversationCreated);
    return () => cleanup();
  }, []);

  // Handle members added to a conversation
  useEffect(() => {
    const handleMembersAdded = (data: any) => {
      const { conversationId, message } = data;
      const memberIds = Array.isArray(data?.newMembers)
        ? data.newMembers.map((member: any) => member?.userId).filter(Boolean)
        : Array.isArray(data?.memberIds)
          ? data.memberIds
          : [];
      if (!conversationId || memberIds.length === 0) return;

      // If current user is one of the added members, fetch chats to show the new group
      if (memberIds.includes(user?.id) || memberIds.includes(user?._id)) {
        fetchChats(false);
      }

      touchConversationActivity(conversationId, message, {
        memberCountDelta: memberIds.length,
        fallbackText: "Có thành viên mới được thêm vào nhóm",
      });

      setChats((prev) =>
        prev.map((chat) => {
          if (chat.id === conversationId) {
            const newChat = {
              ...chat,
            };

            // If the conversation has pendingMembers, add new members to pending list
            if (chat.pendingMembers) {
              const newPending = chat.pendingMembers.filter((pendingId: string) => !memberIds.includes(pendingId));
              if (newPending.length > 0) {
                newChat.pendingMembers = newPending;
              } else {
                delete newChat.pendingMembers;
              }
            }

            return newChat;
          }
          return chat;
        }),
      );
    };

    const cleanup = socketService.on("conversation:members_added", handleMembersAdded);
    return () => cleanup();
  }, [fetchChats, touchConversationActivity, user?.id, user?._id]);

  // Handle conversation admin actions: pin, archive, mute
  useEffect(() => {
    const handlePinToggled = () => fetchChats(false);
    const handleArchivedToggled = () => fetchChats(false);
    const handleMuteChanged = () => fetchChats(false);

    const cleanupPin = socketService.on("conversation:pin_toggled", handlePinToggled);
    const cleanupArchive = socketService.on("conversation:archived_toggled", handleArchivedToggled);
    const cleanupMute = socketService.on("conversation:mute_changed", handleMuteChanged);

    return () => {
      if (cleanupPin) cleanupPin();
      if (cleanupArchive) cleanupArchive();
      if (cleanupMute) cleanupMute();
    };
  }, [fetchChats]);

  // Handle group admin actions: settings, approval/rejection, admin/owner changes
  useEffect(() => {
    const handleGroupSettingsUpdated = (data: any) => {
      const conversationId =
        data?.conversationId || data?.groupId || data?.id || data?.conversation?.id;
      const rawSettings = data?.settings || data?.data?.settings || data;
      const settings = {
        ...(rawSettings?.whoCanSendMessages !== undefined && {
          whoCanSendMessages: rawSettings.whoCanSendMessages,
        }),
        ...(rawSettings?.requireApproval !== undefined && {
          requireApproval: rawSettings.requireApproval,
        }),
        ...(rawSettings?.allowMemberInvite !== undefined && {
          allowMemberInvite: rawSettings.allowMemberInvite,
        }),
        ...(rawSettings?.allowSendLink !== undefined && {
          allowSendLink: rawSettings.allowSendLink,
        }),
      };
      if (!conversationId || !settings || typeof settings !== "object") return;
      if (Object.keys(settings).length === 0) return;

      setChats((prev) =>
        prev.map((chat) =>
          String(chat.id) === String(conversationId)
            ? { ...chat, settings: { ...(chat.settings || {}), ...settings } }
            : chat,
        ),
      );
    };
    const handleMemberApproved = () => fetchChats(false);
    const handleMemberRejected = () => fetchChats(false);
    const handleAdminChanged = () => fetchChats(false);
    const handleOwnerTransferred = () => fetchChats(false);

    const cleanupSettings = socketService.on("group:settings_updated", handleGroupSettingsUpdated);
    const cleanupApproved = socketService.on("group:member_approved", handleMemberApproved);
    const cleanupRejected = socketService.on("group:member_rejected", handleMemberRejected);
    const cleanupAdmin = socketService.on("group:admin_changed", handleAdminChanged);
    const cleanupOwner = socketService.on("group:owner_transferred", handleOwnerTransferred);

    return () => {
      if (cleanupSettings) cleanupSettings();
      if (cleanupApproved) cleanupApproved();
      if (cleanupRejected) cleanupRejected();
      if (cleanupAdmin) cleanupAdmin();
      if (cleanupOwner) cleanupOwner();
    };
  }, [fetchChats]);

  // Handle group member left (kicked or voluntary leave)
  useEffect(() => {
    const handleMemberLeft = (data: any) => {
      const { conversationId, userId, message } = data;
      const leftUserId = userId || data?.removedUserId;
      if (shouldSkipDuplicateMemberRemoval(conversationId, leftUserId)) {
        return;
      }

      // If current user was removed/kicked, remove conversation from list
      if (leftUserId === user?.id) {
        setChats((prev) => prev.filter((chat) => chat.id !== conversationId));
      } else {
        touchConversationActivity(conversationId, message, {
          memberCountDelta: -1,
          fallbackText: "Một thành viên đã rời khỏi nhóm",
        });
      }
    };

    const cleanup = socketService.on("group:member_left", handleMemberLeft);
    return () => cleanup();
  }, [user?.id, shouldSkipDuplicateMemberRemoval, touchConversationActivity]);

  // Handle group dissolved
  useEffect(() => {
    const handleGroupDissolved = (data: any) => {
      const { conversationId } = data;
      setChats((prev) => prev.filter((chat) => chat.id !== conversationId));
    };

    const cleanup = socketService.on("group:dissolved", handleGroupDissolved);
    return () => cleanup();
  }, []);

  const [globalUsers, setGlobalUsers] = useState([]);
  const [globalGroups, setGlobalGroups] = useState([]);
  const [globalMessages, setGlobalMessages] = useState([]);
  const [globalMedia, setGlobalMedia] = useState([]);
  const [globalLinks, setGlobalLinks] = useState([]);
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const isSearchView = isSearchMode || Boolean(normalizedQuery);
  const mediaResults = globalMedia.filter((item: any) =>
    ["image", "video"].includes(String(item?.type || "").toLowerCase()),
  );
  const fileResults = globalMedia.filter((item: any) =>
    ["file", "audio", "music"].includes(String(item?.type || "").toLowerCase()),
  );
  const voiceResults = globalMedia.filter((item: any) => String(item?.type || "").toLowerCase() === "voice");
  const isGroupChat = isGroupChatItem;

  useEffect(() => {
    if (!searchContextMenu) return;
    const handleClose = () => setSearchContextMenu(null);
    document.addEventListener("click", handleClose);
    return () => document.removeEventListener("click", handleClose);
  }, [searchContextMenu]);

  useEffect(() => {
    if (!forwardModalVisible) return;
    fetchFriends();
  }, [forwardModalVisible, fetchFriends]);

  const handleSearchResultContextMenu = (event: any, item: any, kind: string, message: any, chat: any) => {
    event.preventDefault();
    event.stopPropagation();
    const targetPayload = buildSearchTargetPayload(item, chat, message);
    if (!targetPayload) return;
    setSearchContextMenu({
      x: event.clientX,
      y: event.clientY,
      item,
      kind,
      message,
      targetPayload,
    });
  };

  const handleShowSearchResultInChat = () => {
    if (!searchContextMenu?.targetPayload) return;
    onSelectChat?.(searchContextMenu.targetPayload);
    setSearchContextMenu(null);
  };

  const handleForwardSearchResult = () => {
    if (!searchContextMenu?.message) return;
    setMessageToForward(searchContextMenu.message);
    setForwardModalVisible(true);
    setSearchContextMenu(null);
  };

  useEffect(() => {
    if (!isGlobalSearchEnabled) return;

    if (!normalizedQuery) {
      setGlobalUsers([]);
      setGlobalGroups([]);
      setGlobalMessages([]);
      setGlobalMedia([]);
      setGlobalLinks([]);
      setIsSearchingGlobal(false);
      return;
    }

    const fetchGlobalSearch = async () => {
      setIsSearchingGlobal(true);
      try {
        const response: any = await searchService.globalSearch({
          query: searchQuery.trim(),
          type: "ALL",
          limit: 10,
          contextLimit: 1,
        });
        setGlobalUsers(Array.isArray(response?.users) ? response.users : []);
        setGlobalGroups(Array.isArray(response?.groups) ? response.groups : response?.conversations || []);
        setGlobalMessages(Array.isArray(response?.messages) ? response.messages : []);
        setGlobalMedia(Array.isArray(response?.media) ? response.media : []);
        setGlobalLinks(Array.isArray(response?.links) ? response.links : []);
      } catch (err) {
        console.error("Global search error:", err);
        setGlobalUsers([]);
        setGlobalGroups([]);
        setGlobalMessages([]);
        setGlobalMedia([]);
        setGlobalLinks([]);
      } finally {
        setIsSearchingGlobal(false);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchGlobalSearch();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [normalizedQuery, searchQuery, isGlobalSearchEnabled]);

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

  const privateChatResults = useMemo(
    () => visibleChats.filter((chat) => !isGroupChat(chat)),
    [visibleChats],
  );

  const groupResults = useMemo(() => {
    const localGroups = visibleChats.filter(isGroupChat);
    const groupById = new Map();
    [...localGroups, ...globalGroups].forEach((group: any) => {
      if (!group?.id) return;
      groupById.set(group.id, {
        ...group,
        type: group.type || "group",
        isGroup: true,
        lastMessage: group.lastMessage || null,
      });
    });
    return Array.from(groupById.values());
  }, [visibleChats, globalGroups]);

  const searchTabs = [
    { id: "chats", label: "Chats", count: privateChatResults.length + globalUsers.length },
    { id: "groups", label: "Groups", count: groupResults.length },
    { id: "messages", label: "Messages", count: globalMessages.length },
    { id: "media", label: "Media", count: mediaResults.length },
    { id: "links", label: "Links", count: globalLinks.length },
    { id: "files", label: "Files", count: fileResults.length },
    { id: "voice", label: "Voice", count: voiceResults.length },
  ];

  const hasSearchResults = searchTabs.some((tab) => tab.count > 0);

  useEffect(() => {
    if (!normalizedQuery) {
      setActiveSearchTab("chats");
    }
  }, [
    normalizedQuery,
  ]);

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex-1 overflow-y-auto pb-20">
        {!isSearchView ? (
          isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          ) : visibleChats.length === 0 ? (
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
          )
        ) : (
          <div className={isSearchClosing ? "animate-search-panel-out" : "animate-search-panel"}>
            <div className="sticky top-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-gray-200 dark:border-slate-700">
              <div
                className="flex overflow-x-auto scrollbar-hide px-2 animate-search-tabs"
                onWheel={(event) => {
                  if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
                  event.currentTarget.scrollLeft += event.deltaY;
                }}
              >
                {searchTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSearchTab(tab.id)}
                    className={`px-3 py-3 text-sm font-semibold border-b-2 transition whitespace-nowrap ${
                      activeSearchTab === tab.id
                        ? "border-blue-500 text-blue-600 dark:text-blue-400 scale-[1.03]"
                        : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                    } duration-200 ease-out`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {!normalizedQuery ? (
              <div className="py-10 px-6 text-center text-sm text-gray-500 dark:text-gray-400 animate-empty-search">
                Enter a keyword to search
              </div>
            ) : isSearchingGlobal ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
            ) : !hasSearchResults ? (
              <div className="py-8 text-center text-sm text-gray-500">No results found</div>
            ) : (
              <div key={activeSearchTab} className="pt-2 animate-search-panel">
                {activeSearchTab === "chats" &&
                  (privateChatResults.length > 0 || globalUsers.length > 0 ? (
                    <>
                      {privateChatResults.map((chat, index) => (
                        <div
                          key={`search-chat-${chat.id}`}
                          className="animate-search-result"
                          style={{ animationDelay: `${Math.min(index * 25, 160)}ms` }}
                        >
                          <ConversationItem
                            chat={chat}
                            isCollapsed={isCollapsed}
                            activeChatId={activeChatId}
                            openingChatId={openingChatId}
                            onSelectChat={onSelectChat}
                          />
                        </div>
                      ))}
                      {globalUsers.map((searchUser: any, index) => (
                        <div
                          key={`global-user-${searchUser.id || searchUser._id}`}
                          className="animate-search-result"
                          style={{ animationDelay: `${Math.min((privateChatResults.length + index) * 25, 160)}ms` }}
                        >
                          <GlobalUserItem
                            user={searchUser}
                            isCollapsed={isCollapsed}
                            onSelectChat={onSelectChat}
                          />
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="py-4 text-center text-sm text-gray-500 animate-empty-search">No chats found</div>
                  ))}

                {activeSearchTab === "groups" &&
                  (groupResults.length > 0 ? (
                    groupResults.map((group: any, index) => (
                      <div
                        key={`search-group-${group.id}`}
                        className="animate-search-result"
                        style={{ animationDelay: `${Math.min(index * 25, 160)}ms` }}
                      >
                        <ConversationItem
                          chat={group}
                          isCollapsed={isCollapsed}
                          activeChatId={activeChatId}
                          openingChatId={openingChatId}
                          onSelectChat={onSelectChat}
                        />
                      </div>
                    ))
                  ) : (
                    <div className="py-4 text-center text-sm text-gray-500 animate-empty-search">No groups found</div>
                  ))}

                {activeSearchTab === "messages" &&
                  (globalMessages.length > 0 ? (
                    globalMessages.map((message: any) => {
                      const chat = chats.find((item) => item.id === message.conversationId);
                      return (
                        <GlobalMessageItem
                          key={`global-message-${message.id || message.messageId}`}
                          message={message}
                          chat={chat}
                          isCollapsed={isCollapsed}
                          onSelectChat={onSelectChat}
                        />
                      );
                    })
                  ) : (
                    <div className="py-4 text-center text-sm text-gray-500 animate-empty-search">No messages found</div>
                  ))}

                {activeSearchTab === "media" && (
                  <PhotoProvider maskOpacity={0.85}>
                    {mediaResults.length > 0 ? (
                      mediaResults.map((item: any) => {
                        const chat = chats.find((chatItem) => chatItem.id === item.conversationId);
                        return (
                          <GlobalMediaItem
                            key={`global-media-${item.messageId || item.url}`}
                            item={item}
                            chat={chat}
                            isCollapsed={isCollapsed}
                            onContextMenu={handleSearchResultContextMenu}
                          />
                        );
                      })
                    ) : (
                      <div className="py-4 text-center text-sm text-gray-500 animate-empty-search">No media found</div>
                    )}
                  </PhotoProvider>
                )}

                {activeSearchTab === "links" &&
                  (globalLinks.length > 0 ? (
                    globalLinks.map((item: any) => {
                      const chat = chats.find((chatItem) => chatItem.id === item.conversationId);
                      return (
                        <GlobalLinkItem
                          key={`global-link-${item.messageId || item.url}`}
                          item={item}
                          chat={chat}
                          isCollapsed={isCollapsed}
                          onContextMenu={handleSearchResultContextMenu}
                        />
                      );
                    })
                  ) : (
                    <div className="py-4 text-center text-sm text-gray-500 animate-empty-search">No links found</div>
                  ))}

                {activeSearchTab === "files" &&
                  (fileResults.length > 0 ? (
                    fileResults.map((item: any) => {
                      const chat = chats.find((chatItem) => chatItem.id === item.conversationId);
                      return (
                        <GlobalMediaItem
                          key={`global-file-${item.messageId || item.url}`}
                          item={item}
                          chat={chat}
                          isCollapsed={isCollapsed}
                          onContextMenu={handleSearchResultContextMenu}
                        />
                      );
                    })
                  ) : (
                    <div className="py-4 text-center text-sm text-gray-500 animate-empty-search">No files found</div>
                  ))}

                {activeSearchTab === "voice" &&
                  (voiceResults.length > 0 ? (
                    voiceResults.map((item: any) => {
                      const chat = chats.find((chatItem) => chatItem.id === item.conversationId);
                      return (
                        <GlobalMediaItem
                          key={`global-voice-${item.messageId || item.url}`}
                          item={item}
                          chat={chat}
                          isCollapsed={isCollapsed}
                          onContextMenu={handleSearchResultContextMenu}
                        />
                      );
                    })
                  ) : (
                    <div className="py-4 text-center text-sm text-gray-500 animate-empty-search">No voice messages found</div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      <SearchResultContextMenu
        contextMenu={searchContextMenu}
        onClose={() => setSearchContextMenu(null)}
        onForward={handleForwardSearchResult}
        onDownload={() => {
          downloadUrl(searchContextMenu?.item?.url, searchContextMenu?.item?.name);
          setSearchContextMenu(null);
        }}
        onShowInChat={handleShowSearchResultInChat}
        onOpenLink={() => {
          if (searchContextMenu?.item?.url) {
            window.open(searchContextMenu.item.url, "_blank", "noopener,noreferrer");
          }
          setSearchContextMenu(null);
        }}
        onCopyLink={async () => {
          if (searchContextMenu?.item?.url) {
            await navigator.clipboard.writeText(searchContextMenu.item.url).catch(() => {});
          }
          setSearchContextMenu(null);
        }}
      />

      <ForwardModal
        forwardModalVisible={forwardModalVisible}
        setForwardModalVisible={setForwardModalVisible}
        friends={friends}
        messageToForward={messageToForward}
        currentUserId={user?.id}
        selectedChat={null}
        onForwardToTarget={onForwardToTarget}
      />
    </div>
  );
};
