import { FiCheck, FiEye } from "react-icons/fi";
import { getMessageTime } from "../../../../utils/chatUtils";
import { AnimatedEmojiMessage, JUMBO_EMOJI_ASSETS } from "./AnimatedEmojiMessage";

export const MessageText = ({ message, text, mine, isSeen }) => {
  const hasReactions = message?.reactions && message.reactions.length > 0;

  // Xác định xem toàn bộ tin nhắn có phải chỉ chứa ĐÚNG MỘT emoji tồn tại trong Database không
  const trimmedText = text ? text.trim() : "";
  const isJumboEmoji = !!JUMBO_EMOJI_ASSETS[trimmedText] && text.replace(/\s+/g, "") === trimmedText;

  // Nếu tin nhắn được tạo cách đây dưới 5 giây tức là tin nhắn vừa gửi/nhận xong
  const isNewMsg = message?.createdAt ? new Date().getTime() - new Date(message.createdAt).getTime() < 5000 : false;

  return (
    <div className={`${isJumboEmoji ? "p-0" : `px-2.5 ${!!text ? "pt-1" : "pt-0"}`} cursor-default relative`}>
      {!!text &&
        (isJumboEmoji ? (
          <AnimatedEmojiMessage emoji={trimmedText} isNew={isNewMsg} />
        ) : (
          <p className="whitespace-pre-wrap break-words text-[15px] leading-[1.3] pb-[8px]">
            {text}
            {!hasReactions && <span className="inline-block w-[60px] h-[8px]" aria-hidden="true" />}
          </p>
        ))}
    </div>
  );
};
