import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
  FiX,
  FiEdit2,
  FiBell,
  FiLink2,
  FiUserPlus,
  FiCheck,
  FiInfo,
  FiTrash2,
  FiMoreVertical,
  FiPhone,
} from "react-icons/fi";
import { removeFriend, checkFriendRequestStatus, sendFriendRequest, acceptFriendRequest } from "../../../services";
import { useContactsSocketListeners } from "../../../hooks";
import { userService } from "../../../services";

export const RightSidebarInfo = ({
  isGroup,
  groupName,
  groupAvatar,
  membersCount,
  members,
  isLoading,
  notificationsEnabled,
  setNotificationsEnabled,
  onClose,
  onEditClick,
  canEdit,
  targetUserId,
}: any) => {
  const [friendStatus, setFriendStatus] = useState("LOADING"); // PENDING, ACCEPTED, NONE, LOADING
  const [friendRequestId, setFriendRequestId] = useState<string | null>(null); // Used for accepting incoming requests
  const [friendDirection, setFriendDirection] = useState<string | null>(null); // INCOMING or OUTGOING
  const [isProcessingFriend, setIsProcessingFriend] = useState(false);

  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const [targetUserDetails, setTargetUserDetails] = useState<any>(null);

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (isGroup || !targetUserId) return;
      try {
        const response = await userService.getUserById(targetUserId);
        setTargetUserDetails(response?.data?.data || response?.data || response || null);
      } catch (error) {
        console.error("Failed to fetch target user details", error);
      }
    };
    fetchUserDetails();
  }, [isGroup, targetUserId]);

  const fetchStatus = useCallback(async () => {
    if (isGroup || !targetUserId) return;
    try {
      const response = await checkFriendRequestStatus(targetUserId);
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
  }, [isGroup, targetUserId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    window.addEventListener("friendList_refresh", fetchStatus);
    return () => window.removeEventListener("friendList_refresh", fetchStatus);
  }, [fetchStatus]);

  useContactsSocketListeners({
    onFriendRequestReceived: fetchStatus,
    onFriendRequestAccepted: fetchStatus,
    onFriendRequestRejected: fetchStatus,
    onFriendRequestCanceled: fetchStatus,
    onFriendshipRemoved: fetchStatus,
  });

  const handleAddFriend = async () => {
    if (!targetUserId) return;
    setIsProcessingFriend(true);
    try {
      await sendFriendRequest(targetUserId);
      await fetchStatus();
      window.dispatchEvent(new CustomEvent("friendList_refresh"));
    } catch (err: any) {
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
    } catch (err: any) {
      console.error("Failed to accept friend request:", err);
      alert(err.message || "Failed to accept friend request");
    } finally {
      setIsProcessingFriend(false);
    }
  };

  const handleDeleteContact = async () => {
    if (!targetUserId) return;
    setIsDeleting(true);
    try {
      await removeFriend(targetUserId);
      setShowDeleteConfirm(false);
      window.dispatchEvent(new CustomEvent("friendList_refresh"));
      if (onClose) onClose();
    } catch (err: any) {
      console.error("Failed to delete contact:", err);
      alert(err.message || "Failed to delete contact");
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    if (!isMoreMenuOpen) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMoreMenuOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMoreMenuOpen]);

  return (
    <div className="w-1/2 flex flex-col h-full shrink-0 relative bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-[60px] border-b border-gray-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 transition-colors"
          >
            <FiX className="text-xl" />
          </button>
          <span className="font-semibold text-[16px] text-gray-800 dark:text-gray-100">
            {isGroup ? "Group Info" : "User Info"}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {isGroup && canEdit && (
            <button
              onClick={onEditClick}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 transition-colors"
            >
              <FiEdit2 className="text-[18px]" />
            </button>
          )}

          {!isGroup && friendStatus === "ACCEPTED" && (
            <div ref={moreMenuRef} className="relative">
              <button
                onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                className={`p-2 rounded-full transition-colors ${
                  isMoreMenuOpen
                    ? "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300"
                    : "hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-gray-400"
                }`}
              >
                <FiMoreVertical className="text-xl" />
              </button>

              <div
                className={`absolute right-0 top-10 w-48 rounded-xl bg-white dark:bg-slate-800 shadow-xl border border-gray-200 dark:border-slate-700 z-50 origin-top-right transition-all duration-200 ${
                  isMoreMenuOpen
                    ? "opacity-100 scale-100 pointer-events-auto"
                    : "opacity-0 scale-95 pointer-events-none"
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
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {/* Info Section */}
        <div className="flex flex-col items-center pt-8 pb-6 px-4 border-b border-gray-100 dark:border-slate-800">
          <div className="w-28 h-28 rounded-full bg-blue-500 flex items-center justify-center text-white text-4xl font-semibold mb-4 shadow-md overflow-hidden relative group">
            {groupAvatar ? (
              <img src={groupAvatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span>{groupName.charAt(0).toUpperCase()}</span>
            )}
            {canEdit && (
              <div
                onClick={onEditClick}
                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <FiEdit2 className="text-white text-2xl" />
              </div>
            )}
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white text-center break-words w-full">
            {groupName}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isGroup ? `${membersCount} members` : "online"}
          </p>
        </div>

        {/* Settings Section */}
        <div className="py-2 border-b border-gray-100 dark:border-slate-800">
          {!isGroup && targetUserDetails && (
            <>
              <div className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group">
                <FiPhone className="text-[#aab8c2] group-hover:text-blue-500 text-xl" />
                <div className="flex flex-col flex-1">
                  <span className="text-[15px] font-medium text-gray-800 dark:text-gray-200">
                    {targetUserDetails.phone || "+84 971484472"}
                  </span>
                  <span className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">Phone</span>
                </div>
              </div>

              <div className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group">
                <span className="text-[#aab8c2] group-hover:text-blue-500 text-xl font-bold">@</span>
                <div className="flex flex-col flex-1">
                  <span className="text-[15px] font-medium text-gray-800 dark:text-gray-200">
                    {targetUserDetails.email || "No email provided"}
                  </span>
                  <span className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">Email</span>
                </div>
              </div>

              <div className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group">
                <FiInfo className="text-[#aab8c2] group-hover:text-blue-500 text-xl" />
                <div className="flex flex-col flex-1">
                  <span className="text-[15px] font-medium text-gray-800 dark:text-gray-200 min-h-[22px]">
                    {targetUserDetails.bio || ""}
                  </span>
                  <span className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">Bio</span>
                </div>
              </div>
            </>
          )}

          {isGroup && (
            <div className="flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group">
              <FiLink2 className="text-[#aab8c2] group-hover:text-blue-500 text-xl mr-4" />
              <div className="flex-1">
                <div className="text-[15px] font-medium text-gray-800 dark:text-gray-200">t.me/+xyz123 link</div>
                <div className="text-[13px] text-gray-500">Link</div>
              </div>
            </div>
          )}

          <div
            className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group"
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
          >
            <div className="flex items-center">
              <FiBell className="text-[#aab8c2] group-hover:text-blue-500 text-xl mr-4" />
              <div className="text-[15px] font-medium text-gray-800 dark:text-gray-200">Notifications</div>
            </div>
            {/* Toggle switch */}
            <div
              className={`w-10 h-5 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
                notificationsEnabled ? "bg-blue-500" : "bg-gray-300 dark:bg-slate-600"
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                  notificationsEnabled ? "translate-x-4" : ""
                }`}
              ></div>
            </div>
          </div>

          {!isGroup && friendStatus === "NONE" && (
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

          {!isGroup && friendStatus === "PENDING" && friendDirection === "INCOMING" && (
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

          {!isGroup && friendStatus === "PENDING" && friendDirection === "OUTGOING" && (
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

        {/* Members Section (Group Only) */}
        {isGroup && (
          <div className="pb-24">
            {isLoading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
              </div>
            ) : (
              members.map((member: any) => {
                const participant = member.user || member;
                const displayName = participant.displayName || participant.name || participant.username || "Unknown";
                const isOwner = member.role === "admin" || member.role === "owner";

                return (
                  <div
                    key={member._id || member.id || participant._id || participant.id}
                    className="flex items-center px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-orange-400 font-semibold text-white flex items-center justify-center mr-3 overflow-hidden shrink-0">
                      {participant.avatarUrl || participant.avatar ? (
                        <img
                          src={participant.avatarUrl || participant.avatar}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{displayName.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] font-medium text-gray-900 dark:text-gray-100 truncate">
                        {displayName}
                      </div>
                      <div className="text-[13px] text-gray-500 dark:text-gray-400 truncate">last seen recently</div>
                    </div>
                    {isOwner && <span className="text-[12px] text-gray-400 dark:text-gray-500 font-medium">owner</span>}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Floating Add Button */}
      {isGroup && (
        <button className="absolute bottom-6 right-6 w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 z-30">
          <FiUserPlus className="text-2xl" />
        </button>
      )}

      {/* Delete Confirmation Popup */}
      {showDeleteConfirm &&
        typeof window !== "undefined" &&
        createPortal(
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
                  {groupName?.substring(0, 2).toUpperCase() || "U"}
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
          </div>,
          document.body,
        )}
    </div>
  );
};
