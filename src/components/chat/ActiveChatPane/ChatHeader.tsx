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
} from "react-icons/fi";

const moreActions = [
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
}: any) => {
  return (
    <div className="px-4 lg:px-5 py-2.5 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
      {!isHeaderSearchOpen ? (
        <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}>
          <div 
            className="flex items-center gap-3 min-w-0  hover:bg-gray-50 dark:hover:bg-slate-800/50 p-1.5 -ml-1.5 rounded-xl transition-colors"
            
          >
            <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold flex items-center justify-center overflow-hidden shrink-0 shadow-sm border border-black/5 dark:border-white/10">
              {selectedChat?.avatarUrl ? (
                <img
                  src={selectedChat.avatarUrl}
                  alt={selectedChat.name || selectedChat.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                (
                  selectedChat?.name ||
                  selectedChat?.displayName ||
                  (selectedChat?.participants || []).find(
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
                {selectedChat?.name ||
                  selectedChat?.displayName ||
                  (selectedChat?.participants || []).find(
                    (p) => p.userId !== currentUserId,
                  )?.displayName ||
                  "Unknown"}
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
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
          <div 
            className="w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold flex items-center justify-center overflow-hidden shrink-0 cursor-pointer hover:opacity-90 transition-opacity shadow-sm border border-black/5 dark:border-white/10"
            onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
          >
            {selectedChat?.avatarUrl ? (
              <img
                src={selectedChat.avatarUrl}
                alt={selectedChat.name || selectedChat.displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              (
                selectedChat?.name ||
                selectedChat?.displayName ||
                (selectedChat?.participants || []).find(
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
  );
};
