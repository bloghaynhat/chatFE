import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { socketService } from "../../services/socketService";
import { userService } from "../../services/userService";
import { conversationService } from "../../services/conversationService";
import {
  blockUser,
  checkBlockStatus,
  checkFriendRequestStatus,
} from "../../services";
import { useDropzone } from "react-dropzone";
import { useFriendManagement } from "../../hooks";
import "react-photo-view/dist/react-photo-view.css";
import { useDraft } from "../../context/DraftContext";

import { ChatHeader } from "./ActiveChatPane/ChatHeader";
import { MessageList } from "./ActiveChatPane/MessageList";
import { ChatInput } from "./ActiveChatPane/ChatInput";
import { ForwardModal } from "./ActiveChatPane/ForwardModal";
import { CalendarModal } from "./ActiveChatPane/CalendarModal";
import { PinnedBar } from "./ActiveChatPane/PinnedBar";
import { PinnedList } from "./ActiveChatPane/PinnedList";
import { MessageContextMenu } from "./ActiveChatPane/MessageContextMenu";
import { AiTranslateMessage } from "./AiTranslateMessage";
import { VideoPreviewModal } from "./ActiveChatPane/VideoPreviewModal";
import { FilePreviewModal } from "./ActiveChatPane/FilePreviewModal";
import { DragDropOverlay } from "./ActiveChatPane/DragDropOverlay";
import { CreatePollModal } from "./ActiveChatPane/CreatePollModal";
import { ContactPickerModal } from "./ActiveChatPane/ContactPickerModal";
import { WelcomeScreen } from "./WelcomeScreen";
import { getMessageText } from "../../utils/chatUtils";
import type { Message } from "../../types/conversation";
import { pollService } from "../../services/pollService";
import { useCallV2 } from "../../providers/CallV2SocketProvider";
import { callV2Service } from "../../services/callV2.service";
import type { CallV2Session } from "../../services/callV2.types";
import {
  FiImage,
  FiFile,
  FiGift,
  FiCheckCircle,
  FiBarChart2,
  FiUserPlus,
} from "react-icons/fi";

const mergeGroupSettings = (...sources: any[]) =>
  sources.reduce((merged, source) => {
    if (!source) return merged;
    return {
      ...merged,
      ...source,
      utilityPermissions: {
        ...(merged.utilityPermissions || {}),
        ...(source.utilityPermissions || {}),
      },
    };
  }, {});

export const ActiveChatPane = ({
  selectedChat,
  selectedConversationId,
  isLoading,
  error,
  messages,
  typingUsers = new Set(),
  currentUserId,
  onRetry,
  onSendMessage,
  onRevokeMessage,
  onDeleteMessageForMe,
  onDeleteMessageForEveryone,
  onForwardToTarget,
  onForwardMessages,
  forwardingMessage,
  onClearForwarding,
  isRightSidebarOpen,
  setIsRightSidebarOpen,
  onPinMessage,
  onUnpinMessage,
  onPollCreated,
  onPollUpdated,
  onDeleteConversation,
  hasMoreMessages = false,
  isLoadingOlderMessages = false,
  onLoadOlderMessages,
  onOpenChat,
  onCloseChat,
}: any) => {
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isHeaderSearchOpen, setIsHeaderSearchOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [headerSearchValue, setHeaderSearchValue] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(
    () => new Date(),
  );

  const { drafts, setDraft, loadDrafts } = useDraft();

  const draftMessage = (selectedConversationId ? drafts[selectedConversationId] : "") || "";
  const setDraftMessage = useCallback((text: string | ((prev: string) => string)) => {
    if (!selectedConversationId) return;
    const newText = typeof text === "function" ? text(draftMessage) : text;
    setDraft(selectedConversationId, newText);
  }, [selectedConversationId, draftMessage, setDraft]);

  useEffect(() => {
    if (selectedConversationId) {
      loadDrafts(selectedConversationId);
    }
  }, [selectedConversationId, loadDrafts]);

  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [replyingMessage, setReplyingMessage] = useState<Message | null>(null);
  const [isPinnedListOpen, setIsPinnedListOpen] = useState(false);
  const [isCreatePollOpen, setIsCreatePollOpen] = useState(false);
  const [isContactPickerOpen, setIsContactPickerOpen] = useState(false);
  const [isCreatingPoll, setIsCreatingPoll] = useState(false);

  const attachMenuRef = useRef(null);
  const moreMenuRef = useRef(null);
  const emojiMenuRef = useRef(null);
  const headerSearchInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);
  const messagesEndRef = useRef(null);
  const firstMessageRef = useRef(null);
  const photoVideoInputRef = useRef(null);
  const documentInputRef = useRef(null);
  const userCache = useRef<Map<string, any>>(new Map());

  // File upload state for UI/UX
  const [dragType, setDragType] = useState(null); // 'image' or 'file'
  const [previewFiles, setPreviewFiles] = useState([]);
  const [compressImage, setCompressImage] = useState(true);

  const [previewVideoUrl, setPreviewVideoUrl] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [forwardModalVisible, setForwardModalVisible] = useState(false);
  const [messageToForward, setMessageToForward] = useState(null);
  const [chatRestriction, setChatRestriction] = useState<string | null>(null);
  const [messageToTranslate, setMessageToTranslate] = useState<Message | null>(
    null,
  );
  const [effectiveGroupSettings, setEffectiveGroupSettings] = useState<any>(
    mergeGroupSettings(selectedChat?.settings, selectedChat?.groupSettings),
  );

  const callV2 = useCallV2();
  const [activeCallV2, setActiveCallV2] = useState<CallV2Session | null>(null);

  // Computed pinned messages from messages (real-time from socket)
  const [enrichedPinnedMessages, setEnrichedPinnedMessages] = useState<
    Message[]
  >([]);

  // Enrich pinned messages with sender info whenever messages change
  useEffect(() => {
    const updatePinnedMessages = async () => {
      if (!messages || messages.length === 0) {
        setEnrichedPinnedMessages([]);
        return;
      }

      const pinned = messages.filter((m) => m.pinnedAt);
      if (pinned.length === 0) {
        setEnrichedPinnedMessages([]);
        return;
      }

      const enriched = await enrichMessagesWithSenderInfo(pinned);
      setEnrichedPinnedMessages(enriched);
    };

    updatePinnedMessages();
  }, [messages]);

  const { friends, fetchFriends } = useFriendManagement();

  const isGroupChat = useMemo(
    () =>
      selectedChat?.type === "GROUP" ||
      selectedChat?.type === "group" ||
      selectedChat?.isGroup === true,
    [selectedChat],
  );

  useEffect(() => {
    setEffectiveGroupSettings(mergeGroupSettings(selectedChat?.settings, selectedChat?.groupSettings));
  }, [selectedChat?.id, selectedChat?.settings, selectedChat?.groupSettings]);

  useEffect(() => {
    const conversationId = selectedConversationId || selectedChat?.id;
    if (!conversationId || !isGroupChat) return;

    const cleanupSettings = socketService.on("group:settings_updated", (event: any) => {
      const eventConversationId =
        event?.conversationId || event?.groupId || event?.id || event?.conversation?.id;
      if (String(eventConversationId) !== String(conversationId)) return;

      const incomingSettings = event?.settings || event?.data?.settings || {};
      setEffectiveGroupSettings((current: any) => mergeGroupSettings(current, incomingSettings));
    });

    return () => {
      if (cleanupSettings) cleanupSettings();
    };
  }, [isGroupChat, selectedChat?.id, selectedConversationId]);

  const currentUserGroupRole = useMemo(() => {
    if (!isGroupChat || !currentUserId) return selectedChat?.role || "member";

    const directRole = selectedChat?.role || selectedChat?.currentUserRole;
    if (directRole) return directRole;

    const member = (
      selectedChat?.members ||
      selectedChat?.participants ||
      []
    ).find(
      (item: any) =>
        String(
          item?.userId ||
          item?.user?.id ||
          item?.user?._id ||
          item?.id ||
          item?._id,
        ) === String(currentUserId),
    );
    if (member?.role) return member.role;

    const ownerId =
      selectedChat?.ownerId ||
      selectedChat?.owner?.id ||
      selectedChat?.owner?._id;
    if (ownerId && String(ownerId) === String(currentUserId)) return "owner";

    const adminIds = [
      ...(Array.isArray(selectedChat?.admins) ? selectedChat.admins : []),
      ...(Array.isArray(selectedChat?.adminIds) ? selectedChat.adminIds : []),
    ].map((admin: any) => admin?.id || admin?._id || admin?.userId || admin);
    if (adminIds.some((id: any) => String(id) === String(currentUserId)))
      return "admin";

    return "member";
  }, [currentUserId, isGroupChat, selectedChat]);

  const isCurrentUserGroupAdmin = useMemo(() => {
    const role = String(currentUserGroupRole || "").toLowerCase();
    return role === "owner" || role === "admin";
  }, [currentUserGroupRole]);

  const groupMessageRestriction = useMemo(() => {
    const whoCanSendMessages = effectiveGroupSettings?.whoCanSendMessages;

    if (
      isGroupChat &&
      whoCanSendMessages === "admins" &&
      !isCurrentUserGroupAdmin
    ) {
      return "Chỉ trưởng nhóm và phó nhóm có thể nhắn tin";
    }

    return null;
  }, [effectiveGroupSettings, isCurrentUserGroupAdmin, isGroupChat]);

  const canCreatePoll = useMemo(() => {
    if (!isGroupChat) return false;
    const pollPermission = effectiveGroupSettings?.utilityPermissions?.poll || "all";
    return pollPermission !== "admins" || isCurrentUserGroupAdmin;
  }, [effectiveGroupSettings, isCurrentUserGroupAdmin, isGroupChat]);

  const resolveInviteeIds = useCallback(async () => {
    if (!isGroupChat) {
      const targetUserId =
        selectedChat?.targetUserId || selectedChat?.participantId;
      return targetUserId ? [targetUserId] : [];
    }

    const rawMembers =
      selectedChat?.members || selectedChat?.participants || [];
    let inviteeIds = Array.isArray(rawMembers)
      ? rawMembers
        .map((member) => member?.userId || member?.id || member?._id)
        .filter(Boolean)
      : [];

    if (inviteeIds.length === 0 && selectedConversationId) {
      try {
        const membersData = await conversationService.getGroupMembers(
          selectedConversationId,
        );
        const rawList = Array.isArray(membersData)
          ? membersData
          : membersData?.members || membersData?.data || [];
        inviteeIds = rawList
          .map(
            (member: any) =>
              member?.userId ||
              member?.user?.id ||
              member?.user?._id ||
              member?.id ||
              member?._id,
          )
          .filter(Boolean);
      } catch (err) {
        console.warn("Failed to load group members for call", err);
      }
    }

    return inviteeIds.filter((id) => id && id !== currentUserId);
  }, [selectedChat, selectedConversationId, currentUserId, isGroupChat]);

  const callPeerInfo = useMemo(() => {
    if (!selectedChat) return null;
    const target =
      selectedChat.targetUser ||
      selectedChat.participant ||
      selectedChat.user ||
      selectedChat.receiver ||
      selectedChat.friend ||
      null;

    return {
      id:
        selectedChat.targetUserId ||
        selectedChat.participantId ||
        target?.id ||
        target?._id ||
        null,
      name:
        selectedChat.name ||
        selectedChat.displayName ||
        target?.displayName ||
        target?.name ||
        target?.username ||
        null,
      avatarUrl:
        selectedChat.avatarUrl ||
        selectedChat.avatar ||
        target?.avatarUrl ||
        target?.avatar ||
        target?.profilePicture ||
        null,
    };
  }, [selectedChat]);

  const privateTargetUserId = useMemo(() => {
    if (!selectedChat) return null;
    if (isGroupChat) return null;

    const target =
      selectedChat.targetUser ||
      selectedChat.participant ||
      selectedChat.user ||
      selectedChat.receiver ||
      selectedChat.friend ||
      null;

    return (
      selectedChat.targetUserId ||
      selectedChat.participantId ||
      target?.id ||
      target?._id ||
      (selectedChat?.pairKey
        ? selectedChat.pairKey
          .split("_")
          .find((id: string) => id !== currentUserId)
        : null) ||
      null
    );
  }, [currentUserId, selectedChat, isGroupChat]);

  const refreshChatRestriction = useCallback(async () => {
    if (!privateTargetUserId) {
      setChatRestriction(null);
      return;
    }

    try {
      const [blockStatus, relationshipStatus] = await Promise.all([
        checkBlockStatus(privateTargetUserId).catch(() => ({
          isBlocked: false,
        })),
        checkFriendRequestStatus(privateTargetUserId).catch(() => null),
      ]);

      const relationshipPayload =
        relationshipStatus &&
          typeof relationshipStatus === "object" &&
          "status" in relationshipStatus &&
          "data" in relationshipStatus
          ? (relationshipStatus as any).data
          : (relationshipStatus as any)?.data || relationshipStatus || {};

      if (
        blockStatus?.isBlocked ||
        relationshipPayload?.direction === "BLOCKING"
      ) {
        setChatRestriction("You blocked this user");
        return;
      }

      if (
        relationshipPayload?.status === "BLOCKED" &&
        relationshipPayload?.direction === "BLOCKED_BY"
      ) {
        setChatRestriction("You can't message this user");
        return;
      }

      setChatRestriction(null);
    } catch (err) {
      console.error("Failed to refresh chat restriction", err);
      setChatRestriction(null);
    }
  }, [privateTargetUserId]);

  useEffect(() => {
    refreshChatRestriction();
  }, [refreshChatRestriction]);

  useEffect(() => {
    void socketService.initBlocksSocket();

    const handleBlockStatusChanged = (event: any) => {
      if (
        !event?.detail?.userId ||
        event.detail.userId === privateTargetUserId
      ) {
        refreshChatRestriction();
      }
    };

    const handleSocketBlockStatusChanged = (payload: any) => {
      if (!payload?.userId || payload.userId === privateTargetUserId) {
        refreshChatRestriction();
      }
    };

    const unsubscribeSocket = socketService.on(
      "blockStatus:changed",
      handleSocketBlockStatusChanged,
    );
    window.addEventListener("blockStatus:changed", handleBlockStatusChanged);
    return () => {
      unsubscribeSocket();
      window.removeEventListener(
        "blockStatus:changed",
        handleBlockStatusChanged,
      );
    };
  }, [privateTargetUserId, refreshChatRestriction]);

  const handleStartCall = useCallback(
    async (type: "audio" | "video") => {
      const isSavedMessages =
        selectedChat?.type === "saved_messages" ||
        selectedChat?.isSavedMessages ||
        selectedChat?.isSelfChat;
      if (isSavedMessages) return;

      const conversationId = selectedConversationId || selectedChat?.id;
      if (!conversationId) return;

      const inviteeIds = await resolveInviteeIds();
      await callV2.startCallV2(
        conversationId,
        type,
        inviteeIds.length > 0 ? inviteeIds : undefined,
        isGroupChat,
        callPeerInfo,
        isGroupChat
          ? callPeerInfo?.name ||
          selectedChat?.name ||
          selectedChat?.displayName ||
          null
          : null,
      );
    },
    [
      callPeerInfo,
      callV2,
      resolveInviteeIds,
      isGroupChat,
      selectedConversationId,
      selectedChat,
    ],
  );

  const handleBlockUser = useCallback(async () => {
    if (!privateTargetUserId) return;

    const confirmed = window.confirm(
      "Block this user? They will not be able to message or call you.",
    );
    if (!confirmed) return;

    try {
      await blockUser(privateTargetUserId);
      setChatRestriction("You blocked this user");
      window.dispatchEvent(
        new CustomEvent("blockStatus:changed", {
          detail: { userId: privateTargetUserId, isBlocked: true },
        }),
      );
      window.dispatchEvent(new Event("chatList:refresh"));
    } catch (err: any) {
      console.error("[ActiveChatPane] Failed to block user:", err);
      alert(err?.message || "Failed to block user");
    }
  }, [privateTargetUserId]);

  const refreshActiveCallV2 = useCallback(async () => {
    const conversationId = selectedConversationId || selectedChat?.id;
    if (!conversationId) {
      setActiveCallV2(null);
      return;
    }

    const activeCall =
      await callV2Service.getActiveCallByConversation(conversationId);
    setActiveCallV2(activeCall);
  }, [selectedConversationId, selectedChat?.id]);

  const handleJoinActiveCallV2 = useCallback(async () => {
    const conversationId = selectedConversationId || selectedChat?.id;
    if (!conversationId || !activeCallV2) return;
    await callV2.joinExistingCallV2(
      activeCallV2.callId,
      conversationId,
      activeCallV2.type,
      isGroupChat,
    );
    await refreshActiveCallV2();
  }, [
    activeCallV2,
    callV2,
    refreshActiveCallV2,
    isGroupChat,
    selectedConversationId,
    selectedChat?.id,
  ]);

  useEffect(() => {
    void refreshActiveCallV2();

    const handleRefresh = () => {
      void refreshActiveCallV2();
    };

    window.addEventListener("chatList:refresh", handleRefresh);
    return () => window.removeEventListener("chatList:refresh", handleRefresh);
  }, [refreshActiveCallV2]);

  useEffect(() => {
    if (forwardModalVisible) {
      fetchFriends();
    }
  }, [forwardModalVisible]);

  useEffect(() => {
    if (isContactPickerOpen) {
      fetchFriends();
    }
  }, [isContactPickerOpen]);

  // Socket-based pin/unpin handlers (now from parent via props)
  const handlePinMessage = async (messageId: string) => {
    if (onPinMessage) {
      await onPinMessage(messageId);
    }
  };

  const handleUnpinMessage = async (messageId: string) => {
    if (onUnpinMessage) {
      await onUnpinMessage(messageId);
    }
  };

  // Navigate to a specific message
  const handleNavigateToMessage = (messageId: string) => {
    // Scroll after a short delay to allow DOM update
    setTimeout(() => {
      const messageElement = document.getElementById(`message-${messageId}`);
      if (messageElement) {
        messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
        // Add highlight effect
        messageElement.classList.add(
          "bg-orange-100",
          "dark:bg-emerald-900/60",
          "ring-2",
          "ring-blue-500",
        );
        setTimeout(() => {
          messageElement.classList.remove(
            "bg-orange-100",
            "dark:bg-emerald-900/60",
            "ring-2",
            "ring-blue-500",
          );
        }, 2000);
      }
    }, 100);
  };

  const lastSearchTargetRef = useRef<string | null>(null);

  useEffect(() => {
    const targetMessageId = selectedChat?.searchTargetMessageId;
    if (
      !targetMessageId ||
      !selectedConversationId ||
      messages.length === 0 ||
      isLoading
    )
      return;

    const targetKey = `${selectedConversationId}:${targetMessageId}`;
    if (lastSearchTargetRef.current === targetKey) return;
    lastSearchTargetRef.current = targetKey;

    const timer = setTimeout(() => {
      handleNavigateToMessage(String(targetMessageId));
    }, 180);

    return () => clearTimeout(timer);
  }, [
    selectedChat?.searchTargetMessageId,
    selectedConversationId,
    messages.length,
    isLoading,
  ]);

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleContextMenu = (e, message) => {
    e.preventDefault();
    e.stopPropagation();

    const menuWidth = 200;
    const menuHeight = 310;
    let x = e.clientX;
    let y = e.clientY;

    if (x + menuWidth > window.innerWidth) x -= menuWidth;
    if (y + menuHeight > window.innerHeight) y -= menuHeight;

    setContextMenu({ x, y, message });
  };

  const onDrop = useCallback((acceptedFiles, fileRejections, event) => {
    if (acceptedFiles?.length === 0) return;

    let isImageDrop = true;
    if (event && event.clientY) {
      isImageDrop = event.clientY < window.innerHeight / 2;
    }

    const hasNonImage = acceptedFiles.some((f) => !f.type.startsWith("image/"));
    if (hasNonImage) isImageDrop = false;

    const filesWithPreview = acceptedFiles.map((file) =>
      Object.assign(file, {
        preview: URL.createObjectURL(file),
        isImageMode: isImageDrop,
      }),
    );

    setCompressImage(isImageDrop);
    setPreviewFiles(filesWithPreview);
    setDragType(null);
  }, []);

  useEffect(() => {
    const handlePaste = (e: any) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) files.push(file);
        }
      }

      if (files.length > 0) {
        onDrop(files, [], e);
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, [onDrop]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/jpeg": [],
      "image/png": [],
      "image/gif": [],
      "image/webp": [],
      "video/mp4": [],
      "video/mpeg": [],
      "video/quicktime": [],
      "audio/mpeg": [],
      "audio/wav": [],
      "application/pdf": [],
    },
    onDrop,
    noClick: true,
    noKeyboard: true,
    onDragEnter: (e) => {
      const items = e.dataTransfer?.items;
      let hasImage = false;
      let hasFile = false;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.startsWith("image/")) hasImage = true;
          else hasFile = true;
        }
      }
      setDragType(hasFile ? "file" : "image");
    },
    onDragLeave: () => setDragType(null),
  });

  const handleSendAttachedFiles = () => {
    if (previewFiles.length === 0) return;
    onSendMessage(draftMessage, previewFiles, { compress: compressImage });
    previewFiles.forEach((file) => URL.revokeObjectURL(file.preview));
    setPreviewFiles([]);
    setDraftMessage("");
  };

  const handleCancelAttachment = () => {
    previewFiles.forEach((file) => URL.revokeObjectURL(file.preview));
    setPreviewFiles([]);
    setDragType(null);
  };

  // Enrich messages with sender user data using cache
  const enrichMessagesWithSenderInfo = async (
    messages: Message[],
  ): Promise<Message[]> => {
    if (!messages || messages.length === 0) return messages;

    // Extract unique senderIds
    const senderIds = [
      ...new Set(messages.map((msg) => msg.senderId).filter(Boolean)),
    ] as string[];

    if (senderIds.length === 0) return messages;

    try {
      // Separate cached and uncached senderIds
      const uncachedSenderIds = senderIds.filter(
        (id) => !userCache.current.has(id),
      );

      // Fetch uncached users in parallel
      if (uncachedSenderIds.length > 0) {
        const userPromises = uncachedSenderIds.map((senderId) =>
          userService.getUserById(senderId).catch((error) => {
            console.warn(`Failed to fetch user ${senderId}:`, error);
            return null;
          }),
        );

        const users = await Promise.all(userPromises);

        // Update cache with fetched users (extract data from response)
        uncachedSenderIds.forEach((senderId, index) => {
          const userRes = users[index];
          if (userRes) {
            const userData = userRes.data || userRes;
            userCache.current.set(senderId, userData);
          }
        });
      }

      // Attach user data to messages from cache
      return messages.map((msg) => {
        const senderId = msg.senderId;
        if (senderId && userCache.current.has(senderId)) {
          return {
            ...msg,
            sender: userCache.current.get(senderId),
          };
        }
        return msg;
      });
    } catch (error) {
      console.error("Error enriching messages with sender info:", error);
      return messages;
    }
  };

  const scrollToBottom = (behavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const visibleMessages = useMemo(() => messages, [messages]);

  const lastMessage = messages[messages.length - 1];
  const lastMessageId =
    lastMessage?.id || lastMessage?._id || lastMessage?.messageId || "";
  const isLastMessageFromCurrentUser =
    Boolean(lastMessage?.senderId) && lastMessage.senderId === currentUserId;

  useEffect(() => {
    if (!isLoadingOlderMessages) {
      scrollToBottom();
    }
  }, [lastMessageId, typingUsers]);

  useEffect(() => {
    setTimeout(() => scrollToBottom("auto"), 100);
  }, [selectedConversationId]);

  useEffect(() => {
    if (!isLoading) {
      setTimeout(() => scrollToBottom("auto"), 100);
    }
  }, [isLoading]);

  useEffect(() => {
    const el = firstMessageRef.current;
    if (!el || !hasMoreMessages || isLoadingOlderMessages) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadOlderMessages?.();
        }
      },
      { rootMargin: "160px", threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.unobserve(el);
  }, [
    hasMoreMessages,
    isLoadingOlderMessages,
    onLoadOlderMessages,
    visibleMessages,
  ]);

  const attachActions = [
    {
      id: "photo-video",
      label: "Photo or Video",
      icon: FiImage,
      onClick: () => photoVideoInputRef.current?.click(),
    },
    {
      id: "document",
      label: "Document",
      icon: FiFile,
      onClick: () => documentInputRef.current?.click(),
    },
    {
      id: "poll",
      label: "Poll",
      icon: FiBarChart2,
      onClick: () => setIsCreatePollOpen(true),
      groupOnly: true,
    },
  ];

  const visibleAttachActions = attachActions.filter((action: any) => {
    if (action.id === "poll") return canCreatePoll;
    if (!action.groupOnly) return true;
    return selectedChat?.type === "group" || selectedChat?.type === "GROUP";
  });

  const handleCreatePoll = async (payload: any) => {
    if (!selectedConversationId) return;
    setIsCreatingPoll(true);
    try {
      const result = await pollService.createPoll(
        selectedConversationId,
        payload,
      );
      const poll = result?.poll || result;
      const message = result?.message || poll?.timelineMessage;
      if (message) onPollCreated?.(message);
      if (poll) onPollUpdated?.(poll);
      window.dispatchEvent(new Event("chatList:refresh"));
    } catch (error: any) {
      alert(error?.message || "Could not create poll.");
      throw error;
    } finally {
      setIsCreatingPoll(false);
    }
  };

  const calendarMonthLabel = calendarMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const selectedCalendarHeadline = selectedCalendarDate.toLocaleDateString(
    "en-US",
    {
      weekday: "short",
      month: "long",
      day: "numeric",
    },
  );

  const calendarGrid = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const leadingEmptyDays = (firstDay.getDay() + 6) % 7;
    const totalDays = new Date(year, month + 1, 0).getDate();
    return { leadingEmptyDays, totalDays };
  }, [calendarMonth]);

  const todayStart = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }, []);

  const isViewingCurrentMonthOrLater =
    calendarMonth.getFullYear() > todayStart.getFullYear() ||
    (calendarMonth.getFullYear() === todayStart.getFullYear() &&
      calendarMonth.getMonth() >= todayStart.getMonth());

  useEffect(() => {
    if (!isAttachMenuOpen && !isMoreMenuOpen && !isEmojiPickerOpen) return;

    const handleOutsideClick = (event) => {
      const isInsideAttach =
        attachMenuRef.current && attachMenuRef.current.contains(event.target);
      const isInsideMore =
        moreMenuRef.current && moreMenuRef.current.contains(event.target);
      const isInsideEmoji =
        emojiMenuRef.current && emojiMenuRef.current.contains(event.target);

      if (!isInsideAttach && !isInsideMore && !isInsideEmoji) {
        setIsAttachMenuOpen(false);
        setIsMoreMenuOpen(false);
        setIsEmojiPickerOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsAttachMenuOpen(false);
        setIsMoreMenuOpen(false);
        setIsEmojiPickerOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isAttachMenuOpen, isMoreMenuOpen, isEmojiPickerOpen]);

  useEffect(() => {
    setIsAttachMenuOpen(false);
    setIsMoreMenuOpen(false);
    setIsEmojiPickerOpen(false);
    setIsHeaderSearchOpen(false);
    setIsCalendarModalOpen(false);
    setHeaderSearchValue("");
  }, [selectedChat?.id]);

  useEffect(() => {
    if (!isCalendarModalOpen) return;
    const handleEscape = (event) => {
      if (event.key === "Escape") setIsCalendarModalOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isCalendarModalOpen]);

  useEffect(() => {
    if (!isHeaderSearchOpen) return;
    const timer = setTimeout(() => {
      headerSearchInputRef.current?.focus();
    }, 120);
    return () => clearTimeout(timer);
  }, [isHeaderSearchOpen]);

  useEffect(() => {
    // We no longer clear draft message on chat switch because DraftContext handles it per conversationId
  }, [selectedChat?.id]);

  const inputDisabledReason = chatRestriction || groupMessageRestriction;
  const inputDisabledTone =
    groupMessageRestriction && !chatRestriction ? "neutral" : "danger";
  const wallpaperUrl = selectedChat?.wallpaperUrl || null;

  const handleInputChange = (event) => {
    if (inputDisabledReason) return;
    setDraftMessage(event.target.value);
    const targetId = isGroupChat
      ? selectedConversationId
      : selectedChat?.targetUserId;

    if (targetId) {
      if (!isTypingRef.current) {
        socketService.startTyping(targetId, isGroupChat);
        isTypingRef.current = true;
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        isTypingRef.current = false;
        socketService.stopTyping(targetId, isGroupChat);
      }, 3000);
    }
  };

  const executeSend = (textToSend: string) => {
    if (onSendMessage) {
      if (editingMessage) {
        const payload = {
          id: editingMessage.id || editingMessage._id,
          text: textToSend,
          type: "edit",
        };
        onSendMessage(payload);
        setEditingMessage(null);
      } else {
        const payload = {
          text: textToSend,
          type: "text",
          forwardingMessage: forwardingMessage,
          replyingMessage: replyingMessage,
        };
        onSendMessage(payload);
      }

      setDraftMessage("");
      if (onClearForwarding) onClearForwarding();
      setReplyingMessage(null);

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (isTypingRef.current) {
        isTypingRef.current = false;
        const targetId = isGroupChat
          ? selectedConversationId
          : selectedChat?.targetUserId;
        socketService.stopTyping(targetId, isGroupChat);
      }
    }
  };

  const handleSendMessage = () => {
    if (inputDisabledReason) return;
    if (
      !draftMessage.trim() &&
      !forwardingMessage &&
      !editingMessage &&
      !replyingMessage
    )
      return;

    executeSend(draftMessage.trim());
  };

  const handleSendVoice = (voiceFile: any) => {
    if (inputDisabledReason) return;

    if (onSendMessage) {
      const fileWithPreview = Object.assign(voiceFile, {
        preview: URL.createObjectURL(voiceFile),
        isImageMode: false,
      });
      onSendMessage("", [fileWithPreview], { compress: false });
    }
  };

  if (!selectedChat) {
    return <WelcomeScreen />;
  }

  return (
    <div
      {...getRootProps()}
      className={`flex-1 flex flex-col min-h-0 relative ${isDragActive ? "bg-slate-50 dark:bg-slate-800/50" : ""}`}
    >
      <input {...getInputProps()} />

      <input
        type="file"
        multiple
        accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/mpeg,video/quicktime,audio/mpeg,audio/wav"
        ref={photoVideoInputRef}
        style={{ display: "none" }}
        onChange={(e: any) => {
          if (e.target.files && e.target.files.length > 0) {
            onDrop(Array.from(e.target.files) as any[], [], e);
            e.target.value = "";
          }
        }}
      />
      <input
        type="file"
        multiple
        accept="application/pdf"
        ref={documentInputRef}
        style={{ display: "none" }}
        onChange={(e: any) => {
          if (e.target.files && e.target.files.length > 0) {
            onDrop(Array.from(e.target.files) as any[], [], e);
            e.target.value = "";
          }
        }}
      />

      {isDragActive && <DragDropOverlay dragType={dragType} />}

      {previewFiles.length > 0 && (
        <FilePreviewModal
          files={previewFiles}
          draftMessage={draftMessage}
          onDraftMessageChange={setDraftMessage}
          onCancel={handleCancelAttachment}
          onSend={handleSendAttachedFiles}
        />
      )}

      {messageToTranslate && (
        <AiTranslateMessage
          message={messageToTranslate}
          onClose={() => setMessageToTranslate(null)}
        />
      )}

      <ChatHeader
        selectedConversationId={selectedConversationId}
        selectedChat={selectedChat}
        currentUserId={currentUserId}
        isLoading={isLoading}
        onCloseChat={onCloseChat}
        isHeaderSearchOpen={isHeaderSearchOpen}
        setIsHeaderSearchOpen={setIsHeaderSearchOpen}
        headerSearchValue={headerSearchValue}
        setHeaderSearchValue={setHeaderSearchValue}
        setIsCalendarModalOpen={setIsCalendarModalOpen}
        setCalendarMonth={setCalendarMonth}
        selectedCalendarDate={selectedCalendarDate}
        isMoreMenuOpen={isMoreMenuOpen}
        setIsMoreMenuOpen={setIsMoreMenuOpen}
        moreMenuRef={moreMenuRef}
        setIsAttachMenuOpen={setIsAttachMenuOpen}
        setIsEmojiPickerOpen={setIsEmojiPickerOpen}
        headerSearchInputRef={headerSearchInputRef}
        isRightSidebarOpen={isRightSidebarOpen}
        setIsRightSidebarOpen={setIsRightSidebarOpen}
        pinnedCount={enrichedPinnedMessages.length}
        onStartAudioCall={() => void handleStartCall("audio")}
        onStartVideoCall={() => void handleStartCall("video")}
        onBlockUser={() => void handleBlockUser()}
        onDeleteConversation={onDeleteConversation}
        onOpenContactPicker={() => setIsContactPickerOpen(true)}
        activeCallV2={activeCallV2}
        callV2Status={callV2.state.status}
        onJoinActiveCallV2={() => void handleJoinActiveCallV2()}
      />

      {/* Pinned Messages Bar */}
      {selectedConversationId && enrichedPinnedMessages.length > 0 && (
        <PinnedBar
          pinnedMessages={enrichedPinnedMessages}
          currentUserId={currentUserId}
          onUnpin={handleUnpinMessage}
          onOpenList={() => setIsPinnedListOpen(true)}
          onNavigateToMessage={handleNavigateToMessage}
        />
      )}

      <MessageList
        isLoading={isLoading}
        error={error}
        messages={messages}
        visibleMessages={visibleMessages}
        hasMoreMessages={hasMoreMessages}
        isLoadingOlderMessages={isLoadingOlderMessages}
        onRetry={onRetry}
        currentUserId={currentUserId}
        typingUsers={typingUsers}
        selectedChat={selectedChat}
        wallpaperUrl={wallpaperUrl}
        firstMessageRef={firstMessageRef}
        messagesEndRef={messagesEndRef}
        handleContextMenu={handleContextMenu}
        setPreviewVideoUrl={setPreviewVideoUrl}
        onNavigateToMessage={handleNavigateToMessage}
        onPollUpdated={onPollUpdated}
        onOpenChat={onOpenChat}
      />

      {contextMenu && (
        <MessageContextMenu
          contextMenu={contextMenu}
          messages={messages}
          currentUserId={currentUserId}
          onClose={() => setContextMenu(null)}
          onReply={(message) => {
            setReplyingMessage(message);
            setContextMenu(null);
          }}
          onEdit={(message) => {
            setEditingMessage(message);
            setDraftMessage(getMessageText(message));
            setContextMenu(null);
          }}
          onPinMessage={handlePinMessage}
          onUnpinMessage={handleUnpinMessage}
          onOpenForwardModal={(message) => {
            setMessageToForward(message);
            setForwardModalVisible(true);
            setContextMenu(null);
          }}
          onTranslateMessage={(message) => {
            setMessageToTranslate(message);
            setContextMenu(null);
          }}
          onRevokeMessage={onRevokeMessage}
          onDeleteMessageForMe={onDeleteMessageForMe}
          onDeleteMessageForEveryone={onDeleteMessageForEveryone}
        />
      )}

      <ForwardModal
        forwardModalVisible={forwardModalVisible}
        setForwardModalVisible={setForwardModalVisible}
        friends={friends}
        messageToForward={messageToForward}
        currentUserId={currentUserId}
        selectedChat={selectedChat}
        onForwardToTarget={onForwardToTarget}
        onForwardMessages={onForwardMessages}
      />

      <CalendarModal
        isCalendarModalOpen={isCalendarModalOpen}
        setIsCalendarModalOpen={setIsCalendarModalOpen}
        selectedCalendarHeadline={selectedCalendarHeadline}
        setCalendarMonth={setCalendarMonth}
        calendarMonthLabel={calendarMonthLabel}
        isViewingCurrentMonthOrLater={isViewingCurrentMonthOrLater}
        calendarGrid={calendarGrid}
        calendarMonth={calendarMonth}
        todayStart={todayStart}
        selectedCalendarDate={selectedCalendarDate}
        setSelectedCalendarDate={setSelectedCalendarDate}
        setHeaderSearchValue={setHeaderSearchValue}
      />

      {/* Pinned List Sidebar */}
      <PinnedList
        pinnedMessages={enrichedPinnedMessages}
        currentUserId={currentUserId}
        isOpen={isPinnedListOpen}
        onClose={() => setIsPinnedListOpen(false)}
        onUnpin={handleUnpinMessage}
        onNavigateToMessage={handleNavigateToMessage}
      />

      {/* Attach Menu Overlay */}
      {isAttachMenuOpen && (
        <div
          className="absolute inset-x-0 bottom-full bg-white dark:bg-slate-800 border-t dark:border-slate-700 p-2 flex items-center justify-around shadow-[0_-4px_25px_-5px_rgba(0,0,0,0.1)] z-10"
          onMouseLeave={() => setIsAttachMenuOpen(false)}
        >
          {visibleAttachActions.map((action) => (
            <div
              key={action.id}
              className="flex flex-col items-center cursor-pointer p-2 transition-transform transform hover:scale-105"
              onClick={action.onClick}
            >
              <action.icon className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                {action.label}
              </span>
            </div>
          ))}
        </div>
      )}

      <ChatInput
        draftMessage={draftMessage}
        setDraftMessage={setDraftMessage}
        handleInputChange={handleInputChange}
        handleSendMessage={handleSendMessage}
        isAttachMenuOpen={isAttachMenuOpen}
        setIsAttachMenuOpen={setIsAttachMenuOpen}
        isEmojiPickerOpen={isEmojiPickerOpen}
        setIsEmojiPickerOpen={setIsEmojiPickerOpen}
        isMoreMenuOpen={isMoreMenuOpen}
        setIsMoreMenuOpen={setIsMoreMenuOpen}
        attachMenuRef={attachMenuRef}
        emojiMenuRef={emojiMenuRef}
        attachActions={visibleAttachActions}
        editingMessage={editingMessage}
        setEditingMessage={setEditingMessage}
        replyingMessage={replyingMessage}
        setReplyingMessage={setReplyingMessage}
        forwardingMessage={forwardingMessage}
        onClearForwarding={onClearForwarding}
        currentUserId={currentUserId}
        handleSendVoice={handleSendVoice}
        selectedConversationId={selectedConversationId}
        smartReplyTriggerKey={lastMessageId}
        isTyping={typingUsers.size > 0}
        isLastMessageFromCurrentUser={isLastMessageFromCurrentUser}
        disabledReason={inputDisabledReason}
        disabledTone={inputDisabledTone}
      />

      <CreatePollModal
        isOpen={isCreatePollOpen}
        onClose={() => setIsCreatePollOpen(false)}
        onCreate={handleCreatePoll}
        isCreating={isCreatingPoll}
      />

      <ContactPickerModal
        isOpen={isContactPickerOpen}
        onClose={() => setIsContactPickerOpen(false)}
        conversationId={selectedConversationId}
        friends={friends}
      />

      <VideoPreviewModal
        previewVideoUrl={previewVideoUrl}
        onClose={() => setPreviewVideoUrl(null)}
      />
    </div>
  );
};
