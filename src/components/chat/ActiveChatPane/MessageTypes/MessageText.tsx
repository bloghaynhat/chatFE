import { FiCheck, FiEye } from "react-icons/fi";
import { getMessageTime } from "../../../../utils/chatUtils";

export const MessageText = ({ message, text, mine, isSeen }) => {
  const hasReactions = message?.reactions && message.reactions.length > 0;
  return (
    <div className={`px-2.5 ${!!text ? "pt-1" : "pt-0"} cursor-default relative`}>
      {!!text && (
        <p className="whitespace-pre-wrap break-words text-[15px] leading-[1.3] pb-[8px]">
          {text}
          {!hasReactions && <span className="inline-block w-[60px] h-[8px]" aria-hidden="true" />}
        </p>
      )}
    </div>
  );
};
