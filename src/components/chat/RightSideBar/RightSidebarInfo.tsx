import { ContextMenuDropdown } from "./RightSideBarTypes/ContextMenuDropdown";
import { RightSidebarHeader } from "./RightSideBarTypes/RightSidebarHeader";
import { RightSidebarAvatar } from "./RightSideBarTypes/RightSidebarAvatar";
import { RightSidebarSettings } from "./RightSideBarTypes/RightSidebarSettings";
import { RightSidebarMemberList } from "./RightSideBarTypes/RightSidebarMemberList";
import { MoreMenu } from "./RightSideBarTypes/MoreMenu";
import { DeleteContactModal } from "./RightSideBarTypes/DeleteContactModal";
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

  // Fetch user details for non-group view
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
    ? (groupName || "Group")
    : (targetUserDetails?.displayName || targetUserDetails?.name || targetUserDetails?.username || "User");

  return (
    <div className="w-1/4 flex flex-col h-full shrink-0 relative bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-slate-800">
      <RightSidebarHeader
        isGroup={isGroup}
        onClose={onClose}
        onEditClick={onEditClick}
      />

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
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

        {isGroup && (
          <RightSidebarMemberList
            members={members}
            isLoading={isLoading}
            contextMenu={contextMenu}
            onContextMenu={handleContextMenu}
          />
        )}
      </div>

      <ContextMenuDropdown
        contextMenu={contextMenu}
        onAction={handleAction}
        currentUserRole={currentUserRole}
        currentUserId={currentUserId}
      />

      {isGroup && (
        <button className="absolute bottom-6 right-6 w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 z-30">
          {/* FiUserPlus icon would go here if imported */}
          <span className="text-2xl">+</span>
        </button>
      )}

      {!isGroup && (
        <MoreMenu
          isOpen={isMoreMenuOpen}
          onToggle={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
          onDeleteClick={() => setShowDeleteConfirm(true)}
        />
      )}

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
