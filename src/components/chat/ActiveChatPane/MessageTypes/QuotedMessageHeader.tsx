import React, { useState, useEffect } from "react";
import userService from "../../../../services/userService";

export const QuotedMessageHeader = ({ message, messages = [], mine }) => {
  const isQuoted = Boolean(message?.quotedMessageId || message?.quotedMessage);
  
  const [fetchedSenderName, setFetchedSenderName] = useState("");

  useEffect(() => {
    if (!isQuoted) return;

    let targetSenderId = message?.quotedMessage?.senderId || message?.quotedMessage?.id_sender;
    let fallbackName = message?.quotedMessage?.sender?.name ||
      message?.quotedMessage?.senderName ||
      message?.quotedMessage?.sender?.displayName ||
      message?.quotedMessage?.sender?.username;

    // Nếu không có thông tin từ quotedMessage, fallback tìm trong mảng messages
    if (!fallbackName && message?.quotedMessageId) {
      const originalMessage = messages?.find(m => String(m.id || m._id) === String(message.quotedMessageId));
      if (originalMessage) {
        fallbackName = originalMessage.senderName || originalMessage.sender?.displayName || originalMessage.sender?.name;
        targetSenderId = originalMessage.senderId || originalMessage.id_sender;
      }
    }

    if (fallbackName) {
      setFetchedSenderName(fallbackName);
    } else if (targetSenderId) {
      // Fetch if we only have ID
      userService.getUserById(targetSenderId)
        .then((res) => {
          if (res) {
            setFetchedSenderName(res.displayName || res.fullName || res.lastName || res.name || "Unknown");
          }
        })
        .catch(() => setFetchedSenderName("Unknown"));
    } else {
      setFetchedSenderName("Unknown");
    }
  }, [message, messages, isQuoted]);

  if (!isQuoted) return null;

  const quotedMsg = message?.quotedMessage || {};
  
  const senderName = fetchedSenderName || "Unknown";

  const previewText = message?.quotedMessagePreview || quotedMsg?.text || "Ghi âm/Hình ảnh";

  return (
    <div className={`mx-2 mt-[6px] mb-1 px-3 py-[6px] rounded-[6px] relative overflow-hidden flex flex-col justify-center cursor-pointer ${
      mine ? "bg-[#d1f1cb] dark:bg-emerald-800/40" : "bg-black/5 dark:bg-white/5"
    }`}>
      <div className={`absolute left-0 top-0 bottom-0 w-[4px] ${mine ? "bg-[#107c10] dark:bg-emerald-400" : "bg-[#2ea6f3] dark:bg-blue-400"}`}></div>
      <span className={`text-[12.5px] font-semibold leading-tight truncate ${mine ? "text-[#107c10] dark:text-emerald-400" : "text-[#2ea6f3] dark:text-blue-400"}`}>
        {senderName}
      </span>
      <span className={`text-[13px] truncate leading-snug mt-0.5 ${mine ? "text-emerald-900/80 dark:text-emerald-100/70" : "text-gray-600 dark:text-gray-300"}`}>
        {previewText}
      </span>
    </div>
  );
};
