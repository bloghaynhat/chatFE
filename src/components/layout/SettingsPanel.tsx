import { FiArrowLeft, FiEdit2, FiMoreVertical, FiPhone, FiAtSign, FiGift, FiBell, FiDatabase, FiLock, FiSettings, FiFolder, FiSmile, FiMonitor, FiStar } from "react-icons/fi";
import { MdTranslate } from "react-icons/md";
import { useAuth } from "../../hooks";

export const SettingsPanel = ({ isCollapsed, onBack, onNavigate }: any) => {
  const { user } = useAuth();
  
  const displayPhone = user?.phone || "+84 971484472";
  const displayUsername = user?.username || "bevisVo";
  const displayName = user?.displayName || "An Thanh";
  // Attempt to get initials from display name
  const nameParts = displayName.split(" ");
  const initials = nameParts.length > 1 
    ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase() 
    : displayName.substring(0, 2).toUpperCase();
  
  if (isCollapsed) {
    return (
      <div className="flex-1 flex flex-col items-center py-4 bg-white dark:bg-slate-900 border-l border-gray-100 dark:border-slate-800">
        <button onClick={onBack} className="p-2 mb-4 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full text-gray-500 dark:text-gray-400">
           <FiArrowLeft className="text-xl" />
        </button>
        <FiSettings className="text-2xl text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white dark:bg-slate-900 shadow-sm z-10 shrink-0">
        <div className="flex items-center gap-5">
          <button onClick={onBack} className="text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 p-2 rounded-full transition -ml-2">
             <FiArrowLeft className="text-xl" />
          </button>
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Settings</h2>
        </div>
        <div className="flex items-center gap-1">
          <button className="text-gray-500 hover:bg-gray-100 p-2 rounded-full transition dark:text-gray-400 dark:hover:bg-slate-800">
             <FiEdit2 className="text-lg" />
          </button>
          <button className="text-gray-500 hover:bg-gray-100 p-2 rounded-full transition dark:text-gray-400 dark:hover:bg-slate-800 -mr-2">
             <FiMoreVertical className="text-xl" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900 pb-8">
        <div className="flex flex-col items-center pt-8 pb-4">
          <div className="w-[100px] h-[100px] rounded-full bg-[#E56E8A] text-white flex items-center justify-center text-[40px] font-medium shadow-sm mb-4">
            {user?.avatarUrl ? <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-full" /> : initials}
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-0.5">{displayName}</h1>
          <p className="text-[14px] text-blue-500 dark:text-blue-400 font-medium tracking-wide">online</p>
        </div>

        {/* Info list */}
        <div className="flex flex-col mb-2 border-b border-gray-100/60 dark:border-slate-800 pb-2">
           <div className="flex items-center gap-6 px-5 py-3 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer transition">
              <FiPhone className="text-gray-500 dark:text-gray-400 text-[22px]" />
              <div className="flex-1">
                 <p className="text-[15px] font-normal text-gray-900 dark:text-white leading-tight mb-0.5">{displayPhone}</p>
                 <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-tight">Phone</p>
              </div>
           </div>
           
           <div className="flex items-center gap-6 px-5 py-3 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer transition">
              <FiAtSign className="text-gray-500 dark:text-gray-400 text-[22px]" />
              <div className="flex-1">
                 <p className="text-[15px] font-normal text-gray-900 dark:text-white leading-tight mb-0.5">{displayUsername}</p>
                 <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-tight">Username</p>
              </div>
           </div>

           <div className="flex items-center gap-6 px-5 py-3 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer transition">
              <FiGift className="text-gray-500 dark:text-gray-400 text-[22px]" />
              <div className="flex-1">
                 <p className="text-[15px] font-normal text-gray-900 dark:text-white leading-tight mb-0.5">January 6, 2004 (22 years old)</p>
                 <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-tight">Birthday</p>
              </div>
           </div>
        </div>

        <div className="h-2 bg-gray-100/50 dark:bg-slate-950 w-full" />

        {/* Menu list */}
        <div className="flex flex-col py-2 border-b border-gray-100/60 dark:border-slate-800">
           <SettingsMenuItem icon={<FiBell />} label="Notifications and Sounds" />
           <SettingsMenuItem icon={<FiDatabase />} label="Data and Storage" />
           <SettingsMenuItem icon={<FiLock />} label="Privacy and Security" />
           <SettingsMenuItem icon={<FiSettings />} label="General Settings" />
           <SettingsMenuItem icon={<FiFolder />} label="Chat Folders" />
           <SettingsMenuItem icon={<FiSmile />} label="Stickers and Emoji" />
           <SettingsMenuItem icon={<FiMonitor />} label="Devices" rightText="3" onClick={() => onNavigate("devices")} />
           <SettingsMenuItem icon={<MdTranslate />} label="Language" rightText="English" />
        </div>

        <div className="h-2 bg-gray-100/50 dark:bg-slate-950 w-full" />

        <div className="flex flex-col py-2">
           <div className="flex items-center px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer transition">
             <div className="w-9 flex justify-center text-blue-500 text-[22px] mr-2">
               <FiStar className="fill-blue-500" />
             </div>
             <span className="text-[15px] text-gray-900 dark:text-white font-medium flex-1">Telegram Premium</span>
           </div>
        </div>
      </div>
    </div>
  );
};

const SettingsMenuItem = ({ icon, label, rightText, onClick }: any) => {
  return (
    <div 
      onClick={onClick}
      className="flex items-center px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer transition gap-2"
    >
      <div className="w-9 flex justify-center text-gray-500 dark:text-gray-400 text-[22px]">
        {icon}
      </div>
      <span className="text-[15px] text-gray-900 dark:text-white flex-1">{label}</span>
      {rightText && <span className="text-[14px] text-gray-400 mr-2">{rightText}</span>}
    </div>
  )
}
