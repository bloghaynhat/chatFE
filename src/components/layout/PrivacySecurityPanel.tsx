import { FiArrowLeft, FiChevronRight, FiKey, FiLock } from "react-icons/fi";
import { useLanguage } from "../../context";

export const PrivacySecurityPanel = ({ isCollapsed, onBack, onNavigate }: any) => {
  const { t } = useLanguage();

  if (isCollapsed) {
    return (
      <div className="flex-1 flex flex-col items-center py-4 bg-white dark:bg-slate-900 border-l border-gray-100 dark:border-slate-800">
        <button onClick={onBack} className="p-2 mb-4 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full text-gray-500 dark:text-gray-400">
          <FiArrowLeft className="text-xl" />
        </button>
        <FiLock className="text-2xl text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden">
      <div className="flex items-center gap-5 px-4 py-2.5 bg-white dark:bg-slate-900 shadow-sm z-10 shrink-0">
        <button onClick={onBack} className="text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 p-2 rounded-full transition -ml-2">
          <FiArrowLeft className="text-xl" />
        </button>
        <h2 className="text-[19px] font-medium text-gray-900 dark:text-white">{t("privacy.title")}</h2>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900">
        <div className="h-2 bg-gray-100/50 dark:bg-slate-950 w-full" />
        <button
          onClick={() => onNavigate("change-password")}
          className="w-full flex items-center px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer transition gap-2 text-left"
        >
          <div className="w-9 flex justify-center text-gray-500 dark:text-gray-400 text-[22px]">
            <FiKey />
          </div>
          <span className="text-[15px] text-gray-900 dark:text-white flex-1">{t("privacy.changePassword")}</span>
          <FiChevronRight className="text-gray-400 text-lg" />
        </button>
        <button
          onClick={() => onNavigate("block-list")}
          className="w-full flex items-center px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer transition gap-2 text-left"
        >
          <div className="w-9 flex justify-center text-gray-500 dark:text-gray-400 text-[22px]">
            <FiLock />
          </div>
          <span className="text-[15px] text-gray-900 dark:text-white flex-1">{t("privacy.blockList")}</span>
          <FiChevronRight className="text-gray-400 text-lg" />
        </button>
        <div className="bg-[#f4f4f5] dark:bg-slate-800/80 px-4 py-3 border-y border-gray-200/50 dark:border-slate-700/50">
          <p className="text-[13.5px] text-gray-500 dark:text-gray-400 leading-relaxed">
            {t("privacy.blockListDescription")}
          </p>
        </div>
      </div>
    </div>
  );
};
