import { FiArrowLeft, FiMinusCircle } from "react-icons/fi";

export const DevicesPanel = ({ isCollapsed, onBack }) => {
  if (isCollapsed) {
    return (
      <div className="flex-1 flex flex-col items-center py-4 bg-white dark:bg-slate-900 border-l border-gray-100 dark:border-slate-800">
        <button onClick={onBack} className="p-2 mb-4 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full text-gray-500 dark:text-gray-400">
           <FiArrowLeft className="text-xl" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-5 px-4 py-2.5 bg-white dark:bg-slate-900 shadow-sm z-10 shrink-0">
        <button onClick={onBack} className="text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 p-2 rounded-full transition -ml-2">
           <FiArrowLeft className="text-xl" />
        </button>
        <h2 className="text-[19px] font-medium text-gray-900 dark:text-white">Active Sessions</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900">
        
        {/* Section: This device */}
        <div className="px-5 pt-4 pb-2">
           <h3 className="text-[15px] font-medium text-blue-500 mb-3 tracking-wide">This device</h3>
           
           <div className="mb-4">
              <p className="text-[15px] font-medium text-gray-900 dark:text-white leading-tight mb-0.5">Telegram Web 2.2 K</p>
              <p className="text-[14px] text-gray-500 dark:text-gray-400 leading-snug">Chrome 147, Windows</p>
              <p className="text-[14px] text-gray-400 dark:text-gray-500 leading-snug">Ho Chi Minh City, Vietnam</p>
           </div>
           
           <button className="flex items-center gap-4 text-red-500 hover:text-red-600 transition w-full py-1">
              <FiMinusCircle className="text-2xl shrink-0 stroke-[1.5]" />
              <span className="text-[15px] font-normal">Terminate All Other Sessions</span>
           </button>
        </div>

        <div className="bg-[#f4f4f5] dark:bg-slate-800/80 px-4 py-3 border-y border-gray-200/50 dark:border-slate-700/50">
           <p className="text-[13.5px] text-gray-500 dark:text-gray-400 leading-relaxed">
             Logs out all devices except for this one.
           </p>
        </div>

        {/* Section: Active sessions */}
        <div className="px-5 pt-4 pb-2">
           <h3 className="text-[15px] font-medium text-blue-500 mb-2 tracking-wide">Active sessions</h3>
           
           <div className="py-3 hover:bg-gray-50 dark:hover:bg-slate-800 transition -mx-5 px-5 cursor-pointer flex justify-between gap-4">
              <div>
                 <p className="text-[15px] font-medium text-gray-900 dark:text-white leading-tight mb-0.5">Telegram iOS 12.6.3 (32738)</p>
                 <p className="text-[14px] text-gray-500 dark:text-gray-400 leading-snug">iPhone 11, 15.1</p>
                 <p className="text-[14px] text-gray-400 dark:text-gray-500 leading-snug">Ho Chi Minh City, Vietnam</p>
              </div>
              <span className="text-[13px] text-gray-400 mt-0.5 shrink-0">16:45</span>
           </div>

           <div className="py-3 hover:bg-gray-50 dark:hover:bg-slate-800 transition -mx-5 px-5 cursor-pointer flex justify-between gap-4">
              <div>
                 <p className="text-[15px] font-medium text-gray-900 dark:text-white leading-tight mb-0.5">Telegram Desktop 6.6.2 x64</p>
                 <p className="text-[14px] text-gray-500 dark:text-gray-400 leading-snug">82L7, Windows 11 x64</p>
                 <p className="text-[14px] text-gray-400 dark:text-gray-500 leading-snug">Ho Chi Minh City, Vietnam</p>
              </div>
              <span className="text-[13px] text-gray-400 mt-0.5 shrink-0">Mar 28</span>
           </div>
        </div>

        <div className="bg-[#f4f4f5] dark:bg-slate-800/80 px-4 py-3 border-t border-gray-200/50 dark:border-slate-700/50 pb-8 min-h-[50vh]">
           <p className="text-[13.5px] text-gray-500 dark:text-gray-400 leading-relaxed">
             The official Telegram app is available for Android, iPhone, iPad, Windows, macOS and Linux.
           </p>
        </div>

      </div>
    </div>
  );
};
