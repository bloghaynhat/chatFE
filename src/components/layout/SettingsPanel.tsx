import { FiArrowLeft, FiEdit2, FiMoreVertical, FiPhone, FiAtSign, FiGift, FiBell, FiDatabase, FiLock, FiSettings, FiFolder, FiSmile, FiMonitor, FiStar } from "react-icons/fi";
import { MdTranslate } from "react-icons/md";
import { useAuth } from "../../hooks";
import { useCallback, useEffect, useState } from "react";
import { authService } from "../../services/authService";
import { useLanguage, LanguageCode } from "../../context";

export const SettingsPanel = ({ isCollapsed, onBack, onNavigate }: any) => {
  const { user } = useAuth();
  const { language, languageLabel, setLanguage, t } = useLanguage();
  const [deviceCount, setDeviceCount] = useState<number | null>(null);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);

  const refreshDeviceCount = useCallback(async () => {
    try {
      const sessions = await authService.getSessions();
      setDeviceCount(Array.isArray(sessions) ? sessions.length : 0);
    } catch {
      setDeviceCount(null);
    }
  }, []);

  useEffect(() => {
    refreshDeviceCount();

    const handleSessionsChanged = () => {
      refreshDeviceCount();
    };

    window.addEventListener("auth:sessions-changed", handleSessionsChanged);
    return () => window.removeEventListener("auth:sessions-changed", handleSessionsChanged);
  }, [refreshDeviceCount]);
  
  const displayPhone = user?.phone || "+84 971484472";
  const displayUsername = user?.username || "bevisVo";
  const displayName = user?.displayName || "An Thanh";
  // Attempt to get initials from display name
  const nameParts = displayName.split(" ");
  const initials = nameParts.length > 1 
    ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase() 
    : displayName.substring(0, 2).toUpperCase();

  const handleLanguageChange = (nextLanguage: LanguageCode) => {
    setLanguage(nextLanguage);
    setIsLanguageOpen(false);
  };
  
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
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">{t("settings.title")}</h2>
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
          <p className="text-[14px] text-blue-500 dark:text-blue-400 font-medium tracking-wide">{t("app.online")}</p>
        </div>

        {/* Info list */}
        <div className="flex flex-col mb-2 border-b border-gray-100/60 dark:border-slate-800 pb-2">
           <div className="flex items-center gap-6 px-5 py-3 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer transition">
              <FiPhone className="text-gray-500 dark:text-gray-400 text-[22px]" />
              <div className="flex-1">
                 <p className="text-[15px] font-normal text-gray-900 dark:text-white leading-tight mb-0.5">{displayPhone}</p>
                 <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-tight">{t("settings.phone")}</p>
              </div>
           </div>
           
           <div className="flex items-center gap-6 px-5 py-3 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer transition">
              <FiAtSign className="text-gray-500 dark:text-gray-400 text-[22px]" />
              <div className="flex-1">
                 <p className="text-[15px] font-normal text-gray-900 dark:text-white leading-tight mb-0.5">{displayUsername}</p>
                 <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-tight">{t("settings.username")}</p>
              </div>
           </div>

           <div className="flex items-center gap-6 px-5 py-3 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer transition">
              <FiGift className="text-gray-500 dark:text-gray-400 text-[22px]" />
              <div className="flex-1">
                 <p className="text-[15px] font-normal text-gray-900 dark:text-white leading-tight mb-0.5">January 6, 2004 (22 years old)</p>
                 <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-tight">{t("settings.birthday")}</p>
              </div>
           </div>
        </div>

        <div className="h-2 bg-gray-100/50 dark:bg-slate-950 w-full" />

        {/* Menu list */}
        <div className="flex flex-col py-2 border-b border-gray-100/60 dark:border-slate-800">
           <SettingsMenuItem icon={<FiBell />} label={t("settings.notifications")} />
           <SettingsMenuItem icon={<FiDatabase />} label={t("settings.dataStorage")} />
           <SettingsMenuItem icon={<FiLock />} label={t("settings.privacySecurity")} onClick={() => onNavigate("privacy-security")} />
           <SettingsMenuItem icon={<FiSettings />} label={t("settings.general")} />
           <SettingsMenuItem icon={<FiFolder />} label={t("settings.chatFolders")} />
           <SettingsMenuItem icon={<FiSmile />} label={t("settings.stickersEmoji")} />
           <SettingsMenuItem icon={<FiMonitor />} label={t("settings.devices")} rightText={deviceCount ?? ""} onClick={() => onNavigate("devices")} />
           <SettingsMenuItem
             icon={<MdTranslate />}
             label={t("settings.language")}
             rightText={languageLabel}
             onClick={() => setIsLanguageOpen((isOpen) => !isOpen)}
           />
           {isLanguageOpen && (
             <div className="mx-4 mb-2 overflow-hidden rounded-lg border border-gray-100 bg-gray-50 dark:border-slate-700 dark:bg-slate-800">
               <p className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                 {t("settings.chooseLanguage")}
               </p>
               <LanguageOption
                 label={t("settings.english")}
                 isActive={language === "en"}
                 onClick={() => handleLanguageChange("en")}
               />
               <LanguageOption
                 label={t("settings.vietnamese")}
                 isActive={language === "vi"}
                 onClick={() => handleLanguageChange("vi")}
               />
             </div>
           )}
        </div>

        <div className="h-2 bg-gray-100/50 dark:bg-slate-950 w-full" />

        <div className="flex flex-col py-2">
           <div className="flex items-center px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer transition">
             <div className="w-9 flex justify-center text-blue-500 text-[22px] mr-2">
               <FiStar className="fill-blue-500" />
             </div>
             <span className="text-[15px] text-gray-900 dark:text-white font-medium flex-1">{t("settings.premium")}</span>
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

const LanguageOption = ({ label, isActive, onClick }: any) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between px-4 py-3 text-left text-[15px] text-gray-900 transition hover:bg-white dark:text-white dark:hover:bg-slate-700"
    >
      <span>{label}</span>
      <span
        className={`h-5 w-5 rounded-full border ${
          isActive
            ? "border-blue-500 bg-blue-500 shadow-[inset_0_0_0_4px_white] dark:shadow-[inset_0_0_0_4px_rgb(30,41,59)]"
            : "border-gray-300 dark:border-slate-500"
        }`}
        aria-hidden="true"
      />
    </button>
  );
};
