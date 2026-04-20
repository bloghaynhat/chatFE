import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { socketService } from "../../services/socketService";
import { userService } from "../../services/userService";
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
import { getMessageText } from "../../utils/chatUtils";
import type { Message } from "../../types/conversation";
import {
  FiImage,
  FiFile,
  FiGift,
  FiCheckCircle,
  FiX,
  FiMoreVertical,
  FiDownload,
} from "react-icons/fi";

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
    const messageIndex = messages.findIndex(m => (m.id || m._id) === messageId);
    if (messageIndex !== -1) {
      // Calculate required displayCount to ensure this message is visible
      const requiredDisplayCount = messages.length - messageIndex;
      setDisplayCount(prev => Math.max(prev, requiredDisplayCount));
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
      'image/jpeg': [],
      'image/png': [],
      'image/gif': [],
      'image/webp': [],
      'video/mp4': [],
      'video/mpeg': [],
      'video/quicktime': [],
      'audio/mpeg': [],
      'audio/wav': [],
      'application/pdf': []
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
    const senderIds = [...new Set(messages.map(msg => msg.senderId).filter(Boolean))] as string[];

    if (senderIds.length === 0) return messages;

    try {
      // Separate cached and uncached senderIds
      const uncachedSenderIds = senderIds.filter(id => !userCache.current.has(id));

      // Fetch uncached users in parallel
      if (uncachedSenderIds.length > 0) {
        const userPromises = uncachedSenderIds.map(senderId =>
          userService.getUserById(senderId).catch(error => {
            console.warn(`Failed to fetch user ${senderId}:`, error);
            return null;
          })
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
      return messages.map(msg => {
        const senderId = msg.senderId;
        if (senderId && userCache.current.has(senderId)) {
          return {
            ...msg,
            sender: userCache.current.get(senderId)
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

      {isDragActive && (
        <div className="absolute inset-0 z-[100] flex flex-col pointer-events-none">
          {dragType === "image" ? (
            <div className="flex-1 flex flex-col justify-center items-center backdrop-blur-sm bg-white/70 dark:bg-slate-900/70 p-6 md:p-12">
              <div className="flex flex-col gap-6 w-full max-w-3xl h-full pb-16">
                <div className="flex-1 flex flex-col items-center justify-center border-[5px] border-dashed border-blue-500 rounded-[2.5rem] bg-white/95 dark:bg-slate-800/95 shadow-2xl transition-transform hover:scale-[1.01]">
                  <FiImage className="text-6xl md:text-7xl text-blue-500 mb-4" />
                  <p className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">Drop as Image</p>
                  <p className="text-base md:text-lg text-gray-500 dark:text-gray-400 mt-2">Compresses image</p>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center border-[5px] border-dashed border-purple-500 rounded-[2.5rem] bg-white/95 dark:bg-slate-800/95 shadow-2xl transition-transform hover:scale-[1.01]">
                  <FiFile className="text-6xl md:text-7xl text-purple-500 mb-4" />
                  <p className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">Drop as File</p>
                  <p className="text-base md:text-lg text-gray-500 dark:text-gray-400 mt-2">Original quality</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="absolute inset-4 border-4 border-dashed border-blue-500 rounded-3xl backdrop-blur-sm bg-white/70 dark:bg-slate-900/70 flex flex-col items-center justify-center shadow-2xl z-50">
              <FiFile className="text-8xl text-blue-500 mb-6" />
              <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Drop files here to send them</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-4 text-xl">without compression</p>
            </div>
          )}
        </div>
      )}

      {previewFiles.length > 0 && (
        <div className="absolute inset-0 z-[110] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCancelAttachment}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                >
                  <FiX className="text-xl text-gray-500 dark:text-gray-400" />
                </button>
                <h3 className="font-medium text-lg text-gray-800 dark:text-white">
                  Send {previewFiles.length} {previewFiles.length === 1 ? "Photo" : "Photos"}
                </h3>
              </div>
              <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors text-gray-500 dark:text-gray-400">
                <FiMoreVertical className="text-xl" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-2 gap-2">
                {previewFiles.map((file, index) => {
                  const isImage = file.type.startsWith("image/") && file.isImageMode !== false;
                  return (
                    <div
                      key={index}
                      className={`relative rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-700 ${
                        previewFiles.length === 3 && index === 2
                          ? "col-span-2 aspect-video"
                          : previewFiles.length === 5 && index >= 2
                            ? "col-span-1 aspect-square"
                            : "aspect-square"
                      }`}
                    >
                      {isImage ? (
                        <img src={file.preview} alt="preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full p-4">
                          <FiFile className="text-4xl text-blue-500 mb-2" />
                          <span className="text-xs text-center truncate w-full px-2 text-gray-700 dark:text-gray-300">
                            {file.name}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-3 border-t border-gray-100 dark:border-slate-700">
              <input
                type="text"
                placeholder="Add a caption..."
                value={draftMessage}
                onChange={(e) => setDraftMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendAttachedFiles()}
                autoFocus
                className="flex-1 bg-transparent border-none outline-none text-gray-700 dark:text-white placeholder-gray-400"
              />
              <button
                onClick={handleSendAttachedFiles}
                className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-lg font-medium transition-colors text-sm"
              >
                SEND
              </button>
            </div>
          </div>
        </div>
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

      {previewVideoUrl && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setPreviewVideoUrl(null)}
        >
          <button
            className="absolute top-6 right-6 text-white hover:text-gray-300 hover:bg-white/10 p-3 rounded-full z-[10000] transition-colors shadow-lg"
            onClick={() => setPreviewVideoUrl(null)}
          >
            <FiX className="text-3xl" />
          </button>

          <div
            className="relative w-full h-full flex flex-col items-center justify-center p-4 md:p-12 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full max-w-[1200px] aspect-video max-h-[85vh] rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-black ring-1 ring-white/10 relative group">
              <video
                src={previewVideoUrl}
                controls
                autoPlay
                className="w-full h-full object-contain outline-none"
                controlsList="nodownload"
              />
              <a
                href={previewVideoUrl}
                download="video.mp4"
                target="_blank"
                rel="noopener noreferrer"
                className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 backdrop-blur-md border border-white/20 shadow-lg"
                title="Download video"
              >
                <FiDownload className="text-xl" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
