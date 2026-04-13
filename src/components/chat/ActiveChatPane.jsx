import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { socketService } from "../../services/socketService";
import {
  FiMessageCircle,
  FiRefreshCw,
  FiPhone,
  FiSearch,
  FiMoreVertical,
  FiSmile,
  FiPaperclip,
  FiMic,
  FiImage,
  FiFile,
  FiGift,
  FiCheckCircle,
  FiClock,
  FiBellOff,
  FiVideo,
  FiShare2,
  FiLock,
  FiEyeOff,
  FiTrash2,
  FiChevronLeft,
  FiChevronRight,
  FiHeart,
  FiThumbsUp,
  FiThumbsDown,
  FiZap,
  FiFilm,
  FiDelete,
  FiX,
  FiCalendar,
  FiSend,
  FiCornerUpLeft,
  FiEdit2,
  FiCopy,
  FiMapPin,
  FiCheck,
  FiCornerUpRight,
  FiBookmark,
  FiRotateCcw,
  FiDownload,
} from "react-icons/fi";
import { useDropzone } from "react-dropzone";
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";
import { useFriendManagement } from "../../hooks";
import { conversationService } from "../../services";

const getMessageId = (message, index) =>
  message?.id || message?._id || `${index}-${message?.createdAt || "msg"}`;
const getMessageText = (message) =>
  message?.text || message?.content || message?.message || "";
const getMessageTime = (message) => {
  const value = message?.createdAt || message?.updatedAt || message?.time;
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const getDateLabel = (dateValue) => {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
};

const CALENDAR_WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

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
  onForwardToTarget,
  forwardingMessage,
  onClearForwarding,
}) => {
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
  const [draftMessage, setDraftMessage] = useState("");
  const [editingMessage, setEditingMessage] = useState(null);
  const attachMenuRef = useRef(null);
  const moreMenuRef = useRef(null);
  const emojiMenuRef = useRef(null);
  const headerSearchInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);
  const messagesEndRef = useRef(null);
  const firstMessageRef = useRef(null);

  const [displayCount, setDisplayCount] = useState(20);

  // File upload state for UI/UX
  const [dragType, setDragType] = useState(null); // 'image' or 'file'
  const [previewFiles, setPreviewFiles] = useState([]);
  const [compressImage, setCompressImage] = useState(true); // for split screen selection

  const [contextMenu, setContextMenu] = useState(null);

  const [forwardModalVisible, setForwardModalVisible] = useState(false);
  const [messageToForward, setMessageToForward] = useState(null);
  const { friends, fetchFriends } = useFriendManagement();

  useEffect(() => {
    if (forwardModalVisible) {
      fetchFriends();
    }
  }, [forwardModalVisible]);

  const handleOpenForwardModal = (message) => {
    setMessageToForward(message);
    setForwardModalVisible(true);
    setContextMenu(null);
  };

  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(null);
    };
    document.addEventListener("click", handleClickOutside);
    // document.addEventListener("contextmenu", handleClickOutside); // if we listen here, it closes immediately if propagation isn't stopped
    return () => {
      document.removeEventListener("click", handleClickOutside);
      // document.removeEventListener("contextmenu", handleClickOutside);
    };
  }, []);

  const handleContextMenu = (e, message) => {
    e.preventDefault();
    e.stopPropagation();

    // adjust menu position assuming fixed width/height
    const menuWidth = 200;
    const menuHeight = 310;
    let x = e.clientX;
    let y = e.clientY;

    if (x + menuWidth > window.innerWidth) {
      x -= menuWidth;
    }
    if (y + menuHeight > window.innerHeight) {
      y -= menuHeight;
    }

    setContextMenu({
      x,
      y,
      message,
    });
  };

  const onDrop = useCallback((acceptedFiles, fileRejections, event) => {
    if (acceptedFiles?.length === 0) return;

    let isImageDrop = true;
    if (event && event.clientY) {
      // Assuming split is roughly vertical half-half when dragType === "image"
      isImageDrop = event.clientY < window.innerHeight / 2;
    }

    // Determine the type: if any file is not an image, treat it as a 'file'
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
    setDragType(null); // close drag overlay upon drop
    // Compress is defaulted to true, user can toggle in overlay if they hovered over "uncompressed" option if we had one
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragAccept } =
    useDropzone({
      onDrop,
      noClick: true,
      noKeyboard: true,
      onDragEnter: (e) => {
        // Basic check, dropzone doesn't give us item types reliably until drop.
        // We will default drag overlay but can't fully know if it's image or file until drop or reading datatransfer items.
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
      onDragLeave: () => {
        setDragType(null);
      },
    });

  const handleSendAttachedFiles = () => {
    // Here we'd map over previewFiles and send them along with draftMessage
    // This assumes onSendMessage deals with file attachments
    if (previewFiles.length === 0) return;

    // Call the parent handler
    onSendMessage(draftMessage, previewFiles, { compress: compressImage });

    // Clear state
    previewFiles.forEach((file) => URL.revokeObjectURL(file.preview));
    setPreviewFiles([]);
    setDraftMessage("");
  };

  const handleCancelAttachment = () => {
    previewFiles.forEach((file) => URL.revokeObjectURL(file.preview));
    setPreviewFiles([]);
    setDragType(null);
  };

  const scrollToBottom = (behavior = "smooth") => {
    // Only scroll if we are near the bottom to avoid snapping when loading older messages
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, typingUsers]);

  // Scroll to bottom immediately when switching conversation
  useEffect(() => {
    setDisplayCount(20); // Reset display count on chat switch
    setTimeout(() => {
      scrollToBottom("auto");
    }, 100);
  }, [selectedConversationId]);

  // Force scroll when data finishes loading
  useEffect(() => {
    if (!isLoading) {
      setTimeout(() => {
        scrollToBottom("auto");
      }, 100);
    }
  }, [isLoading]);

  const visibleMessages = useMemo(() => {
    return messages.length > displayCount
      ? messages.slice(messages.length - displayCount)
      : messages;
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
    },
    {
      id: "document",
      label: "Document",
      icon: FiFile,
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

  const moreActions = [
    {
      id: "auto-delete",
      label: "Auto-delete",
      icon: FiClock,
      hasChevron: true,
    },
    { id: "mute", label: "Mute", icon: FiBellOff },
    { id: "call", label: "Call", icon: FiPhone },
    { id: "video-call", label: "Video Call", icon: FiVideo },
    { id: "select-messages", label: "Select Messages", icon: FiCheckCircle },
    { id: "share-contact", label: "Share contact", icon: FiShare2 },
    { id: "send-gift", label: "Send a Gift", icon: FiGift },
    { id: "block-user", label: "Block user", icon: FiLock },
    { id: "disable-sharing", label: "Disable Sharing", icon: FiEyeOff },
    { id: "delete-chat", label: "Delete Chat", icon: FiTrash2, danger: true },
  ];

  const frequentEmojis = [
    "😂",
    "😘",
    "❤️",
    "😍",
    "😊",
    "😁",
    "👍",
    "😌",
    "😔",
    "😄",
    "😭",
    "💋",
    "😒",
    "😳",
    "😜",
    "🙈",
    "😉",
    "😀",
    "😥",
    "😝",
    "😱",
    "😡",
    "😏",
    "😞",
    "😅",
    "😚",
    "🙊",
    "🤤",
    "😃",
    "😋",
    "😆",
    "👌",
  ];

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
    const leadingEmptyDays = (firstDay.getDay() + 6) % 7; // monday-first
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
    setDisplayCount(20); // Reset message count when switching chats
  }, [selectedChat?.id]);

  useEffect(() => {
    if (!isCalendarModalOpen) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsCalendarModalOpen(false);
      }
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

    // Xác định đang chat nhóm hay cá nhân
    const isGroup =
      selectedChat?.type === "GROUP" || !selectedChat?.targetUserId;
    const targetId = isGroup
      ? selectedConversationId
      : selectedChat?.targetUserId;

    if (targetId) {
      if (!isTypingRef.current) {
        socketService.startTyping(targetId, isGroup);
        isTypingRef.current = true;
      }

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        isTypingRef.current = false;
        socketService.stopTyping(targetId, isGroup);
      }, 3000);
    }
  };

  const handleSendMessage = () => {
    if (!draftMessage.trim() && !forwardingMessage && !editingMessage) return;

    if (onSendMessage) {
      if (editingMessage) {
        // Make the update API call or handle editing via parent
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
        };
        onSendMessage(payload);
      }

      setDraftMessage("");
      if (onClearForwarding) onClearForwarding();

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (isTypingRef.current) {
        isTypingRef.current = false;
        const isGroup =
          selectedChat?.type === "GROUP" || !selectedChat?.targetUserId;
        const targetId = isGroup
          ? selectedConversationId
          : selectedChat?.targetUserId;
        socketService.stopTyping(targetId, isGroup);
      }
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

      {/* Drag Overlay */}
      {isDragActive && (
        <div className="absolute inset-0 z-[100] flex flex-col pointer-events-none">
          {dragType === "image" ? (
            <div className="flex-1 flex flex-col justify-center items-center backdrop-blur-sm bg-white/70 dark:bg-slate-900/70 p-6 md:p-12">
              <div className="flex flex-col gap-6 w-full max-w-3xl h-full pb-16">
                <div className="flex-1 flex flex-col items-center justify-center border-[5px] border-dashed border-blue-500 rounded-[2.5rem] bg-white/95 dark:bg-slate-800/95 shadow-2xl transition-transform hover:scale-[1.01]">
                  <FiImage className="text-6xl md:text-7xl text-blue-500 mb-4" />
                  <p className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
                    Drop as Image
                  </p>
                  <p className="text-base md:text-lg text-gray-500 dark:text-gray-400 mt-2">
                    Compresses image
                  </p>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center border-[5px] border-dashed border-purple-500 rounded-[2.5rem] bg-white/95 dark:bg-slate-800/95 shadow-2xl transition-transform hover:scale-[1.01]">
                  <FiFile className="text-6xl md:text-7xl text-purple-500 mb-4" />
                  <p className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
                    Drop as File
                  </p>
                  <p className="text-base md:text-lg text-gray-500 dark:text-gray-400 mt-2">
                    Original quality
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="absolute inset-4 border-4 border-dashed border-blue-500 rounded-3xl backdrop-blur-sm bg-white/70 dark:bg-slate-900/70 flex flex-col items-center justify-center shadow-2xl z-50">
              <FiFile className="text-8xl text-blue-500 mb-6" />
              <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
                Drop files here to send them
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mt-4 text-xl">
                without compression
              </p>
            </div>
          )}
        </div>
      )}

      {/* Preview Modal */}
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
                  Send {previewFiles.length}{" "}
                  {previewFiles.length === 1 ? "Photo" : "Photos"}
                </h3>
              </div>
              <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors text-gray-500 dark:text-gray-400">
                <FiMoreVertical className="text-xl" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-2 gap-2">
                {previewFiles.map((file, index) => {
                  const isImage =
                    file.type.startsWith("image/") &&
                    file.isImageMode !== false;
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
                        <img
                          src={file.preview}
                          alt="preview"
                          className="w-full h-full object-cover"
                        />
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
                onKeyDown={(e) =>
                  e.key === "Enter" && handleSendAttachedFiles()
                }
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

      <div className="px-4 lg:px-5 py-2.5 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        {!isHeaderSearchOpen ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold flex items-center justify-center overflow-hidden">
                {selectedChat.avatarUrl ? (
                  <img
                    src={selectedChat.avatarUrl}
                    alt={selectedChat.name || selectedChat.displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (
                    selectedChat.name ||
                    selectedChat.displayName ||
                    (selectedChat.participants || []).find(
                      (p) => p.userId !== currentUserId,
                    )?.displayName ||
                    "U"
                  )
                    ?.charAt(0)
                    ?.toUpperCase()
                )}
              </div>

              <div className="min-w-0">
                <p className="font-semibold text-[15px] text-gray-900 dark:text-white truncate">
                  {selectedChat.name ||
                    selectedChat.displayName ||
                    (selectedChat.participants || []).find(
                      (p) => p.userId !== currentUserId,
                    )?.displayName ||
                    "Unknown"}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  {isLoading
                    ? "Opening conversation..."
                    : "last seen 1 hour ago"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-300">
              <button className="h-8 w-8 lg:h-9 lg:w-9 inline-flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition">
                <FiPhone className="text-base lg:text-lg" />
              </button>
              <button
                onClick={() => {
                  setIsHeaderSearchOpen(true);
                  setIsMoreMenuOpen(false);
                  setIsAttachMenuOpen(false);
                  setIsEmojiPickerOpen(false);
                }}
                className="h-8 w-8 lg:h-9 lg:w-9 inline-flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition"
                title="Search in conversation"
              >
                <FiSearch className="text-base lg:text-lg" />
              </button>
              <div ref={moreMenuRef} className="relative">
                <button
                  onClick={() => {
                    setIsMoreMenuOpen((prev) => !prev);
                    setIsAttachMenuOpen(false);
                    setIsEmojiPickerOpen(false);
                  }}
                  className={`h-8 w-8 lg:h-9 lg:w-9 inline-flex items-center justify-center rounded-full transition ${isMoreMenuOpen ? "bg-gray-100 dark:bg-slate-800" : "hover:bg-gray-100 dark:hover:bg-slate-800"}`}
                  title="Open conversation actions"
                >
                  <FiMoreVertical className="text-base lg:text-lg" />
                </button>

                <div
                  className={`absolute right-0 top-10 w-[260px] max-w-[84vw] rounded-2xl bg-[#edf4f1] dark:bg-slate-800 shadow-2xl p-2 border border-white/70 dark:border-slate-700 z-50 origin-top-right will-change-transform transition-all duration-200 ease-out ${isMoreMenuOpen ? "opacity-100 scale-100 translate-y-0 pointer-events-auto" : "opacity-0 scale-95 -translate-y-1 pointer-events-none"}`}
                  aria-hidden={!isMoreMenuOpen}
                >
                  {moreActions.map((action) => {
                    const ActionIcon = action.icon;
                    return (
                      <button
                        key={action.id}
                        onClick={() => setIsMoreMenuOpen(false)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-[14px] leading-none hover:bg-white/75 dark:hover:bg-slate-700/80 transition ${action.danger ? "text-red-500" : "text-gray-900 dark:text-gray-100"}`}
                      >
                        <ActionIcon className="text-[18px] shrink-0" />
                        <span className="font-semibold tracking-tight flex-1">
                          {action.label}
                        </span>
                        {action.hasChevron && (
                          <FiChevronRight className="text-[16px] text-gray-400 dark:text-gray-500" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 animate-in fade-in duration-200">
            <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold flex items-center justify-center overflow-hidden shrink-0">
              {selectedChat.avatarUrl ? (
                <img
                  src={selectedChat.avatarUrl}
                  alt={selectedChat.name || selectedChat.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                (
                  selectedChat.name ||
                  selectedChat.displayName ||
                  (selectedChat.participants || []).find(
                    (p) => p.userId !== currentUserId,
                  )?.displayName ||
                  "U"
                )
                  ?.charAt(0)
                  ?.toUpperCase()
              )}
            </div>

            <div className="flex-1 h-9 lg:h-10 rounded-full bg-gray-100 dark:bg-slate-800 border border-gray-200/80 dark:border-slate-700 px-3.5 flex items-center gap-2.5 shadow-inner">
              <FiSearch className="text-[18px] text-gray-400 dark:text-gray-500" />
              <input
                ref={headerSearchInputRef}
                type="text"
                value={headerSearchValue}
                onChange={(event) => setHeaderSearchValue(event.target.value)}
                placeholder="Search"
                className="flex-1 bg-transparent text-[14px] lg:text-[15px] leading-normal text-gray-700 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none"
              />
              <button
                onClick={() => {
                  setHeaderSearchValue("");
                  setIsHeaderSearchOpen(false);
                  setIsCalendarModalOpen(false);
                }}
                className="h-7 w-7 inline-flex items-center justify-center rounded-full text-gray-400 dark:text-gray-500 hover:bg-gray-200/70 dark:hover:bg-slate-700 transition"
                title="Close search"
              >
                <FiX className="text-[20px]" />
              </button>
            </div>

            <button
              onClick={() => {
                setIsCalendarModalOpen(true);
                setCalendarMonth(new Date(selectedCalendarDate));
                setIsMoreMenuOpen(false);
                setIsAttachMenuOpen(false);
                setIsEmojiPickerOpen(false);
              }}
              className="h-8 w-8 lg:h-9 lg:w-9 inline-flex items-center justify-center rounded-full text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition shrink-0"
              title="Search by date"
            >
              <FiCalendar className="text-[20px] lg:text-[22px]" />
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 lg:px-6 pt-4 pb-24 bg-[linear-gradient(120deg,_rgba(245,245,200,0.75)_0%,_rgba(184,220,185,0.78)_45%,_rgba(143,198,169,0.8)_100%)] dark:bg-[linear-gradient(120deg,_rgba(30,41,59,0.9)_0%,_rgba(22,78,99,0.85)_50%,_rgba(30,58,138,0.82)_100%)]">
        {isLoading && (
          <div className="h-full flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
            Opening conversation...
          </div>
        )}

        {!isLoading && error && (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
            <p className="text-sm text-red-600 dark:text-red-400">
              Couldn’t open this conversation
            </p>
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm transition"
            >
              <FiRefreshCw className="text-sm" />
              Try again
            </button>
          </div>
        )}

        {!isLoading && !error && messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center">
            <div className="bg-black/15 dark:bg-black/30 rounded-[20px] p-6 px-8 flex flex-col items-center justify-center text-center max-w-[300px] backdrop-blur-md border border-white/10 shadow-sm">
              <span className="text-white dark:text-white/90 font-semibold text-[15px] mb-1">
                No messages here yet...
              </span>
              <span className="text-white/90 dark:text-white/70 text-[14px] mb-5">
                Send a message or tap the greeting below.
              </span>
              <div className="text-[70px] drop-shadow-md hover:scale-110 transition-transform cursor-pointer">
                👋
              </div>
            </div>
          </div>
        )}

        {!isLoading && !error && visibleMessages.length > 0 && (
          <PhotoProvider maskOpacity={0.8}>
            <div className="flex flex-col gap-3 items-start max-w-4xl mx-auto w-full">
              <div className="mx-auto px-3 py-1 rounded-full text-xs font-semibold bg-white/80 dark:bg-slate-800/80 text-gray-600 dark:text-gray-300 shadow-sm transition-all duration-300 ease-in-out">
                {displayCount < messages.length ? (
                  <div className="flex items-center gap-2">
                    <FiRefreshCw className="animate-spin" />
                    Loading older messages...
                  </div>
                ) : (
                  getDateLabel(visibleMessages[0]?.createdAt) || "Today"
                )}
              </div>

              {visibleMessages.map((message, index) => {
                const rawText = getMessageText(message);
                const mine = Boolean(
                  message?.isMine ||
                  message?.sender?.isMe ||
                  (currentUserId && message?.senderId === currentUserId),
                );

                // Parse forwarded message
                let isForwarded = Boolean(message?.originalMessageId);
                let fwData = null;
                let text = rawText;

                if (
                  typeof rawText === "string" &&
                  rawText.startsWith("[FWM]::")
                ) {
                  isForwarded = true;
                  try {
                    fwData = JSON.parse(rawText.replace("[FWM]::", ""));
                    text = fwData.text || "";
                  } catch (e) {
                    text = rawText;
                  }
                } else if (isForwarded) {
                  // Fallback for API forwarded message
                  fwData = {
                    senderName:
                      message?.originalMessage?.senderName ||
                      message?.originalMessage?.sender?.displayName ||
                      message?.originalMessage?.sender?.username ||
                      "Unknown",
                    senderAvatarStr: "U",
                    text:
                      message?.originalMessage?.text ||
                      message?.originalMessage?.content ||
                      rawText ||
                      "Forwarded Message",
                  };
                  if (fwData.senderName !== "Unknown") {
                    fwData.senderAvatarStr = fwData.senderName
                      .charAt(0)
                      .toUpperCase();
                  }
                }

                // Simple check for attachments
                const messageFiles = message?.files || message?.media || [];

                // Extract all images
                const images = messageFiles.filter(
                  (f) =>
                    f?.type === "image" ||
                    f?.type === "IMAGE" ||
                    f?.type?.startsWith("image/") ||
                    f?.mimetype?.startsWith("image/") ||
                    f?.url?.match(/\.(jpeg|jpg|gif|png|webp|heic)$/i),
                );

                // If there's a top-level imageUrl but it's not in the array, add it
                if (message?.imageUrl && images.length === 0) {
                  images.push({ url: message.imageUrl, type: "image/jpeg" });
                }

                // Extract all videos
                const videos = messageFiles.filter(
                  (f) =>
                    f?.type === "video" ||
                    f?.type === "VIDEO" ||
                    f?.type?.startsWith("video/") ||
                    f?.mimetype?.startsWith("video/") ||
                    f?.url?.match(/\.(mp4|webm|ogg|mov)$/i),
                );

                const isImage = images.length > 0;
                const isVideo = videos.length > 0;

                const isDocument =
                  !isImage &&
                  !isVideo &&
                  (message?.type === "document" ||
                    message?.type === "DOCUMENT" ||
                    message?.type === "file" ||
                    (messageFiles &&
                      messageFiles.length > 0 &&
                      !images.includes(messageFiles[0]) &&
                      !videos.includes(messageFiles[0])));

                // If it's classified as an image, don't show it as a document block
                const isFirst = index === 0;

                const hasText = !!text && text.trim() !== "";
                const onlyImagesOrVideos =
                  (isImage || isVideo) &&
                  !hasText &&
                  !isDocument &&
                  !isForwarded;

                if (message.isRevoked || message.deletedAt) {
                  return (
                    <div
                      ref={isFirst ? firstMessageRef : null}
                      key={getMessageId(message, index)}
                      className={`w-fit max-w-[74%] lg:max-w-[68%] rounded-2xl text-[14px] shadow-sm flex flex-col relative px-3 py-2 border border-gray-100 dark:border-slate-700/50 bg-black/[0.02] dark:bg-white/[0.02] ${
                        mine
                          ? "self-end rounded-br-md"
                          : "self-start rounded-bl-md"
                      }`}
                    >
                      <span className="text-gray-500 dark:text-gray-400 italic font-medium">
                        Message recalled
                      </span>
                    </div>
                  );
                }

                return (
                  <div
                    ref={isFirst ? firstMessageRef : null}
                    key={getMessageId(message, index)}
                    onContextMenu={(e) => handleContextMenu(e, message)}
                    className={`w-fit max-w-[74%] lg:max-w-[68%] rounded-2xl text-sm shadow-sm flex flex-col relative ${
                      mine
                        ? "self-end bg-[#d9fdd3] dark:bg-emerald-900/70 text-gray-900 dark:text-emerald-50 rounded-br-md"
                        : "self-start bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-100 rounded-bl-md"
                    }`}
                  >
                    {isForwarded && fwData && (
                      <div className="px-2.5 pt-2 pb-1 flex flex-col gap-0.5">
                        <span className="text-[13px] font-medium text-emerald-600 dark:text-emerald-400">
                          Forwarded from
                        </span>
                        <div className="flex items-center gap-1.5 opacity-90">
                          <div className="w-[18px] h-[18px] rounded-full bg-pink-500 flex items-center justify-center text-white text-[9px] font-bold shrink-0 shadow-sm">
                            {fwData.senderAvatarStr || "U"}
                          </div>
                          <span className="font-semibold text-[14px] text-emerald-700 dark:text-emerald-300 tracking-tight">
                            {fwData.senderName || "Unknown"}
                          </span>
                        </div>
                      </div>
                    )}

                    {isImage && (
                      <div
                        className={`p-1 cursor-pointer overflow-hidden ${hasText ? "pb-0 rounded-t-lg" : "rounded-lg"} relative`}
                      >
                        {images.length === 1 ? (
                          <PhotoView
                            src={
                              images[0].url || images[0].preview || images[0]
                            }
                          >
                            <img
                              src={
                                images[0].url || images[0].preview || images[0]
                              }
                              alt="Message image"
                              className="w-full max-w-[340px] max-h-[400px] rounded-lg object-contain"
                            />
                          </PhotoView>
                        ) : (
                          <div
                            className={`grid gap-0.5 rounded-lg overflow-hidden max-w-[340px] ${
                              images.length === 2 || images.length === 4
                                ? "grid-cols-2"
                                : images.length === 3
                                  ? "grid-cols-2"
                                  : "grid-cols-3"
                            }`}
                          >
                            {images.map((img, i) => (
                              <PhotoView
                                key={i}
                                src={img.url || img.preview || img}
                              >
                                <div
                                  className={`relative ${
                                    images.length === 3 && i === 0
                                      ? "col-span-2 aspect-[2/1]"
                                      : "aspect-square"
                                  }`}
                                >
                                  <img
                                    src={img.url || img.preview || img}
                                    alt={`Image ${i}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              </PhotoView>
                            ))}
                          </div>
                        )}
                        {onlyImagesOrVideos && (
                          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/40 rounded-full flex items-center justify-end gap-[4px] text-white">
                            {message.isEdited && (
                              <span className="italic font-semibold text-[10px]">
                                edited
                              </span>
                            )}
                            <span className="text-[11px] font-medium leading-none">
                              {getMessageTime(message)}
                            </span>
                            {mine && (
                              <span className="flex -space-x-[3px] ml-0.5">
                                <FiCheck className="text-[12px]" />
                                <FiCheck className="text-[12px]" />
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {isVideo && (
                      <div
                        className={`p-1 cursor-pointer overflow-hidden ${hasText ? "pb-0 rounded-t-lg" : "rounded-lg"} relative`}
                      >
                        <div className="grid gap-0.5 rounded-lg overflow-hidden max-w-[340px] grid-cols-1">
                          {videos.map((vid, i) => (
                            <div
                              key={i}
                              className="relative w-full bg-black rounded-lg overflow-hidden group flex justify-center items-center"
                            >
                              <video
                                src={
                                  vid.url ||
                                  vid.preview ||
                                  (typeof vid === "string" ? vid : "")
                                }
                                controls
                                className="w-full h-auto max-h-[400px] object-contain"
                              />
                              <a
                                href={
                                  vid.url ||
                                  vid.preview ||
                                  (typeof vid === "string" ? vid : "")
                                }
                                download={
                                  vid.filename || vid.name || "video.mp4"
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <FiDownload className="text-sm" />
                              </a>
                            </div>
                          ))}
                        </div>
                        {onlyImagesOrVideos && (
                          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/40 rounded-full flex items-center justify-end gap-[4px] text-white pointer-events-none">
                            {message.isEdited && (
                              <span className="italic font-semibold text-[10px]">
                                edited
                              </span>
                            )}
                            <span className="text-[11px] font-medium leading-none">
                              {getMessageTime(message)}
                            </span>
                            {mine && (
                              <span className="flex -space-x-[3px] ml-0.5">
                                <FiCheck className="text-[12px]" />
                                <FiCheck className="text-[12px]" />
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {isDocument &&
                      (() => {
                        const file =
                          message?.file || (messageFiles && messageFiles[0]);
                        const fileName =
                          file?.name ||
                          file?.filename ||
                          file?.originalName ||
                          "Document";
                        const fileSize = file?.size
                          ? `${(file.size / 1024).toFixed(0)} KB`
                          : "";
                        const fileUrl =
                          file?.url ||
                          file?.preview ||
                          (typeof file === "string" ? file : "");
                        return (
                          <div className="flex items-center justify-between p-3 bg-black/5 dark:bg-white/5 rounded-t-2xl gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 ${mine ? "bg-emerald-600" : "bg-blue-500"}`}
                              >
                                <FiFile className="text-xl" />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <a
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-medium truncate hover:underline cursor-pointer text-sm"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {fileName}
                                </a>
                                <span className="text-xs opacity-70">
                                  {fileSize}
                                </span>
                              </div>
                            </div>
                            {fileUrl && (
                              <a
                                href={fileUrl}
                                download={fileName}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="shrink-0 p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-gray-500 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <FiDownload className="text-lg" />
                              </a>
                            )}
                          </div>
                        );
                      })()}

                    {!onlyImagesOrVideos && (
                      <div className="px-3 pb-2 pt-2 cursor-default relative">
                        {!!text && (
                          <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">
                            {text}
                          </p>
                        )}
                        <p
                          className={`mt-1 text-[11.5px] font-medium tracking-tight flex items-center justify-end gap-[5px] ${mine ? "text-emerald-700/80 dark:text-emerald-200/80" : "text-gray-400 dark:text-gray-500"}`}
                        >
                          {message.isEdited && (
                            <span className="italic font-semibold opacity-75 text-[10.5px] tracking-normal">
                              edited
                            </span>
                          )}
                          <span>{getMessageTime(message)}</span>
                          {mine && (
                            <span className="flex -space-x-[4px] ml-0.5">
                              <FiCheck className="text-[13px]" />
                              <FiCheck className="text-[13px]" />
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Typing Indicator */}
              {typingUsers.size > 0 &&
                (selectedChat?.targetUserId
                  ? typingUsers.has(selectedChat.targetUserId)
                  : true) && (
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

        {contextMenu && (
          <div
            className="fixed z-[9999] w-[200px] bg-white dark:bg-slate-800 rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.15)] py-1.5 flex flex-col text-[#0f1419] dark:text-gray-100 border border-gray-100/50 dark:border-slate-700/50 text-[15px]"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onClick={(e) => e.stopPropagation()}
          >
            {contextMenu.message?.senderId === currentUserId ||
            contextMenu.message?.sender?.id === currentUserId ||
            contextMenu.message?.id_sender === currentUserId ? (
              <div className="px-3.5 py-1.5 mb-1 flex items-center gap-2 text-[13px] text-gray-500 font-medium">
                <div className="flex -space-x-[4px] text-blue-500">
                  <FiCheck className="text-sm" />
                  <FiCheck className="text-sm" />
                </div>
                <span>
                  {getDateLabel(
                    contextMenu.message?.createdAt ||
                      contextMenu.message?.updatedAt,
                  )}{" "}
                  at {getMessageTime(contextMenu.message)}
                </span>
              </div>
            ) : null}
            <button
              className="w-full text-left px-4 py-[9px] hover:bg-gray-100/70 dark:hover:bg-slate-700/50 flex items-center gap-3.5 transition-colors"
              onClick={() => {
                setContextMenu(null); /* Implement Reply */
              }}
            >
              <FiCornerUpLeft className="text-[18px]" strokeWidth={2} />{" "}
              <span className="font-medium">Reply</span>
            </button>
            {(contextMenu.message?.senderId === currentUserId ||
              contextMenu.message?.sender?.id === currentUserId ||
              contextMenu.message?.id_sender === currentUserId) && (
              <button
                className="w-full text-left px-4 py-[9px] hover:bg-gray-100/70 dark:hover:bg-slate-700/50 flex items-center gap-3.5 transition-colors"
                onClick={() => {
                  setEditingMessage(contextMenu.message);
                  setDraftMessage(getMessageText(contextMenu.message));
                  setContextMenu(null);
                }}
              >
                <FiEdit2 className="text-[18px]" strokeWidth={2} />{" "}
                <span className="font-medium">Edit</span>
              </button>
            )}
            <button
              className="w-full text-left px-4 py-[9px] hover:bg-gray-100/70 dark:hover:bg-slate-700/50 flex items-center gap-3.5 transition-colors"
              onClick={() => {
                setContextMenu(null); /* Implement Copy */
              }}
            >
              <FiCopy className="text-[18px]" strokeWidth={2} />{" "}
              <span className="font-medium">Copy</span>
            </button>
            {/* Translate button */}
            <button
              className="w-full text-left px-4 py-[9px] hover:bg-gray-100/70 dark:hover:bg-slate-700/50 flex items-center gap-3.5 transition-colors"
              onClick={() => {
                setContextMenu(null); /* Implement Translate */
              }}
            >
              <div className="relative flex items-center text-[18px] w-[18px] h-[18px] justify-center font-bold">
                <span className="text-[13px] absolute -top-0.5 -left-1 tracking-tighter">
                  A
                </span>
                <span className="text-[10px] absolute -bottom-0.5 -right-0.5 truncate tracking-tighter">
                  文
                </span>
              </div>
              <span className="font-medium">Translate</span>
            </button>
            <button
              className="w-full text-left px-4 py-[9px] hover:bg-gray-100/70 dark:hover:bg-slate-700/50 flex items-center gap-3.5 transition-colors"
              onClick={() => {
                setContextMenu(null); /* Implement Pin */
              }}
            >
              <FiMapPin className="text-[18px]" strokeWidth={2} />{" "}
              <span className="font-medium">Pin</span>
            </button>
            <button
              className="w-full text-left px-4 py-[9px] hover:bg-gray-100/70 dark:hover:bg-slate-700/50 flex items-center gap-3.5 transition-colors"
              onClick={() => handleOpenForwardModal(contextMenu.message)}
            >
              <FiCornerUpRight className="text-[18px]" strokeWidth={2} />{" "}
              <span className="font-medium">Forward</span>
            </button>
            <button
              className="w-full text-left px-4 py-[9px] hover:bg-gray-100/70 dark:hover:bg-slate-700/50 flex items-center gap-3.5 transition-colors"
              onClick={() => {
                setContextMenu(null); /* Implement Select */
              }}
            >
              <FiCheckCircle className="text-[18px]" strokeWidth={2} />{" "}
              <span className="font-medium">Select</span>
            </button>

            {(contextMenu.message?.senderId === currentUserId ||
              contextMenu.message?.sender?.id === currentUserId ||
              contextMenu.message?.id_sender === currentUserId) && (
              <button
                className="w-full text-left px-4 py-[9px] hover:bg-red-50 dark:hover:bg-red-900/20 text-[#ff4b4b] flex items-center gap-3.5 transition-colors"
                onClick={() => {
                  if (onRevokeMessage && contextMenu.message) {
                    onRevokeMessage(contextMenu.message);
                  }
                  setContextMenu(null);
                }}
              >
                <FiRotateCcw className="text-[18px]" strokeWidth={2} />{" "}
                <span className="font-medium">Recall</span>
              </button>
            )}

            <button
              className="w-full text-left px-4 py-[9px] hover:bg-red-50 dark:hover:bg-red-900/20 text-[#ff4b4b] flex items-center gap-3.5 transition-colors"
              onClick={() => {
                setContextMenu(null);
                /* Implement Delete for me */
              }}
            >
              <FiTrash2 className="text-[18px]" strokeWidth={2} />{" "}
              <span className="font-medium">Delete for me only</span>
            </button>
          </div>
        )}
      </div>

      {/* Forward Modal */}
      {forwardModalVisible && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-[360px] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="flex items-center px-4 py-3 border-b border-gray-100 dark:border-slate-700/50 gap-4">
              <button
                onClick={() => setForwardModalVisible(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                <FiX className="text-xl" />
              </button>
              <span className="font-semibold text-[17px] text-gray-800 dark:text-gray-100">
                Forward to...
              </span>
            </div>

            <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
              <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-slate-700/50 cursor-pointer transition-colors">
                <div className="w-11 h-11 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0">
                  <FiBookmark className="text-xl" />
                </div>
                <div className="flex flex-col max-w-full overflow-hidden">
                  <span className="font-medium text-[15px] truncate text-gray-900 dark:text-gray-100">
                    Saved Messages
                  </span>
                  <span className="text-[13px] text-blue-500 dark:text-blue-400 font-medium truncate">
                    forward here to save
                  </span>
                </div>
              </div>

              {friends?.map((friend) => (
                <div
                  key={friend.id || friend._id}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                  onClick={() => {
                    if (messageToForward) {
                      const targetUserId =
                        friend.friendUserId ||
                        friend.userId ||
                        friend.id ||
                        friend._id;

                      const augmentedMsg = { ...messageToForward };
                      if (!augmentedMsg.sender) augmentedMsg.sender = {};

                      const isMyMsg = Boolean(
                        augmentedMsg.isMine ||
                        augmentedMsg.sender?.isMe ||
                        (currentUserId &&
                          augmentedMsg.senderId === currentUserId),
                      );

                      if (isMyMsg) {
                        augmentedMsg.isMine = true;
                      } else if (
                        !augmentedMsg.sender.name &&
                        !augmentedMsg.sender.displayName
                      ) {
                        const participant = selectedChat?.participants?.find(
                          (p) =>
                            p.userId === augmentedMsg.senderId ||
                            p.id === augmentedMsg.senderId ||
                            p._id === augmentedMsg.senderId,
                        );
                        if (participant) {
                          augmentedMsg.sender.name =
                            participant.displayName ||
                            participant.name ||
                            participant.username;
                        } else if (
                          selectedChat?.targetUserId === augmentedMsg.senderId
                        ) {
                          augmentedMsg.sender.name =
                            selectedChat?.displayName || selectedChat?.name;
                        }
                      }

                      // Create a target chat object compatible with openChatByRow
                      const targetChat = {
                        id: `temp-${targetUserId}`,
                        targetUserId: targetUserId,
                        isGroup: false,
                        participants: [friend],
                        type: "private",
                        name:
                          friend.displayName ||
                          friend.name ||
                          friend.phone ||
                          "Unknown",
                        avatarUrl: friend.avatarUrl,
                      };

                      if (onForwardToTarget) {
                        onForwardToTarget(targetChat, augmentedMsg);
                      }
                    }
                    setForwardModalVisible(false);
                  }}
                >
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold flex items-center justify-center overflow-hidden shrink-0">
                    {friend.avatarUrl ? (
                      <img
                        src={friend.avatarUrl}
                        alt={friend.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      (friend.displayName || friend.name || friend.phone || "U")
                        .charAt(0)
                        .toUpperCase()
                    )}
                  </div>
                  <div className="flex flex-col max-w-full overflow-hidden">
                    <span className="font-medium text-[15px] truncate text-gray-900 dark:text-gray-100">
                      {friend.displayName || friend.name || friend.phone}
                    </span>
                    <span className="text-[13px] text-blue-500 dark:text-blue-400 font-medium truncate">
                      online
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Attachment / Upload Overlays */}
      {isDragActive && (
        <div
          className="absolute inset-0 z-40 flex items-center justify-center px-3 lg:px-4 py-5 bg-black/20 backdrop-blur-[1px]"
          onMouseDown={() => setIsAttachMenuOpen(false)}
        >
          <div
            onMouseDown={(event) => event.stopPropagation()}
            className="w-[min(400px,92vw)] max-h-[min(78vh,620px)] overflow-y-auto rounded-2xl lg:rounded-3xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 shadow-2xl px-5 lg:px-6 py-4 lg:py-5"
          >
            <p className="text-[28px] lg:text-[32px] font-semibold text-gray-900 dark:text-gray-100 leading-tight mb-3">
              {selectedCalendarHeadline}
            </p>

            <div className="flex items-center justify-between mb-3.5">
              <button
                onClick={() =>
                  setCalendarMonth(
                    (prev) =>
                      new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
                  )
                }
                className="h-9 w-9 rounded-full inline-flex items-center justify-center text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition"
                title="Previous month"
              >
                <FiChevronLeft className="text-[22px]" />
              </button>
              <p className="text-[15px] lg:text-[16px] font-semibold text-gray-800 dark:text-gray-100">
                {calendarMonthLabel}
              </p>
              <button
                onClick={() =>
                  setCalendarMonth(
                    (prev) =>
                      new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
                  )
                }
                disabled={isViewingCurrentMonthOrLater}
                className={`h-9 w-9 rounded-full inline-flex items-center justify-center transition ${isViewingCurrentMonthOrLater ? "text-gray-300 dark:text-slate-600 cursor-not-allowed" : "text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"}`}
                title="Next month"
              >
                <FiChevronRight className="text-[22px]" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-y-1.5 mb-1">
              {CALENDAR_WEEKDAYS.map((weekday, index) => (
                <div
                  key={`${weekday}-${index}`}
                  className="h-7 flex items-center justify-center text-[12px] font-medium text-gray-500 dark:text-gray-400"
                >
                  {weekday}
                </div>
              ))}

              {Array.from({ length: calendarGrid.leadingEmptyDays }).map(
                (_, idx) => (
                  <div key={`empty-${idx}`} className="h-9" />
                ),
              )}

              {Array.from({ length: calendarGrid.totalDays }).map(
                (_, index) => {
                  const day = index + 1;
                  const year = calendarMonth.getFullYear();
                  const month = calendarMonth.getMonth();
                  const cellDate = new Date(year, month, day);
                  cellDate.setHours(0, 0, 0, 0);
                  const isFutureDate =
                    cellDate.getTime() > todayStart.getTime();
                  const isSelected =
                    selectedCalendarDate.getFullYear() === year &&
                    selectedCalendarDate.getMonth() === month &&
                    selectedCalendarDate.getDate() === day;

                  return (
                    <button
                      key={`day-${day}`}
                      onClick={() => {
                        if (isFutureDate) return;
                        setSelectedCalendarDate(new Date(year, month, day));
                      }}
                      disabled={isFutureDate}
                      className={`h-9 w-9 mx-auto rounded-full inline-flex items-center justify-center text-[14px] transition ${isFutureDate ? "text-gray-300 dark:text-slate-600 cursor-not-allowed" : isSelected ? "bg-blue-500 text-white" : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800"}`}
                    >
                      {day}
                    </button>
                  );
                },
              )}
            </div>

            <div className="mt-2.5 pt-2.5 border-t border-gray-100 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsCalendarModalOpen(false)}
                className="h-9 px-3 rounded-md text-[13px] font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition"
              >
                CANCEL
              </button>
              <button
                onClick={() => {
                  setHeaderSearchValue(
                    selectedCalendarDate.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    }),
                  );
                  setIsCalendarModalOpen(false);
                }}
                className="h-9 px-3 rounded-md text-[13px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition"
              >
                JUMP TO DATE
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="absolute left-0 right-0 bottom-3 px-4 lg:px-5 bg-transparent">
        {(forwardingMessage || editingMessage) && (
          <div className="max-w-4xl mx-auto mb-2 flex bg-[#edf4f1] dark:bg-slate-800/95 rounded-t-[10px] overflow-hidden relative z-40 p-[8px] pl-[14px] items-center">
            <div className="flex-1 flex flex-col justify-center min-w-0 pr-6 gap-[5px]">
              <span className="text-[14px] font-medium text-blue-500 flex items-center gap-1.5 leading-none">
                {editingMessage ? (
                  <FiEdit2 className="text-[17px]" strokeWidth={2} />
                ) : (
                  <FiCornerUpRight className="text-[14px]" strokeWidth={2.5} />
                )}
                <span className="text-[14.5px] tracking-tight">
                  {editingMessage ? "Editing" : "Forward Message"}
                </span>
              </span>
              <p className="text-[13.5px] text-gray-500/90 dark:text-gray-400 truncate leading-none flex gap-1 items-center pb-0.5">
                {editingMessage ? null : (
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {forwardingMessage?.senderId === currentUserId
                      ? "You"
                      : forwardingMessage?.sender?.name || "Someone"}
                    :
                  </span>
                )}
                {editingMessage
                  ? editingMessage.media?.length
                    ? `Photo${editingMessage.text ? `, ${editingMessage.text}` : ""}`
                    : editingMessage.text
                  : forwardingMessage?.media?.length
                    ? `Photo${forwardingMessage.text ? `, ${forwardingMessage.text}` : ""}`
                    : forwardingMessage?.text}
              </p>
            </div>
            <button
              onClick={() => {
                if (editingMessage) {
                  setEditingMessage(null);
                  setDraftMessage("");
                }
                if (forwardingMessage && onClearForwarding) {
                  onClearForwarding();
                }
              }}
              className="absolute right-3 text-gray-400 hover:text-blue-500 transition-colors p-[8px]"
            >
              <FiX
                className="text-[#3e3e3e]"
                strokeWidth={1}
                style={{ fontSize: "22px" }}
              />
            </button>
            <div className="absolute left-[3px] top-1/2 -translate-y-1/2 w-[3px] h-[70%] bg-blue-500 rounded-[5px]"></div>
          </div>
        )}
        <div
          className={`flex items-center gap-2 max-w-4xl mx-auto ${forwardingMessage || editingMessage ? "-mt-4 z-40 relative" : ""}`}
        >
          <div
            ref={attachMenuRef}
            className="relative flex-1 h-11 lg:h-12 rounded-full bg-white/95 dark:bg-slate-800/95 shadow-lg border border-white/90 dark:border-slate-700/90"
          >
            <div
              className={`absolute right-0 bottom-14 w-[260px] max-w-[78vw] rounded-2xl bg-[#edf4f1] dark:bg-slate-800 shadow-xl p-2 border border-white/70 dark:border-slate-700 z-50 origin-bottom-right will-change-transform transition-all duration-200 ease-out ${isAttachMenuOpen ? "opacity-100 scale-100 translate-y-0 pointer-events-auto" : "opacity-0 scale-95 translate-y-1 pointer-events-none"}`}
              aria-hidden={!isAttachMenuOpen}
            >
              {attachActions.map((action) => {
                const ActionIcon = action.icon;
                return (
                  <button
                    key={action.id}
                    onClick={() => setIsAttachMenuOpen(false)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-[14px] leading-none text-gray-900 dark:text-gray-100 hover:bg-white/75 dark:hover:bg-slate-700/80 transition"
                  >
                    <ActionIcon className="text-[18px] shrink-0" />
                    <span className="font-semibold tracking-tight">
                      {action.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <div
              ref={emojiMenuRef}
              className={`absolute left-0 bottom-14 w-[min(460px,88vw)] max-w-[88vw] rounded-2xl bg-[#edf4f1] dark:bg-slate-800 shadow-2xl border border-white/70 dark:border-slate-700 z-50 overflow-hidden origin-bottom-left will-change-transform transition-all duration-200 ease-out ${isEmojiPickerOpen ? "opacity-100 scale-100 translate-y-0 pointer-events-auto" : "opacity-0 scale-95 translate-y-1 pointer-events-none"}`}
              aria-hidden={!isEmojiPickerOpen}
            >
              <div className="px-4 py-2.5 border-b border-gray-200/80 dark:border-slate-700 flex items-center gap-3 text-gray-600 dark:text-gray-300">
                <button className="h-9 w-9 rounded-full inline-flex items-center justify-center bg-white/80 dark:bg-slate-700/80">
                  <FiClock className="text-lg" />
                </button>
                <button className="h-9 w-9 rounded-full inline-flex items-center justify-center hover:bg-white/60 dark:hover:bg-slate-700/60 transition">
                  <FiSmile className="text-lg" />
                </button>
              </div>

              <div className="px-4 py-2.5 border-b border-gray-200/80 dark:border-slate-700">
                <div className="h-10 rounded-xl bg-white/70 dark:bg-slate-700/70 flex items-center gap-2.5 px-3 text-gray-500 dark:text-gray-300">
                  <FiSearch className="text-base" />
                  <span className="text-sm font-medium text-gray-400 dark:text-gray-400">
                    Search Emoji
                  </span>
                  <div className="ml-auto flex items-center gap-2 text-gray-400 dark:text-gray-400">
                    <FiHeart className="text-base" />
                    <FiThumbsUp className="text-base" />
                    <FiThumbsDown className="text-base" />
                    <FiZap className="text-base" />
                    <FiSmile className="text-base" />
                  </div>
                </div>
              </div>

              <div className="px-4 py-3">
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2.5">
                  Frequently Used
                </p>

                <div className="grid grid-cols-8 gap-1 pb-1">
                  {frequentEmojis.map((emoji, index) => (
                    <button
                      key={index}
                      onClick={() =>
                        setDraftMessage((prev) => `${prev}${emoji}`)
                      }
                      className="h-10 w-10 rounded-lg inline-flex items-center justify-center text-2xl hover:bg-white/70 dark:hover:bg-slate-700/70 transition"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-4 py-2.5 border-t border-gray-200/80 dark:border-slate-700 flex items-center justify-around text-gray-500 dark:text-gray-300">
                <button className="h-9 w-9 rounded-full inline-flex items-center justify-center bg-white/80 dark:bg-slate-700/80">
                  <FiSmile className="text-lg" />
                </button>
                <button className="h-9 w-9 rounded-full inline-flex items-center justify-center hover:bg-white/70 dark:hover:bg-slate-700/70 transition">
                  <FiMessageCircle className="text-lg" />
                </button>
                <button className="h-9 w-9 rounded-full inline-flex items-center justify-center hover:bg-white/70 dark:hover:bg-slate-700/70 transition">
                  <FiFilm className="text-lg" />
                </button>
                <button className="h-9 w-9 rounded-full inline-flex items-center justify-center hover:bg-white/70 dark:hover:bg-slate-700/70 transition">
                  <FiDelete className="text-lg" />
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                setIsEmojiPickerOpen((prev) => !prev);
                setIsAttachMenuOpen(false);
                setIsMoreMenuOpen(false);
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 lg:h-9 lg:w-9 inline-flex items-center justify-center rounded-full text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition"
              title="Open emoji picker"
            >
              <FiSmile className="text-[20px] lg:text-[22px]" />
            </button>

            <input
              type="text"
              value={draftMessage}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendMessage();
              }}
              placeholder="Message"
              className="absolute left-11 right-11 top-1/2 -translate-y-1/2 h-8 bg-transparent text-[14px] lg:text-[15px] text-gray-700 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none"
            />

            <button
              onClick={() => {
                setIsAttachMenuOpen((prev) => !prev);
                setIsMoreMenuOpen(false);
                setIsEmojiPickerOpen(false);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 lg:h-9 lg:w-9 inline-flex items-center justify-center rounded-full text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition"
              title="Open attachment actions"
            >
              <FiPaperclip className="text-[20px] lg:text-[22px]" />
            </button>
          </div>

          <button
            className="h-11 w-11 lg:h-12 lg:w-12 rounded-full bg-[#2ea6f3] text-white inline-flex items-center justify-center shadow-md hover:bg-[#1f97e5] transition cursor-pointer z-50 relative"
            onClick={
              editingMessage || draftMessage.trim() || forwardingMessage
                ? handleSendMessage
                : undefined
            }
          >
            {editingMessage || draftMessage.trim() || forwardingMessage ? (
              <FiSend className="text-[20px] lg:text-[22px]" />
            ) : (
              <FiMic className="text-[20px] lg:text-[22px]" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
