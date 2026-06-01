import { getMessageId } from "../../../../utils/chatUtils";

export const RevokedMessage = ({
  message,
  index,
  isFirst,
  firstMessageRef,
  mine,
  isGroup,
  isFirstInSequence,
  isLastInSequence,
  senderName,
  senderAvatarStr,
  wallpaperTheme,
}) => {
  return (
    <div className={`w-full flex ${mine ? "justify-end" : "justify-start"} items-end gap-2 mb-1`}>
      {isGroup && !mine && (
        <div className="w-7 h-7 rounded-full shrink-0 overflow-hidden bg-gray-100 flex items-center justify-center text-gray-600 text-xs font-bold shadow-sm mb-0.5" style={{ opacity: isLastInSequence ? 1 : 0 }}>
           {isLastInSequence ? senderAvatarStr : ""}
        </div>
      )}
      <div
        ref={isFirst ? firstMessageRef : null}
        key={getMessageId(message, index)}
        className={`w-fit max-w-[74%] lg:max-w-[68%] rounded-2xl text-[14px] shadow-sm flex flex-col relative px-3 py-2 border ${
          wallpaperTheme?.revoked ||
          "border-gray-100 dark:border-slate-700/50 bg-black/[0.02] dark:bg-white/[0.02]"
        } ${
          mine ? "self-end rounded-br-md" : "self-start rounded-bl-md"
        }`}
      >
        {isGroup && !mine && isFirstInSequence && (
          <span
            className={`text-[12.5px] font-semibold mb-0.5 ${
              wallpaperTheme?.sender || "text-blue-600 dark:text-blue-400"
            }`}
          >
            {senderName}
          </span>
        )}
        <span
          className={`italic font-medium ${
            wallpaperTheme?.revoked
              ? ""
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          Message recalled
        </span>
      </div>
    </div>
  );
};
