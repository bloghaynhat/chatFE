import {
  FiArrowLeft,
  FiPhone,
  FiSearch,
  FiMoreVertical,
  FiCalendar,
  FiX,
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
import { useEffect, useMemo, useState } from "react";
import { AiSummaryModal } from "../AiSummaryModal";
import { aiService } from "../../../services/aiService";
import { socketService } from "../../../services/socketService";
import {
  isConversationMuted,
  isConversationMutedValue,
  setConversationMuted,
} from "../../../services/muteRegistry";
import { toast } from "sonner";
import { useLanguage } from "../../../context";

const moreActions = [
  { id: "ai-summarize", label: "Tóm tắt cuộc trò chuyện (AI)", icon: FiZap },
  { id: "ai-smart-search", label: "Tìm kiếm thông minh (AI)", icon: FiSearch },
  {
    id: "ai-extract-tasks",
    label: "Trích xuất công việc (AI)",
    icon: FiCheckCircle,
  },
  { id: "mute", label: "Mute", icon: FiBellOff },
  { id: "call", label: "Call", icon: FiPhone },
  { id: "video-call", label: "Video Call", icon: FiVideo },
  { id: "share-contact", label: "Share contact", icon: FiShare2 },
  { id: "block-user", label: "Block user", icon: FiLock },
  { id: "delete-chat", label: "Delete Chat", icon: FiTrash2, danger: true },
];

export const ChatHeader = ({
  selectedChat,
  selectedConversationId,
  currentUserId,
  isLoading,
  onCloseChat,
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
  onBlockUser,
  onDeleteConversation,
  onOpenContactPicker,
  activeCallV2,
  callV2Status,
  onJoinActiveCallV2,
}: any) => {
  const { t } = useLanguage();
  const [isAiSummaryModalOpen, setIsAiSummaryModalOpen] = useState(false);
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [isExtractingTasks, setIsExtractingTasks] = useState(false);
  const [isMuteUpdating, setIsMuteUpdating] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [presence, setPresence] = useState<any>(null);

  const isSavedMessages =
    selectedChat?.type === "saved_messages" ||
    selectedChat?.isSavedMessages ||
    selectedChat?.isSelfChat;
  const isGroup =
    selectedChat?.type === "GROUP" ||
    selectedChat?.type === "group" ||
    selectedChat?.isGroup === true;

  const visibleMoreActions = isSavedMessages
    ? moreActions.filter(
        (action) =>
          ![
            "call",
            "video-call",
            "share-contact",
            "send-gift",
            "mute",
            "block-user",
            "disable-sharing",
            "delete-chat",
          ].includes(action.id),
      )
    : moreActions.filter((action) =>
        isGroup ? action.id !== "block-user" : true,
      );

  const otherParticipant = (selectedChat?.participants || selectedChat?.members || []).find(
    (p: any) => p.userId !== currentUserId,
  );
  const otherParticipantUser = otherParticipant?.user || otherParticipant;

  const privateTargetUserId = useMemo(() => {
    if (!selectedChat || isGroup || isSavedMessages) return null;

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
      otherParticipant?.userId ||
      otherParticipant?.id ||
      (selectedChat.pairKey && currentUserId
        ? String(selectedChat.pairKey)
            .split("_")
            .find((id: string) => id && id !== currentUserId && id !== "self")
        : null) ||
      null
    );
  }, [currentUserId, isGroup, isSavedMessages, otherParticipant, selectedChat]);

  const displayName =
    selectedChat?.name ||
    selectedChat?.displayName ||
    selectedChat?.targetUser?.displayName ||
    selectedChat?.targetUser?.name ||
    selectedChat?.participant?.displayName ||
    selectedChat?.participant?.name ||
    selectedChat?.user?.displayName ||
    selectedChat?.user?.name ||
    otherParticipantUser?.displayName ||
    otherParticipantUser?.name ||
    otherParticipantUser?.username ||
    (isLoading ? "Opening conversation..." : "Unknown");

  const hasResolvedDisplayName = displayName !== "Unknown" && displayName !== "Opening conversation...";
  const shouldShowHeaderLoading = isLoading && !hasResolvedDisplayName;
  const headerAvatarUrl =
    selectedChat?.avatarUrl ||
    selectedChat?.targetUser?.avatarUrl ||
    selectedChat?.targetUser?.avatar ||
    selectedChat?.participant?.avatarUrl ||
    selectedChat?.participant?.avatar ||
    selectedChat?.user?.avatarUrl ||
    selectedChat?.user?.avatar ||
    otherParticipantUser?.avatarUrl ||
    otherParticipantUser?.avatar ||
    "";

  const avatarLetter =
    displayName && hasResolvedDisplayName
      ? displayName.charAt(0).toUpperCase()
      : "U";

  useEffect(() => {
    setPresence(
      privateTargetUserId
        ? {
            isOnline: Boolean(selectedChat?.isOnline),
            lastSeen: selectedChat?.lastSeen ?? null,
            visibility: selectedChat?.presenceVisibility,
          }
        : null,
    );

    if (!privateTargetUserId) return;

    let active = true;
    socketService
      .getOnlineStatus(privateTargetUserId)
      .then((status) => {
        if (!active) return;
        setPresence({
          isOnline: Boolean(status?.isOnline ?? status?.online),
          lastSeen: status?.lastSeen ?? null,
          visibility: status?.visibility,
        });
      })
      .catch(() => {});

    const cleanup = socketService.on("presence:changed", (payload: any) => {
      if (String(payload?.userId) !== String(privateTargetUserId)) return;
      setPresence((previous: any) => ({
        ...previous,
        isOnline: Boolean(payload.isOnline ?? payload.online),
        lastSeen: payload.lastSeen ?? previous?.lastSeen ?? null,
        visibility: payload.visibility ?? previous?.visibility,
      }));
    });

    return () => {
      active = false;
      cleanup();
    };
  }, [
    privateTargetUserId,
    selectedChat?.isOnline,
    selectedChat?.lastSeen,
    selectedChat?.presenceVisibility,
  ]);

  const formatLastSeen = (value: any) => {
    if (!value) return t("app.offline");
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return t("app.offline");

    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));
    if (diffMinutes < 1) return t("chat.justNow");
    if (diffMinutes < 60) return t("chat.lastSeenMinutes").replace("{count}", String(diffMinutes));

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return t("chat.lastSeenHours").replace("{count}", String(diffHours));

    return t("chat.lastSeenDate").replace("{date}", date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
    }));
  };

  const presenceLabel = isSavedMessages
    ? t("chat.savedMessagesLower")
    : isLoading
      ? t("chat.openingConversation")
      : isGroup
        ? `${selectedChat?.membersCount || selectedChat?.memberCount || ""} ${t("chat.members")}`.trim()
        : presence?.isOnline
          ? t("app.online")
          : formatLastSeen(presence?.lastSeen);

  const getMoreActionLabel = (actionId: string, fallback: string) => {
    const labels: Record<string, string> = {
      "ai-summarize": t("chat.aiSummarize"),
      "ai-smart-search": t("chat.aiSmartSearch"),
      "ai-extract-tasks": t("chat.aiExtractTasks"),
      mute: isMuted ? t("chat.unmute") : t("chat.mute"),
      call: t("chat.call"),
      "video-call": t("chat.videoCall"),
      "share-contact": t("chat.shareContact"),
      "block-user": t("chat.blockUser"),
      "delete-chat": t("chat.deleteChat"),
    };
    return labels[actionId] || fallback;
  };

  const handleToggleInfo = () => {
    setIsRightSidebarOpen(!isRightSidebarOpen);
  };

  useEffect(() => {
    setIsMuted(
      isConversationMuted(selectedConversationId) || isConversationMutedValue(selectedChat),
    );
  }, [selectedChat, selectedConversationId]);

  useEffect(() => {
    if (!selectedConversationId) return;

    const handleMuteChanged = (event: any) => {
      if (String(event?.detail?.conversationId) !== String(selectedConversationId)) return;
      setIsMuted(Boolean(event.detail.muted));
    };

    window.addEventListener("conversation:mute-local-changed", handleMuteChanged);
    return () => window.removeEventListener("conversation:mute-local-changed", handleMuteChanged);
  }, [selectedConversationId]);

  const handleToggleMute = async () => {
    if (!selectedConversationId || isMuteUpdating) return;

    const nextMuted = !isMuted;
    const previousMuted = isMuted;

    setIsMuteUpdating(true);
    setIsMuted(nextMuted);
    setConversationMuted(String(selectedConversationId), nextMuted);

    try {
      if (nextMuted) {
        await socketService.muteConversation(selectedConversationId, undefined);
      } else {
        await socketService.unmuteConversation(selectedConversationId);
      }

      window.dispatchEvent(new Event("chatList:refresh"));
    } catch (error: any) {
      setIsMuted(previousMuted);
      setConversationMuted(String(selectedConversationId), previousMuted);
      toast.error(error?.message || "Could not update notifications");
    } finally {
      setIsMuteUpdating(false);
    }
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
            toast.info(
              `AI Extracted Tasks:\n\n${tasks
                .map((task: any) => `- ${task}`)
                .join("\n")}`,
            );
          } else {
            toast.info("Không tìm thấy công việc nào.");
          }
        })
        .catch((err: any) => {
          console.error(err);
          toast.error("Lỗi khi trích xuất công việc.");
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
      return;
    }

    if (action.id === "call") {
      onStartAudioCall?.(selectedConversationId);
      return;
    }

    if (action.id === "mute") {
      void handleToggleMute();
      return;
    }

    if (action.id === "video-call") {
      onStartVideoCall?.(selectedConversationId);
      return;
    }

    if (action.id === "block-user") {
      onBlockUser?.();
      return;
    }

    if (action.id === "delete-chat") {
      onDeleteConversation?.();
    }

    if (action.id === "share-contact") {
      onOpenContactPicker?.();
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
            <div className="flex items-center gap-1 md:gap-3 min-w-0">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onCloseChat?.();
                }}
                className="lg:hidden h-10 w-10 inline-flex items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-800 shrink-0 relative z-50 cursor-pointer"
              >
                <FiArrowLeft className="text-[22px]" />
              </button>
              <div
                className="flex items-center gap-3 min-w-0 p-1.5 -ml-1.5 rounded-xl transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer"
                onClick={handleToggleInfo}
              >
              <div className="relative shrink-0">
                <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold flex items-center justify-center overflow-hidden shadow-sm border border-black/5 dark:border-white/10">
                  {isSavedMessages ? (
                    <FiBookmark className="text-[18px] lg:text-[20px]" />
                  ) : headerAvatarUrl ? (
                    <img
                      src={headerAvatarUrl}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : shouldShowHeaderLoading ? (
                    <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  ) : (
                    avatarLetter
                  )}
                </div>
                {!isSavedMessages && !isGroup && presence?.isOnline && (
                  <span className="absolute right-0 bottom-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                )}
              </div>

              <div className="min-w-0">
                <p className="font-semibold text-base md:text-lg text-gray-900 dark:text-white truncate">
                  {displayName}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  {presenceLabel}
                </p>
              </div>
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
                title={t("chat.searchConversation")}
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
                  title={t("chat.openConversationActions")}
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
                              action.id.startsWith("ai-") ? "text-blue-500" : ""
                            }`}
                          />
                        )}

                        <span className="font-semibold tracking-tight flex-1">
                          {isExtractingTasks && action.id === "ai-extract-tasks"
                            ? t("chat.extracting")
                            : getMoreActionLabel(action.id, action.label)}
                        </span>
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
              ) : headerAvatarUrl ? (
                <img
                  src={headerAvatarUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : shouldShowHeaderLoading ? (
                <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
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
                        toast.info(
                          `AI Search Results:\n\n${result.data.results
                            .map((item: any) => `- ${item.content}`)
                            .join("\n")}`,
                        );
                      } else {
                        toast.info(
                          `AI Found: ${result?.data?.summary || "No results"}`,
                        );
                      }
                    } catch (err) {
                      console.error(err);
                      toast.error("Lỗi khi tìm kiếm bằng AI.");
                    } finally {
                      setIsAiSearching(false);
                    }
                  }
                }}
                placeholder={t("chat.searchSmartPlaceholder")}
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
                title={t("chat.closeSearch")}
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
