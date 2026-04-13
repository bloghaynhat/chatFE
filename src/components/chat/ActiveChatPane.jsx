import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { socketService } from "../../services/socketService";
import { searchUserById } from "../../services/friendService";
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
  FiEye,
  FiCheck,
} from "react-icons/fi";
import { useDropzone } from "react-dropzone";
import { UserInfoPanel } from "./UserInfoPanel";

const getMessageId = (message, index) => message?.id || message?._id || `${index}-${message?.createdAt || "msg"}`;
const getMessageText = (message) => message?.text || message?.content || message?.message || "";
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
}) => {
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);
  const [isUserInfoOpen, setIsUserInfoOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isHeaderSearchOpen, setIsHeaderSearchOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [headerSearchValue, setHeaderSearchValue] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(() => new Date());
  const [draftMessage, setDraftMessage] = useState("");
  const attachMenuRef = useRef(null);
  const moreMenuRef = useRef(null);
  const emojiMenuRef = useRef(null);
  const headerSearchInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);
  const messagesEndRef = useRef(null);
  const firstMessageRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const [displayCount, setDisplayCount] = useState(20);

  // File upload state for UI/UX
  const [dragType, setDragType] = useState(null); // 'image' or 'file'
  const [previewFiles, setPreviewFiles] = useState([]);
  const [compressImage, setCompressImage] = useState(true); // for split screen selection

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles?.length === 0) return;

    // Determine the type: if any file is not an image, treat it as a 'file'
    const hasNonImage = acceptedFiles.some((f) => !f.type.startsWith("image/"));
    const isImageDrop = !hasNonImage;

    const filesWithPreview = acceptedFiles.map((file) =>
      Object.assign(file, {
        preview: URL.createObjectURL(file),
      }),
    );

    setPreviewFiles(filesWithPreview);
    setDragType(null); // close drag overlay upon drop
    // Compress is defaulted to true, user can toggle in overlay if they hovered over "uncompressed" option if we had one
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragAccept } = useDropzone({
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

  const scrollToBottom = () => {
    // Only scroll if we are near the bottom to avoid snapping when loading older messages
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, typingUsers]);

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

  const selectedCalendarHeadline = selectedCalendarDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
  });

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
    setIsUserInfoOpen(false);
    setDetailedUser(null);
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

  const [detailedUser, setDetailedUser] = useState(null);
  const [isLoadingUserInfo, setIsLoadingUserInfo] = useState(false);

  const handleOpenUserInfo = async () => {
    setIsUserInfoOpen(true);

    const targetId = selectedChat?.targetUserId;
    if (targetId) {
      setIsLoadingUserInfo(true);
      try {
        const response = await searchUserById(targetId);
        const userData = response?.user || response?.data?.user || response?.data || response;
        setDetailedUser({ ...selectedChat, ...userData });
      } catch (error) {
        console.error("Error fetching user details:", error);
        setDetailedUser(selectedChat);
      } finally {
        setIsLoadingUserInfo(false);
      }
    } else {
      setDetailedUser(selectedChat);
    }
  };

  const handleInputChange = (event) => {
    setDraftMessage(event.target.value);

    // Xác định đang chat nhóm hay cá nhân
    const isGroup = selectedChat?.type === "GROUP" || !selectedChat?.targetUserId;
    const targetId = isGroup ? selectedConversationId : selectedChat?.targetUserId;

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
    if (!draftMessage.trim()) return;
    if (onSendMessage) {
      onSendMessage({
        text: draftMessage.trim(),
        type: "text",
      });
      setDraftMessage("");

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (isTypingRef.current) {
        isTypingRef.current = false;
        const isGroup = selectedChat?.type === "GROUP" || !selectedChat?.targetUserId;
        const targetId = isGroup ? selectedConversationId : selectedChat?.targetUserId;
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
    <div className="flex h-full w-full relative overflow-hidden">
      <div
        {...getRootProps()}
        className={`flex-1 flex flex-col min-h-0 transition-all relative duration-300 ${isDragActive ? "bg-slate-50 dark:bg-slate-800/50" : ""}`}
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

        {/* Preview Modal */}
        {previewFiles.length > 0 && (
          <div className="absolute inset-0 z-[110] bg-white dark:bg-slate-900 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleCancelAttachment}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <FiX className="text-2xl text-gray-600 dark:text-gray-300" />
                </button>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                  Send {previewFiles.length} {previewFiles.length === 1 ? "file" : "files"}
                </h2>
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto bg-gray-50 dark:bg-slate-950">
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden max-w-2xl w-full">
                {previewFiles[0].type.startsWith("image/") ? (
                  <div className="relative aspect-video max-h-[60vh] bg-black">
                    <img src={previewFiles[0].preview} alt="Preview" className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
                    <FiFile className="text-6xl text-blue-500 mb-4" />
                    <p className="text-lg font-medium text-gray-800 dark:text-white truncate max-w-full px-4">
                      {previewFiles[0].name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      {(previewFiles[0].size / 1024).toFixed(0)} KB
                    </p>
                  </div>
                )}
                <div className="p-4 flex items-center gap-4">
                  <input
                    type="text"
                    placeholder="Add a caption..."
                    className="flex-1 bg-transparent text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 outline-none text-lg"
                    value={draftMessage}
                    onChange={(e) => setDraftMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendAttachedFiles()}
                    autoFocus
                  />
                  <button
                    onClick={handleSendAttachedFiles}
                    className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-medium transition-colors"
                  >
                    SEND
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="px-4 lg:px-5 py-2.5 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          {!isHeaderSearchOpen ? (
            <div className="flex items-center justify-between">
              <div
                className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50 py-1 px-2 -ml-2 rounded-xl transition-colors"
                onClick={handleOpenUserInfo}
              >
                <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold flex items-center justify-center overflow-hidden shrink-0">
                  {selectedChat.avatarUrl ? (
                    <img src={selectedChat.avatarUrl} alt={selectedChat.name} className="w-full h-full object-cover" />
                  ) : (
                    selectedChat.name?.charAt(0) || "U"
                  )}
                </div>

                <div className="min-w-0">
                  <p className="font-semibold text-[15px] text-gray-900 dark:text-white truncate">
                    {selectedChat.name}
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                    {isLoading ? "Opening conversation..." : "last seen 1 hour ago"}
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
                          <span className="font-semibold tracking-tight flex-1">{action.label}</span>
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
                  <img src={selectedChat.avatarUrl} alt={selectedChat.name} className="w-full h-full object-cover" />
                ) : (
                  selectedChat.name?.charAt(0) || "U"
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
              <p className="text-sm text-red-600 dark:text-red-400">Couldn’t open this conversation</p>
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
                <div className="text-[70px] drop-shadow-md hover:scale-110 transition-transform cursor-pointer">👋</div>
              </div>
            </div>
          )}

          {!isLoading && !error && visibleMessages.length > 0 && (
            <div ref={messagesContainerRef} className="flex flex-col gap-3 items-start max-w-4xl mx-auto w-full">
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
                const text = getMessageText(message);
                const mine = Boolean(
                  message?.isMine || message?.sender?.isMe || (currentUserId && message?.senderId === currentUserId),
                );
                // Simple check for image vs file types
                const isImage =
                  message?.type === "image" || (message?.files && message.files[0]?.type?.startsWith("image/"));
                const isDocument =
                  message?.type === "document" ||
                  message?.type === "file" ||
                  (message?.files && message.files[0] && !message.files[0].type?.startsWith("image/"));
                const isFirst = index === 0;
                const isLast = index === visibleMessages.length - 1;
                const isSystem = message?.type === "SYSTEM" || message?.type === "system" || message?.isSystem;

                if (isSystem) {
                  return (
                    <div
                      ref={isFirst ? firstMessageRef : null}
                      key={getMessageId(message, index)}
                      className="mx-auto my-1.5 px-4 py-1.5 rounded-full text-[13px] font-medium bg-black/10 dark:bg-white/10 text-gray-600 dark:text-gray-300 backdrop-blur-sm shadow-sm text-center max-w-[85%]"
                    >
                      {text}
                    </div>
                  );
                }

                return (
                  <div
                    ref={isFirst ? firstMessageRef : null}
                    key={getMessageId(message, index)}
                    className={`w-fit max-w-[74%] lg:max-w-[68%] rounded-2xl text-sm shadow-sm flex flex-col ${mine ? "self-end bg-[#d9fdd3] dark:bg-emerald-900/70 text-gray-900 dark:text-emerald-50 rounded-br-md" : "self-start bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-100 rounded-bl-md"}`}
                  >
                    {isImage && (
                      <div className="p-1 pb-0">
                        {message?.imageUrl ||
                        (message?.files && message.files[0]?.url) ||
                        (message?.files && message.files[0]?.preview) ? (
                          <img
                            src={
                              message?.imageUrl ||
                              (message?.files && (message.files[0]?.url || message.files[0]?.preview))
                            }
                            alt={message.imageAlt || "Image message"}
                            className="w-full max-w-[340px] h-auto rounded-xl object-cover"
                          />
                        ) : (
                          <div className="w-[320px] h-[220px] rounded-xl bg-gray-200 dark:bg-slate-700 flex items-center justify-center text-gray-500 dark:text-gray-300">
                            Image preview
                          </div>
                        )}
                      </div>
                    )}

                    {isDocument &&
                      (() => {
                        const file = message?.file || (message?.files && message.files[0]);
                        const fileName = file?.name || "Document";
                        const fileSize = file?.size ? `${(file.size / 1024).toFixed(0)} KB` : "";
                        return (
                          <div className="flex items-center gap-3 p-3 pb-0 bg-black/5 dark:bg-white/5 rounded-t-2xl">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 ${mine ? "bg-emerald-600" : "bg-blue-500"}`}
                            >
                              <FiFile className="text-xl" />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-medium truncate underline hover:no-underline cursor-pointer">
                                {fileName}
                              </span>
                              <span className="text-xs opacity-70">{fileSize}</span>
                            </div>
                          </div>
                        );
                      })()}

                    <div className="px-3 pb-2 pt-2">
                      {!!text && <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">{text}</p>}
                      <div
                        className={`mt-1 text-[11px] text-right flex items-center justify-end gap-1 ${mine ? "text-emerald-700/80 dark:text-emerald-200/80" : "text-gray-400 dark:text-gray-500"}`}
                      >
                        <span>{getMessageTime(message)}</span>
                        {isLast && mine && message?.status === "SEEN" && (
                          <span title="Seen" className="flex items-center">
                            <FiEye className="w-3 h-3 text-blue-500" />
                          </span>
                        )}
                        {isLast && mine && message?.status === "DELIVERED" && (
                          <span title="Delivered" className="flex items-center">
                            <svg
                              className="w-3 h-3 text-gray-400"
                              viewBox="0 0 16 16"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M1 8L5.5 12.5L15 3"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M6 8L10.5 12.5L14 9"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </span>
                        )}
                        {isLast &&
                          mine &&
                          (!message?.status || message?.status === "SENT" || message?.status === "sending") && (
                            <span title="Sent" className="flex items-center">
                              <FiCheck className="w-3 h-3 text-gray-400" />
                            </span>
                          )}
                      </div>
                    </div>
                  </div>
                );
              })}

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
          )}
        </div>

        {isCalendarModalOpen && (
          <div
            className="absolute inset-0 z-40 flex items-center justify-center px-3 lg:px-4 py-5 bg-black/20 backdrop-blur-[1px]"
            onMouseDown={() => setIsCalendarModalOpen(false)}
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
                  onClick={() => setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                  className="h-9 w-9 rounded-full inline-flex items-center justify-center text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition"
                  title="Previous month"
                >
                  <FiChevronLeft className="text-[22px]" />
                </button>
                <p className="text-[15px] lg:text-[16px] font-semibold text-gray-800 dark:text-gray-100">
                  {calendarMonthLabel}
                </p>
                <button
                  onClick={() => setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
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

                {Array.from({ length: calendarGrid.leadingEmptyDays }).map((_, idx) => (
                  <div key={`empty-${idx}`} className="h-9" />
                ))}

                {Array.from({ length: calendarGrid.totalDays }).map((_, index) => {
                  const day = index + 1;
                  const year = calendarMonth.getFullYear();
                  const month = calendarMonth.getMonth();
                  const cellDate = new Date(year, month, day);
                  cellDate.setHours(0, 0, 0, 0);
                  const isFutureDate = cellDate.getTime() > todayStart.getTime();
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
                })}
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
          <div className="flex items-center gap-2 max-w-4xl mx-auto">
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
                      <span className="font-semibold tracking-tight">{action.label}</span>
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
                    <span className="text-sm font-medium text-gray-400 dark:text-gray-400">Search Emoji</span>
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
                  <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2.5">Frequently Used</p>

                  <div className="grid grid-cols-8 gap-1 pb-1">
                    {frequentEmojis.map((emoji, index) => (
                      <button
                        key={index}
                        onClick={() => setDraftMessage((prev) => `${prev}${emoji}`)}
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
              className="h-11 w-11 lg:h-12 lg:w-12 rounded-full bg-[#2ea6f3] text-white inline-flex items-center justify-center shadow-md hover:bg-[#1f97e5] transition"
              onClick={draftMessage.trim() ? handleSendMessage : undefined}
            >
              {draftMessage.trim() ? (
                <FiSend className="text-[20px] lg:text-[22px]" />
              ) : (
                <FiMic className="text-[20px] lg:text-[22px]" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* User Info Panel */}
      <div
        className={`flex-shrink-0 bg-white dark:bg-slate-900 transition-all duration-300 ease-in-out overflow-hidden ${
          isUserInfoOpen
            ? "w-full sm:w-[320px] lg:w-[30vw] max-w-[400px] border-l border-gray-200 dark:border-slate-700/50 opacity-100"
            : "w-0 border-l-0 opacity-0"
        }`}
      >
        <div className="w-[100vw] sm:w-[320px] lg:w-[30vw] lg:max-w-[400px] h-full flex flex-col">
          <UserInfoPanel
            user={detailedUser || selectedChat}
            onClose={() => setIsUserInfoOpen(false)}
            isLoading={isLoadingUserInfo}
          />
        </div>
      </div>
    </div>
  );
};
