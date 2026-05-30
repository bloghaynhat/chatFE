import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { socketService } from "../../services/socketService";
import { userService } from "../../services/userService";
import { conversationService } from "../../services/conversationService";
import { useDropzone } from "react-dropzone";
import { useFriendManagement } from "../../hooks";
import "react-photo-view/dist/react-photo-view.css";

import { ChatHeader } from "./ActiveChatPane/ChatHeader";
import { MessageList } from "./ActiveChatPane/MessageList";
import { ChatInput } from "./ActiveChatPane/ChatInput";
import { ForwardModal } from "./ActiveChatPane/ForwardModal";
import { CalendarModal } from "./ActiveChatPane/CalendarModal";
import { PinnedBar } from "./ActiveChatPane/PinnedBar";
import { PinnedList } from "./ActiveChatPane/PinnedList";
import { MessageContextMenu } from "./ActiveChatPane/MessageContextMenu";
import { VideoPreviewModal } from "./ActiveChatPane/VideoPreviewModal";
import { FilePreviewModal } from "./ActiveChatPane/FilePreviewModal";
import { DragDropOverlay } from "./ActiveChatPane/DragDropOverlay";
import { getMessageText } from "../../utils/chatUtils";
import type { Message } from "../../types/conversation";
import { useCallV2 } from "../../providers/CallV2SocketProvider";
import { callV2Service } from "../../services/callV2.service";
import type { CallV2Session } from "../../services/callV2.types";
import { FiImage, FiFile, FiGift, FiCheckCircle } from "react-icons/fi";

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
  onForwardToTarget,
  forwardingMessage,
  onClearForwarding,
  isRightSidebarOpen,
  setIsRightSidebarOpen,
  onPinMessage,
  onUnpinMessage,
}: any) => {
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isHeaderSearchOpen, setIsHeaderSearchOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [headerSearchValue, setHeaderSearchValue] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(() => new Date());
  const [draftMessage, setDraftMessage] = useState("");
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [replyingMessage, setReplyingMessage] = useState<Message | null>(null);
  const [isPinnedListOpen, setIsPinnedListOpen] = useState(false);

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

  const [displayCount, setDisplayCount] = useState(20);

  // File upload state for UI/UX
  const [dragType, setDragType] = useState(null); // 'image' or 'file'
  const [previewFiles, setPreviewFiles] = useState([]);
  const [compressImage, setCompressImage] = useState(true);

  const [previewVideoUrl, setPreviewVideoUrl] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [forwardModalVisible, setForwardModalVisible] = useState(false);
  const [messageToForward, setMessageToForward] = useState(null);

  const callV2 = useCallV2();
  const [activeCallV2, setActiveCallV2] = useState<CallV2Session | null>(null);

  // Computed pinned messages from messages (real-time from socket)
  const [enrichedPinnedMessages, setEnrichedPinnedMessages] = useState<Message[]>([]);

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

  const resolveInviteeIds = useCallback(async () => {
    const isGroup =
      selectedChat?.type === "GROUP" ||
      selectedChat?.type === "group" ||
      (selectedChat?.members && selectedChat.members.length > 2);

    if (!isGroup) {
      const targetUserId = selectedChat?.targetUserId || selectedChat?.participantId;
      return targetUserId ? [targetUserId] : [];
    }

    const rawMembers = selectedChat?.members || selectedChat?.participants || [];
    let inviteeIds = Array.isArray(rawMembers)
      ? rawMembers.map((member) => member?.userId || member?.id || member?._id).filter(Boolean)
      : [];

    if (inviteeIds.length === 0 && selectedConversationId) {
      try {
        const membersData = await conversationService.getGroupMembers(selectedConversationId);
        const rawList = Array.isArray(membersData) ? membersData : membersData?.members || membersData?.data || [];
        inviteeIds = rawList
          .map((member: any) => member?.userId || member?.user?.id || member?.user?._id || member?.id || member?._id)
          .filter(Boolean);
      } catch (err) {
        console.warn("Failed to load group members for call", err);
      }
    }

    return inviteeIds.filter((id) => id && id !== currentUserId);
  }, [selectedChat, selectedConversationId, currentUserId]);

  const handleStartCall = useCallback(
    async (type: "audio" | "video") => {
      const conversationId = selectedConversationId || selectedChat?.id;
      if (!conversationId) return;

      const isGroup =
        selectedChat?.type === "GROUP" ||
        selectedChat?.type === "group" ||
        (selectedChat?.members && selectedChat.members.length > 2);

      const inviteeIds = await resolveInviteeIds();
      await callV2.startCallV2(conversationId, type, inviteeIds.length > 0 ? inviteeIds : undefined, isGroup);
    },
    [callV2, resolveInviteeIds, selectedConversationId, selectedChat],
  );

  const refreshActiveCallV2 = useCallback(async () => {
    const conversationId = selectedConversationId || selectedChat?.id;
    if (!conversationId) {
      setActiveCallV2(null);
      return;
    }

    const activeCall = await callV2Service.getActiveCallByConversation(conversationId);
    setActiveCallV2(activeCall);
  }, [selectedConversationId, selectedChat?.id]);

  const handleJoinActiveCallV2 = useCallback(async () => {
    const conversationId = selectedConversationId || selectedChat?.id;
    if (!conversationId || !activeCallV2) return;
    await callV2.joinExistingCallV2(activeCallV2.callId, conversationId, activeCallV2.type);
    await refreshActiveCallV2();
  }, [activeCallV2, callV2, refreshActiveCallV2, selectedConversationId, selectedChat?.id]);

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
    // Find the message index in the full messages array
    const messageIndex = messages.findIndex((m) => (m.id || m._id) === messageId);
    if (messageIndex !== -1) {
      // Calculate required displayCount to ensure this message is visible
      const requiredDisplayCount = messages.length - messageIndex;
      setDisplayCount((prev) => Math.max(prev, requiredDisplayCount));
    }

    // Scroll after a short delay to allow DOM update
    setTimeout(() => {
      const messageElement = document.getElementById(`message-${messageId}`);
      if (messageElement) {
        messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
        // Add highlight effect
        messageElement.classList.add("bg-orange-100", "dark:bg-emerald-900/60", "ring-2", "ring-blue-500");
        setTimeout(() => {
          messageElement.classList.remove("bg-orange-100", "dark:bg-emerald-900/60", "ring-2", "ring-blue-500");
        }, 2000);
      }
    }, 100);
  };

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
  const enrichMessagesWithSenderInfo = async (messages: Message[]): Promise<Message[]> => {
    if (!messages || messages.length === 0) return messages;

    // Extract unique senderIds
    const senderIds = [...new Set(messages.map((msg) => msg.senderId).filter(Boolean))] as string[];

    if (senderIds.length === 0) return messages;

    try {
      // Separate cached and uncached senderIds
      const uncachedSenderIds = senderIds.filter((id) => !userCache.current.has(id));

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

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, typingUsers]);

  useEffect(() => {
    setDisplayCount(20);
    setTimeout(() => scrollToBottom("auto"), 100);
  }, [selectedConversationId]);

  useEffect(() => {
    if (!isLoading) {
      setTimeout(() => scrollToBottom("auto"), 100);
    }
  }, [isLoading]);

  const visibleMessages = useMemo(() => {
    return messages.length > displayCount ? messages.slice(messages.length - displayCount) : messages;
  }, [messages, displayCount]);

  useEffect(() => {
    if (firstMessageRef.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && displayCount < messages.length) {
            setDisplayCount((prev) => Math.min(prev + 20, messages.length));
          }
        },
        { rootMargin: "100px", threshold: 0.1 },
      );

      const el = firstMessageRef.current;
      observer.observe(el);
      return () => observer.unobserve(el);
    }
  }, [displayCount, messages.length, visibleMessages]);

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
      id: "gift-premium",
      label: "Gift Premium",
      icon: FiGift,
    },
    {
      id: "checklist",
      label: "Checklist",
      icon: FiCheckCircle,
    },
  ];

  const calendarMonthLabel = calendarMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const selectedCalendarHeadline = selectedCalendarDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
  });

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
    (calendarMonth.getFullYear() === todayStart.getFullYear() && calendarMonth.getMonth() >= todayStart.getMonth());

  useEffect(() => {
    if (!isAttachMenuOpen && !isMoreMenuOpen && !isEmojiPickerOpen) return;

    const handleOutsideClick = (event) => {
      const isInsideAttach = attachMenuRef.current && attachMenuRef.current.contains(event.target);
      const isInsideMore = moreMenuRef.current && moreMenuRef.current.contains(event.target);
      const isInsideEmoji = emojiMenuRef.current && emojiMenuRef.current.contains(event.target);

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
    setDisplayCount(20);
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
    setDraftMessage("");
  }, [selectedChat?.id]);

  const handleInputChange = (event) => {
    setDraftMessage(event.target.value);
    const isGroup =
      selectedChat?.type === "GROUP" ||
      selectedChat?.type === "group" ||
      (selectedChat?.members && selectedChat.members.length > 2);
    const targetId = isGroup ? selectedConversationId : selectedChat?.targetUserId;

    if (targetId) {
      if (!isTypingRef.current) {
        socketService.startTyping(targetId, isGroup);
        isTypingRef.current = true;
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        isTypingRef.current = false;
        socketService.stopTyping(targetId, isGroup);
      }, 3000);
    }
  };

  const handleSendMessage = () => {
    if (!draftMessage.trim() && !forwardingMessage && !editingMessage && !replyingMessage) return;

    if (onSendMessage) {
      if (editingMessage) {
        const payload = {
          id: editingMessage.id || editingMessage._id,
          text: draftMessage.trim(),
          type: "edit",
        };
        onSendMessage(payload);
        setEditingMessage(null);
      } else {
        const payload = {
          text: draftMessage.trim(),
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
        const isGroup =
          selectedChat?.type === "GROUP" ||
          selectedChat?.type === "group" ||
          (selectedChat?.members && selectedChat.members.length > 2);
        const targetId = isGroup ? selectedConversationId : selectedChat?.targetUserId;
        socketService.stopTyping(targetId, isGroup);
      }
    }
  };

  const handleSendVoice = (voiceFile: any) => {
    if (onSendMessage) {
      const fileWithPreview = Object.assign(voiceFile, {
        preview: URL.createObjectURL(voiceFile),
        isImageMode: false,
      });
      onSendMessage("", [fileWithPreview], { compress: false });
    }
  };

  if (!selectedChat) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500">
        <p>Select a chat to start messaging</p>
      </div>
    );
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

      <ChatHeader
        selectedConversationId={selectedConversationId}
        selectedChat={selectedChat}
        currentUserId={currentUserId}
        isLoading={isLoading}
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
        displayCount={displayCount}
        onRetry={onRetry}
        currentUserId={currentUserId}
        typingUsers={typingUsers}
        selectedChat={selectedChat}
        firstMessageRef={firstMessageRef}
        messagesEndRef={messagesEndRef}
        handleContextMenu={handleContextMenu}
        setPreviewVideoUrl={setPreviewVideoUrl}
        onNavigateToMessage={handleNavigateToMessage}
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
          onRevokeMessage={onRevokeMessage}
          onDeleteMessageForMe={onDeleteMessageForMe}
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
        attachActions={attachActions}
        editingMessage={editingMessage}
        setEditingMessage={setEditingMessage}
        replyingMessage={replyingMessage}
        setReplyingMessage={setReplyingMessage}
        forwardingMessage={forwardingMessage}
        onClearForwarding={onClearForwarding}
        currentUserId={currentUserId}
        handleSendVoice={handleSendVoice}
      />

      <VideoPreviewModal previewVideoUrl={previewVideoUrl} onClose={() => setPreviewVideoUrl(null)} />
    </div>
  );
};
