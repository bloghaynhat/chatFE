import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChatList } from "../chat/ChatList";
import { ContactsPanel } from "../chat/ContactsPanel";
import { SettingsPanel } from "./SettingsPanel";
import { DevicesPanel } from "./DevicesPanel";
import { PrivacySecurityPanel } from "./PrivacySecurityPanel";
import { BlockListPanel } from "./BlockListPanel";
import { UserProfileModal, CreateGroupModal } from "../common";
import { MainTaskbar } from "./MainTaskbar";
import { QuickActionFab } from "./QuickActionFab";
import { QuickActionSheet } from "./QuickActionSheet";
import { useAuth, useFriendManagement } from "../../hooks";
import { useFriendRequestsContext, useLanguage } from "../../context";
import {
  FiPlus,
  FiBookmark,
  FiArchive,
  FiMoon,
  FiUsers,
  FiSettings,
  FiLogOut,
  FiArrowLeft,
} from "react-icons/fi";
import { MdOutlineGroups } from "react-icons/md";

export const ResizableChatPanel = ({
  activeView,
  onViewChange,
  activeChatId,
  openingChatId,
  onSelectChat,
  onForwardToTarget,
  onForwardMessages,
  onOpenSavedMessages,
}: any) => {
  const [width, setWidth] = useState(320); // Default width in pixels
  const [isResizing, setIsResizing] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [isSearchClosing, setIsSearchClosing] = useState(false);
  const [filterMode, setFilterMode] = useState("all");
  const [archiveStats, setArchiveStats] = useState({
    count: 0,
    unreadCount: 0,
    preview: "",
  });
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const panelRef = useRef(null);
  const navigationMenuRef = useRef(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const { friendRequests, fetchFriendRequests } = useFriendRequestsContext();

  // Fetch friend requests on mount
  useEffect(() => {
    fetchFriendRequests();
  }, []);

  // Refetch friend requests when switching to contacts view (clear stale cache)
  useEffect(() => {
    if (activeView === "contacts") {
      fetchFriendRequests();
    }
  }, [activeView]);

  const minWidth = activeView === "contacts" ? 308 : 80;
  const maxWidth = activeView === "contacts" ? 420 : 500;
  const isCollapsed = width <= 120;

  const openArchivedChats = () => {
    setFilterMode("archived");
    setSearchQuery("");
    setDebouncedSearchQuery("");
    setIsSearchMode(false);
    setIsSearchClosing(false);
    setIsNavigationOpen(false);
  };

  const backToAllChats = () => {
    setFilterMode("all");
    setSearchQuery("");
    setDebouncedSearchQuery("");
    setIsSearchMode(false);
    setIsSearchClosing(false);
  };

  // Ensure width bounds are respected when switching views
  useEffect(() => {
    setWidth((currentWidth) =>
      Math.max(minWidth, Math.min(currentWidth, maxWidth)),
    );
  }, [minWidth, maxWidth]);

  const handleMenuAction = (actionId) => {
    if (actionId === "profile") {
      setShowProfileModal(true);
      setIsNavigationOpen(false);
      return;
    }

    if (actionId === "contacts") {
      onViewChange("contacts");
      setIsNavigationOpen(false);
      return;
    }

    if (actionId === "archived") {
      openArchivedChats();
      return;
    }

    if (actionId === "saved") {
      setFilterMode("all");
      setIsNavigationOpen(false);
      onOpenSavedMessages?.();
      return;
    }

    if (actionId === "new-group") {
      setShowCreateGroupModal(true);
      setIsNavigationOpen(false);
      return;
    }

    if (actionId === "settings") {
      onViewChange("settings");
      setIsNavigationOpen(false);
      return;
    }

    if (actionId === "logout") {
      logout();
      navigate("/login");
      setIsNavigationOpen(false);
      return;
    }

    setIsNavigationOpen(false);
  };

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        isNavigationOpen &&
        navigationMenuRef.current &&
        !navigationMenuRef.current.contains(e.target) &&
        !e.target.closest('button[title="Open navigation menu"]')
      ) {
        setIsNavigationOpen(false);
      }
    };

    const handleEscapeKey = (e) => {
      if (isNavigationOpen && e.key === "Escape") {
        setIsNavigationOpen(false);
      }
    };

    if (isNavigationOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("keydown", handleEscapeKey);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isNavigationOpen]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 250);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => {
    let animationFrameId;

    const handleMouseMove = (e) => {
      if (!isResizing) return;

      // Use requestAnimationFrame to throttle state updates to the display's refresh rate
      if (animationFrameId) cancelAnimationFrame(animationFrameId);

      animationFrameId = requestAnimationFrame(() => {
        const newWidth = e.clientX;
        if (newWidth >= minWidth && newWidth <= maxWidth) {
          setWidth(newWidth);
        }
      });
    };

    const handleMouseUp = () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      setIsResizing(false);
    };

    if (isResizing) {
      document.body.style.cursor = "col-resize"; // enforce cursor while dragging
      document.body.style.userSelect = "none"; // prevent text selection while dragging
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isResizing, minWidth, maxWidth, activeView]);

  return (
    <div className="flex h-full relative w-full lg:w-auto">
      {/* Chat Panel */}
      <div
        ref={panelRef}
        className={`flex flex-col bg-white dark:bg-black lg:dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 relative w-full lg:w-[360px] transition-all duration-200`}
      >
        {activeView === "chats" && (
          filterMode === "archived" ? (
            <div className="h-[58px] shrink-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center px-2 gap-2">
              <button
                onClick={backToAllChats}
                className="h-10 w-10 rounded-full flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition"
                title={t("app.back")}
                aria-label={t("app.back")}
              >
                <FiArrowLeft className="text-xl" />
              </button>
              {!isCollapsed && (
                <div className="min-w-0">
                  <p className="text-base font-semibold text-gray-950 dark:text-white truncate">
                    {t("nav.archivedChats")}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {archiveStats.count} {archiveStats.count === 1 ? t("archive.conversation") : t("archive.conversations")}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <MainTaskbar
              searchValue={searchQuery}
              onSearchChange={(value) => {
                setIsSearchClosing(false);
                setSearchQuery(value);
                setFilterMode("all");
                setIsSearchMode(true);
              }}
              onSearchFocus={() => {
                setIsSearchClosing(false);
                setFilterMode("all");
                setIsSearchMode(true);
              }}
              onOpenMenu={() => setIsNavigationOpen(true)}
              onClearSearch={() => setSearchQuery("")}
              onExitSearch={() => {
                setIsSearchClosing(true);
                window.setTimeout(() => {
                  setSearchQuery("");
                  setDebouncedSearchQuery("");
                  setIsSearchMode(false);
                  setIsSearchClosing(false);
                }, 180);
              }}
              isSearchMode={isSearchMode}
              friendRequestCount={friendRequests.length}
              isCollapsed={isCollapsed}
              placeholder={t("search.placeholder")}
            />
          )
        )}

        {/* Navigation Drawer */}
        {isNavigationOpen && (
          <div
            ref={navigationMenuRef}
            className="absolute left-2 top-2 w-[284px] bg-gray-100 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-xl z-[60] overflow-hidden origin-top-left animate-menu-pop"
          >
            <div className="px-3 py-2 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <button
                onClick={() => handleMenuAction("profile")}
                className="w-full flex items-center gap-3 text-left rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-slate-700 transition"
              >
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold flex items-center justify-center overflow-hidden">
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user?.displayName || t("app.user")}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    user?.displayName?.charAt(0) || t("app.user").charAt(0)
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white truncate">
                    {user?.displayName || t("app.user")}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t("app.online")}
                  </p>
                </div>
              </button>
            </div>

            <div className="py-1 bg-gray-100 dark:bg-slate-800">
              <button
                onClick={() => handleMenuAction("saved")}
                className="w-full text-left px-4 py-3 text-sm text-gray-800 dark:text-gray-100 hover:bg-gray-200/70 dark:hover:bg-slate-700 transition flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <FiBookmark className="text-lg opacity-70" />
                  <span>{t("nav.savedMessages")}</span>
                </div>
              </button>

              <button
                onClick={() => handleMenuAction("archived")}
                className="w-full text-left px-4 py-3 text-sm text-gray-800 dark:text-gray-100 hover:bg-gray-200/70 dark:hover:bg-slate-700 transition flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <FiArchive className="text-lg opacity-70" />
                  <span>{t("nav.archivedChats")}</span>
                </div>
                {archiveStats.unreadCount > 0 && (
                  <span className="text-xs font-semibold bg-gray-500 text-white px-2 py-0.5 rounded-full">
                    {archiveStats.unreadCount > 99 ? "99+" : archiveStats.unreadCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => handleMenuAction("contacts")}
                className="w-full text-left px-4 py-3 text-sm text-gray-800 dark:text-gray-100 hover:bg-gray-200/70 dark:hover:bg-slate-700 transition flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <FiUsers className="text-lg opacity-70" />
                  <span>{t("nav.contacts")}</span>
                </div>
                {friendRequests.length > 0 && (
                  <span className="text-xs font-semibold bg-red-500 text-white px-2 py-0.5 rounded-full">
                    {friendRequests.length}
                  </span>
                )}
              </button>

              <div className="h-px bg-gray-200 dark:bg-slate-700 my-1" />

              <button
                onClick={() => handleMenuAction("settings")}
                className="w-full text-left px-4 py-3 text-sm text-gray-800 dark:text-gray-100 hover:bg-gray-200/70 dark:hover:bg-slate-700 transition flex items-center gap-3"
              >
                <FiSettings className="text-lg opacity-70" />
                <span>{t("nav.settings")}</span>
              </button>

              <button
                onClick={() => handleMenuAction("new-group")}
                className="w-full text-left px-4 py-3 text-sm text-gray-800 dark:text-gray-100 hover:bg-gray-200/70 dark:hover:bg-slate-700 transition flex items-center gap-3"
              >
                <MdOutlineGroups className="text-xl opacity-70" />
                <span>{t("nav.newGroup")}</span>
              </button>

              <div className="h-px bg-gray-200 dark:bg-slate-700 my-1" />

              <button
                onClick={() => handleMenuAction("logout")}
                className="w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition flex items-center gap-3 font-medium"
              >
                <FiLogOut className="text-lg" />
                <span>{t("nav.logout")}</span>
              </button>
            </div>
          </div>
        )}

        {/* === SLIDING CONTAINER FOR CHATS/CONTACTS === */}
        <div className="flex-1 w-full relative overflow-hidden flex flex-col pointer-events-none">
          {/* Chats View */}
          <div
            className={`absolute inset-0 flex flex-col bg-white dark:bg-black lg:dark:bg-slate-900 transition-all duration-300 ease-[cubic-bezier(0.33,1,0.68,1)] z-10 ${activeView === "chats" ? "translate-x-0 opacity-100 pointer-events-auto" : "-translate-x-[20%] opacity-0 pointer-events-none"}`}
          >
            <div className="flex-1 overflow-hidden relative flex flex-col">
              {filterMode !== "archived" && archiveStats.count > 0 && !isSearchMode && !debouncedSearchQuery && (
                <button
                  onClick={openArchivedChats}
                  className={`w-full h-[74px] flex items-center px-3 gap-3 border-b border-gray-100 dark:border-slate-800 hover:bg-gray-100 dark:hover:bg-slate-800 transition text-left ${
                    isCollapsed ? "justify-center px-2" : ""
                  }`}
                >
                  <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white shadow-sm">
                    <FiArchive className="text-xl" />
                    {isCollapsed && archiveStats.unreadCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gray-500 px-1 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                        {archiveStats.unreadCount > 99 ? "99+" : archiveStats.unreadCount}
                      </span>
                    )}
                  </div>
                  {!isCollapsed && (
                    <>
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-semibold text-gray-950 dark:text-white truncate">
                          {t("nav.archivedChats")}
                        </p>
                        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400 truncate">
                          {archiveStats.preview || `${archiveStats.count} ${t("archive.previewFallback")} ${archiveStats.count === 1 ? t("archive.conversation") : t("archive.conversations")}`}
                        </p>
                      </div>
                      {archiveStats.unreadCount > 0 && (
                        <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-gray-500 px-2 text-xs font-bold text-white">
                          {archiveStats.unreadCount > 99 ? "99+" : archiveStats.unreadCount}
                        </span>
                      )}
                    </>
                  )}
                </button>
              )}
              <div className="flex-1 min-h-0">
                <ChatList
                  searchQuery={debouncedSearchQuery}
                  isSearchMode={isSearchMode}
                  isSearchClosing={isSearchClosing}
                  filterMode={filterMode}
                  isCollapsed={isCollapsed}
                  activeChatId={activeChatId}
                  openingChatId={openingChatId}
                  isGlobalSearchEnabled={true}
                  onArchiveStatsChange={setArchiveStats}
                  onSelectChat={onSelectChat}
                  onForwardToTarget={onForwardToTarget}
                  onForwardMessages={onForwardMessages}
                />
              </div>

              {!isCollapsed && (
                <QuickActionFab
                  onClick={() => setIsQuickActionOpen(!isQuickActionOpen)}
                  isOpen={isQuickActionOpen}
                />
              )}

              <QuickActionSheet
                isOpen={isQuickActionOpen}
                onClose={() => setIsQuickActionOpen(false)}
                onSelectAction={(actionId) => {
                  setIsQuickActionOpen(false);

                  if (
                    actionId === "new-message" ||
                    actionId === "add-contact"
                  ) {
                    onViewChange("contacts");
                    return;
                  }

                  if (actionId === "new-group" || actionId === "create-group") {
                    setShowCreateGroupModal(true);
                    return;
                  }
                }}
              />
            </div>
          </div>

          {/* Contacts View */}
          <div
            className={`absolute inset-0 flex flex-col bg-white dark:bg-black lg:dark:bg-slate-900 transition-transform duration-300 ease-[cubic-bezier(0.33,1,0.68,1)] z-20 pointer-events-auto ${activeView === "contacts" ? "translate-x-0" : "translate-x-full"}`}
          >
            <ContactsPanel
              isCollapsed={isCollapsed}
              onBackToChats={() => onViewChange("chats")}
              onSelectChat={onSelectChat}
            />
          </div>

          {/* Settings View */}
          <div
            className={`absolute inset-0 flex flex-col bg-white dark:bg-black lg:dark:bg-slate-900 transition-transform duration-300 ease-[cubic-bezier(0.33,1,0.68,1)] z-30 pointer-events-auto ${activeView === "settings" ? "translate-x-0" : activeView === "devices" || activeView === "privacy-security" || activeView === "block-list" ? "-translate-x-[20%]" : "translate-x-full pointer-events-none"}`}
          >
            <SettingsPanel
              isCollapsed={isCollapsed}
              onBack={() => onViewChange("chats")}
              onNavigate={onViewChange}
            />
          </div>

          {/* Privacy and Security View */}
          <div
            className={`absolute inset-0 flex flex-col bg-white dark:bg-black lg:dark:bg-slate-900 transition-transform duration-300 ease-[cubic-bezier(0.33,1,0.68,1)] z-40 pointer-events-auto ${activeView === "privacy-security" ? "translate-x-0" : activeView === "block-list" ? "-translate-x-[20%]" : "translate-x-full pointer-events-none"}`}
          >
            <PrivacySecurityPanel
              isCollapsed={isCollapsed}
              onBack={() => onViewChange("settings")}
              onNavigate={onViewChange}
            />
          </div>

          {/* Devices View */}
          <div
            className={`absolute inset-0 flex flex-col bg-white dark:bg-black lg:dark:bg-slate-900 transition-transform duration-300 ease-[cubic-bezier(0.33,1,0.68,1)] z-40 pointer-events-auto ${activeView === "devices" ? "translate-x-0" : "translate-x-full pointer-events-none"}`}
          >
            <DevicesPanel
              isCollapsed={isCollapsed}
              onBack={() => onViewChange("settings")}
            />
          </div>

          {/* Block List View */}
          <div
            className={`absolute inset-0 flex flex-col bg-white dark:bg-black lg:dark:bg-slate-900 transition-transform duration-300 ease-[cubic-bezier(0.33,1,0.68,1)] z-50 pointer-events-auto ${activeView === "block-list" ? "translate-x-0" : "translate-x-full pointer-events-none"}`}
          >
            <BlockListPanel
              isCollapsed={isCollapsed}
              onBack={() => onViewChange("privacy-security")}
            />
          </div>
        </div>
      </div>

      {/* Resize Handle Removed */}

      {/* Profile Modal - Rendered outside ProfileMenu so it persists when menu closes */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onSuccess={() => {
          // Optional: Handle success callback
        }}
      />

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
      />
    </div>
  );
};
