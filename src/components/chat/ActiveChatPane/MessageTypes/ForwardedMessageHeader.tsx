export const ForwardedMessageHeader = ({ fwData }) => {
  return (
    <div className="px-2.5 pt-2 pb-1 flex flex-col gap-0.5">
      <span className="text-[13px] font-medium text-emerald-600 dark:text-emerald-400">Forwarded from</span>
      <div className="flex items-center gap-1.5 opacity-90">
        <div className="w-[18px] h-[18px] rounded-full bg-pink-500 flex items-center justify-center text-white text-[9px] font-bold shrink-0 shadow-sm">
          {fwData.senderAvatarStr || "U"}
        </div>
        <span className="font-semibold text-[14px] text-emerald-700 dark:text-emerald-300 tracking-tight">
          {fwData.senderName || "Unknown"}
        </span>
      </div>
    </div>
  );
};
