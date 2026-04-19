import { useEffect, useState } from "react";
import { conversationService, userService, mediaService } from "../../services";
import { RightSidebarInfo } from "./RightSideBar/RightSidebarInfo";
import { RightSidebarEdit } from "./RightSideBar/RightSidebarEdit";
import { RightSidebarMembers } from "./RightSideBar/RightSidebarMembers";

export const RightSidebar = ({ isOpen, selectedChat, onClose, currentUserId, onGroupUpdated }: any) => {
  const [members, setMembers] = useState<any[]>([]);
  const [info, setInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [activeSubView, setActiveSubView] = useState<"none" | "members" | "admins">("none");
  const [editName, setEditName] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

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
            const rawMembersList = Array.isArray(membersData) ? membersData : (membersData?.members || membersData?.data || []);
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
              })
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
    
    return () => {
      isMounted = false;
    };
  }, [selectedChat?.id, isGroup]);

  const groupAvatar = selectedChat?.avatarUrl || info?.conversation?.avatarUrl || info?.avatarUrl;
  const groupName = selectedChat?.name || info?.conversation?.name || info?.name || "Group";
  const membersCount = info?.memberCount || info?.membersCount || info?.members?.length || members.length || selectedChat?.members?.length || 0;
  
  const adminCount = members.length > 0 
    ? members.filter((m: any) => m.role === 'admin' || m.role === 'owner' || m.role === 'ADMIN' || m.role === 'OWNER').length 
    : (info?.adminIds?.length ? info.adminIds.length + (info?.ownerId ? 1 : 0) : 1);

  const currentUserMember = members.find((m: any) => m.userId === currentUserId || m.user?.id === currentUserId || m.id === currentUserId);
  const currentUserRole = currentUserMember?.role || "member";
  const canEditGroup = currentUserRole === "admin" || currentUserRole === "owner";


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
          avatarUrl: actualInfo.conversation?.avatarUrl || actualInfo.avatarUrl 
        });
      }
    } catch (err) {
      console.error("Failed to update group info:", err);
      setIsUploadingAvatar(false);
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div
      className={`bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 flex flex-col h-full z-20 shadow-[-5px_0_15px_-10px_rgba(0,0,0,0.1)] transition-all duration-300 ease-in-out relative overflow-hidden ${
        isOpen ? "w-[320px] lg:w-[350px] border-l opacity-100" : "w-0 border-l-0 opacity-0"
      }`}
    >
      <div className={`w-[320px] lg:w-[350px] flex h-full shrink-0 relative transition-transform duration-300 ease-in-out overflow-hidden ${isOpen ? "translate-x-0" : "translate-x-[50px]"}`}>
        <div className={`flex w-[300%] h-full shrink-0 transition-transform duration-300 ease-in-out ${
          activeSubView !== "none" ? "-translate-x-2/3" : isEditing ? "-translate-x-1/3" : "translate-x-0"
        }`}>
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
            onMembersClick={() => setActiveSubView('members')}
            onAdminsClick={() => setActiveSubView('admins')}
          />

          <RightSidebarMembers 
            type={activeSubView === "none" ? "members" : activeSubView}
            members={members}
            onClose={() => setActiveSubView("none")}
            groupName={groupName}
          />
        </div>
      </div>
    </div>
  );
};
