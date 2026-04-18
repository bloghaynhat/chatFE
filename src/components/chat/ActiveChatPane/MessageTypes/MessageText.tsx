import { FiCheck, FiEye } from "react-icons/fi";
import { getMessageTime } from "../../../../utils/chatUtils";

export const MessageText = ({ message, text, mine, isSeen }) => {
  return (
    <div className={`px-3 pb-2 pt-2 cursor-default relative`}>
      {!!text && <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">{text}</p>}
      <p
        className={`mt-1 text-[11.5px] font-medium tracking-tight flex items-center justify-end gap-[5px] ${mine ? "text-emerald-700/80 dark:text-emerald-200/80" : "text-gray-400 dark:text-gray-500"}`}
      >
        {message.isEdited && (
          <span className="italic font-semibold opacity-75 text-[10.5px] tracking-normal">edited</span>
        )}
        <span>{getMessageTime(message)}</span>
        {mine && <>{isSeen ? <FiEye className="text-[13px]" /> : <FiCheck className="text-[13px]" />}</>}
      </p>
    </div>
  );
};
