import React, { Fragment } from "react";
import { AnimatedEmojiMessage, JUMBO_EMOJI_ASSETS } from "./AnimatedEmojiMessage";

const renderTextWithLinks = (text) => {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, i) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:opacity-80 transition-opacity break-all"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
};
export const MessageText = ({ message, text, mine, isSeen }) => {
  const hasReactions = message?.reactions && message.reactions.length > 0;

  // Xác định xem toàn bộ tin nhắn có phải chỉ chứa ĐÚNG MỘT emoji tồn tại trong Database không
  const trimmedText = text ? text.trim() : "";
  const isJumboEmoji = !!JUMBO_EMOJI_ASSETS[trimmedText] && text.replace(/\s+/g, "") === trimmedText;

  // Nếu tin nhắn được tạo cách đây dưới 5 giây tức là tin nhắn vừa gửi/nhận xong
  const isNewMsg = message?.createdAt ? new Date().getTime() - new Date(message.createdAt).getTime() < 5000 : false;

  return (
    <div className={`${isJumboEmoji ? "p-0" : `px-3 ${!!text ? "py-[6px]" : "pt-0"}`} cursor-default relative`}>
      {!!text &&
        (isJumboEmoji ? (
          <AnimatedEmojiMessage emoji={trimmedText} isNew={isNewMsg} isMine={mine} />
        ) : (
          <p className="whitespace-pre-wrap break-words text-[15px] leading-[1.32]">
            {renderTextWithLinks(text)}
            {!hasReactions && <span className="inline-block w-[58px] h-0" aria-hidden="true" />}
          </p>
        ))}
    </div>
  );
};
