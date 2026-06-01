import { ContextMenuDropdown } from "./RightSideBarTypes/ContextMenuDropdown";
import { RightSidebarHeader } from "./RightSideBarTypes/RightSidebarHeader";
import { RightSidebarAvatar } from "./RightSideBarTypes/RightSidebarAvatar";
import { RightSidebarSettings } from "./RightSideBarTypes/RightSidebarSettings";
import { RightSidebarMemberList } from "./RightSideBarTypes/RightSidebarMemberList";
import { MoreMenu } from "./RightSideBarTypes/MoreMenu";
import { DeleteContactModal } from "./RightSideBarTypes/DeleteContactModal";
import { BlockUserModal } from "./RightSideBarTypes/BlockUserModal";
import { InviteLinkManagerModal } from "./RightSideBarTypes/InviteLinkManagerModal";
import { MediaGallery } from "./MediaGallery";
import { GroupNotesPanel, GroupRemindersPanel } from "./GroupUtilities/GroupUtilitiesPanel";
import { ShareToConversationModal } from "../ActiveChatPane/ShareToConversationModal";
import React, { useState, useEffect, useCallback } from "react";
import { FiShare2 } from "react-icons/fi";
import { useContactsSocketListeners } from "../../../hooks";
import {
  blockUser,
  checkBlockStatus,
  checkFriendRequestStatus,
  removeFriend,
  socketService,
  unblockUser,
} from "../../../services";
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
  isSavedMessages?: boolean;
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
  isSavedMessages,
}: RightSidebarInfoProps) => {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; member: any } | null>(null);
  const [friendStatus, setFriendStatus] = useState<"LOADING" | "PENDING" | "ACCEPTED" | "NONE">("LOADING");
  const [friendRequestId, setFriendRequestId] = useState<string | null>(null);
  const [friendDirection, setFriendDirection] = useState<"INCOMING" | "OUTGOING" | null>(null);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [targetUserDetails, setTargetUserDetails] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<
    "members" | "images" | "files" | "links" | "voice" | "notes" | "reminders"
  >("images");
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isShareProfileOpen, setIsShareProfileOpen] = useState(false);

  const canDeleteContact = !isGroup && !isSavedMessages && friendStatus === "ACCEPTED";

  const unwrapApiData = (payload: any) => {
    if (!payload || typeof payload !== "object") return payload;
    if ("status" in payload && "data" in payload) return payload.data;
    return payload.data || payload;
  };

  // Fetch user details for non-group view
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  const fetchUserDetails = useCallback(async () => {
    if (isGroup || !targetUserId) {
      setTargetUserDetails(null);
      return;
    }
    try {
      const response = await userService.getUserById(targetUserId);
      setTargetUserDetails(unwrapApiData(response) || null);
    } catch (error) {
      console.error("Failed to fetch target user details", error);
      setTargetUserDetails(null);
    }
  }, [isGroup, targetUserId]);

  useEffect(() => {
    fetchUserDetails();
  }, [fetchUserDetails]);

  // Check friend status for non-group
  const fetchStatus = useCallback(async () => {
    if (isGroup || !targetUserId) return;
    try {
      const response = await checkFriendRequestStatus(targetUserId);
      const statusData = unwrapApiData(response) || {};
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

  const fetchBlockStatus = useCallback(async () => {
    if (isGroup || !targetUserId) {
      setIsBlocked(false);
      return;
    }

    try {
      const status = await checkBlockStatus(targetUserId);
      setIsBlocked(Boolean(status?.isBlocked));
    } catch (err) {
      console.error("Failed to check block status", err);
      setIsBlocked(false);
    }
  }, [isGroup, targetUserId]);

  useEffect(() => {
    fetchBlockStatus();
  }, [fetchBlockStatus]);

  useEffect(() => {
    void socketService.initBlocksSocket();

    const handleRelationshipRefresh = () => {
      fetchStatus();
      fetchBlockStatus();
      fetchUserDetails();
    };

    const handleSocketBlockStatusChanged = (payload: any) => {
      if (!payload?.userId || payload.userId === targetUserId) {
        handleRelationshipRefresh();
      }
    };

    const handleWindowBlockStatusChanged = (event: any) => {
      if (!event?.detail?.userId || event.detail.userId === targetUserId) {
        handleRelationshipRefresh();
      }
    };

    const unsubscribeSocket = socketService.on("blockStatus:changed", handleSocketBlockStatusChanged);
    window.addEventListener("friendList_refresh", handleRelationshipRefresh);
    window.addEventListener("blockStatus:changed", handleWindowBlockStatusChanged);
    return () => {
      unsubscribeSocket();
      window.removeEventListener("friendList_refresh", handleRelationshipRefresh);
      window.removeEventListener("blockStatus:changed", handleWindowBlockStatusChanged);
    };
  }, [targetUserId, fetchStatus, fetchBlockStatus, fetchUserDetails]);

  useContactsSocketListeners({
    onFriendRequestReceived: fetchStatus,
    onFriendRequestAccepted: fetchStatus,
    onFriendRequestRejected: fetchStatus,
    onFriendRequestCanceled: fetchStatus,
    onFriendshipRemoved: fetchStatus,
  });

  const handleDeleteContact = async () => {
    if (!targetUserId || !canDeleteContact) return;
    setIsDeleting(true);
    try {
      await removeFriend(targetUserId);
      setShowDeleteConfirm(false);
      setFriendStatus("NONE");
      setFriendRequestId(null);
      setFriendDirection(null);
      window.dispatchEvent(new CustomEvent("friendList_refresh", { detail: { friendId: targetUserId } }));
      window.dispatchEvent(new Event("chatList:refresh"));
      if (onClose) onClose();
    } catch (err: any) {
      console.error("Failed to delete contact:", err);
      alert(err.message || "Failed to delete contact");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBlockToggle = async () => {
    if (!targetUserId) return;
    setIsBlocking(true);
    try {
      if (isBlocked) {
        await unblockUser(targetUserId);
        setIsBlocked(false);
      } else {
        await blockUser(targetUserId);
        setIsBlocked(true);
      }

      setShowBlockConfirm(false);
      window.dispatchEvent(
        new CustomEvent("blockStatus:changed", {
          detail: { userId: targetUserId, isBlocked: !isBlocked },
        }),
      );
      window.dispatchEvent(new Event("chatList:refresh"));
    } catch (err: any) {
      console.error("Failed to update block status:", err);
      alert(err.message || "Failed to update block status");
    } finally {
      setIsBlocking(false);
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
  const displayName = isSavedMessages
    ? "Saved Messages"
    : isGroup
    ? groupName || "Group"
    : targetUserDetails?.displayName || targetUserDetails?.name || targetUserDetails?.username || "User";

  return (
    <div className="w-1/4 flex flex-col h-full shrink-0 relative bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-slate-800">
      <RightSidebarHeader isGroup={isGroup} onClose={onClose} onEditClick={onEditClick}>
        {!isGroup && !isSavedMessages && targetUserId && (
          <MoreMenu
            isOpen={isMoreMenuOpen}
            onToggle={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
            onDeleteClick={() => setShowDeleteConfirm(true)}
            onBlockClick={() => setShowBlockConfirm(true)}
            showDelete={canDeleteContact}
            isBlocked={isBlocked}
          />
        )}
      </RightSidebarHeader>

      <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col">
        <RightSidebarAvatar
          avatarUrl={isGroup ? groupAvatar : targetUserDetails?.avatarUrl}
          name={displayName}
          canEdit={!isSavedMessages && canEdit}
          onEditClick={onEditClick}
          isSavedMessages={isSavedMessages}
        />

        {!isGroup && !isSavedMessages && targetUserId && (
          <div className="px-5 pb-3 -mt-3 border-b border-gray-100 dark:border-slate-800">
            <button
              onClick={() => setIsShareProfileOpen(true)}
              className="min-h-[44px] w-full rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition"
            >
              <FiShare2 className="text-[17px]" />
              Chia sẻ danh thiếp
            </button>
          </div>
        )}

        {!isSavedMessages && (
          <RightSidebarSettings
            isGroup={isGroup}
            targetUserDetails={targetUserDetails}
            notificationsEnabled={notificationsEnabled}
            setNotificationsEnabled={setNotificationsEnabled}
            onOpenInviteLink={() => setIsInviteModalOpen(true)}
          />
        )}

        {/* Tab Navigation - Members + Media tabs for groups, Media only for private */}
        {(isGroup || conversationId) && (
          <div className="flex flex-wrap border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 flex-shrink-0">
            {/* Members tab - only for groups */}
            {isGroup && (
              <button
                onClick={() => setActiveTab("members")}
                className={`min-w-[92px] flex-1 px-3 py-3 text-sm font-medium transition-colors border-b-2 ${
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
                  className={`min-w-[76px] flex-1 px-3 py-3 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === "images"
                      ? "border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
                  }`}
                >
                  Media
                </button>
                <button
                  onClick={() => setActiveTab("files")}
                  className={`min-w-[70px] flex-1 px-3 py-3 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === "files"
                      ? "border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
                  }`}
                >
                  Files
                </button>
                <button
                  onClick={() => setActiveTab("links")}
                  className={`min-w-[70px] flex-1 px-3 py-3 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === "links"
                      ? "border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
                  }`}
                >
                  Links
                </button>
                <button
                  onClick={() => setActiveTab("voice")}
                  className={`min-w-[70px] flex-1 px-3 py-3 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === "voice"
                      ? "border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
                  }`}
                >
                  Voice
                </button>
              </>
            )}
            {isGroup && conversationId && (
              <>
                <button
                  onClick={() => setActiveTab("notes")}
                  className={`min-w-[76px] flex-1 px-3 py-3 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === "notes"
                      ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                      : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
                  }`}
                >
                  Notes
                </button>
                <button
                  onClick={() => setActiveTab("reminders")}
                  className={`min-w-[104px] flex-1 px-3 py-3 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === "reminders"
                      ? "border-amber-500 text-amber-600 dark:text-amber-400"
                      : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
                  }`}
                >
                  Reminders
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

        {activeTab === "notes" && isGroup && conversationId && (
          <div className="flex-1 overflow-hidden">
            <GroupNotesPanel groupId={conversationId} />
          </div>
        )}

        {activeTab === "reminders" && isGroup && conversationId && (
          <div className="flex-1 overflow-hidden">
            <GroupRemindersPanel groupId={conversationId} />
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

      <BlockUserModal
        isOpen={showBlockConfirm}
        onClose={() => setShowBlockConfirm(false)}
        onConfirm={handleBlockToggle}
        userName={displayName}
        isLoading={isBlocking}
        isBlocked={isBlocked}
      />

      {isGroup && conversationId && (
        <InviteLinkManagerModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          groupId={conversationId}
          isAdmin={currentUserRole === "admin" || currentUserRole === "owner"}
          groupName={groupName || "Group"}
          groupAvatar={groupAvatar}
        />
      )}

      <ShareToConversationModal
        isOpen={isShareProfileOpen}
        onClose={() => setIsShareProfileOpen(false)}
        profileUserId={targetUserId}
      />
    </div>
  );
};
