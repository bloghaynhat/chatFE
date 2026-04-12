import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChatList } from "../chat/ChatList";
import { ContactsPanel } from "../chat/ContactsPanel";
import { UserProfileModal } from "../common";
import { MainTaskbar } from "./MainTaskbar";
import { QuickActionFab } from "./QuickActionFab";
import { QuickActionSheet } from "./QuickActionSheet";
import { useAuth, useFriendManagement } from "../../hooks";
import { useFriendRequestsContext } from "../../context/FriendContext";
import { FiBookmark, FiArchive, FiMoon, FiUsers, FiSettings, FiLogOut } from "react-icons/fi";
import { MdOutlineGroups } from "react-icons/md";

export const ResizableChatPanel = ({ activeView, onViewChange, activeChatId, openingChatId, onSelectChat }) => {
  const [width, setWidth] = useState(320); // Default width in pixels
  const [isResizing, setIsResizing] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState("all");
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const panelRef = useRef(null);
  const navigationMenuRef = useRef(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
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

  // Ensure width bounds are respected when switching views
  useEffect(() => {
    setWidth((currentWidth) => Math.max(minWidth, Math.min(currentWidth, maxWidth)));
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
      setFilterMode("archived");
      setSearchQuery("");
      setIsNavigationOpen(false);
      return;
    }

    if (actionId === "saved") {
      setFilterMode("all");
      setIsNavigationOpen(false);
      return;
    }

    if (actionId === "new-group") {
      setIsQuickActionOpen(true);
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
    <div className="flex h-full relative">
      {/* Chat Panel */}
      <div
        ref={panelRef}
        style={{ width: `${isCollapsed ? minWidth : width}px` }}
        className={`flex flex-col bg-white dark:bg-slate-900 border-r dark:border-slate-700 relative ${isResizing ? "" : "transition-all duration-200"}`}
      >
        {activeView === "chats" && (
          <MainTaskbar
            searchValue={searchQuery}
            onSearchChange={(value) => {
              setSearchQuery(value);
              setFilterMode("all");
            }}
            onOpenMenu={() => setIsNavigationOpen(true)}
            onClearSearch={() => setSearchQuery("")}
            friendRequestCount={friendRequests.length}
            isCollapsed={isCollapsed}
          />
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
                      alt={user?.displayName || "User"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    user?.displayName?.charAt(0) || "U"
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white truncate">{user?.displayName || "User"}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Online</p>
                </div>
              </button>

              <button
                onClick={() => setIsNavigationOpen(false)}
                className="mt-1 w-full flex items-center gap-2 rounded-lg p-2 text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-700 transition"
              >
                <span className="text-xl leading-none">＋</span>
                <span className="text-sm font-medium">Add Account</span>
              </button>
            </div>

            <div className="py-1 bg-gray-100 dark:bg-slate-800">
              <button
                onClick={() => handleMenuAction("saved")}
                className="w-full text-left px-4 py-3 text-sm text-gray-800 dark:text-gray-100 hover:bg-gray-200/70 dark:hover:bg-slate-700 transition flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <FiBookmark className="text-lg opacity-70" />
                  <span>Saved Messages</span>
                </div>
              </button>

              <button
                onClick={() => handleMenuAction("archived")}
                className="w-full text-left px-4 py-3 text-sm text-gray-800 dark:text-gray-100 hover:bg-gray-200/70 dark:hover:bg-slate-700 transition flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <FiArchive className="text-lg opacity-70" />
                  <span>Archived Chats</span>
                </div>
                <span className="text-xs font-semibold bg-gray-200 dark:bg-slate-700 px-2 py-0.5 rounded-full text-gray-500 dark:text-gray-400">
                  1
                </span>
              </button>

              <button
                onClick={() => setIsNavigationOpen(false)}
                className="w-full text-left px-4 py-3 text-sm text-gray-800 dark:text-gray-100 hover:bg-gray-200/70 dark:hover:bg-slate-700 transition flex items-center gap-3"
              >
                <FiMoon className="text-lg opacity-70" />
                <span>My Stories</span>
              </button>

              <button
                onClick={() => handleMenuAction("contacts")}
                className="w-full text-left px-4 py-3 text-sm text-gray-800 dark:text-gray-100 hover:bg-gray-200/70 dark:hover:bg-slate-700 transition flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <FiUsers className="text-lg opacity-70" />
                  <span>Contacts</span>
                </div>
                {friendRequests.length > 0 && (
                  <span className="text-xs font-semibold bg-red-500 text-white px-2 py-0.5 rounded-full">
                    {friendRequests.length}
                  </span>
                )}
              </button>

              <div className="h-px bg-gray-200 dark:bg-slate-700 my-1" />

              <button
                onClick={() => setIsNavigationOpen(false)}
                className="w-full text-left px-4 py-3 text-sm text-gray-800 dark:text-gray-100 hover:bg-gray-200/70 dark:hover:bg-slate-700 transition flex items-center gap-3"
              >
                <FiSettings className="text-lg opacity-70" />
                <span>Settings</span>
              </button>

              <button
                onClick={() => handleMenuAction("new-group")}
                className="w-full text-left px-4 py-3 text-sm text-gray-800 dark:text-gray-100 hover:bg-gray-200/70 dark:hover:bg-slate-700 transition flex items-center gap-3"
              >
                <MdOutlineGroups className="text-xl opacity-70" />
                <span>New Group</span>
              </button>

              <div className="h-px bg-gray-200 dark:bg-slate-700 my-1" />

              <button
                onClick={() => handleMenuAction("logout")}
                className="w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition flex items-center gap-3 font-medium"
              >
                <FiLogOut className="text-lg" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}

        {/* === SLIDING CONTAINER FOR CHATS/CONTACTS === */}
        <div className="flex-1 w-full relative overflow-hidden flex flex-col pointer-events-none">
          {/* Chats View */}
          <div
            className={`absolute inset-0 flex flex-col bg-white dark:bg-slate-900 transition-all duration-300 ease-[cubic-bezier(0.33,1,0.68,1)] z-10 ${activeView === "contacts" ? "-translate-x-[20%] opacity-0 pointer-events-none" : "translate-x-0 opacity-100 pointer-events-auto"}`}
          >
            <div className="flex-1 overflow-hidden relative">
              <ChatList
                searchQuery={debouncedSearchQuery}
                filterMode={filterMode}
                isCollapsed={isCollapsed}
                activeChatId={activeChatId}
                openingChatId={openingChatId}
                onSelectChat={onSelectChat}
              />

              {!isCollapsed && (
                <QuickActionFab onClick={() => setIsQuickActionOpen(!isQuickActionOpen)} isOpen={isQuickActionOpen} />
              )}

              <QuickActionSheet
                isOpen={isQuickActionOpen}
                onClose={() => setIsQuickActionOpen(false)}
                onSelectAction={(actionId) => {
                  setIsQuickActionOpen(false);

                  if (actionId === "new-message" || actionId === "add-contact") {
                    onViewChange("contacts");
                    return;
                  }

                  if (actionId === "create-group") {
                    onViewChange("contacts");
                    return;
                  }
                }}
              />
            </div>
          </div>

          {/* Contacts View */}
          <div
            className={`absolute inset-0 flex flex-col bg-white dark:bg-slate-900 transition-transform duration-300 ease-[cubic-bezier(0.33,1,0.68,1)] shadow-[-5px_0_15px_rgba(0,0,0,0.05)] dark:shadow-[-5px_0_15px_rgba(0,0,0,0.2)] z-20 pointer-events-auto ${activeView === "contacts" ? "translate-x-0" : "translate-x-full"}`}
          >
            <ContactsPanel
              isCollapsed={isCollapsed}
              onBackToChats={() => onViewChange("chats")}
              onSelectChat={onSelectChat}
            />
          </div>
        </div>
      </div>

      {/* Resize Handle */}
      <div
        onMouseDown={(e) => {
          e.preventDefault();
          setIsResizing(true);
        }}
        className={`w-1 bg-gray-200 dark:bg-slate-700 hover:bg-blue-500 dark:hover:bg-blue-500 cursor-col-resize transition-colors z-50 ${isResizing ? "bg-blue-500" : ""}`}
      />

      {/* Profile Modal - Rendered outside ProfileMenu so it persists when menu closes */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onSuccess={() => {
          // Optional: Handle success callback
        }}
      />
    </div>
  );
};
