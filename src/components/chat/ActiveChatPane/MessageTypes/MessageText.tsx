import { FiCheck, FiEye } from "react-icons/fi";
import { getMessageTime } from "../../../../utils/chatUtils";

export const MessageText = ({ message, text, mine, isSeen }) => {
  return (
    <div className={`px-3 ${!!text ? "pt-2" : "pt-0"} cursor-default relative`}>
      {!!text && <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">{text}</p>}
    </div>
  );
};
