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
import { FiShare2, FiUsers, FiImage, FiFile, FiLink, FiMic, FiFileText, FiBell, FiChevronRight } from "react-icons/fi";
import { GroupContentOverlay, ContentTabType } from "./GroupContentOverlay";
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
import { toast } from "sonner";
import { useLanguage } from "../../../context";

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
  canInviteMembers?: boolean;
  onRemoveMember?: (userId: string) => void;
  onPromoteAdmin?: (userId: string) => void;
  onSendMessage?: (member: any) => void;
  onLeaveGroup?: () => void;
  targetUserId?: string | null;
  conversationId?: string;
  onShowInChat?: (mediaUrl: string) => void;
  messages?: any[];
  isSavedMessages?: boolean;
  wallpaperUrl?: string | null;
  isWallpaperUpdating?: boolean;
  onChangeWallpaper?: () => void;
  onRemoveWallpaper?: () => void;
  onSelectWallpaperPreset?: (value: string | null) => void;
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
  canInviteMembers,
  onRemoveMember,
  onPromoteAdmin,
  onSendMessage,
  onLeaveGroup,
  targetUserId,
  conversationId,
  onShowInChat,
  messages,
  isSavedMessages,
  wallpaperUrl,
  isWallpaperUpdating,
  onChangeWallpaper,
  onRemoveWallpaper,
  onSelectWallpaperPreset,
}: RightSidebarInfoProps) => {
  const { t } = useLanguage();
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
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [overlayTab, setOverlayTab] = useState<ContentTabType>("images");
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
      toast.error(err.message || "Failed to delete contact");
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
      toast.error(err.message || "Failed to update block status");
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
    ? t("nav.savedMessages")
    : isGroup
    ? groupName || "Group"
    : targetUserDetails?.displayName || targetUserDetails?.name || targetUserDetails?.username || t("app.user");

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

      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar">
        {/* Top Section for Info & Settings */}
        <div className="shrink-0 border-b border-gray-100 dark:border-slate-800">
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
                {t("profileCard.shareContact")}
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
              canOpenInviteLink={canInviteMembers}
              wallpaperUrl={wallpaperUrl}
              isWallpaperUpdating={isWallpaperUpdating}
              onChangeWallpaper={onChangeWallpaper}
              onRemoveWallpaper={onRemoveWallpaper}
              onSelectWallpaperPreset={onSelectWallpaperPreset}
            />
          )}
        </div>

        {/* Content Menu List */}
        <div className="flex-1 px-3 py-4 space-y-1">
          {isGroup && (
            <button
              onClick={() => {
                setOverlayTab("members");
                setIsOverlayOpen(true);
              }}
              className="w-full flex items-center justify-between px-3 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                  <FiUsers className="text-lg" />
                </div>
                <span className="text-[15px] font-medium text-gray-800 dark:text-gray-200">
                  {t("chat.members")}
                </span>
                {membersCount !== undefined && (
                  <span className="text-[13px] font-medium text-gray-400">
                    {membersCount}
                  </span>
                )}
              </div>
              <FiChevronRight className="text-gray-400 text-lg" />
            </button>
          )}

          {conversationId && (
            <>
              <button
                onClick={() => {
                  setOverlayTab("images");
                  setIsOverlayOpen(true);
                }}
                className="w-full flex items-center justify-between px-3 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
                    <FiImage className="text-lg" />
                  </div>
                  <span className="text-[15px] font-medium text-gray-800 dark:text-gray-200">
                    {t("chat.media")}
                  </span>
                </div>
                <FiChevronRight className="text-gray-400 text-lg" />
              </button>

              <button
                onClick={() => {
                  setOverlayTab("files");
                  setIsOverlayOpen(true);
                }}
                className="w-full flex items-center justify-between px-3 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400">
                    <FiFile className="text-lg" />
                  </div>
                  <span className="text-[15px] font-medium text-gray-800 dark:text-gray-200">
                    {t("chat.files")}
                  </span>
                </div>
                <FiChevronRight className="text-gray-400 text-lg" />
              </button>

              <button
                onClick={() => {
                  setOverlayTab("links");
                  setIsOverlayOpen(true);
                }}
                className="w-full flex items-center justify-between px-3 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400">
                    <FiLink className="text-lg" />
                  </div>
                  <span className="text-[15px] font-medium text-gray-800 dark:text-gray-200">
                    {t("chat.links")}
                  </span>
                </div>
                <FiChevronRight className="text-gray-400 text-lg" />
              </button>

              <button
                onClick={() => {
                  setOverlayTab("voice");
                  setIsOverlayOpen(true);
                }}
                className="w-full flex items-center justify-between px-3 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-50 text-pink-600 dark:bg-pink-500/20 dark:text-pink-400">
                    <FiMic className="text-lg" />
                  </div>
                  <span className="text-[15px] font-medium text-gray-800 dark:text-gray-200">
                    {t("chat.voice")}
                  </span>
                </div>
                <FiChevronRight className="text-gray-400 text-lg" />
              </button>
            </>
          )}

          {isGroup && conversationId && (
            <>
              <button
                onClick={() => {
                  setOverlayTab("notes");
                  setIsOverlayOpen(true);
                }}
                className="w-full flex items-center justify-between px-3 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                    <FiFileText className="text-lg" />
                  </div>
                  <span className="text-[15px] font-medium text-gray-800 dark:text-gray-200">
                    Notes
                  </span>
                </div>
                <FiChevronRight className="text-gray-400 text-lg" />
              </button>

              <button
                onClick={() => {
                  setOverlayTab("reminders");
                  setIsOverlayOpen(true);
                }}
                className="w-full flex items-center justify-between px-3 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                    <FiBell className="text-lg" />
                  </div>
                  <span className="text-[15px] font-medium text-gray-800 dark:text-gray-200">
                    Reminders
                  </span>
                </div>
                <FiChevronRight className="text-gray-400 text-lg" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Shared Media / Content Overlay */}
      <GroupContentOverlay
        isOpen={isOverlayOpen}
        onClose={() => setIsOverlayOpen(false)}
        initialTab={overlayTab}
        isGroup={isGroup}
        conversationId={conversationId}
        members={members}
        isLoadingMembers={isLoading}
        contextMenu={contextMenu}
        onContextMenu={handleContextMenu}
        currentUserId={currentUserId}
        onShowInChat={onShowInChat}
        messages={messages}
      />

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
          canUseInviteLink={canInviteMembers}
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
