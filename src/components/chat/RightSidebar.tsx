import { useEffect, useState } from "react";
import { FiX, FiEdit2, FiBell, FiLink2, FiUserPlus } from "react-icons/fi";
import { conversationService } from "../../services";

export const RightSidebar = ({ selectedChat, onClose, currentUserId }: any) => {
  const [members, setMembers] = useState<any[]>([]);
  const [info, setInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const isGroup = selectedChat?.type === "group" || selectedChat?.type === "GROUP";

  useEffect(() => {
    if (!selectedChat?.id) return;
    
    let isMounted = true;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (isGroup) {
          const membersData = await conversationService.getGroupMembers(selectedChat.id);
          const infoData = await conversationService.getGroupInfo(selectedChat.id);
          if (isMounted) {
            setMembers(membersData || []);
            setInfo(infoData || null);
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

  const groupAvatar = selectedChat?.avatarUrl || info?.avatarUrl;
  const groupName = selectedChat?.name || info?.name || "Group";
  const membersCount = info?.membersCount || members.length || selectedChat?.members?.length || 0;

  return (
    <div className="w-[320px] lg:w-[350px] bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-slate-800 flex flex-col h-full z-20 shadow-[-5px_0_15px_-10px_rgba(0,0,0,0.1)] transition-all animate-in slide-in-from-right-8 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-[60px] border-b border-gray-100 dark:border-slate-800 shrink-0">
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
        {isGroup && (
          <button className="p-2 -mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 transition-colors">
            <FiEdit2 className="text-[18px]" />
          </button>
        )}
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
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <FiEdit2 className="text-white text-2xl" />
            </div>
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
          <div className="flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group">
            <FiLink2 className="text-[#aab8c2] group-hover:text-blue-500 text-xl mr-4" />
            <div className="flex-1">
              <div className="text-[15px] font-medium text-gray-800 dark:text-gray-200">t.me/+xyz123 link</div>
              <div className="text-[13px] text-gray-500">Link</div>
            </div>
          </div>
          
          <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group" onClick={() => setNotificationsEnabled(!notificationsEnabled)}>
            <div className="flex items-center">
              <FiBell className="text-[#aab8c2] group-hover:text-blue-500 text-xl mr-4" />
              <div className="text-[15px] font-medium text-gray-800 dark:text-gray-200">Notifications</div>
            </div>
            {/* Toggle switch */}
            <div className={`w-10 h-5 flex items-center bg-gray-300 rounded-full p-1 cursor-pointer transition-colors duration-300 ${notificationsEnabled ? 'bg-blue-500' : 'bg-gray-300 dark:bg-slate-600'}`}>
              <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${notificationsEnabled ? 'translate-x-4' : ''}`}></div>
            </div>
          </div>
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
                // Determine display names/avatars depending on the backend response structure 
                // Using fallback 'user' sub-object common in my APIs
                const participant = member.user || member;
                const displayName = participant.displayName || participant.name || participant.username || "Unknown";
                const isOwner = member.role === "admin" || member.role === "owner";
                
                return (
                  <div key={member.id || participant.id} className="flex items-center px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
                    <div className="w-10 h-10 rounded-full bg-orange-400 font-semibold text-white flex items-center justify-center mr-3 overflow-hidden shrink-0">
                      {participant.avatarUrl ? (
                         <img src={participant.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                         <span>{displayName.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] font-medium text-gray-900 dark:text-gray-100 truncate">
                         {displayName}
                      </div>
                      <div className="text-[13px] text-gray-500 dark:text-gray-400 truncate">
                         last seen recently
                      </div>
                    </div>
                    {isOwner && (
                      <span className="text-[12px] text-gray-400 dark:text-gray-500 font-medium">owner</span>
                    )}
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
    </div>
  );
};
