import { ContextMenuDropdown } from "./RightSideBarTypes/ContextMenuDropdown";
import { RightSidebarHeader } from "./RightSideBarTypes/RightSidebarHeader";
import { RightSidebarAvatar } from "./RightSideBarTypes/RightSidebarAvatar";
import { RightSidebarSettings } from "./RightSideBarTypes/RightSidebarSettings";
import { RightSidebarMemberList } from "./RightSideBarTypes/RightSidebarMemberList";
import { MoreMenu } from "./RightSideBarTypes/MoreMenu";
import { DeleteContactModal } from "./RightSideBarTypes/DeleteContactModal";
import { MediaGallery } from "./MediaGallery";
import React, { useState, useEffect, useCallback } from "react";
import { useContactsSocketListeners } from "../../../hooks";
import { removeFriend, checkFriendRequestStatus, sendFriendRequest, acceptFriendRequest } from "../../../services";
import { userService } from "../../../services";

interface RightSidebarInfoProps {
  isGroup: boolean;
  groupName?: string;
  groupAvatar?: string;
  membersCount?: number;
  members: any[];
  isLoading: boolean;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
  onClose: () => void;
  onEditClick?: () => void;
  canEdit?: boolean;
  currentUserRole?: string;
  currentUserId?: string;
  onRemoveMember?: (userId: string) => void;
  onPromoteAdmin?: (userId: string) => void;
  onSendMessage?: (member: any) => void;
  onLeaveGroup?: () => void;
  targetUserId?: string | null;
  conversationId?: string;
  onShowInChat?: (mediaUrl: string) => void;
  messages?: any[];
}

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
  currentUserRole,
  currentUserId,
  onRemoveMember,
  onPromoteAdmin,
  onSendMessage,
  onLeaveGroup,
  targetUserId,
  conversationId,
  onShowInChat,
  messages,
}: RightSidebarInfoProps) => {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; member: any } | null>(null);
  const [friendStatus, setFriendStatus] = useState<"LOADING" | "PENDING" | "ACCEPTED" | "NONE">("LOADING");
  const [friendRequestId, setFriendRequestId] = useState<string | null>(null);
  const [friendDirection, setFriendDirection] = useState<"INCOMING" | "OUTGOING" | null>(null);
  const [isProcessingFriend, setIsProcessingFriend] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [targetUserDetails, setTargetUserDetails] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"members" | "images" | "files" | "links" | "voice">("images");

  // Fetch user details for non-group view
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

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

  // Check friend status for non-group
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

  const handleContextMenu = (e: React.MouseEvent, member: any) => {
    e.preventDefault();
    e.stopPropagation();
    const x = Math.min(e.clientX, window.innerWidth - 220);
    const y = Math.min(e.clientY, window.innerHeight - 200);
    setContextMenu({ x, y, member });
  };

  const handleAction = (action: string) => {
    if (!contextMenu) return;
    const { member } = contextMenu;
    const memberId = member.userId || member.user?.id || member.user?._id;

    switch (action) {
      case "sendMessage":
        if (onSendMessage) onSendMessage(member);
        break;
      case "promote":
        if (onPromoteAdmin) onPromoteAdmin(memberId);
        break;
      case "remove":
        if (onRemoveMember) onRemoveMember(memberId);
        break;
      case "leave":
        if (onLeaveGroup) onLeaveGroup();
        break;
    }
    setContextMenu(null);
  };

  // Determine display name
  const displayName = isGroup
    ? groupName || "Group"
    : targetUserDetails?.displayName || targetUserDetails?.name || targetUserDetails?.username || "User";

  return (
    <div className="w-1/4 flex flex-col h-full shrink-0 relative bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-slate-800">
      <RightSidebarHeader isGroup={isGroup} onClose={onClose} onEditClick={onEditClick}>
        {!isGroup && (
          <MoreMenu
            isOpen={isMoreMenuOpen}
            onToggle={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
            onDeleteClick={() => setShowDeleteConfirm(true)}
          />
        )}
      </RightSidebarHeader>

      <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col">
        <RightSidebarAvatar
          avatarUrl={isGroup ? groupAvatar : targetUserDetails?.avatarUrl}
          name={displayName}
          canEdit={canEdit}
          onEditClick={onEditClick}
        />

        <RightSidebarSettings
          isGroup={isGroup}
          targetUserDetails={targetUserDetails}
          notificationsEnabled={notificationsEnabled}
          setNotificationsEnabled={setNotificationsEnabled}
          friendStatus={friendStatus}
          friendDirection={friendDirection}
          isProcessingFriend={isProcessingFriend}
          onAddFriend={handleAddFriend}
          onAcceptRequest={handleAcceptRequest}
        />

        {/* Tab Navigation - Members + Media tabs for groups, Media only for private */}
        {(isGroup || conversationId) && (
          <div className="flex border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 flex-shrink-0">
            {/* Members tab - only for groups */}
            {isGroup && (
              <button
                onClick={() => setActiveTab("members")}
                className={`flex-1 min-w-0 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === "members"
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
                }`}
              >
                Members
              </button>
            )}

            {/* Media/Files/Links/Voice tabs - for both groups and private */}
            {conversationId && (
              <>
                <button
                  onClick={() => setActiveTab("images")}
                  className={`flex-1 min-w-0 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === "images"
                      ? "border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
                  }`}
                >
                  Media
                </button>
                <button
                  onClick={() => setActiveTab("files")}
                  className={`flex-1 min-w-0 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === "files"
                      ? "border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
                  }`}
                >
                  Files
                </button>
                <button
                  onClick={() => setActiveTab("links")}
                  className={`flex-1 min-w-0 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === "links"
                      ? "border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
                  }`}
                >
                  Links
                </button>
                <button
                  onClick={() => setActiveTab("voice")}
                  className={`flex-1 min-w-0 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === "voice"
                      ? "border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
                  }`}
                >
                  Voice
                </button>
              </>
            )}
          </div>
        )}

        {/* Content Area */}
        {activeTab === "members" && isGroup && (
          <div className="flex-1 overflow-y-auto">
            <RightSidebarMemberList
              members={members}
              isLoading={isLoading}
              contextMenu={contextMenu}
              onContextMenu={handleContextMenu}
            />
          </div>
        )}

        {(activeTab === "images" || activeTab === "files" || activeTab === "links" || activeTab === "voice") &&
          conversationId && (
            <div className="flex-1 overflow-hidden">
              <MediaGallery
                conversationId={conversationId}
                currentUserId={currentUserId}
                onShowInChat={onShowInChat}
                messages={messages}
                activeTab={activeTab}
                hideTabNavigation={true}
              />
            </div>
          )}
      </div>

      <ContextMenuDropdown
        contextMenu={contextMenu}
        onAction={handleAction}
        currentUserRole={currentUserRole}
        currentUserId={currentUserId}
      />

      <DeleteContactModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteContact}
        contactName={displayName}
        isLoading={isDeleting}
      />
    </div>
  );
};
