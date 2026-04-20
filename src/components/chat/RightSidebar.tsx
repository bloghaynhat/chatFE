import { useEffect, useState } from "react";
import { conversationService, userService, mediaService, socketService } from "../../services";
import { RightSidebarInfo } from "./RightSideBar/RightSidebarInfo";
import { RightSidebarEdit } from "./RightSideBar/RightSidebarEdit";
import { RightSidebarMembers } from "./RightSideBar/RightSidebarMembers";
import { RightSidebarAddMember } from "./RightSideBar/RightSidebarAddMember";
import { DeleteGroupModal } from "./ActiveChatPane/DeleteGroupModal";
import { SelectAdminModal } from "./ActiveChatPane/SelectAdminModal";

export const RightSidebar = ({
  isOpen,
  selectedChat,
  onClose,
  currentUserId,
  onGroupUpdated,
  onShowInChat,
  messages,
}: any) => {
  const [members, setMembers] = useState<any[]>([]);
  const [info, setInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [activeSubView, setActiveSubView] = useState<"none" | "members" | "admins" | "addMember">("none");
  const [editName, setEditName] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSelectAdminModalOpen, setIsSelectAdminModalOpen] = useState(false);

  const isGroup = selectedChat?.type === "group" || selectedChat?.type === "GROUP";

  useEffect(() => {
    setActiveSubView("none"); // Reset view when chat changes
    if (!selectedChat?.id) return;

    let isMounted = true;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (isGroup) {
          const membersData = await conversationService.getGroupMembers(selectedChat.id);
          const infoData = await conversationService.getGroupInfo(selectedChat.id);
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
                if (participant.displayName || participant.name || participant.username) return m;
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
        setMembers((prev) => prev.filter((m: any) => (m.userId || m.user?.id || m.user?._id) !== data.removedUserId));
      }
    };

    const handleMembersAdded = async (data: any) => {
      if (data.conversationId === selectedChat?.id) {
        try {
          const membersData = await conversationService.getGroupMembers(selectedChat.id);
          const rawMembersList = Array.isArray(membersData)
            ? membersData
            : membersData?.members || membersData?.data || [];

          const enrichedMembers = await Promise.all(
            rawMembersList.map(async (m: any) => {
              const participant = m.user || m;
              if (participant.displayName || participant.name || participant.username) return m;
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

    const cleanupRemoved = socketService.on("conversation:member_removed", handleMemberRemoved);
    const cleanupAdded = socketService.on("conversation:members_added", handleMembersAdded);

    const handleOwnerTransferred = async (data: any) => {
      if (data.conversationId === selectedChat?.id) {
        try {
          // Refresh members to get updated roles
          const membersData = await conversationService.getGroupMembers(selectedChat.id);
          const rawMembersList = Array.isArray(membersData)
            ? membersData
            : membersData?.members || membersData?.data || [];

          const enrichedMembers = await Promise.all(
            rawMembersList.map(async (m: any) => {
              const participant = m.user || m;
              if (participant.displayName || participant.name || participant.username) return m;
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

    const cleanupOwnerTransfer = socketService.on("group:owner_transferred", handleOwnerTransferred);

    const handleGroupRenamed = async (data: any) => {
      if (data.conversationId === selectedChat?.id) {
        try {
          const infoData = await conversationService.getGroupInfo(selectedChat.id);
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
          const infoData = await conversationService.getGroupInfo(selectedChat.id);
          const actualInfo = infoData?.data || infoData;
          if (isMounted) {
            setInfo(actualInfo || null);
          }
        } catch (err) {
          console.error("Failed to refresh group info after avatar change:", err);
        }
      }
    };

    const cleanupGroupRenamed = socketService.on("group:renamed", handleGroupRenamed);
    const cleanupGroupAvatarChanged = socketService.on("group:avatar_changed", handleGroupAvatarChanged);

    return () => {
      isMounted = false;
      if (cleanupRemoved) cleanupRemoved();
      if (cleanupAdded) cleanupAdded();
      if (cleanupOwnerTransfer) cleanupOwnerTransfer();
      if (cleanupGroupRenamed) cleanupGroupRenamed();
      if (cleanupGroupAvatarChanged) cleanupGroupAvatarChanged();
    };
  }, [selectedChat?.id, isGroup]);

  const groupAvatar = selectedChat?.avatarUrl || info?.conversation?.avatarUrl || info?.avatarUrl;
  const groupName = selectedChat?.name || info?.conversation?.name || info?.name || "Group";
  const membersCount =
    info?.memberCount ||
    info?.membersCount ||
    info?.members?.length ||
    members.length ||
    selectedChat?.members?.length ||
    0;

  const adminCount =
    members.length > 0
      ? members.filter((m: any) => m.role === "admin" || m.role === "owner" || m.role === "ADMIN" || m.role === "OWNER")
          .length
      : info?.adminIds?.length
        ? info.adminIds.length + (info?.ownerId ? 1 : 0)
        : 1;

  const currentUserMember = members.find(
    (m: any) => m.userId === currentUserId || m.user?.id === currentUserId || m.id === currentUserId,
  );
  const currentUserRole = currentUserMember?.role || "member";
  const canEditGroup = currentUserRole === "admin";

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

  const handleSaveGroupInfo = async () => {
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
      setIsEditing(false);
      setAvatarFile(null);

      const infoData = await conversationService.getGroupInfo(selectedChat.id);
      const actualInfo = infoData?.data || infoData;
      setInfo(actualInfo || null);

      if (onGroupUpdated && actualInfo) {
        onGroupUpdated({
          name: actualInfo.conversation?.name || actualInfo.name,
          avatarUrl: actualInfo.conversation?.avatarUrl || actualInfo.avatarUrl,
        });
      }

      // Emit socket event to notify other members
      if (socketService.messagesSocket?.connected) {
        socketService.messagesSocket.emit("conversation:updated", {
          conversationId: selectedChat.id,
          updates: {
            name: actualInfo.conversation?.name || actualInfo.name,
            avatarUrl: actualInfo.conversation?.avatarUrl || actualInfo.avatarUrl,
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
      await conversationService.addGroupMembers(selectedChat.id, memberIds);

      // Emit socket over to the added users
      socketService.notifyAddMembers(selectedChat.id, memberIds);

      const membersData = await conversationService.getGroupMembers(selectedChat.id);
      const rawMembersList = Array.isArray(membersData) ? membersData : membersData?.members || membersData?.data || [];

      const enrichedMembers = await Promise.all(
        rawMembersList.map(async (m: any) => {
          const participant = m.user || m;
          if (participant.displayName || participant.name || participant.username) return m;
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
      setActiveSubView("members");
    } catch (error) {
      console.error("Failed to add members", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      setIsLoading(true);
      await conversationService.removeGroupMember(selectedChat.id, userId);

      socketService.notifyRemoveMember(selectedChat.id, userId);

      setMembers((prev) => prev.filter((m: any) => (m.userId || m.user?.id || m.user?._id) !== userId));

      if (socketService.messagesSocket?.connected) {
        socketService.messagesSocket.emit("conversation:updated", {
          conversationId: selectedChat.id,
          updates: {},
        });
      }
    } catch (error) {
      console.error("Failed to remove member", error);
    } finally {
      setIsLoading(false);
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
      await conversationService.leaveGroupConversation(selectedChat.id);
      if (socketService.messagesSocket?.connected) {
        socketService.messagesSocket.emit("conversation:updated", {
          conversationId: selectedChat.id,
          updates: {},
        });
      }
      onClose();
      // Notify ChatList to refresh and remove the conversation
      window.dispatchEvent(new Event("chatList:refresh"));
    } catch (error) {
      console.error("Failed to leave group", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfirm = async (deleteForAll: boolean) => {
    if (currentUserRole === "admin" && !deleteForAll) {
      // Admin wants to leave without deleting group - need to transfer admin first
      setIsSelectAdminModalOpen(true);
      setIsDeleteModalOpen(false);
    } else {
      // Either deleting for all (admin), or user is a regular member leaving
      await handleDeleteGroup(deleteForAll);
    }
  };

  const handleDeleteGroup = async (deleteForAll: boolean = false) => {
    try {
      setIsLoading(true);

      if (deleteForAll) {
        // Case 1: Delete for all members - emit dissolveGroup socket event
        // The server will delete the group and broadcast group:dissolved to all members
        await socketService.dissolveGroup(selectedChat.id);
      } else {
        // Case 2: Regular member leaving (or admin after transfer)
        await conversationService.leaveGroupConversation(selectedChat.id);
        if (socketService.messagesSocket?.connected) {
          socketService.messagesSocket.emit("conversation:updated", {
            conversationId: selectedChat.id,
            updates: {},
          });
        }
      }

      onClose();
      // Notify ChatList to refresh and remove the conversation
      window.dispatchEvent(new Event("chatList:refresh"));
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
      await conversationService.transferGroupOwnership(selectedChat.id, newOwnerId);

      // Step 2: Leave the group
      await conversationService.leaveGroupConversation(selectedChat.id);

      if (socketService.messagesSocket?.connected) {
        socketService.messagesSocket.emit("conversation:updated", {
          conversationId: selectedChat.id,
          updates: {},
        });
      }

      setIsSelectAdminModalOpen(false);
      setIsDeleteModalOpen(false);
      onClose();
      // Notify ChatList to refresh and remove the conversation
      window.dispatchEvent(new Event("chatList:refresh"));
    } catch (error) {
      console.error("Failed to transfer ownership and leave:", error);
      setIsLoading(false);
      throw error;
    }
  };

  return (
    <div
      className={`bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 flex flex-col h-full z-20 shadow-[-5px_0_15px_-10px_rgba(0,0,0,0.1)] transition-all duration-300 ease-in-out relative overflow-hidden ${
        isOpen ? "w-[320px] lg:w-[350px] border-l opacity-100" : "w-0 border-l-0 opacity-0"
      }`}
    >
      <div
        className={`w-[320px] lg:w-[350px] flex h-full shrink-0 relative transition-transform duration-300 ease-in-out overflow-hidden ${isOpen ? "translate-x-0" : "translate-x-[50px]"}`}
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
            onRemoveMember={handleRemoveMember}
            onPromoteAdmin={handlePromoteAdmin}
            onLeaveGroup={handleLeaveGroup}
            targetUserId={!isGroup ? selectedChat?.targetUserId || selectedChat?.participantId : null}
            conversationId={selectedChat?.id}
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
            onDeleteGroupClick={() => setIsDeleteModalOpen(true)}
          />

          <RightSidebarMembers
            type={activeSubView === "none" || activeSubView === "addMember" ? "members" : activeSubView}
            members={members}
            onClose={() => setActiveSubView("none")}
            groupName={groupName}
            onAddMemberClick={() => setActiveSubView("addMember")}
            currentUserRole={currentUserRole}
            currentUserId={currentUserId}
            onRemoveMember={handleRemoveMember}
            onPromoteAdmin={handlePromoteAdmin}
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
        isAdmin={currentUserRole === "admin"}
      />

      <SelectAdminModal
        isOpen={isSelectAdminModalOpen}
        onClose={() => setIsSelectAdminModalOpen(false)}
        onConfirm={handleTransferAdminAndLeave}
        members={members}
        isLoading={isLoading}
        currentUserId={currentUserId}
      />
    </div>
  );
};
