import { useEffect, useMemo, useRef, useState } from "react";
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
} from "react-icons/fi";

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
  isLoading,
  error,
  messages,
  onRetry,
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
  const attachMenuRef = useRef(null);
  const moreMenuRef = useRef(null);
  const emojiMenuRef = useRef(null);
  const headerSearchInputRef = useRef(null);

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
    "😌",
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

  if (!selectedChat) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500">
        <p>Select a chat to start messaging</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 relative">
      <div className="px-4 lg:px-5 py-2.5 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        {!isHeaderSearchOpen ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold flex items-center justify-center overflow-hidden">
                {selectedChat.avatarUrl ? (
                  <img
                    src={selectedChat.avatarUrl}
                    alt={selectedChat.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  selectedChat.name?.charAt(0) || "U"
                )}
              </div>

              <div className="min-w-0">
                <p className="font-semibold text-[15px] text-gray-900 dark:text-white truncate">
                  {selectedChat.name}
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
                  alt={selectedChat.name}
                  className="w-full h-full object-cover"
                />
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
          <div className="h-full flex flex-col items-center justify-center gap-2 text-center text-gray-500 dark:text-gray-400">
            <FiMessageCircle className="text-2xl" />
            <p>No messages yet. Say hello 👋</p>
          </div>
        )}

        {!isLoading && !error && messages.length > 0 && (
          <div className="flex flex-col gap-3 items-start max-w-4xl mx-auto w-full">
            <div className="mx-auto px-3 py-1 rounded-full text-xs font-semibold bg-white/80 dark:bg-slate-800/80 text-gray-600 dark:text-gray-300 shadow-sm">
              {getDateLabel(messages[0]?.createdAt) || "Today"}
            </div>

            {messages.map((message, index) => {
              const text = getMessageText(message);
              const mine = Boolean(message?.isMine || message?.sender?.isMe);
              const isImage = message?.type === "image";

              return (
                <div
                  key={getMessageId(message, index)}
                  className={`w-fit max-w-[74%] lg:max-w-[68%] rounded-2xl text-sm shadow-sm ${mine ? "self-end bg-[#d9fdd3] dark:bg-emerald-900/70 text-gray-900 dark:text-emerald-50 rounded-br-md" : "self-start bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-100 rounded-bl-md"}`}
                >
                  {isImage && (
                    <div className="p-1">
                      {message?.imageUrl ? (
                        <img
                          src={message.imageUrl}
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

                  <div className="px-3 pb-2 pt-2">
                    {!!text && (
                      <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">
                        {text}
                      </p>
                    )}
                    <p
                      className={`mt-1 text-[11px] text-right ${mine ? "text-emerald-700/80 dark:text-emerald-200/80" : "text-gray-400 dark:text-gray-500"}`}
                    >
                      {getMessageTime(message)}
                    </p>
                  </div>
                </div>
              );
            })}
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
                  {frequentEmojis.map((emoji) => (
                    <button
                      key={emoji}
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
              onChange={(event) => setDraftMessage(event.target.value)}
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

          <button className="h-11 w-11 lg:h-12 lg:w-12 rounded-full bg-[#2ea6f3] text-white inline-flex items-center justify-center shadow-md hover:bg-[#1f97e5] transition">
            <FiMic className="text-[20px] lg:text-[22px]" />
          </button>
        </div>
      </div>
    </div>
  );
};
