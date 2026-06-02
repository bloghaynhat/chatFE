import { useCallback, useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { conversationService, mediaService } from "../../services";
import { socketService } from "../../services/socketService";
import { ActiveChatPane } from "../chat";
import { DeleteConversationModal } from "../chat/ActiveChatPane/DeleteConversationModal";
import { RightSidebar } from "../chat/RightSidebar";
import { ResizableChatPanel } from "./ResizableChatPanel";
import { useAuth } from "../../hooks";
import type {
  PinMessagePayload,
  UnpinMessagePayload,
} from "../../types/socket";
import { toast } from "sonner";

const MESSAGE_PAGE_SIZE = 30;

const slugifyChatName = (value: string = "") => {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "chat";
};

const getConversationUrl = (conversationId: string, chatName?: string) =>
  `/c/${encodeURIComponent(conversationId)}/${slugifyChatName(chatName)}`;

const hasDisplayInfo = (conversation: any) =>
  Boolean(
    conversation?.name ||
      conversation?.displayName ||
      conversation?.targetUser?.displayName ||
      conversation?.participant?.displayName ||
      conversation?.user?.displayName,
  );

const sortMessagesByCreatedAt = (items: any[] = []) =>
  [...items].sort((a, b) => {
    const dateA = new Date(a.createdAt || a.updatedAt || 0).getTime();
    const dateB = new Date(b.createdAt || b.updatedAt || 0).getTime();
    return dateA - dateB;
  });

const getMessageId = (message: any) =>
  message?.id || message?._id || message?.messageId || null;

const getMessageTimeValue = (message: any) => {
  const value =
    message?.createdAt ||
    message?.updatedAt ||
    message?.timestamp ||
    message?.sentAt ||
    null;
  const time = value ? new Date(value).getTime() : 0;
  return Number.isFinite(time) ? time : 0;
};

const getMessagePreviewValue = (message: any) => {
  const value =
    message?.text ||
    message?.content ||
    message?.textPreview ||
    (typeof message?.message === "string" ? message.message : "");

  return String(value || "").trim();
};

const getChatActivityTimeValue = (chat: any) => {
  const value =
    chat?.lastMessageAt ||
    chat?.lastMessage?.createdAt ||
    chat?.lastMessage?.updatedAt ||
    chat?.updatedAt ||
    null;
  const time = value ? new Date(value).getTime() : 0;
  return Number.isFinite(time) ? time : 0;
};

const getMessageConversationId = (message: any, payload?: any) => {
  let conversationId =
    message?.conversationId ||
    message?.conversation?.id ||
    message?.conversation?._id ||
    message?.id_conversation ||
    payload?.conversationId ||
    payload?.conversation?.id ||
    payload?.conversation?._id ||
    null;

  if (conversationId && typeof conversationId === "object") {
    conversationId = conversationId.id || conversationId._id;
  }

  return conversationId ? String(conversationId) : "";
};

const isMessageRevoked = (message: any) => {
  const status = String(
    message?.status ||
      message?.messageStatus ||
      message?.state ||
      message?.action ||
      "",
  ).toLowerCase();

  return Boolean(
    message?.isRevoked ||
      message?.revoked ||
      message?.isRecalled ||
      message?.recalled ||
      message?.deletedForEveryone ||
      message?.isDeletedForEveryone ||
      message?.revokedAt ||
      message?.recalledAt ||
      message?.deletedAt ||
      status === "revoked" ||
      status === "recalled" ||
      status === "deleted_for_everyone",
  );
};

const isMessageEdited = (message: any) => {
  const status = String(
    message?.status ||
      message?.messageStatus ||
      message?.state ||
      "",
  ).toLowerCase();

  return Boolean(
    message?.isEdited ||
      message?.edited ||
      message?.isEditted ||
      message?.editted ||
      message?.editedAt ||
      message?.edittedAt ||
      message?.editHistory?.length ||
      status === "edited" ||
      status === "editted",
  );
};

const normalizeMessageLifecycle = (message: any) => {
  if (!message) return message;

  const editedMessage = isMessageEdited(message)
    ? {
        ...message,
        isEdited: true,
        editedAt:
          message.editedAt ||
          message.edittedAt ||
          message.updatedAt ||
          new Date().toISOString(),
      }
    : message;

  if (!isMessageRevoked(editedMessage)) return editedMessage;

  return {
    ...editedMessage,
    isRevoked: true,
    deletedAt:
      editedMessage.deletedAt ||
      editedMessage.revokedAt ||
      editedMessage.recalledAt ||
      new Date().toISOString(),
  };
};

const normalizeMessagesLifecycle = (items: any[] = []) =>
  items.map(normalizeMessageLifecycle);

const sortPinnedMessages = (items: any[] = []) =>
  [...items].sort((a, b) => {
    const dateA = new Date(a.pinnedAt || a.createdAt || 0).getTime();
    const dateB = new Date(b.pinnedAt || b.createdAt || 0).getTime();
    return dateB - dateA;
  });

const upsertPinnedMessage = (items: any[], message: any) => {
  const messageId = getMessageId(message);
  if (!messageId) return items;

  const pinnedMessage = {
    ...message,
    pinnedAt: message.pinnedAt || new Date().toISOString(),
  };
  const exists = items.some((item) => String(getMessageId(item)) === String(messageId));
  const next = exists
    ? items.map((item) =>
        String(getMessageId(item)) === String(messageId)
          ? { ...item, ...pinnedMessage }
          : item,
      )
    : [pinnedMessage, ...items];

  return sortPinnedMessages(next);
};

const removePinnedMessage = (items: any[], messageId: string) =>
  items.filter((item) => String(getMessageId(item)) !== String(messageId));

type ConversationMessageCacheEntry = {
  messages: any[];
  messagePageInfo: {
    nextCursor: string | null;
    hasMore: boolean;
  };
  memberSeenMap: Record<string, string>;
  pinnedMessages: any[];
  cachedAt: number;
};

const applyMemberSeenMapToMessages = (
  items: any[] = [],
  memberSeenMap: Record<string, string> = {},
  currentUserId?: string,
) => {
  if (!currentUserId || !memberSeenMap || Object.keys(memberSeenMap).length === 0) {
    return items;
  }

  const sorted = sortMessagesByCreatedAt(items);
  const messageIndexById = new Map<string, number>();
  sorted.forEach((message, index) => {
    const messageId = getMessageId(message);
    if (messageId) messageIndexById.set(String(messageId), index);
  });

  const otherSeenIndexes = Object.entries(memberSeenMap)
    .filter(([userId]) => String(userId) !== String(currentUserId))
    .map(([, lastSeenMessageId]) => messageIndexById.get(String(lastSeenMessageId)))
    .filter((index): index is number => typeof index === "number");

  if (otherSeenIndexes.length === 0) return sorted;

  const maxSeenIndex = Math.max(...otherSeenIndexes);

  return sorted.map((message, index) => {
    const isOwnMessage = String(message?.senderId || message?.sender?.id || "") === String(currentUserId);
    if (!isOwnMessage || index > maxSeenIndex) return message;

    return {
      ...message,
      status: "seen",
      isSeen: true,
      readAt: message.readAt || new Date().toISOString(),
    };
  });
};

const mergeUniqueMessages = (olderMessages: any[], currentMessages: any[]) => {
  const seen = new Set<string>();
  const merged = [...olderMessages, ...currentMessages].filter((message) => {
    const id = getMessageId(message);
    if (!id) return true;
    if (seen.has(String(id))) return false;
    seen.add(String(id));
    return true;
  });
  return sortMessagesByCreatedAt(merged);
};

const MainLayout = ({ children }: { children?: any }) => {
  const [activeView, setActiveView] = useState("chats"); // 'chats', 'contacts'
  const [darkMode, setDarkMode] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const selectedChatRef = useRef(null);
  const selectedConversationIdRef = useRef<string | null>(null);
  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  useEffect(() => {
    selectedConversationIdRef.current = selectedConversationId;
  }, [selectedConversationId]);
  const [isDeleteConversationModalOpen, setIsDeleteConversationModalOpen] = useState(false);
  const [isDeletingConversation, setIsDeletingConversation] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messagePageInfo, setMessagePageInfo] = useState<{
    nextCursor: string | null;
    hasMore: boolean;
  }>({ nextCursor: null, hasMore: false });
  const [memberSeenMap, setMemberSeenMap] = useState<Record<string, string>>({});
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [isOpeningConversation, setIsOpeningConversation] = useState(false);
  const [openingChatId, setOpeningChatId] = useState(null);
  const [chatError, setChatError] = useState("");
  const [forwardingMessage, setForwardingMessage] = useState(null); // Added state
  const [pinnedMessages, setPinnedMessages] = useState<any[]>([]);
  const conversationMessageCacheRef = useRef<
    Map<string, ConversationMessageCacheEntry>
  >(new Map());
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { conversationId: routeConversationId } = useParams();

  // Track pending pin/unpin operations to prevent duplicate requests
  const pendingPinOperations = useRef<Set<string>>(new Set());
  const recentMemberRemovalEvents = useRef<Map<string, number>>(new Map());
  const lastInteractionSeenRef = useRef<string>("");

  const markCachedMessageRevoked = useCallback(
    (messageId: string, payload: any = {}) => {
      if (!messageId) return false;

      let touched = false;
      const revokedAt =
        payload?.deletedAt ||
        payload?.revokedAt ||
        payload?.recalledAt ||
        payload?.message?.deletedAt ||
        payload?.message?.revokedAt ||
        payload?.message?.recalledAt ||
        new Date().toISOString();

      conversationMessageCacheRef.current.forEach((entry, conversationId) => {
        let found = false;
        const nextMessages = (entry.messages || []).map((message) => {
          if (String(getMessageId(message)) !== String(messageId)) {
            return normalizeMessageLifecycle(message);
          }

          found = true;
          return normalizeMessageLifecycle({
            ...message,
            ...payload?.message,
            isRevoked: true,
            deletedAt: revokedAt,
          });
        });

        if (found) {
          touched = true;
          conversationMessageCacheRef.current.set(conversationId, {
            ...entry,
            messages: nextMessages,
            cachedAt: Date.now(),
          });
        }
      });

      return touched;
    },
    [],
  );

  const markCachedMessageEdited = useCallback(
    (messageId: string, editedMessage: any = {}) => {
      if (!messageId) return false;

      let touched = false;
      const newText =
        editedMessage?.text ||
        editedMessage?.content ||
        editedMessage?.message ||
        editedMessage?.textPreview;

      conversationMessageCacheRef.current.forEach((entry, conversationId) => {
        let found = false;
        const nextMessages = (entry.messages || []).map((message) => {
          if (String(getMessageId(message)) !== String(messageId)) {
            return normalizeMessageLifecycle(message);
          }

          found = true;
          return normalizeMessageLifecycle({
            ...message,
            ...editedMessage,
            isEdited: true,
            text: newText ?? message.text,
            content: newText ?? message.content,
            textPreview: newText ?? message.textPreview,
            updatedAt: editedMessage?.updatedAt || new Date().toISOString(),
          });
        });

        if (found) {
          touched = true;
          conversationMessageCacheRef.current.set(conversationId, {
            ...entry,
            messages: nextMessages,
            cachedAt: Date.now(),
          });
        }
      });

      return touched;
    },
    [],
  );

  const shouldSkipDuplicateMemberRemoval = useCallback(
    (conversationId?: string, userId?: string) => {
      if (!conversationId || !userId) return false;

      const now = Date.now();
      const key = `${conversationId}:${userId}`;
      const lastSeenAt = recentMemberRemovalEvents.current.get(key);

      recentMemberRemovalEvents.current.forEach((seenAt, seenKey) => {
        if (now - seenAt > 2500) {
          recentMemberRemovalEvents.current.delete(seenKey);
        }
      });

      recentMemberRemovalEvents.current.set(key, now);
      return Boolean(lastSeenAt && now - lastSeenAt < 2500);
    },
    [],
  );

  const appendLocalMessage = useCallback((message: any) => {
    if (!message?.id && !message?._id) return;
    setMessages((prev) => {
      const messageId = message.id || message._id;
      if (prev.some((item: any) => String(item.id || item._id) === String(messageId))) {
        return prev;
      }
      return [...prev, normalizeMessageLifecycle(message)];
    });
  }, []);

  const refreshPinnedMessages = useCallback(
    async (conversationId: string = selectedConversationId) => {
      if (!conversationId) {
        setPinnedMessages([]);
        return;
      }

      try {
        const pinned = await conversationService.getPinnedMessages(conversationId);
        setPinnedMessages(sortPinnedMessages(pinned || []));
      } catch (error) {
        console.warn("Failed to load pinned messages", error);
        setPinnedMessages(sortPinnedMessages(messages.filter((message: any) => message.pinnedAt)));
      }
    },
    [messages, selectedConversationId],
  );

  const markConversationRead = useCallback(
    (conversationId: string, conversationMessages: any[] = []) => {
      const lastMessage = conversationMessages[conversationMessages.length - 1];
      const lastMessageId = getMessageId(lastMessage);
      if (!conversationId || !lastMessageId || !lastMessage) return;

      const isLastMessageFromCurrentUser =
        String(
          lastMessage.senderId ||
          lastMessage.sender?.id ||
          lastMessage.sender?._id ||
          lastMessage.id_sender ||
          "",
        ) === String(user?.id || "");

      if (isLastMessageFromCurrentUser) return;

      Promise.allSettled([
        conversationService.markDelivered(conversationId, lastMessageId),
        conversationService.markSeen(conversationId, lastMessageId),
      ]).then(() => {
        window.dispatchEvent(new Event("chatList:refresh"));
      });
    },
    [user?.id],
  );

  const handleChatInteractionRead = useCallback(() => {
    if (!selectedConversationId || messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    const lastMessageId = getMessageId(lastMessage);
    if (!lastMessageId) return;

    const senderId =
      lastMessage.senderId ||
      lastMessage.sender?.id ||
      lastMessage.sender?._id ||
      lastMessage.id_sender ||
      "";
    if (String(senderId) === String(user?.id || "")) return;

    const seenKey = `${selectedConversationId}:${lastMessageId}`;
    if (lastInteractionSeenRef.current === seenKey) return;
    lastInteractionSeenRef.current = seenKey;

    Promise.allSettled([
      socketService.markSeen(selectedConversationId, lastMessageId),
      conversationService.markSeen(selectedConversationId, lastMessageId),
    ]).then(() => {
      window.dispatchEvent(new Event("chatList:refresh"));
    });
  }, [messages, selectedConversationId, user?.id]);

  useEffect(() => {
    if (!selectedConversationId || isOpeningConversation) return;

    conversationMessageCacheRef.current.set(String(selectedConversationId), {
      messages: normalizeMessagesLifecycle(messages),
      messagePageInfo,
      memberSeenMap,
      pinnedMessages,
      cachedAt: Date.now(),
    });
  }, [
    selectedConversationId,
    messages,
    messagePageInfo,
    memberSeenMap,
    pinnedMessages,
    isOpeningConversation,
  ]);

  const updatePollInMessages = useCallback((poll: any) => {
    if (!poll?.id) return;
    setMessages((prev) =>
      prev.map((message: any) => {
        const messagePollId = message.pollId || message.poll?.id;
        const messageId = message.id || message._id;
        if (
          String(messagePollId) === String(poll.id) ||
          (poll.messageId && String(messageId) === String(poll.messageId))
        ) {
          return {
            ...message,
            pollId: messagePollId || poll.id,
            poll: {
              ...(message.poll || {}),
              ...poll,
            },
          };
        }
        return message;
      }),
    );
  }, []);

  const removePollFromMessages = useCallback((pollId: string) => {
    if (!pollId) return;
    setMessages((prev) =>
      prev.filter((message: any) => {
        const messagePollId = message.pollId || message.poll?.id;
        return String(messagePollId) !== String(pollId);
      }),
    );
  }, []);

  const getPayloadConversationId = useCallback((payload: any) => {
    const rawId =
      payload?.conversationId ||
      payload?.groupId ||
      payload?.note?.conversationId ||
      payload?.note?.groupId ||
      payload?.reminder?.conversationId ||
      payload?.reminder?.groupId ||
      payload?.message?.conversationId ||
      payload?.data?.conversationId ||
      payload?.data?.groupId;

    if (rawId && typeof rawId === "object") {
      return rawId.id || rawId._id || rawId.conversationId || rawId.groupId;
    }

    return rawId;
  }, []);

  const upsertMessageFromPayload = useCallback(
    (payload: any) => {
      const message =
        payload?.message ||
        payload?.systemMessage ||
        payload?.data?.message ||
        payload?.data?.systemMessage ||
        payload?.reminder?.message ||
        payload?.reminder?.timelineMessage ||
        payload?.data?.reminder?.message ||
        payload?.data?.reminder?.timelineMessage ||
        null;

      if (!message) return;

      const conversationId = getPayloadConversationId(payload);
      if (String(conversationId || message.conversationId) !== String(selectedConversationId)) {
        return;
      }

      setMessages((prev) => {
        const messageId = message.id || message._id || message.messageId;
        if (!messageId) return prev;

        const exists = prev.some(
          (item: any) => String(item.id || item._id || item.messageId) === String(messageId),
        );

        if (exists) {
          return prev.map((item: any) =>
            String(item.id || item._id || item.messageId) === String(messageId)
              ? { ...item, ...message }
              : item,
          );
        }

        return sortMessagesByCreatedAt([...prev, normalizeMessageLifecycle(message)]);
      });
    },
    [getPayloadConversationId, selectedConversationId],
  );

  useEffect(() => {
    let active = true;

    // Initialize global socket
    socketService.connect().then((socket) => {
      if (!active) return;
      if (socket) {
        socketService.onNewMessage((payload) => {
          // Payload từ receiveMessage: { message: {...}, conversationId: "..." }
          const message = payload?.message || payload;
          const incomingConversationId = getMessageConversationId(message, payload);
          const activeConversationId = selectedConversationIdRef.current;
          if (
            incomingConversationId &&
            String(incomingConversationId) !== String(activeConversationId)
          ) {
            conversationMessageCacheRef.current.delete(incomingConversationId);
          }

          setTypingUsers((prev) => {
            const sender =
              message?.senderId ||
              message?.sender?.id ||
              message?.id_sender ||
              (typeof message?.sender === "string" ? message.sender : null);
            if (sender && prev.has(sender)) {
              const ns = new Set(prev);
              ns.delete(sender);
              return ns;
            }
            return prev;
          });

          setMessages((prev) => {
            if (!message || !message.id) return prev;
            // Prevent duplicate messages
            const msgId = message.id;
            if (prev.some((m) => String(m.id) === String(msgId))) return prev;

            // Only add if it belongs to currently open conversation
            const msgConvId = incomingConversationId;
            if (String(msgConvId) === String(selectedConversationIdRef.current)) {
              // Auto mark as seen when message is received in current conversation
              const senderId =
                message?.senderId || message?.sender?.id || message?.id_sender;
              if (senderId && senderId !== user?.id) {
                // Only mark seen if message is from someone else, not from current user
                socketService
                  .markSeen(selectedConversationIdRef.current, msgId)
                  .then(() => {
                    window.dispatchEvent(new Event("chatList:refresh"));
                  })
                  .catch(() => {});
              }
              return [...prev, normalizeMessageLifecycle(message)];
            }
            return prev;
          });
        });

        // Handle quoted message (reply with quote)
        socketService.onMessageQuoted((payload) => {
          console.log("[Socket] Received message:quoted:", payload);
          const message = payload?.message || payload;
          if (!message) {
            console.warn(
              "[Socket] message:quoted payload has no message:",
              payload,
            );
            return;
          }

          setMessages((prev) => {
            const msgId = message.id;
            if (!msgId) {
              console.warn(
                "[Socket] message:quoted message has no id:",
                message,
              );
              return prev;
            }
            if (prev.some((m) => String(m.id) === String(msgId))) {
              console.log(
                "[Socket] message:quoted already exists, skipping:",
                msgId,
              );
              return prev;
            }

            let msgConvId = message.conversationId || payload?.conversationId;
            if (msgConvId && typeof msgConvId === "object") {
              msgConvId = msgConvId.id;
            }
            if (String(msgConvId) === String(selectedConversationId)) {
              console.log("[Socket] Adding quoted message to state:", msgId);
              return [...prev, normalizeMessageLifecycle(message)];
            }
            console.log(
              "[Socket] message:quoted conversationId mismatch. msgConvId:",
              msgConvId,
              "selected:",
              selectedConversationId,
            );
            return prev;
          });
        });

        socketService.onMessageEdited((payload) => {
          const editedMsg = payload?.message || payload;
          if (!editedMsg || (!editedMsg._id && !editedMsg.id && !editedMsg.messageId)) return;
          const editedMessageId = getMessageId(editedMsg);
          const newText =
            editedMsg.text ||
            editedMsg.content ||
            editedMsg.message ||
            editedMsg.textPreview;
          const touchedCache = markCachedMessageEdited(String(editedMessageId), editedMsg);
          const editedConversationId = getMessageConversationId(editedMsg, payload);
          if (editedConversationId && !touchedCache) {
            conversationMessageCacheRef.current.delete(String(editedConversationId));
          }

          setMessages((prev) =>
            prev.map((m) => {
              if (String(getMessageId(m)) === String(editedMessageId)) {
                return normalizeMessageLifecycle({
                  ...m,
                  ...editedMsg,
                  isEdited: true,
                  text: newText ?? m.text,
                  content: newText ?? m.content,
                  textPreview: newText ?? m.textPreview,
                });
              }
              return m;
            }),
          );
          window.dispatchEvent(
            new CustomEvent("chatList:messageEdited", {
              detail: {
                message: editedMsg,
                conversationId: editedConversationId,
              },
            }),
          );
        });

        socketService.onMessageRevoked((payload) => {
          console.log("Socket message revoked payload:", payload);
          const revokedId =
            payload?.messageId ||
            payload?.message?._id ||
            payload?.message?.id ||
            payload?.id ||
            payload?._id;
          if (!revokedId) return;

          const touchedCache = markCachedMessageRevoked(String(revokedId), payload);
          const revokedConversationId = getMessageConversationId(payload?.message, payload);
          if (revokedConversationId && !touchedCache) {
            conversationMessageCacheRef.current.delete(String(revokedConversationId));
          }

          setMessages((prev) =>
            prev.map((m) =>
              String(m._id || m.id) === String(revokedId)
                ? normalizeMessageLifecycle({
                    ...m,
                    ...payload?.message,
                    isRevoked: true,
                    deletedAt:
                      payload.deletedAt ||
                      payload.revokedAt ||
                      payload.recalledAt ||
                      payload?.message?.deletedAt ||
                      payload?.message?.revokedAt ||
                      payload?.message?.recalledAt ||
                      new Date().toISOString(),
                  })
                : m,
            ),
          );
          window.dispatchEvent(new Event("chatList:refresh"));
        });

        socketService.onMessageStatusUpdate((payload) => {
          // payload might contain { messageId, status } or { id, conversationId }
          // Mark all messages up to lastSeenMessageId as seen
          const lastSeenMessageId = payload?.lastSeenMessageId;
          const seenUserId = payload?.userId;

          if (!lastSeenMessageId) return;

          if (seenUserId) {
            setMemberSeenMap((prev) => ({
              ...prev,
              [seenUserId]: lastSeenMessageId,
            }));
          }

          if (seenUserId && String(seenUserId) === String(user?.id)) {
            return;
          }

          setMessages((prev) => {
            let foundIndex = -1;

            // Find the index of the lastSeenMessageId
            for (let i = 0; i < prev.length; i++) {
              const msgId = getMessageId(prev[i]);
              if (String(msgId) === String(lastSeenMessageId)) {
                foundIndex = i;
                break;
              }
            }

            // If found, mark all messages up to and including this index as seen
            if (foundIndex !== -1) {
              return prev.map((m, idx) => {
                const isOwnMessage =
                  String(m?.senderId || m?.sender?.id || "") === String(user?.id);
                if (isOwnMessage && idx <= foundIndex) {
                  return {
                    ...m,
                    status: "seen",
                    isSeen: true,
                    readAt: new Date().toISOString(),
                  };
                }
                return m;
              });
            }

            return prev;
          });
        });

        socketService.onTypingStart((payload) => {
          const currentChat = selectedChatRef.current;
          if (payload?.groupId) {
            if (payload.groupId !== selectedConversationId) return;
          } else {
            const isGroup =
              currentChat?.type === "group" || currentChat?.type === "GROUP";
            if (isGroup) return;
          }

          const uId =
            payload?.userId || payload?.senderId || payload?.id_sender;
          if (uId) {
            setTypingUsers((prev) => {
              const newSet = new Set(prev);
              newSet.add(uId);
              return newSet;
            });
          }
        });

        socketService.onTypingStop((payload) => {
          const uId =
            payload?.userId || payload?.senderId || payload?.id_sender;
          if (uId) {
            setTypingUsers((prev) => {
              const newSet = new Set(prev);
              newSet.delete(uId);
              return newSet;
            });
          }
        });

        socketService.onMessageReaction((payload: any) => {
          if (!payload) return;
          const messageId = payload.messageId || payload.reaction?.messageId;
          const reaction = payload.reaction;
          if (!messageId || !reaction) return;

          setMessages((prev) =>
            prev.map((m) => {
              if (String(m._id || m.id) === String(messageId)) {
                const currentReactions = m.reactions ? [...m.reactions] : [];
                // Find if an object for this emoji already exists
                const existingIndex = currentReactions.findIndex(
                  (r) => r.emoji === reaction.emoji,
                );
                const userObj = {
                  _id: reaction.userId,
                  id: reaction.userId,
                  avatarUrl: reaction.user?.avatarUrl || undefined,
                  displayName: reaction.user?.displayName || "Unknown User",
                };

                if (existingIndex !== -1) {
                  const existingReaction = currentReactions[existingIndex];
                  const hasUser = existingReaction.users?.some(
                    (u: any) =>
                      String(u._id || u.id) === String(reaction.userId),
                  );
                  if (!hasUser) {
                    currentReactions[existingIndex] = {
                      ...existingReaction,
                      users: existingReaction.users
                        ? [...existingReaction.users, userObj]
                        : [userObj],
                      count:
                        (existingReaction.count ||
                          existingReaction.users?.length ||
                          0) + 1,
                    };
                  }
                } else {
                  currentReactions.push({
                    emoji: reaction.emoji,
                    users: [userObj],
                    count: 1,
                  });
                }
                return { ...m, reactions: currentReactions };
              }
              return m;
            }),
          );
        });

        socketService.onMessageReactionRemove((payload: any) => {
          if (!payload) return;
          const { messageId, userId, emoji } = payload;
          if (!messageId || !userId) return;

          setMessages((prev) =>
            prev.map((m) => {
              if (String(m._id || m.id) === String(messageId)) {
                if (!m.reactions || m.reactions.length === 0) return m;
                let newReactions = [...m.reactions];

                if (emoji) {
                  const index = newReactions.findIndex(
                    (r) => r.emoji === emoji,
                  );
                  if (index !== -1) {
                    newReactions[index] = {
                      ...newReactions[index],
                      users:
                        newReactions[index].users?.filter(
                          (u: any) => String(u._id || u.id) !== String(userId),
                        ) || [],
                    };
                    newReactions[index].count =
                      newReactions[index].users.length;
                    if (newReactions[index].count <= 0) {
                      newReactions.splice(index, 1);
                    }
                  }
                } else {
                  newReactions = newReactions
                    .map((r) => ({
                      ...r,
                      users:
                        r.users?.filter(
                          (u: any) => String(u._id || u.id) !== String(userId),
                        ) || [],
                    }))
                    .map((r) => ({ ...r, count: r.users.length }))
                    .filter((r) => r.count > 0);
                }

                return { ...m, reactions: newReactions };
              }
              return m;
            }),
          );
        });

        socketService.onPollVote((payload: any) => {
          updatePollInMessages(payload?.poll || payload?.data || payload);
        });

        socketService.onPollClosed((payload: any) => {
          updatePollInMessages(payload?.poll || payload?.data || payload);
        });

        socketService.onPollOptionAdded((payload: any) => {
          updatePollInMessages(payload?.poll || payload?.data || payload);
        });

        socketService.onPollPinned((payload: any) => {
          updatePollInMessages(payload?.poll || payload?.data || payload);
          upsertMessageFromPayload(payload);
        });

        socketService.onPollUnpinned((payload: any) => {
          updatePollInMessages(payload?.poll || payload?.data || payload);
          upsertMessageFromPayload(payload);
        });

        socketService.onPollDeleted((payload: any) => {
          removePollFromMessages(payload?.pollId || payload?.data?.pollId || payload?.poll?.id);
        });

        socketService.onPollNew((payload: any) => {
          const message = payload?.message || payload?.poll?.timelineMessage;
          if (message) appendLocalMessage(message);
          if (payload?.poll) updatePollInMessages(payload.poll);
        });

        const handleUtilityChanged = (payload: any) => {
          upsertMessageFromPayload(payload);
          const conversationId = getPayloadConversationId(payload);
          if (String(conversationId) === String(selectedConversationId)) {
            window.dispatchEvent(new Event("chatList:refresh"));
          }
        };

        socketService.onGroupNoteCreated(handleUtilityChanged);
        socketService.onGroupNoteUpdated(handleUtilityChanged);
        socketService.onGroupNoteDeleted(handleUtilityChanged);
        socketService.onGroupReminderCreated(handleUtilityChanged);
        socketService.onGroupReminderUpdated(handleUtilityChanged);
        socketService.onGroupReminderDeleted(handleUtilityChanged);
        socketService.onGroupReminderPinned(handleUtilityChanged);
        socketService.onGroupReminderUnpinned(handleUtilityChanged);
        socketService.onGroupReminderDue(handleUtilityChanged);

        // Handle message pin
        socketService.onMessagePinned((payload: any) => {
          const { conversationId, message } = payload;
          if (!message) return;
          const msgId = message.id || message._id;
          let msgConvId = conversationId || message.conversationId;
          if (msgConvId && typeof msgConvId === "object") {
            msgConvId = msgConvId._id || msgConvId.id;
          }

          if (String(msgConvId) === String(selectedConversationId)) {
            setPinnedMessages((prev) => upsertPinnedMessage(prev, message));
          }

          setMessages((prev) => {
            // Only update if it belongs to currently open conversation
            if (String(msgConvId) !== String(selectedConversationId))
              return prev;

            return prev.map((m) =>
              String(m._id || m.id) === String(msgId)
                ? {
                    ...m,
                    ...message,
                    pinnedAt: message.pinnedAt || new Date().toISOString(),
                  }
                : m,
            );
          });
        });

        // Handle message unpin
        socketService.onMessageUnpinned((payload: any) => {
          const { conversationId, message } = payload;
          if (!message) return;
          const msgId = message.id || message._id;
          let msgConvId = conversationId || message.conversationId;
          if (msgConvId && typeof msgConvId === "object") {
            msgConvId = msgConvId._id || msgConvId.id;
          }

          if (String(msgConvId) === String(selectedConversationId)) {
            setPinnedMessages((prev) => removePinnedMessage(prev, msgId));
          }

          setMessages((prev) => {
            // Only update if it belongs to currently open conversation
            if (String(msgConvId) !== String(selectedConversationId))
              return prev;

            return prev.map((m) =>
              String(m._id || m.id) === String(msgId)
                ? { ...m, ...message, pinnedAt: undefined, pinnedBy: undefined }
                : m,
            );
          });
        });

        socketService.on("conversation:updated", (payload: any) => {
          const { conversationId, updates } = payload;
          if (!conversationId || !updates) return;

          if (String(conversationId) === String(selectedConversationId)) {
            setSelectedChat((prev: any) => {
              if (!prev) return prev;
              return { ...prev, ...updates };
            });
          }
        });

        socketService.on("conversation:members_added", (payload: any) => {
          const { conversationId, message } = payload;
          if (String(conversationId) === String(selectedConversationId)) {
            if (message) {
              appendLocalMessage(message);
            } else {
              conversationService
                .getConversationMessages(conversationId, {
                  limit: MESSAGE_PAGE_SIZE,
                })
                .then((messageResult) => {
                  setMessages(sortMessagesByCreatedAt(normalizeMessagesLifecycle(messageResult.messages || [])));
                  setMessagePageInfo({
                    nextCursor: messageResult.nextCursor,
                    hasMore: messageResult.hasMore,
                  });
                })
                .catch(console.error);
            }
          }
        });

        socketService.onGroupMemberLeft((payload: any) => {
          const { conversationId, message, userId, removedUserId } = payload;
          const leftUserId = userId || removedUserId;
          if (shouldSkipDuplicateMemberRemoval(conversationId, leftUserId)) {
            return;
          }

          if (String(leftUserId) === String(user?.id) || String(leftUserId) === String(user?._id)) {
            conversationMessageCacheRef.current.delete(String(conversationId));
            if (String(conversationId) === String(selectedConversationId)) {
              setSelectedChat(null);
              setSelectedConversationId(null);
              setMessages([]);
              setPinnedMessages([]);
              setChatError("Bạn đã rời khỏi nhóm này.");
            }
            window.dispatchEvent(new Event("chatList:refresh"));
            return;
          }

          if (String(conversationId) === String(selectedConversationId)) {
            if (message) {
              appendLocalMessage(message);
            } else {
              conversationService
                .getConversationMessages(conversationId, {
                  limit: MESSAGE_PAGE_SIZE,
                })
                .then((messageResult) => {
                  setMessages(sortMessagesByCreatedAt(normalizeMessagesLifecycle(messageResult.messages || [])));
                  setMessagePageInfo({
                    nextCursor: messageResult.nextCursor,
                    hasMore: messageResult.hasMore,
                  });
                })
                .catch(console.error);
            }
          }
        });

        socketService.on("conversation:member_removed", (payload: any) => {
          const { conversationId, message, userId, removedUserId, reason } = payload;
          const leftUserId = userId || removedUserId;
          if (shouldSkipDuplicateMemberRemoval(conversationId, leftUserId)) {
            return;
          }

          if (String(leftUserId) === String(user?.id) || String(leftUserId) === String(user?._id)) {
            conversationMessageCacheRef.current.delete(String(conversationId));
            if (String(conversationId) === String(selectedConversationId)) {
              setSelectedChat(null);
              setSelectedConversationId(null);
              setMessages([]);
              setPinnedMessages([]);
              setChatError(
                reason === "left"
                  ? "Bạn đã rời khỏi nhóm này."
                  : "Bạn đã bị xoá khỏi nhóm này.",
              );
            }
            window.dispatchEvent(new Event("chatList:refresh"));
            return;
          }

          if (String(conversationId) === String(selectedConversationId)) {
            if (message) {
              appendLocalMessage(message);
            } else {
              conversationService
                .getConversationMessages(conversationId, {
                  limit: MESSAGE_PAGE_SIZE,
                })
                .then((messageResult) => {
                  setMessages(sortMessagesByCreatedAt(normalizeMessagesLifecycle(messageResult.messages || [])));
                  setMessagePageInfo({
                    nextCursor: messageResult.nextCursor,
                    hasMore: messageResult.hasMore,
                  });
                })
                .catch(console.error);
            }
          }
        });

        // Handle group dissolution - this group has been deleted by an admin
        socketService.onGroupDissolved((payload: any) => {
          const { conversationId } = payload;
          if (!conversationId) return;

          // If the dissolved group is currently open, navigate away
          if (String(conversationId) === String(selectedConversationId)) {
            setSelectedChat(null);
            setSelectedConversationId(null);
            setMessages([]);
            setChatError("This group has been deleted by an admin");
          }

          // Notify ChatList to refresh and remove the dissolved group
          window.dispatchEvent(new Event("chatList:refresh"));
        });

        // Handle group renamed
        const handleGroupRenamed = (payload: any) => {
          const { conversationId, newName } = payload;
          if (!conversationId || !newName) return;

          if (String(conversationId) === String(selectedConversationId)) {
            setSelectedChat((prev: any) => {
              if (!prev) return prev;
              return { ...prev, name: newName };
            });
          }
        };

        // Handle group avatar changed
        const handleGroupAvatarChanged = (payload: any) => {
          const { conversationId, avatarUrl } = payload;
          if (!conversationId || !avatarUrl) return;

          if (String(conversationId) === String(selectedConversationId)) {
            setSelectedChat((prev: any) => {
              if (!prev) return prev;
              return { ...prev, avatarUrl };
            });
          }
        };

        socketService.onGroupRenamed(handleGroupRenamed);
        socketService.onGroupAvatarChanged(handleGroupAvatarChanged);
      }
    });

    return () => {
      active = false;
      socketService.offNewMessage();
      socketService.offMessageRevoked();
      socketService.offMessageEdited();
      socketService.offMessageReaction();
      socketService.offMessageReactionRemove();
      socketService.offMessagePinned();
      socketService.offMessageUnpinned();
      socketService.offMessageQuoted();
      socketService.off("poll:new");
      socketService.off("poll:vote");
      socketService.off("poll:closed");
      socketService.off("poll:option_added");
      socketService.off("poll:pinned");
      socketService.off("poll:unpinned");
      socketService.off("poll:deleted");
      socketService.off("group:note:created");
      socketService.off("group:note:updated");
      socketService.off("group:note:deleted");
      socketService.off("group:reminder:created");
      socketService.off("group:reminder:updated");
      socketService.off("group:reminder:deleted");
      socketService.off("group:reminder:pinned");
      socketService.off("group:reminder:unpinned");
      socketService.off("group:reminder:due");
      socketService.off("conversation:updated");
      socketService.off("conversation:members_added");
      socketService.off("conversation:member_removed");
      socketService.offGroupMemberLeft();
      socketService.offGroupDissolved();
      socketService.offGroupRenamed();
      socketService.offGroupAvatarChanged();
      // Do not disconnect the socket here to preserve global connectivity
    };
  }, [
    selectedConversationId,
    appendLocalMessage,
    removePollFromMessages,
    updatePollInMessages,
    getPayloadConversationId,
    upsertMessageFromPayload,
    markCachedMessageRevoked,
    markCachedMessageEdited,
    shouldSkipDuplicateMemberRemoval,
  ]);

  useEffect(() => {
    setTypingUsers(new Set());
    if (!selectedConversationId) {
      setMessagePageInfo({ nextCursor: null, hasMore: false });
      setIsLoadingOlderMessages(false);
      setPinnedMessages([]);
    }

    const isGroupChat =
      selectedChat?.type === "group" || selectedChat?.type === "GROUP";
    if (selectedConversationId && isGroupChat) {
      socketService.joinRoom(selectedConversationId).catch((error) => {
        console.warn("Failed to join group socket room", error);
      });
    }
    return () => {
      if (selectedConversationId && isGroupChat) {
        socketService.leaveRoom(selectedConversationId).catch((error) => {
          console.warn("Failed to leave group socket room", error);
        });
      }
    };
  }, [selectedConversationId, selectedChat?.type]);

  useEffect(() => {
    const handleCurrentUserLeftGroup = (event: any) => {
      const conversationId = event?.detail?.conversationId;
      if (!conversationId) return;

      if (String(conversationId) === String(selectedConversationId)) {
        conversationMessageCacheRef.current.delete(String(conversationId));
        setSelectedChat(null);
        setSelectedConversationId(null);
        setMessages([]);
        setPinnedMessages([]);
        setChatError("Bạn đã rời khỏi nhóm này.");
      }
    };

    window.addEventListener("group:currentUserLeft", handleCurrentUserLeftGroup);
    return () => {
      window.removeEventListener(
        "group:currentUserLeft",
        handleCurrentUserLeftGroup,
      );
    };
  }, [selectedConversationId]);

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const buildMockMessages = (chat) => {
    const base = new Date("2026-02-08T07:30:00").getTime();
    return [
      {
        id: `${chat.id}-1`,
        type: "text",
        text: "Đã đủ",
        createdAt: new Date(base + 1000 * 60 * 14).toISOString(),
        isMine: false,
      },
      {
        id: `${chat.id}-2`,
        type: "image",
        text: "TẠI HẠ BÁI PHỤC",
        imageUrl: "https://picsum.photos/420/280?random=12",
        imageAlt: "Mock meme",
        createdAt: new Date(base + 1000 * 60 * 15).toISOString(),
        isMine: false,
      },
      {
        id: `${chat.id}-3`,
        type: "text",
        text: "Tin nhắn mock để preview khung chat giống ảnh tham chiếu.",
        createdAt: new Date(base + 1000 * 60 * 35).toISOString(),
        isMine: true,
      },
    ];
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  const resolveConversationId = (conversationPayload) => {
    return (
      conversationPayload?.conversationId ||
      conversationPayload?.id ||
      conversationPayload?._id ||
      conversationPayload?.conversation?.id ||
      conversationPayload?.conversation?._id ||
      null
    );
  };

  const getMessageKey = (message) =>
    message?.id || message?._id || message?.messageId || null;

  const normalizeSearchMessage = (message, conversationId) => {
    const id = getMessageKey(message);
    if (!id) return null;
    return {
      ...message,
      id,
      conversationId: message.conversationId || conversationId,
      type: message.type || "text",
    };
  };

  const mergeSearchTargetMessages = (messages, chat, conversationId) => {
    const searchMessages = [
      ...(Array.isArray(chat?.searchContextMessages)
        ? chat.searchContextMessages
        : []),
      chat?.searchTargetMessage,
    ]
      .map((message) => normalizeSearchMessage(message, conversationId))
      .filter(Boolean);

    if (searchMessages.length === 0) return messages;

    const messageById = new Map();
    [...messages, ...searchMessages].forEach((message) => {
      const id = getMessageKey(message);
      if (!id || messageById.has(String(id))) return;
      messageById.set(String(id), message);
    });

    return Array.from(messageById.values()).sort((a, b) => {
      const dateA = new Date(a.createdAt || a.updatedAt || 0).getTime();
      const dateB = new Date(b.createdAt || b.updatedAt || 0).getTime();
      return dateA - dateB;
    });
  };

  const openChatByRow = useCallback(
    async (chat, options: { syncUrl?: boolean; replaceUrl?: boolean } = {}) => {
      if (!chat?.id) {
        setChatError("Couldn’t open this conversation");
        return;
      }

      if (isOpeningConversation && openingChatId === chat.id) {
        return;
      }

      let processedChat = { ...chat };
      if (
        !processedChat.targetUserId &&
        processedChat.type !== "group" &&
        processedChat.type !== "GROUP" &&
        processedChat.pairKey
      ) {
        processedChat.targetUserId = processedChat.pairKey
          .split("_")
          .find((id) => id !== user?.id);
      }

      setSelectedChat(processedChat);
      setChatError("");

      try {
        // Nếu chat.id có dạng temp- (click từ global search), cần tìm conversation thật trước
        let conversationId = chat.id;

        if (String(conversationId).startsWith("temp-") && chat.targetUserId) {
          const conversation =
            await conversationService.createPrivateConversation(
              chat.targetUserId,
            );
          conversationId = resolveConversationId(conversation);
          setSelectedChat((prev: any) => ({
            ...prev,
            ...conversation,
            id: conversationId,
            conversationId: conversationId,
            name: chat.name || prev?.name || conversation?.name,
            avatarUrl:
              chat.avatarUrl || prev?.avatarUrl || conversation?.avatarUrl,
            displayName:
              chat.name ||
              prev?.displayName ||
              (conversation as any)?.displayName,
          }));
        }

        if (!conversationId) {
          setChatError("Conversation not found.");
          setIsOpeningConversation(false);
          setOpeningChatId(null);
          return;
        }

        setSelectedConversationId(conversationId);

        if (options.syncUrl !== false) {
          const chatName =
            processedChat.name ||
            processedChat.displayName ||
            processedChat.title ||
            "chat";
          navigate(getConversationUrl(conversationId, chatName), {
            replace: Boolean(options.replaceUrl),
          });
        }

        const cachedConversation =
          conversationMessageCacheRef.current.get(String(conversationId));

        if (cachedConversation) {
          const cachedMessages = mergeSearchTargetMessages(
            normalizeMessagesLifecycle(cachedConversation.messages || []),
            processedChat,
            conversationId,
          );
          const cachedLastMessage = cachedMessages[cachedMessages.length - 1];
          const cachedLastMessageId = getMessageId(cachedLastMessage);
          const incomingLastMessage = processedChat.lastMessage;
          const incomingLastMessageId = getMessageId(incomingLastMessage);
          const cachedLastMessageTime = getMessageTimeValue(cachedLastMessage);
          const incomingLastMessageTime = getChatActivityTimeValue(processedChat);
          const cachedLastMessagePreview = getMessagePreviewValue(cachedLastMessage);
          const incomingLastMessagePreview = getMessagePreviewValue(incomingLastMessage);
          const cacheIsStale =
            (Boolean(incomingLastMessageId) &&
              (!cachedLastMessageId ||
                String(incomingLastMessageId) !== String(cachedLastMessageId))) ||
            (Boolean(incomingLastMessageId) &&
              String(incomingLastMessageId) === String(cachedLastMessageId) &&
              isMessageRevoked(incomingLastMessage) &&
              !isMessageRevoked(cachedLastMessage)) ||
            (Boolean(incomingLastMessageId) &&
              String(incomingLastMessageId) === String(cachedLastMessageId) &&
              Boolean(incomingLastMessagePreview) &&
              incomingLastMessagePreview !== cachedLastMessagePreview) ||
            (Boolean(incomingLastMessageTime && cachedLastMessageTime) &&
              incomingLastMessageTime > cachedLastMessageTime + 1000) ||
            Boolean(incomingLastMessageTime && !cachedLastMessageTime);

          if (cacheIsStale) {
            conversationMessageCacheRef.current.delete(String(conversationId));
          } else {
            setMemberSeenMap(cachedConversation.memberSeenMap || {});
            setMessages(
              applyMemberSeenMapToMessages(
                cachedMessages,
                cachedConversation.memberSeenMap || {},
                user?.id,
              ),
            );
            setMessagePageInfo(
              cachedConversation.messagePageInfo || {
                nextCursor: null,
                hasMore: false,
              },
            );
            setPinnedMessages(cachedConversation.pinnedMessages || []);
            markConversationRead(conversationId, cachedMessages);
            setIsOpeningConversation(false);
            setOpeningChatId(null);
            return;
          }
        }

        setMessages([]);
        setPinnedMessages([]);
        setMemberSeenMap({});
        setMessagePageInfo({ nextCursor: null, hasMore: false });
        setIsOpeningConversation(true);
        setOpeningChatId(conversationId);

        // Nếu là group chat, fetch thông tin nhóm mới nhất và update selectedChat
        const isGroupChat =
          processedChat.type === "group" || processedChat.type === "GROUP";
        if (isGroupChat) {
          try {
            const infoResult: any =
              await conversationService.getGroupInfo(conversationId);
            const infoData = infoResult?.data || infoResult;
            const groupData = infoData?.conversation || infoData;
            if (groupData) {
              setSelectedChat((prev: any) => ({
                ...prev,
                name: groupData.name ?? prev.name,
                avatarUrl: groupData.avatarUrl ?? prev.avatarUrl,
                membersCount: groupData.membersCount ?? prev.membersCount,
                wallpaperUrl: groupData.wallpaperUrl ?? prev.wallpaperUrl,
              }));
            }
          } catch (e) {
            console.warn("Failed to fetch group info on open", e);
          }
        }

        const messageResult =
          await conversationService.getConversationMessages(conversationId, {
            limit: MESSAGE_PAGE_SIZE,
          });

        // Sort messages by createdAt in ascending order (oldest first)
        const sortedMessages = sortMessagesByCreatedAt(
          normalizeMessagesLifecycle(messageResult.messages || []),
        );

        setMemberSeenMap(messageResult.memberSeenMap || {});
        setMessages(
          applyMemberSeenMapToMessages(
            mergeSearchTargetMessages(sortedMessages, processedChat, conversationId),
            messageResult.memberSeenMap || {},
            user?.id,
          ),
        );
        setMessagePageInfo({
          nextCursor: messageResult.nextCursor,
          hasMore: messageResult.hasMore,
        });
        void refreshPinnedMessages(conversationId);
        markConversationRead(conversationId, sortedMessages);
      } catch (error) {
        setMessages([]);
        setPinnedMessages([]);
        if (
          error?.status === 404 ||
          error?.response?.status === 404 ||
          error?.code === "NOT_FOUND" ||
          error?.payload?.statusCode === 404 ||
          error?.code === "VALIDATION_ERROR" ||
          error?.payload?.statusCode === 400
        ) {
          setChatError("");
        } else {
          setChatError(error?.message || "Couldn’t open this conversation");
        }
      } finally {
        setIsOpeningConversation(false);
        setOpeningChatId(null);
      }
    },
    [
      isOpeningConversation,
      markConversationRead,
      navigate,
      openingChatId,
      refreshPinnedMessages,
      user?.id,
    ],
  );

  useEffect(() => {
    if (!routeConversationId) {
      if (selectedConversationId) {
        setSelectedConversationId(null);
        setSelectedChat(null);
      }
      return;
    }
    if (!user?.id) return;
    if (String(selectedConversationId) === String(routeConversationId)) return;
    if (isOpeningConversation && String(openingChatId) === String(routeConversationId)) return;

    let cancelled = false;

    const openConversationFromUrl = async () => {
      try {
        setActiveView("chats");
        setChatError("");
        let conversation = await conversationService.getConversationById(routeConversationId);
        if (cancelled) return;

        let detail: any = conversation;
        if (!detail?.id && !detail?.conversationId) {
          setChatError("Conversation not found.");
          return;
        }

        const conversationId = detail.id || detail.conversationId;
        if (!hasDisplayInfo(detail)) {
          const conversations = await conversationService.getConversations();
          if (cancelled) return;

          const listItem = (Array.isArray(conversations) ? conversations : []).find(
            (item: any) => String(item?.id || item?.conversationId) === String(conversationId),
          );

          if (listItem) {
            detail = {
              ...detail,
              ...listItem,
              members: detail.members || listItem.members,
              participants: detail.participants || listItem.participants,
              settings: {
                ...(listItem.settings || {}),
                ...(detail.settings || {}),
                utilityPermissions: {
                  ...(listItem.settings?.utilityPermissions || {}),
                  ...(detail.settings?.utilityPermissions || {}),
                },
              },
            };
          }
        }

        await openChatByRow(
          {
            ...detail,
            id: conversationId,
            conversationId,
          },
          { syncUrl: false },
        );
      } catch (error: any) {
        if (cancelled) return;
        setChatError(error?.message || "Could not open this conversation.");
      }
    };

    void openConversationFromUrl();

    return () => {
      cancelled = true;
    };
  }, [
    isOpeningConversation,
    openChatByRow,
    openingChatId,
    routeConversationId,
    selectedConversationId,
    user?.id,
  ]);
  
  const findSavedMessagesConversation = useCallback(async () => {
    const conversations = await conversationService.getConversations();
    return (Array.isArray(conversations) ? conversations : []).find(
      (conversation: any) =>
        conversation?.type === "saved_messages" ||
        conversation?.isSavedMessages ||
        conversation?.isSelfChat ||
        conversation?.pairKey === `self_${user?.id}`,
    );
  }, [user?.id]);

  const openSavedMessages = useCallback(async () => {
    setActiveView("chats");
    setChatError("");

    try {
      const savedMessages = await findSavedMessagesConversation();

      if (!savedMessages) {
        setChatError("Saved Messages not found.");
        return;
      }

      await openChatByRow({
        ...savedMessages,
        name: savedMessages.name || "Saved Messages",
        type: "saved_messages",
        isSavedMessages: true,
        isSelfChat: true,
      });
    } catch (error) {
      console.error("Failed to open Saved Messages:", error);
      setChatError("Could not open Saved Messages.");
    }
  }, [findSavedMessagesConversation, openChatByRow]);

  const retryOpenCurrentChat = useCallback(() => {
    if (!selectedChat) return;
    openChatByRow(selectedChat);
  }, [openChatByRow, selectedChat]);

  const handleDeleteConversation = useCallback(async () => {
    if (!selectedConversationId) return;

    setIsDeletingConversation(true);
    try {
      const deletedConversationId = selectedConversationId;
      await conversationService.deleteConversationForMe(deletedConversationId);
      conversationMessageCacheRef.current.delete(String(deletedConversationId));
      setIsDeleteConversationModalOpen(false);
      setSelectedChat(null);
      setSelectedConversationId(null);
      setMessages([]);
      setChatError("");
      setIsRightSidebarOpen(false);
      navigate("/", { replace: true });
      window.dispatchEvent(
        new CustomEvent("conversation:deletedForMe", {
          detail: { conversationId: deletedConversationId },
        }),
      );
      window.dispatchEvent(new Event("chatList:refresh"));
    } catch (error: any) {
      alert(error?.message || "Could not delete this conversation.");
    } finally {
      setIsDeletingConversation(false);
    }
  }, [navigate, selectedConversationId]);

  const handleLoadOlderMessages = useCallback(async () => {
    if (
      !selectedConversationId ||
      isLoadingOlderMessages ||
      !messagePageInfo.hasMore ||
      !messagePageInfo.nextCursor
    ) {
      return;
    }

    setIsLoadingOlderMessages(true);
    const chatContainer = document.querySelector("[data-chat-container]");
    const previousScrollHeight = chatContainer?.scrollHeight || 0;
    const previousScrollTop = chatContainer?.scrollTop || 0;

    try {
      const messageResult = await conversationService.getConversationMessages(
        selectedConversationId,
        {
          cursor: messagePageInfo.nextCursor,
          limit: MESSAGE_PAGE_SIZE,
        },
      );

      setMessages((prev) =>
        applyMemberSeenMapToMessages(
          mergeUniqueMessages(normalizeMessagesLifecycle(messageResult.messages || []), prev),
          {
            ...memberSeenMap,
            ...(messageResult.memberSeenMap || {}),
          },
          user?.id,
        ),
      );
      setMemberSeenMap((prev) => ({
        ...prev,
        ...(messageResult.memberSeenMap || {}),
      }));
      requestAnimationFrame(() => {
        const updatedContainer = document.querySelector(
          "[data-chat-container]",
        );
        if (!updatedContainer) return;
        const heightDelta =
          updatedContainer.scrollHeight - previousScrollHeight;
        updatedContainer.scrollTop = previousScrollTop + heightDelta;
      });
      setMessagePageInfo({
        nextCursor: messageResult.nextCursor,
        hasMore: messageResult.hasMore,
      });
    } catch (error) {
      console.error("Failed to load older messages:", error);
    } finally {
      setIsLoadingOlderMessages(false);
    }
  }, [
    isLoadingOlderMessages,
    memberSeenMap,
    messagePageInfo.hasMore,
    messagePageInfo.nextCursor,
    selectedConversationId,
    user?.id,
  ]);

  const handleForwardToTarget = useCallback(
    (targetChat, msg) => {
      if (targetChat?.isSavedMessages || targetChat?.type === "saved_messages") {
        void openSavedMessages();
        setForwardingMessage(msg);
        return;
      }

      // Navigate to user's chat
      openChatByRow(targetChat);
      // Set the forwarding message
      setForwardingMessage(msg);
    },
    [openChatByRow, openSavedMessages],
  );

  const clearForwardingMessage = useCallback(() => {
    setForwardingMessage(null);
  }, []);

  const handleForwardMessagesDirect = useCallback(async (targetChats: any[], msg: any) => {
    const messageId = msg?.id || msg?._id || msg?.messageId;
    if (!messageId || targetChats.length === 0) return;

    const targetConversationIds = await Promise.all(
      targetChats.map(async (targetChat) => {
        if (targetChat?.isSavedMessages || targetChat?.type === "saved_messages") {
          const savedMessages = await findSavedMessagesConversation();
          const savedConversationId = resolveConversationId(savedMessages);
          if (!savedConversationId) {
            throw new Error("Saved Messages not found");
          }
          return savedConversationId;
        }

        if (targetChat.conversationId || targetChat.id?.startsWith?.("conv_")) {
          return targetChat.conversationId || targetChat.id;
        }

        const targetUserId =
          targetChat.targetUserId ||
          targetChat.friendUserId ||
          targetChat.userId ||
          targetChat.id ||
          targetChat._id;

        if (!targetUserId) return null;
        const conversation: any = await conversationService.createPrivateConversation(targetUserId);
        return conversation?.conversationId || conversation?.id || conversation?._id;
      }),
    );

    const validConversationIds = targetConversationIds.filter(Boolean);
    if (validConversationIds.length === 0) {
      throw new Error("No valid target conversation");
    }

    const forwardedMessages = await conversationService.forwardMessages({
      messageIds: [messageId],
      targetConversationIds: validConversationIds,
    });

    if (validConversationIds.some((id) => String(id) === String(selectedConversationId))) {
      const items = Array.isArray(forwardedMessages) ? forwardedMessages : [];
      setMessages((prev) => mergeUniqueMessages(prev, items));
    }

    toast.success("Đã chuyển tiếp tin nhắn");
    window.dispatchEvent(new Event("chatList:refresh"));
  }, [findSavedMessagesConversation, selectedConversationId]);

  const handleSendMessage = async (payloadOrText, mediaFiles = []) => {
    let conversationId = selectedConversationId || selectedChat?.id;

    if (!conversationId) return;

    let payloadText = "";
    let payloadMedia = [];

    if (typeof payloadOrText === "object" && payloadOrText !== null) {
      if (payloadOrText.type === "edit") {
        try {
          // Optimistically update UI
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === payloadOrText.id || msg._id === payloadOrText.id
                ? {
                    ...msg,
                    text: payloadOrText.text,
                    content: payloadOrText.text,
                    textPreview: payloadOrText.text,
                    isEdited: true,
                  }
                : msg,
            ),
          );
          markCachedMessageEdited(String(payloadOrText.id), {
            id: payloadOrText.id,
            text: payloadOrText.text,
            content: payloadOrText.text,
            textPreview: payloadOrText.text,
            updatedAt: new Date().toISOString(),
          });

          await socketService.editMessage(payloadOrText.id, payloadOrText.text);
          window.dispatchEvent(
            new CustomEvent("chatList:messageEdited", {
              detail: {
                conversationId,
                message: {
                  id: payloadOrText.id,
                  messageId: payloadOrText.id,
                  text: payloadOrText.text,
                  content: payloadOrText.text,
                  textPreview: payloadOrText.text,
                  updatedAt: new Date().toISOString(),
                },
              },
            }),
          );
        } catch (error: any) {
          console.error("Failed to edit message", error);
          let errorMessage = error?.message || "Chỉnh sửa tin nhắn thất bại";
          if (errorMessage.includes("limit exceeded") || errorMessage.includes("15 minutes")) {
            errorMessage = "Không thể chỉnh sửa tin nhắn đã gửi quá 15 phút.";
          }
          toast.error(errorMessage);
          // Revert UI state
          setMessages((prev) => {
            const originalMsg = messages.find((m) => String(m.id || m._id) === String(payloadOrText.id));
            if (!originalMsg) return prev;
            return prev.map((msg) =>
              String(msg.id || msg._id) === String(payloadOrText.id)
                ? { ...originalMsg }
                : msg,
            );
          });
        }
        return;
      }

      if (payloadOrText instanceof File || Array.isArray(payloadOrText)) {
        payloadText = "";
        payloadMedia = Array.isArray(payloadOrText)
          ? payloadOrText
          : [payloadOrText];
      } else {
        payloadText = payloadOrText.text || "";
        payloadMedia = payloadOrText.media || [];
      }
    } else {
      payloadText = payloadOrText || "";
      payloadMedia = mediaFiles || [];
    }

    if (
      !payloadText.trim() &&
      payloadMedia.length === 0 &&
      !payloadOrText?.forwardingMessage &&
      !payloadOrText?.replyingMessage
    )
      return;

    const fwMsg = payloadOrText?.forwardingMessage;
    const replyMsg = payloadOrText?.replyingMessage;

    const performSend = async (txt, medias, isForward = false) => {
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

      const previewMedias = medias.map((f) => {
        if (f instanceof File) {
          const objUrl = URL.createObjectURL(f);
          return {
            name: f.name,
            filename: f.name,
            size: f.size,
            type: f.type,
            mimetype: f.type,
            url: objUrl,
            preview: objUrl,
          };
        }
        return f;
      });

      setMessages((prev) => {
        const optimisticMessage: any = {
          id: tempId,
          text: txt,
          media: previewMedias,
          createdAt: new Date().toISOString(),
          isMine: true,
          senderId: user?.id || "me",
          status: "sending",
        };
        if (replyMsg) {
          optimisticMessage.quotedMessageId = replyMsg.id || replyMsg._id;
          optimisticMessage.quotedMessage = replyMsg;
        }
        return [...prev, optimisticMessage];
      });

      try {
        let finalMedia = [];
        const filesToUpload = medias.filter((f) => !f.url);
        const existingMedia = medias.filter((f) => f.url);

        if (filesToUpload.length > 0) {
          const uploadedMedia = await Promise.all(
            filesToUpload.map(async (file) => {
              // 1. Lấy Pre-signed URL
              const reqResponse: any = await mediaService.requestUploadUrl(
                file.name,
                file.type,
                file.size,
              );
              // Phụ thuộc vào dữ liệu trả về từ backend, fix triệt để các format có thể trả về:
              const uploadUrl =
                reqResponse?.uploadUrl ||
                reqResponse?.presignedUrl ||
                reqResponse?.url ||
                reqResponse?.signedUrl ||
                reqResponse?.data?.uploadUrl ||
                reqResponse?.data?.url ||
                reqResponse?.data?.presignedUrl;
              const fileId =
                reqResponse?.fileId ||
                reqResponse?.id ||
                reqResponse?.data?.fileId ||
                reqResponse?.data?.id;

              if (!uploadUrl) {
                console.error("Missing uploadUrl in response:", reqResponse);
                throw new Error(
                  "Không lấy được pre-signed upload URL từ server",
                );
              }

              // 2. Upload file trực tiếp lên S3 qua Pre-signed URL
              await mediaService.uploadToPresignedUrl(uploadUrl, file);

              // URL upload file cần gọi confirm: bỏ phần query
              const uploadedUrlClean = uploadUrl.split("?")[0];

              // 3. Confirm quá trình upload với backend
              const confirmResponse: any = await mediaService.confirmUpload(
                fileId,
                uploadedUrlClean,
              );

              const finalUrl =
                confirmResponse?.url ||
                confirmResponse?.fileUrl ||
                confirmResponse?.data?.url ||
                uploadedUrlClean;

              return {
                fileId:
                  confirmResponse?.fileId || confirmResponse?._id || fileId,
                type: file.type?.startsWith("image/")
                  ? "image"
                  : file.type?.startsWith("video/")
                    ? "video"
                    : file.type?.startsWith("audio/")
                      ? "audio"
                      : "file",
                url: finalUrl,
                thumbnailUrl: finalUrl,
                filename: file.name || "unknown",
                size: file.size || 0,
                mimetype: file.type || "application/octet-stream",
                mimeType: file.type || "application/octet-stream",
              };
            }),
          );

          finalMedia = [...existingMedia, ...uploadedMedia];
        } else if (existingMedia.length > 0) {
          finalMedia = existingMedia;
        }

        // Strict normalization for API compliance
        const validMedia = finalMedia.map((m: any) => {
          const rawType = (
            m.type ||
            m.mimeType ||
            m.mimetype ||
            ""
          ).toLowerCase();
          const pType = rawType.startsWith("image")
            ? "image"
            : rawType.startsWith("video")
              ? "video"
              : rawType.startsWith("audio")
                ? "audio"
                : "file";
          return {
            fileId: m.fileId || m.id || m._id || undefined,
            type: pType,
            url: m.url || m.preview || "",
            thumbnailUrl: m.thumbnailUrl || m.preview || m.url || "",
            filename: m.filename || m.name || "unknown",
            size: Number(m.size) || 0,
            mimetype:
              m.mimeType || m.mimetype || rawType || "application/octet-stream",
            mimeType:
              m.mimeType || m.mimetype || rawType || "application/octet-stream",
          };
        });

        let apiResponse: any;
        if (replyMsg) {
          const messageId = replyMsg.id || replyMsg._id;
          apiResponse = await socketService.quoteMessage(
            messageId,
            txt || " ",
            selectedConversationId,
            validMedia,
          );
        } else {
          apiResponse = await socketService.sendMessage(
            conversationId,
            txt || " ",
            validMedia,
          );
        }

        const responseData = apiResponse?.data || apiResponse;
        const sentMessagesArray = Array.isArray(responseData)
          ? responseData
          : responseData?.data && Array.isArray(responseData.data)
            ? responseData.data
            : [responseData];

        setMessages((prev) => {
          // Remove the optimistic 'tempId' message
          const updatedMessages = prev.filter((m) => m.id !== tempId);

          // Append or update messages from the API response
          for (const sMsg of sentMessagesArray) {
            if (!sMsg || (!sMsg._id && !sMsg.id)) continue;

            const msgId = sMsg._id || sMsg.id;
            const existingIndex = updatedMessages.findIndex(
              (m) => String(m.id || m._id) === String(msgId),
            );

            if (existingIndex !== -1) {
              updatedMessages[existingIndex] = {
                ...updatedMessages[existingIndex],
                ...sMsg,
                status: "sent",
                id: msgId,
              };
            } else {
              updatedMessages.push({ ...sMsg, id: msgId, status: "sent" });
            }
          }

          return updatedMessages;
        });

        // Update Chat sidebar and mark message as delivered
        if (sentMessagesArray.length > 0) {
          const lastSent = sentMessagesArray[sentMessagesArray.length - 1];
          const lastMessageId = lastSent.id || lastSent._id;

          socketService.emit("receiveMessage", {
            message: lastSent,
            conversationId,
          });

          if (lastMessageId) {
            socketService
              .markDelivered(conversationId, lastMessageId)
              .catch(() => {});
          }
        }
      } catch (error) {
        console.error("Failed to send message via socket", error);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId ? { ...msg, status: "failed" } : msg,
          ),
        );
      }
    };

    // Nếu gửi forward kèm message trước khi gửi thì gửi message trước rồi forward sau
    if (payloadText.trim() || payloadMedia.length > 0) {
      await performSend(payloadText, payloadMedia, false);
    }

    if (fwMsg) {
      try {
        const msgId = fwMsg.id || fwMsg._id;
        if (msgId) {
          const res: any = await socketService.forwardMessages(
            [msgId],
            conversationId,
          );

          // Normalize res to an array of messages
          let newMessages = [];
          if (Array.isArray(res)) {
            newMessages = res;
          } else if (res?.data && Array.isArray(res.data)) {
            newMessages = res.data;
          } else if (res && typeof res === "object") {
            newMessages = [res.message || res.data || res];
          }

          if (newMessages.length > 0) {
            setMessages((prev) => {
              const newMsgs = [...prev];
              newMessages.forEach((newMsg) => {
                if (
                  newMsg &&
                  !newMsgs.some(
                    (m) =>
                      String(m._id || m.id) === String(newMsg._id || newMsg.id),
                  )
                ) {
                  newMsgs.push(normalizeMessageLifecycle(newMsg));
                }
              });
              return newMsgs;
            });

            // Mark delivered and seen after forwarding message
            const lastForwardedMessage = newMessages[newMessages.length - 1];
            const lastMessageId =
              lastForwardedMessage?.id || lastForwardedMessage?._id;
            if (lastMessageId) {
              // Only mark own messages as delivered (not seen)
              socketService
                .markDelivered(conversationId, lastMessageId)
                .catch(() => {});
            }
          }
        }
      } catch (error) {
        console.error("Failed to forward message via socket", error);
      }
    }
  };
  const handleRevokeMessage = async (message) => {
    try {
      const messageId = message?.id || message?._id;
      if (!messageId) return;

      const res: any = await socketService.revokeMessage(messageId);

      if (res && res.success) {
        markCachedMessageRevoked(String(messageId), {
          message,
          deletedAt: new Date().toISOString(),
        });
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId || msg._id === messageId
              ? normalizeMessageLifecycle({ ...msg, isRevoked: true, deletedAt: new Date().toISOString() })
              : msg,
          ),
        );
        window.dispatchEvent(new Event("chatList:refresh"));
      }
    } catch (error) {
      console.error("Failed to revoke message:", error);
    }
  };

  const handleDeleteMessageForMe = async (message) => {
    const messageId = message?.id || message?._id;
    if (!messageId) return;

    try {
      await conversationService.deleteMessageForMe(messageId);
      setMessages((prev) =>
        prev.filter(
          (msg) =>
            String(msg.id) !== String(messageId) &&
            String(msg._id) !== String(messageId),
        ),
      );
    } catch (error) {
      console.error("Failed to delete message for me via API:", error);
      try {
        const res: any = await socketService.deleteMessage(messageId);
        if (!res?.success && res?.status !== "success") throw new Error(res?.error || "Delete failed");
        setMessages((prev) =>
          prev.filter(
            (msg) =>
              String(msg.id) !== String(messageId) &&
              String(msg._id) !== String(messageId),
          ),
        );
      } catch (socketErr) {
        console.error("Failed to delete message for me via socket fallback:", socketErr);
      }
    }
  };

  const handleDeleteMessageForEveryone = async (message: any) => {
    const messageId = message?.id || message?._id;
    if (!messageId) return;

    try {
      const res: any = await socketService.deleteMessageForEveryone(messageId);

      if (
        res &&
        (res.success || res.status === 200 || res.status === "success")
      ) {
        setMessages((prev) =>
          prev.map((m) =>
            String(m._id || m.id) === String(messageId)
              ? {
                  ...m,
                  isRevoked: true,
                  text: "Message deleted for everyone",
                  deletedAt: new Date().toISOString(),
                }
              : m,
          ),
        );
      }
    } catch (error) {
      console.error("Failed to delete message for everyone via socket:", error);
      try {
        await conversationService.deleteMessageForEveryone(messageId);
      } catch (apiErr) {
        console.error("Failed to delete message for everyone via API:", apiErr);
      }
    }
  };

  const handlePinMessage = async (messageId: string) => {
    // Prevent duplicate requests
    const operationKey = `pin-${messageId}`;
    if (pendingPinOperations.current.has(operationKey)) {
      console.warn(`Pin operation already pending for message ${messageId}`);
      return;
    }

    if (!selectedConversationId) {
      console.error("Cannot pin message: no conversation selected", {
        selectedConversationId,
        messageId,
      });
      return;
    }

    pendingPinOperations.current.add(operationKey);

    console.log("[Pin] Pinning message:", {
      conversationId: selectedConversationId,
      messageId,
    });

    // Get current pinned state before optimistic update (for potential rollback)
    const currentMessage = messages.find(
      (m) => String(m.id || m._id) === String(messageId),
    );
    const originalPinnedAt = currentMessage?.pinnedAt;
    const originalPinnedBy = currentMessage?.pinnedBy;
    const optimisticPinnedMessage = currentMessage
      ? {
          ...currentMessage,
          pinnedAt: new Date().toISOString(),
          pinnedBy: user?.id,
        }
      : null;

    // Optimistic update - add pinnedAt immediately
    setMessages((prev) =>
      prev.map((msg) =>
        String(msg.id || msg._id) === String(messageId)
          ? {
              ...msg,
              pinnedAt: new Date().toISOString(),
              pinnedBy: user?.id,
            }
          : msg,
      ),
    );
    if (optimisticPinnedMessage) {
      setPinnedMessages((prev) => upsertPinnedMessage(prev, optimisticPinnedMessage));
    }

    try {
      const res: any = await socketService.pinMessage(messageId);
      if (
        res &&
        (res.success ||
          res.status === 200 ||
          res.statusText === "OK" ||
          res.status === "success")
      ) {
        console.log("[Pin] Success:", {
          conversationId: selectedConversationId,
          messageId,
        });
        // Server will broadcast back to other clients, but we already updated optimistically
      } else {
        throw new Error(res?.error || res?.msg || res?.message || "Pin failed");
      }
    } catch (error) {
      try {
        await conversationService.pinMessage(messageId);
      } catch (apiError) {
        console.error("Failed to pin message:", apiError);
        if (optimisticPinnedMessage) {
          setPinnedMessages((prev) => {
            if (!originalPinnedAt) return removePinnedMessage(prev, messageId);
            return upsertPinnedMessage(prev, {
              ...optimisticPinnedMessage,
              pinnedAt: originalPinnedAt,
              pinnedBy: originalPinnedBy,
            });
          });
        }
        setMessages((prev) =>
          prev.map((msg) =>
            String(msg.id || msg._id) === String(messageId)
              ? { ...msg, pinnedAt: originalPinnedAt, pinnedBy: originalPinnedBy }
              : msg,
          ),
        );
        throw apiError;
      }
    } finally {
      pendingPinOperations.current.delete(operationKey);
    }
  };

  const handleUnpinMessage = async (messageId: string) => {
    // Prevent duplicate requests
    const operationKey = `unpin-${messageId}`;
    if (pendingPinOperations.current.has(operationKey)) {
      console.warn(`Unpin operation already pending for message ${messageId}`);
      return;
    }

    if (!selectedConversationId) {
      console.error("Cannot unpin message: no conversation selected", {
        selectedConversationId,
        messageId,
      });
      return;
    }

    pendingPinOperations.current.add(operationKey);

    console.log("[Unpin] Unpinning message:", {
      conversationId: selectedConversationId,
      messageId,
    });

    // Get current pinned state before optimistic update (for potential rollback)
    const currentMessage = messages.find(
      (m) => String(m.id || m._id) === String(messageId),
    );
    const originalPinnedAt = currentMessage?.pinnedAt;
    const originalPinnedBy = currentMessage?.pinnedBy;
    const originalPinnedMessage =
      pinnedMessages.find(
        (message) => String(getMessageId(message)) === String(messageId),
      ) || currentMessage;

    // Optimistic update - remove pinnedAt immediately
    setMessages((prev) =>
      prev.map((msg) =>
        String(msg.id || msg._id) === String(messageId)
          ? { ...msg, pinnedAt: undefined, pinnedBy: undefined }
          : msg,
      ),
    );
    setPinnedMessages((prev) => removePinnedMessage(prev, messageId));

    try {
      const res: any = await socketService.unpinMessage(messageId);
      if (
        res &&
        (res.success ||
          res.status === 200 ||
          res.statusText === "OK" ||
          res.status === "success")
      ) {
        console.log("[Unpin] Success:", {
          conversationId: selectedConversationId,
          messageId,
        });
        // Server will broadcast back to other clients, but we already updated optimistically
      } else {
        throw new Error(
          res?.error || res?.msg || res?.message || "Unpin failed",
        );
      }
    } catch (error) {
      try {
        await conversationService.unpinMessage(messageId);
      } catch (apiError) {
        console.error("Failed to unpin message:", apiError);
        if (originalPinnedMessage && originalPinnedAt) {
          setPinnedMessages((prev) =>
            upsertPinnedMessage(prev, {
              ...originalPinnedMessage,
              pinnedAt: originalPinnedAt,
              pinnedBy: originalPinnedBy,
            }),
          );
        }
        setMessages((prev) =>
          prev.map((msg) =>
            String(msg.id || msg._id) === String(messageId)
              ? { ...msg, pinnedAt: originalPinnedAt, pinnedBy: originalPinnedBy }
              : msg,
          ),
        );
        throw apiError;
      }
    } finally {
      pendingPinOperations.current.delete(operationKey);
    }
  };

  const handleShowInChat = (mediaUrl: string) => {
    // Search for the actual message that contains this media
    console.log("🔍 Searching for message containing media URL:", mediaUrl);

    const foundMessage = messages.find((msg) => {
      if (!msg.media || !Array.isArray(msg.media)) return false;
      return msg.media.some(
        (m: any) => m.url === mediaUrl || m.preview === mediaUrl,
      );
    });

    if (!foundMessage) {
      console.warn("❌ Message containing this media not found");
      return;
    }

    const messageId = foundMessage.id || foundMessage._id;
    console.log("✅ Found message ID:", messageId);

    // Try to find and scroll to the message element
    const findAndScrollToMessage = () => {
      const messageElement = document.querySelector(
        `[data-message-id="${messageId}"]`,
      );
      console.log("📍 Found element:", messageElement);

      if (messageElement) {
        messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
        // Highlight the message temporarily
        messageElement.classList.add("bg-yellow-100", "dark:bg-yellow-900/30");
        console.log("✅ Message highlighted and scrolled");
        setTimeout(() => {
          messageElement.classList.remove(
            "bg-yellow-100",
            "dark:bg-yellow-900/30",
          );
        }, 2000);
        return true;
      }
      return false;
    };

    // First attempt
    if (findAndScrollToMessage()) return;

    // If message element not found (may be outside viewport), scroll chat to top and retry
    console.warn(
      "⚠️ Message element not found, trying to scroll chat to top...",
    );
    const chatContainer = document.querySelector("[data-chat-container]");
    if (chatContainer) {
      chatContainer.scrollTop = 0;
      // Wait for messages to render, then retry
      setTimeout(() => {
        findAndScrollToMessage();
      }, 300);
    }
  };

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="flex h-screen bg-white dark:bg-black lg:dark:bg-slate-900 relative overflow-hidden">
        {/* Resizable Left Panel - Chat List */}
        <div className={`h-full shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.33,1,0.68,1)] z-10 flex absolute inset-0 lg:relative lg:translate-x-0 will-change-transform ${selectedChat ? 'translate-x-[30%] w-full pointer-events-none lg:pointer-events-auto lg:flex lg:w-auto' : 'translate-x-0 w-full lg:w-auto'}`}>
          <ResizableChatPanel
            activeView={activeView}
            onViewChange={setActiveView}
            activeChatId={selectedChat?.id || null}
            openingChatId={openingChatId}
            onSelectChat={openChatByRow}
            onForwardToTarget={handleForwardToTarget}
            onForwardMessages={handleForwardMessagesDirect}
            onOpenSavedMessages={openSavedMessages}
          />
        </div>

        {/* Right Panel - Chat Area */}
        <div className={`flex flex-col min-w-0 bg-gray-100 dark:bg-black lg:dark:bg-slate-950 h-full transition-transform duration-300 ease-[cubic-bezier(0.33,1,0.68,1)] z-20 absolute inset-0 lg:relative lg:flex-1 will-change-transform ${!selectedChat ? '-translate-x-full lg:translate-x-0 pointer-events-none lg:pointer-events-auto' : 'translate-x-0'}`}>
          {children || (
            <ActiveChatPane
              selectedChat={selectedChat}
              selectedConversationId={selectedConversationId}
              isLoading={isOpeningConversation}
              error={chatError}
              messages={messages}
              pinnedMessages={pinnedMessages}
              typingUsers={typingUsers}
              currentUserId={user?.id}
              onRetry={retryOpenCurrentChat}
              onSendMessage={handleSendMessage}
              onRevokeMessage={handleRevokeMessage}
              onDeleteMessageForMe={handleDeleteMessageForMe}
              onDeleteMessageForEveryone={handleDeleteMessageForEveryone}
              onForwardToTarget={handleForwardToTarget}
              onForwardMessages={handleForwardMessagesDirect}
              forwardingMessage={forwardingMessage}
              onClearForwarding={clearForwardingMessage}
              isRightSidebarOpen={isRightSidebarOpen}
              setIsRightSidebarOpen={setIsRightSidebarOpen}
              onPinMessage={handlePinMessage}
              onUnpinMessage={handleUnpinMessage}
              onPollCreated={appendLocalMessage}
              onPollUpdated={updatePollInMessages}
              onDeleteConversation={() => setIsDeleteConversationModalOpen(true)}
              hasMoreMessages={messagePageInfo.hasMore}
              isLoadingOlderMessages={isLoadingOlderMessages}
              onLoadOlderMessages={handleLoadOlderMessages}
              onOpenChat={openChatByRow}
              onChatInteractionRead={handleChatInteractionRead}
              onCloseChat={() => {
                navigate("/", { replace: true });
                setSelectedChat(null);
                setSelectedConversationId(null);
                setMessages([]);
                setPinnedMessages([]);
                setMessagePageInfo({ nextCursor: null, hasMore: false });
              }}
            />
          )}
        </div>

        <RightSidebar
          isOpen={isRightSidebarOpen && !!selectedChat}
          selectedChat={selectedChat}
          currentUserId={user?.id}
          onClose={() => setIsRightSidebarOpen(false)}
          onGroupUpdated={(newInfo: any) => {
            setSelectedChat((prev: any) =>
              prev ? { ...prev, ...newInfo } : prev,
            );
          }}
          onShowInChat={handleShowInChat}
          messages={messages}
          onSendMessage={(member: any) => {
            const memberId =
              member.userId ||
              member.user?.id ||
              member.user?._id ||
              member._id ||
              member.id;
            const participant = member.user || member;
            const name =
              participant.displayName ||
              participant.name ||
              participant.username ||
              "Unknown";

            if (memberId) {
              openChatByRow({
                id: `temp-${memberId}`,
                targetUserId: memberId,
                name: name,
                avatarUrl: participant.avatarUrl,
              });
            }
          }}
        />

        <DeleteConversationModal
          isOpen={isDeleteConversationModalOpen}
          isLoading={isDeletingConversation}
          chatName={
            selectedChat?.name ||
            selectedChat?.displayName ||
            selectedChat?.title ||
            "this chat"
          }
          onClose={() => {
            if (!isDeletingConversation) {
              setIsDeleteConversationModalOpen(false);
            }
          }}
          onConfirm={handleDeleteConversation}
        />
      </div>
    </div>
  );
};

export { MainLayout };
