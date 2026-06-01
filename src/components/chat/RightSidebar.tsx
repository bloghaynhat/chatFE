import { useEffect, useState } from "react";
import {
  conversationService,
  groupChatService,
  userService,
  mediaService,
  socketService,
} from "../../services";
import { RightSidebarInfo } from "./RightSideBar/RightSidebarInfo";
import { RightSidebarEdit } from "./RightSideBar/RightSidebarEdit";
import { RightSidebarMembers } from "./RightSideBar/RightSidebarMembers";
import { RightSidebarAddMember } from "./RightSideBar/RightSidebarAddMember";
import { GroupSettingsModal } from "./RightSideBar/GroupSettingsModal";
import { DeleteGroupModal } from "./ActiveChatPane/DeleteGroupModal";
import { SelectAdminModal } from "./ActiveChatPane/SelectAdminModal";
import { groupSettingsService, GroupSettingsPayload } from "../../services/groupSettingsService";

const getMemberUserId = (member: any) =>
  member?.userId || member?.user?.id || member?.user?._id || member?.id;

const getMemberDisplayName = (member: any) => {
  const participant = member?.user || member;
  return (
    participant?.displayName ||
    participant?.name ||
    participant?.username ||
    "this member"
  );
};

const isPrivilegedRole = (role?: string) =>
  role === "admin" || role === "ADMIN" || role === "owner" || role === "OWNER";

const isOwnerRole = (role?: string) =>
  role === "owner" || role === "OWNER";

const notifyCurrentUserLeftGroup = (conversationId: string) => {
  window.dispatchEvent(
    new CustomEvent("group:currentUserLeft", {
      detail: { conversationId },
    }),
  );
  window.dispatchEvent(new Event("chatList:refresh"));
};

const mergeGroupSettings = (
  ...sources: Array<GroupSettingsPayload | undefined | null>
): GroupSettingsPayload => {
  return sources.reduce<GroupSettingsPayload>((merged, source) => {
    if (!source) return merged;
    return {
      ...merged,
      ...source,
      utilityPermissions: {
        ...(merged.utilityPermissions || {}),
        ...(source.utilityPermissions || {}),
      },
    };
  }, {});
};

export const RightSidebar = ({
  isOpen,
  selectedChat,
  onClose,
  currentUserId,
  onGroupUpdated,
  onShowInChat,
  messages,
  onSendMessage,
}: any) => {
  const [members, setMembers] = useState<any[]>([]);
  const [info, setInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [activeSubView, setActiveSubView] = useState<
    "none" | "members" | "admins" | "addMember"
  >("none");
  const [editName, setEditName] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSelectAdminModalOpen, setIsSelectAdminModalOpen] = useState(false);
  const [isGroupSettingsOpen, setIsGroupSettingsOpen] = useState(false);
  const [removeMemberState, setRemoveMemberState] = useState<{
    targetUserId?: string;
    targetName?: string;
    isConfirmOpen: boolean;
    isSubmitting: boolean;
    error?: string;
  }>({
    isConfirmOpen: false,
    isSubmitting: false,
  });

  const isGroup =
    selectedChat?.type === "group" || selectedChat?.type === "GROUP";
  const isSavedMessages =
    selectedChat?.type === "saved_messages" ||
    selectedChat?.isSavedMessages ||
    selectedChat?.isSelfChat;

  useEffect(() => {
    setActiveSubView("none"); // Reset view when chat changes
    if (!selectedChat?.id) return;

    let isMounted = true;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (isGroup) {
          const membersData = await conversationService.getGroupMembers(
            selectedChat.id,
          );
          const infoData = await conversationService.getGroupInfo(
            selectedChat.id,
          );
          if (isMounted) {
            const rawMembersList = Array.isArray(membersData)
              ? membersData
              : membersData?.members || membersData?.data || [];
            setMembers(rawMembersList);
            const actualInfo = infoData?.data || infoData;
            setInfo(actualInfo || null);

            // Dynamically enhance members with user profiles if missing
            const enrichedMembers = await Promise.all(
              rawMembersList.map(async (m: any) => {
                const participant = m.user || m;
                if (
                  participant.displayName ||
                  participant.name ||
                  participant.username
                )
                  return m;
                if (!m.userId) return m;
                try {
                  const userRes = await userService.getUserById(m.userId);
                  const userData = userRes.data || userRes;
                  return { ...m, user: userData };
                } catch (err) {
                  return m;
                }
              }),
            );

            if (isMounted) {
              setMembers(enrichedMembers);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch sidebar info data:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchData();

    const handleMemberRemoved = (data: any) => {
      if (data.conversationId === selectedChat?.id) {
        setMembers((prev) =>
          prev.filter(
            (m: any) =>
              (m.userId || m.user?.id || m.user?._id) !== data.removedUserId,
          ),
        );
      }
    };

    const handleMembersAdded = async (data: any) => {
      if (data.conversationId === selectedChat?.id) {
        try {
          const membersData = await conversationService.getGroupMembers(
            selectedChat.id,
          );
          const rawMembersList = Array.isArray(membersData)
            ? membersData
            : membersData?.members || membersData?.data || [];

          const enrichedMembers = await Promise.all(
            rawMembersList.map(async (m: any) => {
              const participant = m.user || m;
              if (
                participant.displayName ||
                participant.name ||
                participant.username
              )
                return m;
              if (!m.userId) return m;
              try {
                const userRes = await userService.getUserById(m.userId);
                return { ...m, user: userRes.data || userRes };
              } catch (err) {
                return m;
              }
            }),
          );
          setMembers(enrichedMembers);
        } catch (err) {
          console.error("Failed to refresh members:", err);
        }
      }
    };

    const cleanupRemoved = socketService.on(
      "conversation:member_removed",
      handleMemberRemoved,
    );
    const cleanupAdded = socketService.on(
      "conversation:members_added",
      handleMembersAdded,
    );

    const handleOwnerTransferred = async (data: any) => {
      if (data.conversationId === selectedChat?.id) {
        try {
          // Refresh members to get updated roles
          const membersData = await conversationService.getGroupMembers(
            selectedChat.id,
          );
          const rawMembersList = Array.isArray(membersData)
            ? membersData
            : membersData?.members || membersData?.data || [];

          const enrichedMembers = await Promise.all(
            rawMembersList.map(async (m: any) => {
              const participant = m.user || m;
              if (
                participant.displayName ||
                participant.name ||
                participant.username
              )
                return m;
              if (!m.userId) return m;
              try {
                const userRes = await userService.getUserById(m.userId);
                return { ...m, user: userRes.data || userRes };
              } catch (err) {
                return m;
              }
            }),
          );
          setMembers(enrichedMembers);
        } catch (err) {
          console.error("Failed to refresh members after owner transfer:", err);
        }
      }
    };

    const cleanupOwnerTransfer = socketService.on(
      "group:owner_transferred",
      handleOwnerTransferred,
    );

    const handleGroupRenamed = async (data: any) => {
      if (data.conversationId === selectedChat?.id) {
        try {
          const infoData = await conversationService.getGroupInfo(
            selectedChat.id,
          );
          const actualInfo = infoData?.data || infoData;
          if (isMounted) {
            setInfo(actualInfo || null);
          }
        } catch (err) {
          console.error("Failed to refresh group info after rename:", err);
        }
      }
    };

    const handleGroupAvatarChanged = async (data: any) => {
      if (data.conversationId === selectedChat?.id) {
        try {
          const infoData = await conversationService.getGroupInfo(
            selectedChat.id,
          );
          const actualInfo = infoData?.data || infoData;
          if (isMounted) {
            setInfo(actualInfo || null);
          }
        } catch (err) {
          console.error(
            "Failed to refresh group info after avatar change:",
            err,
          );
        }
      }
    };

    const cleanupGroupRenamed = socketService.on(
      "group:renamed",
      handleGroupRenamed,
    );
    const cleanupGroupAvatarChanged = socketService.on(
      "group:avatar_changed",
      handleGroupAvatarChanged,
    );

    return () => {
      isMounted = false;
      if (cleanupRemoved) cleanupRemoved();
      if (cleanupAdded) cleanupAdded();
      if (cleanupOwnerTransfer) cleanupOwnerTransfer();
      if (cleanupGroupRenamed) cleanupGroupRenamed();
      if (cleanupGroupAvatarChanged) cleanupGroupAvatarChanged();
    };
  }, [selectedChat?.id, isGroup]);

  const groupAvatar =
    selectedChat?.avatarUrl || info?.conversation?.avatarUrl || info?.avatarUrl;
  const groupName =
    selectedChat?.name || info?.conversation?.name || info?.name || "Group";
  const membersCount =
    info?.memberCount ||
    info?.membersCount ||
    info?.members?.length ||
    members.length ||
    selectedChat?.members?.length ||
    0;

  const adminCount =
    members.length > 0
      ? members.filter(
          (m: any) =>
            m.role === "admin" ||
            m.role === "owner" ||
            m.role === "ADMIN" ||
            m.role === "OWNER",
        ).length
      : info?.adminIds?.length
        ? info.adminIds.length + (info?.ownerId ? 1 : 0)
        : 1;

  const currentUserMember = members.find(
    (m: any) =>
      String(m.userId) === String(currentUserId) ||
      String(m.user?.id) === String(currentUserId) ||
      String(m.user?._id) === String(currentUserId) ||
      String(m.id) === String(currentUserId),
  );
  const ownerId = info?.ownerId || info?.conversation?.ownerId || selectedChat?.ownerId;
  const adminIds = info?.adminIds || selectedChat?.adminIds || [];
  const currentUserRole =
    String(ownerId) === String(currentUserId)
      ? "owner"
      : adminIds.some((id: any) => String(id?.id || id?._id || id) === String(currentUserId))
        ? "admin"
        : currentUserMember?.role || "member";
  const canEditGroup = isPrivilegedRole(currentUserRole);
  const groupSettings = mergeGroupSettings(
    selectedChat?.settings,
    info?.conversation?.settings || info?.settings,
  );
  const canDissolveGroup = isOwnerRole(currentUserRole);
  const groupSettings = {
    ...(selectedChat?.settings || {}),
    ...(info?.conversation?.settings || info?.settings || {}),
  };
  const canInviteMembers = canEditGroup || groupSettings.allowMemberInvite !== false;

  const handleEditClick = () => {
    setEditName(groupName);
    setEditAvatarUrl(groupAvatar || null);
    setAvatarFile(null);
    setIsEditing(true);
  };

  const handleAvatarChange = (file: File) => {
    setAvatarFile(file);
    setEditAvatarUrl(URL.createObjectURL(file));
  };

  const refreshMembers = async () => {
    if (!selectedChat?.id) return;
    const membersData = await conversationService.getGroupMembers(
      selectedChat.id,
    );
    const rawMembersList = Array.isArray(membersData)
      ? membersData
      : membersData?.members || membersData?.data || [];

    const enrichedMembers = await Promise.all(
      rawMembersList.map(async (m: any) => {
        const participant = m.user || m;
        if (
          participant.displayName ||
          participant.name ||
          participant.username
        )
          return m;
        if (!m.userId) return m;
        try {
          const userRes = await userService.getUserById(m.userId);
          return { ...m, user: userRes.data || userRes };
        } catch (err) {
          return m;
        }
      }),
    );
    setMembers(enrichedMembers);
  };

  const handleSaveGroupInfo = async (settingsPayload?: GroupSettingsPayload) => {
    if (!selectedChat?.id) return;
    try {
      setIsLoading(true);
      let finalAvatarUrl = editAvatarUrl;

      if (avatarFile) {
        setIsUploadingAvatar(true);
        const res = await mediaService.uploadMedia(avatarFile);
        setIsUploadingAvatar(false);
        if (res?.url) {
          finalAvatarUrl = res.url;
        }
      }

      const updatePayload: any = { name: editName };
      if (finalAvatarUrl !== groupAvatar) {
        updatePayload.avatarUrl = finalAvatarUrl || "";
      }
      await conversationService.updateGroupInfo(selectedChat.id, updatePayload);
      if (settingsPayload && Object.keys(settingsPayload).length > 0) {
        await groupSettingsService.updateSettings(selectedChat.id, settingsPayload);
      }
      setIsEditing(false);
      setAvatarFile(null);

      const infoData = await conversationService.getGroupInfo(selectedChat.id);
      const actualInfo = infoData?.data || infoData;
      setInfo(actualInfo || null);

      if (onGroupUpdated && actualInfo) {
        onGroupUpdated({
          name: actualInfo.conversation?.name || actualInfo.name,
          avatarUrl: actualInfo.conversation?.avatarUrl || actualInfo.avatarUrl,
          settings: {
            ...mergeGroupSettings(
              selectedChat?.settings,
              info?.conversation?.settings || info?.settings,
              settingsPayload,
            ),
          },
        });
      }

      // Emit socket event to notify other members
      if (socketService.messagesSocket?.connected) {
        socketService.messagesSocket.emit("conversation:updated", {
          conversationId: selectedChat.id,
          updates: {
            name: actualInfo.conversation?.name || actualInfo.name,
            avatarUrl:
              actualInfo.conversation?.avatarUrl || actualInfo.avatarUrl,
          },
        });
      }
    } catch (err) {
      console.error("Failed to update group info:", err);
      setIsUploadingAvatar(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMembers = async (memberIds: string[]) => {
    try {
      setIsLoading(true);
      const addedMembers = await groupChatService.addMembers(
        selectedChat.id,
        memberIds,
      );

      const membersData = await conversationService.getGroupMembers(
        selectedChat.id,
      );
      const rawMembersList = Array.isArray(membersData)
        ? membersData
        : membersData?.members || membersData?.data || [];

      const enrichedMembers = await Promise.all(
        rawMembersList.map(async (m: any) => {
          const participant = m.user || m;
          if (
            participant.displayName ||
            participant.name ||
            participant.username
          )
            return m;
          if (!m.userId) return m;
          try {
            const userRes = await userService.getUserById(m.userId);
            return { ...m, user: userRes.data || userRes };
          } catch (err) {
            return m;
          }
        }),
      );
      setMembers(enrichedMembers);
      if (Array.isArray(addedMembers) && onGroupUpdated) {
        onGroupUpdated({
          membersCount:
            Math.max(membersCount, members.length) + addedMembers.length,
        });
      }
      setActiveSubView("members");
    } catch (error) {
      console.error("Failed to add members", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    const targetMember = members.find(
      (m: any) => String(getMemberUserId(m)) === String(userId),
    );
    setRemoveMemberState({
      targetUserId: userId,
      targetName: getMemberDisplayName(targetMember),
      isConfirmOpen: true,
      isSubmitting: false,
    });
  };

  const handleConfirmRemoveMember = async () => {
    const userId = removeMemberState.targetUserId;
    if (!userId) return;

    try {
      setRemoveMemberState((prev) => ({
        ...prev,
        isSubmitting: true,
        error: undefined,
      }));
      await groupChatService.removeMember(selectedChat.id, userId);

      setMembers((prev) =>
        prev.filter((m: any) => String(getMemberUserId(m)) !== String(userId)),
      );
      setRemoveMemberState({ isConfirmOpen: false, isSubmitting: false });
    } catch (error) {
      console.error("Failed to remove member", error);
      setRemoveMemberState((prev) => ({
        ...prev,
        isSubmitting: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to remove this member.",
      }));
    } finally {
      window.dispatchEvent(new Event("chatList:refresh"));
    }
  };

  const handlePromoteAdmin = async (userId: string) => {
    try {
      setIsLoading(true);
      await conversationService.setGroupAdmin(selectedChat.id, userId, true);
      setMembers((prev) =>
        prev.map((m: any) => {
          if ((m.userId || m.user?.id || m.user?._id) === userId) {
            return { ...m, role: "admin" };
          }
          return m;
        }),
      );

      if (socketService.messagesSocket?.connected) {
        socketService.messagesSocket.emit("conversation:updated", {
          conversationId: selectedChat.id,
          updates: {},
        });
      }
    } catch (error) {
      console.error("Failed to promote to admin", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    try {
      setIsLoading(true);
      await groupChatService.leaveGroup(selectedChat.id);
      onClose();
      notifyCurrentUserLeftGroup(selectedChat.id);
    } catch (error) {
      console.error("Failed to leave group via API", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfirm = async (deleteForAll: boolean) => {
    if (canDissolveGroup && !deleteForAll) {
      if (membersCount <= 1) {
        await handleDeleteGroup(true);
        return;
      }
      setIsSelectAdminModalOpen(true);
      setIsDeleteModalOpen(false);
    } else {
      await handleDeleteGroup(deleteForAll);
    }
  };

  const handleDeleteGroup = async (deleteForAll: boolean = false) => {
    try {
      setIsLoading(true);

      if (deleteForAll) {
        await conversationService.deleteGroupConversation(selectedChat.id);
      } else {
        await groupChatService.leaveGroup(selectedChat.id);
      }

      onClose();
      if (!deleteForAll) {
        notifyCurrentUserLeftGroup(selectedChat.id);
      } else {
        window.dispatchEvent(new Event("chatList:refresh"));
      }
    } catch (error) {
      console.error("Failed to delete/leave group", error);
      throw error; // Re-throw to let modal know about the error
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransferAdminAndLeave = async (newOwnerId: string) => {
    if (!selectedChat?.id) return;

    try {
      setIsLoading(true);

      // Step 1: Transfer ownership using transfer-owner endpoint
      await conversationService.transferGroupOwnership(
        selectedChat.id,
        newOwnerId,
      );

      // Step 2: Leave the group via HTTP business API
      await groupChatService.leaveGroup(selectedChat.id);

      setIsSelectAdminModalOpen(false);
      setIsDeleteModalOpen(false);
      onClose();
      notifyCurrentUserLeftGroup(selectedChat.id);
    } catch (error) {
      console.error("Failed to transfer ownership and leave:", error);
      setIsLoading(false);
      throw error;
    }
  };

  return (
    <div
      className={`bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 flex flex-col h-full z-20 shadow-[-5px_0_15px_-10px_rgba(0,0,0,0.1)] transition-all duration-300 ease-in-out relative overflow-hidden ${
        isOpen
          ? "w-[360px] lg:w-[390px] border-l opacity-100"
          : "w-0 border-l-0 opacity-0"
      }`}
    >
      <div
        className={`w-[360px] lg:w-[390px] flex h-full shrink-0 relative transition-transform duration-300 ease-in-out overflow-hidden ${isOpen ? "translate-x-0" : "translate-x-[50px]"}`}
      >
        <div
          className="flex h-full shrink-0 transition-transform duration-300 ease-in-out"
          style={{
            width: "400%",
            transform:
              activeSubView === "addMember"
                ? "translateX(-75%)"
                : activeSubView !== "none"
                  ? "translateX(-50%)"
                  : isEditing
                    ? "translateX(-25%)"
                    : "translateX(0)",
          }}
        >
          <RightSidebarInfo
            isGroup={isGroup}
            groupName={groupName}
            groupAvatar={groupAvatar}
            membersCount={membersCount}
            members={members}
            isLoading={isLoading}
            notificationsEnabled={notificationsEnabled}
            setNotificationsEnabled={setNotificationsEnabled}
            onClose={onClose}
            onEditClick={handleEditClick}
            canEdit={canEditGroup}
            currentUserRole={currentUserRole}
            currentUserId={currentUserId}
            canInviteMembers={canInviteMembers}
            onRemoveMember={handleRemoveMember}
            onPromoteAdmin={handlePromoteAdmin}
            onSendMessage={onSendMessage}
            onLeaveGroup={handleLeaveGroup}
            targetUserId={
              !isGroup && !isSavedMessages
                ? selectedChat?.targetUserId ||
                  selectedChat?.participantId ||
                  selectedChat?.targetUser?.id ||
                  selectedChat?.targetUser?._id ||
                  selectedChat?.participant?.id ||
                  selectedChat?.participant?._id ||
                  selectedChat?.user?.id ||
                  selectedChat?.user?._id ||
                  selectedChat?.friend?.id ||
                  selectedChat?.friend?._id ||
                  (selectedChat?.pairKey
                    ? selectedChat.pairKey
                        .split("_")
                        .find((id: string) => id !== currentUserId)
                    : null)
                : null
            }
            conversationId={selectedChat?.id}
            isSavedMessages={isSavedMessages}
            onShowInChat={
              onShowInChat &&
              ((mediaUrl) => {
                onShowInChat(mediaUrl);
                onClose();
              })
            }
            messages={messages}
          />

          <RightSidebarEdit
            groupName={groupName}
            groupAvatar={groupAvatar}
            editName={editName}
            setEditName={setEditName}
            editAvatarUrl={editAvatarUrl}
            isUploadingAvatar={isUploadingAvatar}
            onAvatarChange={handleAvatarChange}
            membersCount={membersCount}
            adminCount={adminCount}
            currentUserRole={currentUserRole}
            onClose={() => setIsEditing(false)}
            onSave={handleSaveGroupInfo}
            onMembersClick={() => setActiveSubView("members")}
            onAdminsClick={() => setActiveSubView("admins")}
            onGroupSettingsClick={() => setIsGroupSettingsOpen(true)}
            onDeleteGroupClick={() => setIsDeleteModalOpen(true)}
          />

          <RightSidebarMembers
            type={
              activeSubView === "none" || activeSubView === "addMember"
                ? "members"
                : activeSubView
            }
            members={members}
            onClose={() => setActiveSubView("none")}
            groupName={groupName}
            onAddMemberClick={() => setActiveSubView("addMember")}
            currentUserRole={currentUserRole}
            currentUserId={currentUserId}
            canInviteMembers={canInviteMembers}
            onRemoveMember={handleRemoveMember}
            onPromoteAdmin={handlePromoteAdmin}
            onSendMessage={onSendMessage}
            onLeaveGroup={handleLeaveGroup}
          />

          <RightSidebarAddMember
            members={members}
            onClose={() => setActiveSubView("members")}
            onAddMembers={handleAddMembers}
          />
        </div>
      </div>

      <DeleteGroupModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        groupName={groupName}
        isLoading={isLoading}
        isAdmin={canDissolveGroup}
      />

      <SelectAdminModal
        isOpen={isSelectAdminModalOpen}
        onClose={() => setIsSelectAdminModalOpen(false)}
        onConfirm={handleTransferAdminAndLeave}
        members={members}
        isLoading={isLoading}
        currentUserId={currentUserId}
      />

      <GroupSettingsModal
        isOpen={isGroupSettingsOpen}
        onClose={() => setIsGroupSettingsOpen(false)}
        groupId={selectedChat?.id}
        groupName={groupName}
        groupAvatar={groupAvatar}
        groupDescription={
          info?.conversation?.description ||
          info?.description ||
          selectedChat?.description
        }
        groupType={
          info?.conversation?.groupType ||
          info?.groupType ||
          selectedChat?.groupType ||
          "private"
        }
        settings={groupSettings}
        isAdmin={canEditGroup}
        editName={editName}
        setEditName={setEditName}
        editAvatarUrl={editAvatarUrl}
        isUploadingAvatar={isUploadingAvatar}
        onAvatarChange={handleAvatarChange}
        onSaveGeneral={handleSaveGroupInfo}
        onSettingsUpdated={(settings) => {
          const nextSettings = mergeGroupSettings(
            selectedChat?.settings,
            info?.conversation?.settings || info?.settings,
            settings,
          );
          setInfo((prev: any) => ({
            ...prev,
            settings: nextSettings,
            conversation: prev?.conversation
              ? { ...prev.conversation, settings: nextSettings }
              : prev?.conversation,
          }));
          onGroupUpdated?.({ settings: nextSettings });
        }}
        onMembersChanged={refreshMembers}
      />

      {removeMemberState.isConfirmOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-[380px] rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-800">
              <h2 className="text-[16px] font-semibold text-gray-900 dark:text-gray-100">
                Remove member
              </h2>
            </div>
            <div className="px-5 py-4">
              <p className="text-[14px] text-gray-700 dark:text-gray-300 leading-relaxed">
                Are you sure you want to remove {removeMemberState.targetName}{" "}
                from this group?
              </p>
              {removeMemberState.error && (
                <p className="mt-3 text-[13px] text-red-500">
                  {removeMemberState.error}
                </p>
              )}
            </div>
            <div className="px-5 py-3 bg-gray-50 dark:bg-slate-800/70 flex justify-end gap-2">
              <button
                type="button"
                disabled={removeMemberState.isSubmitting}
                onClick={() =>
                  setRemoveMemberState({
                    isConfirmOpen: false,
                    isSubmitting: false,
                  })
                }
                className="px-4 py-2 text-[14px] font-semibold rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={removeMemberState.isSubmitting}
                onClick={handleConfirmRemoveMember}
                className="px-4 py-2 text-[14px] font-semibold rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
              >
                {removeMemberState.isSubmitting ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
