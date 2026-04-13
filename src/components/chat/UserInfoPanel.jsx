import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  FiX,
  FiMoreVertical,
  FiPhone,
  FiBell,
  FiImage,
  FiFile,
  FiTrash2,
  FiInfo,
  FiUserPlus,
  FiCheck,
} from "react-icons/fi";
import { removeFriend, checkFriendRequestStatus, sendFriendRequest, acceptFriendRequest } from "../../services";
import { useContactsSocketListeners } from "../../hooks";

export const UserInfoPanel = ({ user, onClose, isLoading }) => {
  const [notifications, setNotifications] = useState(true);
  const [activeMediaTab, setActiveMediaTab] = useState("media");
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Friend status states
  const [friendStatus, setFriendStatus] = useState("LOADING"); // PENDING, ACCEPTED, NONE, LOADING
  const [friendRequestId, setFriendRequestId] = useState(null); // Used for accepting incoming requests
  const [friendDirection, setFriendDirection] = useState(null); // INCOMING or OUTGOING
  const [isProcessingFriend, setIsProcessingFriend] = useState(false);

  const moreMenuRef = useRef(null);

  const fetchStatus = useCallback(async () => {
    if (!user) return;
    try {
      const response = await checkFriendRequestStatus(user.id || user._id);
      const statusData = response?.data || response || {};
      setFriendStatus(statusData.status || "NONE");
      setFriendRequestId(statusData.requestId || null);
      setFriendDirection(statusData.direction || null);
    } catch (err) {
      console.error("Failed to check friend status", err);
      setFriendStatus("NONE");
      setFriendRequestId(null);
      setFriendDirection(null);
    }
  }, [user]);

  // Check their relationship status when user opens the panel
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Global event listener for custom refresh from other components
  useEffect(() => {
    window.addEventListener("friendList_refresh", fetchStatus);
    return () => window.removeEventListener("friendList_refresh", fetchStatus);
  }, [fetchStatus]);

  // Automatically refresh status on socket events
  useContactsSocketListeners({
    onFriendRequestReceived: fetchStatus,
    onFriendRequestAccepted: fetchStatus,
    onFriendRequestRejected: fetchStatus,
    onFriendRequestCanceled: fetchStatus,
    onFriendshipRemoved: fetchStatus,
  });

  const handleAddFriend = async () => {
    if (!user) return;
    setIsProcessingFriend(true);
    try {
      await sendFriendRequest(user.id || user._id);
      await fetchStatus();
      window.dispatchEvent(new CustomEvent("friendList_refresh")); // tell others
    } catch (err) {
      console.error("Failed to send friend request:", err);
      alert(err.message || "Failed to send request");
    } finally {
      setIsProcessingFriend(false);
    }
  };

  const handleAcceptRequest = async () => {
    if (!friendRequestId) return;
    setIsProcessingFriend(true);
    try {
      await acceptFriendRequest(friendRequestId);
      await fetchStatus();
      window.dispatchEvent(new CustomEvent("friendList_refresh"));
    } catch (err) {
      console.error("Failed to accept friend request:", err);
      alert(err.message || "Failed to accept friend request");
    } finally {
      setIsProcessingFriend(false);
    }
  };

  const handleDeleteContact = async () => {
    if (!user) return;
    setIsDeleting(true);
    try {
      await removeFriend(user.id || user._id);
      setShowDeleteConfirm(false);

      // Dispatch a custom event to notify ContactsPanel to refresh
      window.dispatchEvent(new CustomEvent("friendList_refresh"));

      // Optional: close the panel after deleting
      if (onClose) onClose();
      // Optional: trigger a refresh of the contacts list if there's a global context
    } catch (error) {
      console.error("Failed to delete contact:", error);
      alert(error.message || "Failed to delete contact");
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    if (!isMoreMenuOpen) return;

    const handleOutsideClick = (event) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
        setIsMoreMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") setIsMoreMenuOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMoreMenuOpen]);

  if (!user) return null;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 w-full relative">
      {/* Header */}
      <div className="flex items-center h-14 px-4 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-slate-800 flex-shrink-0">
        <button
          onClick={onClose}
          className="mr-4 hover:bg-gray-100 dark:hover:bg-slate-800 p-2 rounded-full transition-colors text-gray-500 dark:text-gray-400"
        >
          <FiX className="text-xl" />
        </button>
        <span className="text-lg font-medium flex-1">User Info</span>

        <div ref={moreMenuRef} className="relative">
          {friendStatus === "ACCEPTED" && (
            <button
              onClick={() => setIsMoreMenuOpen((prev) => !prev)}
              className={`p-2 rounded-full transition-colors ${
                isMoreMenuOpen
                  ? "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300"
                  : "hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-gray-400"
              }`}
              title="More actions"
            >
              <FiMoreVertical className="text-xl" />
            </button>
          )}

          <div
            className={`absolute right-0 top-10 w-48 rounded-xl bg-white dark:bg-slate-800 shadow-xl border border-gray-200 dark:border-slate-700 z-50 origin-top-right transition-all duration-200 ${
              isMoreMenuOpen ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
            }`}
            aria-hidden={!isMoreMenuOpen}
          >
            <div className="p-1.5">
              <button
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  setShowDeleteConfirm(true);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-[14px] font-medium text-red-500 hover:bg-gray-50 dark:hover:bg-slate-700/80 transition-colors"
              >
                <FiTrash2 className="text-[17px]" />
                <span>Delete Contact</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-950">
        {/* Profile Card */}
        <div className="flex flex-col items-center py-6 bg-white dark:bg-slate-900 shadow-sm mb-2">
          <div className="w-32 h-32 rounded-full bg-pink-500 text-white font-bold flex items-center justify-center text-5xl mb-4 overflow-hidden relative">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <span>{user.name?.charAt(0) || "U"}</span>
            )}
          </div>
          <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-1">{user.name}</h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">last seen 2 minutes ago</span>
        </div>

        {/* Info Rows */}
        <div className="flex flex-col py-2 bg-white dark:bg-slate-900 shadow-sm mb-2">
          <div className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
            <FiPhone className="text-gray-400 dark:text-gray-400 text-xl" />
            <div className="flex flex-col flex-1">
              <span className="text-[15px] text-gray-900 dark:text-gray-100">{user.phone || "+84 971484472"}</span>
              <span className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">Phone</span>
            </div>
          </div>

          <div className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
            <span className="text-gray-400 dark:text-gray-400 text-xl font-bold">@</span>
            <div className="flex flex-col flex-1">
              <span className="text-[15px] text-gray-900 dark:text-gray-100">{user.email || "No email provided"}</span>
              <span className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">Email</span>
            </div>
          </div>

          <div className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
            <FiInfo className="text-gray-400 dark:text-gray-400 text-xl" />
            <div className="flex flex-col flex-1">
              <span className="text-[15px] text-gray-900 dark:text-gray-100 min-h-[22px]">{user.bio || ""}</span>
              <span className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">Bio</span>
            </div>
          </div>

          <div className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
            <div className="flex items-center gap-4">
              <FiBell className="text-gray-400 dark:text-gray-400 text-xl" />
              <span className="text-[15px] text-gray-900 dark:text-gray-100">Notifications</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer" onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                className="sr-only peer"
                checked={notifications}
                onChange={() => setNotifications(!notifications)}
              />
              <div className="w-9 h-5 bg-gray-300 dark:bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-200 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500 dark:peer-checked:bg-blue-500 border border-gray-200 dark:border-transparent"></div>
            </label>
          </div>

          {friendStatus === "NONE" && (
            <div className="px-6 py-3 border-t border-gray-100 dark:border-slate-800">
              <button
                disabled={isProcessingFriend}
                onClick={handleAddFriend}
                className="w-full py-2.5 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 active:scale-[0.98] text-white font-medium rounded-lg transition-all disabled:opacity-50"
              >
                <FiUserPlus className="text-lg" />
                <span>{isProcessingFriend ? "Sending..." : "Add Contact"}</span>
              </button>
            </div>
          )}

          {friendStatus === "PENDING" && friendDirection === "INCOMING" && (
            <div className="px-6 py-3 border-t border-gray-100 dark:border-slate-800">
              <button
                disabled={isProcessingFriend}
                onClick={handleAcceptRequest}
                className="w-full py-2.5 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 active:scale-[0.98] text-white font-medium rounded-lg transition-all disabled:opacity-50"
              >
                <FiCheck className="text-lg" />
                <span>{isProcessingFriend ? "Accepting..." : "Accept Request"}</span>
              </button>
            </div>
          )}

          {friendStatus === "PENDING" && friendDirection === "OUTGOING" && (
            <div className="px-6 py-3 border-t border-gray-100 dark:border-slate-800">
              <button
                disabled
                className="w-full py-2.5 flex items-center justify-center gap-2 bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 font-medium rounded-lg"
              >
                <FiInfo className="text-lg" />
                <span>Request Sent</span>
              </button>
            </div>
          )}
        </div>

        {/* Media/Files Tabs */}
        <div className="bg-white dark:bg-slate-900 mb-2 min-h-[300px] shadow-sm">
          <div className="flex px-2 border-b border-gray-100 dark:border-slate-800">
            {["Media", "Files", "Links", "Audio"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveMediaTab(tab.toLowerCase())}
                className={`flex-1 py-3 text-[14px] font-medium transition-colors ${
                  activeMediaTab === tab.toLowerCase()
                    ? "text-blue-500 dark:text-blue-400 border-b-2 border-blue-500 dark:border-blue-400"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800/50 rounded-t-md"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-4 flex flex-col items-center justify-center h-48 text-gray-500 dark:text-gray-400 transition-opacity">
            {/* Media/Files content to be implemented later */}
            <span className="text-sm">No {activeMediaTab} yet</span>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Popup */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 dark:bg-black/50"
          style={{ animation: "fadeInBg 0.2s ease-out forwards" }}
        >
          <style>{`
            @keyframes fadeInBg { from { opacity: 0; } to { opacity: 1; } }
            @keyframes scaleInPopup { from { opacity: 0; transform: scale(0.85); } to { opacity: 1; transform: scale(1); } }
          `}</style>
          <div
            className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl flex flex-col overflow-hidden"
            style={{
              width: "296px",
              minHeight: "148px",
              animation: "scaleInPopup 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards",
            }}
          >
            <div className="flex items-center gap-4 px-6 pt-5 pb-3">
              <div className="w-10 h-10 rounded-full bg-pink-500 text-white font-medium flex items-center justify-center text-[15px] flex-shrink-0">
                {user.name?.substring(0, 2).toUpperCase() || "U"}
              </div>
              <h2 className="text-[19px] font-medium text-gray-900 dark:text-white leading-tight">Delete contact</h2>
            </div>

            <div className="px-6 py-1 text-[15px] text-gray-600 dark:text-gray-300 leading-snug">
              Are you sure you want to delete this contact?
            </div>

            <div className="flex justify-end gap-1 mt-auto" style={{ padding: "8px 12px" }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="px-3 py-2 text-[14px] font-medium text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-700/50 rounded transition-colors uppercase tracking-wide disabled:opacity-50"
              >
                CANCEL
              </button>
              <button
                onClick={handleDeleteContact}
                disabled={isDeleting}
                className="px-3 py-2 text-[14px] font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors uppercase tracking-wide flex items-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? "DELETING..." : "DELETE"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
