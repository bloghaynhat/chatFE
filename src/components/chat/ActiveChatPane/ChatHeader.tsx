import {
  FiPhone,
  FiSearch,
  FiMoreVertical,
  FiCalendar,
  FiX,
  FiChevronRight,
  FiClock,
  FiBellOff,
  FiVideo,
  FiCheckCircle,
  FiShare2,
  FiGift,
  FiLock,
  FiEyeOff,
  FiTrash2,
  FiMapPin,
  FiBookmark,
  FiZap,
} from "react-icons/fi";
import { useState } from "react";
import { AiSummaryModal } from "../AiSummaryModal";
import { aiService } from "../../../services/aiService";

const moreActions = [
  { id: "ai-summarize", label: "Tóm tắt cuộc trò chuyện (AI)", icon: FiZap },
  { id: "ai-smart-search", label: "Tìm kiếm thông minh (AI)", icon: FiSearch },
  {
    id: "ai-extract-tasks",
    label: "Trích xuất công việc (AI)",
    icon: FiCheckCircle,
  },
  { id: "auto-delete", label: "Auto-delete", icon: FiClock, hasChevron: true },
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

export const ChatHeader = ({
  selectedChat,
  selectedConversationId,
  currentUserId,
  isLoading,
  isHeaderSearchOpen,
  setIsHeaderSearchOpen,
  headerSearchValue,
  setHeaderSearchValue,
  setIsCalendarModalOpen,
  setCalendarMonth,
  selectedCalendarDate,
  isMoreMenuOpen,
  setIsMoreMenuOpen,
  moreMenuRef,
  setIsAttachMenuOpen,
  setIsEmojiPickerOpen,
  headerSearchInputRef,
  isRightSidebarOpen,
  setIsRightSidebarOpen,
  pinnedCount = 0,
  onStartAudioCall,
  onStartVideoCall,
  activeCallV2,
  callV2Status,
  onJoinActiveCallV2,
}: any) => {
  const [isAiSummaryModalOpen, setIsAiSummaryModalOpen] = useState(false);
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [isExtractingTasks, setIsExtractingTasks] = useState(false);

  const isSavedMessages =
    selectedChat?.type === "saved_messages" ||
    selectedChat?.isSavedMessages ||
    selectedChat?.isSelfChat;

  const visibleMoreActions = isSavedMessages
    ? moreActions.filter(
        (action) =>
          ![
            "call",
            "video-call",
            "share-contact",
            "send-gift",
            "block-user",
            "disable-sharing",
          ].includes(action.id),
      )
    : moreActions;

  const otherParticipant = (selectedChat?.participants || []).find(
    (p: any) => p.userId !== currentUserId,
  );

  const displayName =
    selectedChat?.name ||
    selectedChat?.displayName ||
    otherParticipant?.displayName ||
    "Unknown";

  const avatarLetter =
    displayName && displayName !== "Unknown"
      ? displayName.charAt(0).toUpperCase()
      : "U";

  const handleToggleInfo = () => {
    setIsRightSidebarOpen(!isRightSidebarOpen);
  };

  const handleMoreActionClick = (action: any) => {
    setIsMoreMenuOpen(false);

    if (action.id === "ai-summarize") {
      setIsAiSummaryModalOpen(true);
      return;
    }

    if (action.id === "ai-extract-tasks") {
      setIsExtractingTasks(true);

      aiService
        .extractTasks({
          conversationId: selectedConversationId,
        })
        .then((res: any) => {
          const tasks = res?.data?.tasks || [];

          if (tasks.length > 0) {
            alert(
              `AI Extracted Tasks:\n\n${tasks
                .map((task: any) => `- ${task}`)
                .join("\n")}`,
            );
          } else {
            alert("Không tìm thấy công việc nào.");
          }
        })
        .catch((err: any) => {
          console.error(err);
          alert("Lỗi khi trích xuất công việc.");
        })
        .finally(() => setIsExtractingTasks(false));

      return;
    }

    if (action.id === "ai-smart-search") {
      setIsHeaderSearchOpen(true);
      setHeaderSearchValue("/ai ");

      setTimeout(() => {
        headerSearchInputRef.current?.focus();
      }, 0);
    }
  };

  return (
    <>
      <AiSummaryModal
        isOpen={isAiSummaryModalOpen}
        onClose={() => setIsAiSummaryModalOpen(false)}
        conversationId={selectedConversationId}
      />

      <div className="px-4 lg:px-5 py-2.5 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        {!isHeaderSearchOpen ? (
          <div className="flex items-center justify-between">
            <div
              className="flex items-center gap-3 min-w-0 p-1.5 -ml-1.5 rounded-xl transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer"
              onClick={handleToggleInfo}
            >
              <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold flex items-center justify-center overflow-hidden shrink-0 shadow-sm border border-black/5 dark:border-white/10">
                {isSavedMessages ? (
                  <FiBookmark className="text-[18px] lg:text-[20px]" />
                ) : selectedChat?.avatarUrl ? (
                  <img
                    src={selectedChat.avatarUrl}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  avatarLetter
                )}
              </div>

              <div className="min-w-0">
                <p className="font-semibold text-[15px] text-gray-900 dark:text-white truncate">
                  {displayName}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  {isSavedMessages
                    ? "Saved messages"
                    : isLoading
                      ? "Opening conversation..."
                      : "last seen 1 hour ago"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-300">
              {pinnedCount > 0 && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-full border border-blue-200 dark:border-blue-800 mr-1">
                  <FiMapPin
                    className="text-blue-500 dark:text-blue-400"
                    strokeWidth={2.5}
                  />
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                    {pinnedCount}
                  </span>
                </div>
              )}

              {!isSavedMessages && (
                <button
                  onClick={() => onStartAudioCall?.(selectedConversationId)}
                  className="h-8 w-8 lg:h-9 lg:w-9 inline-flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition"
                  title="Gọi thoại"
                >
                  <FiPhone className="text-base lg:text-lg" />
                </button>
              )}

              {!isSavedMessages && activeCallV2 && callV2Status === "idle" && (
                <button
                  onClick={() => onJoinActiveCallV2?.()}
                  className="h-8 lg:h-9 inline-flex items-center justify-center rounded-full bg-blue-50 px-3 text-xs font-semibold text-blue-600 border border-blue-200 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800 dark:hover:bg-blue-900/50 transition"
                  title="Tham gia cuộc gọi đang diễn ra"
                >
                  Tham gia
                </button>
              )}

              {!isSavedMessages && (
                <button
                  onClick={() => onStartVideoCall?.(selectedConversationId)}
                  className="h-8 w-8 lg:h-9 lg:w-9 inline-flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition"
                  title="Gọi video"
                >
                  <FiVideo className="text-base lg:text-lg" />
                </button>
              )}

              <button
                onClick={() => {
                  setIsHeaderSearchOpen(true);
                  setIsMoreMenuOpen(false);
                  setIsAttachMenuOpen(false);
                  setIsEmojiPickerOpen(false);
                }}
                className="h-8 w-8 lg:h-9 lg:w-9 inline-flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition text-gray-500 hover:text-blue-500"
                title="Search in conversation"
              >
                <FiSearch className="text-base lg:text-lg" />
              </button>

              <div ref={moreMenuRef} className="relative">
                <button
                  onClick={() => {
                    setIsMoreMenuOpen((prev: boolean) => !prev);
                    setIsAttachMenuOpen(false);
                    setIsEmojiPickerOpen(false);
                  }}
                  className={`h-8 w-8 lg:h-9 lg:w-9 inline-flex items-center justify-center rounded-full transition ${
                    isMoreMenuOpen
                      ? "bg-gray-100 dark:bg-slate-800"
                      : "hover:bg-gray-100 dark:hover:bg-slate-800"
                  }`}
                  title="Open conversation actions"
                >
                  <FiMoreVertical className="text-base lg:text-lg" />
                </button>

                <div
                  className={`absolute right-0 top-10 w-[260px] max-w-[84vw] rounded-2xl bg-[#edf4f1] dark:bg-slate-800 shadow-2xl p-2 border border-white/70 dark:border-slate-700 z-50 origin-top-right will-change-transform transition-all duration-200 ease-out ${
                    isMoreMenuOpen
                      ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                      : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
                  }`}
                  aria-hidden={!isMoreMenuOpen}
                >
                  {visibleMoreActions.map((action) => {
                    const ActionIcon = action.icon;

                    return (
                      <button
                        key={action.id}
                        onClick={() => handleMoreActionClick(action)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-[14px] leading-none hover:bg-white/75 dark:hover:bg-slate-700/80 transition ${
                          action.danger
                            ? "text-red-500"
                            : "text-gray-900 dark:text-gray-100"
                        }`}
                      >
                        {isExtractingTasks &&
                        action.id === "ai-extract-tasks" ? (
                          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin shrink-0" />
                        ) : (
                          <ActionIcon
                            className={`text-[18px] shrink-0 ${
                              action.id.startsWith("ai-")
                                ? "text-blue-500"
                                : ""
                            }`}
                          />
                        )}

                        <span className="font-semibold tracking-tight flex-1">
                          {isExtractingTasks &&
                          action.id === "ai-extract-tasks"
                            ? "Đang trích xuất..."
                            : action.label}
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
            <div
              className="w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold flex items-center justify-center overflow-hidden shrink-0 cursor-pointer hover:opacity-90 transition-opacity shadow-sm border border-black/5 dark:border-white/10"
              onClick={handleToggleInfo}
            >
              {isSavedMessages ? (
                <FiBookmark className="text-[17px] lg:text-[19px]" />
              ) : selectedChat?.avatarUrl ? (
                <img
                  src={selectedChat.avatarUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                avatarLetter
              )}
            </div>

            <div className="flex-1 h-9 lg:h-10 rounded-full bg-gray-100 dark:bg-slate-800 border border-gray-200/80 dark:border-slate-700 px-3.5 flex items-center gap-2.5 shadow-inner">
              {headerSearchValue.startsWith("/ai ") ? (
                <FiZap className="text-[18px] text-blue-500 shrink-0" />
              ) : (
                <FiSearch className="text-[18px] text-gray-400 dark:text-gray-500 shrink-0" />
              )}

              <input
                ref={headerSearchInputRef}
                type="text"
                value={headerSearchValue}
                onChange={(event) => setHeaderSearchValue(event.target.value)}
                onKeyDown={async (event) => {
                  if (
                    event.key === "Enter" &&
                    headerSearchValue.startsWith("/ai ")
                  ) {
                    event.preventDefault();

                    const query = headerSearchValue.slice(4).trim();

                    if (!query) return;

                    setIsAiSearching(true);

                    try {
                      const result = await aiService.smartSearch(
                        query,
                        selectedConversationId,
                      );

                      if (result?.data?.results) {
                        alert(
                          `AI Search Results:\n\n${result.data.results
                            .map((item: any) => `- ${item.content}`)
                            .join("\n")}`,
                        );
                      } else {
                        alert(
                          `AI Found: ${
                            result?.data?.summary || "No results"
                          }`,
                        );
                      }
                    } catch (err) {
                      console.error(err);
                      alert("Lỗi khi tìm kiếm bằng AI.");
                    } finally {
                      setIsAiSearching(false);
                    }
                  }
                }}
                placeholder="Search... (Type '/ai ' for Smart Search)"
                className="flex-1 bg-transparent text-[14px] lg:text-[15px] leading-normal text-gray-700 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none"
              />

              {isAiSearching && (
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin shrink-0" />
              )}

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
    </>
  );
};