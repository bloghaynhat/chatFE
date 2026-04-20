import React, { useState, useEffect } from "react";
import userService from "../../../../services/userService";

export const QuotedMessageHeader = ({ message, messages = [], mine, currentUserId }) => {
  const isQuoted = Boolean(message?.quotedMessageId || message?.quotedMessage || message?.replyTo);
  
  const [fetchedSenderName, setFetchedSenderName] = useState("");
  const [previewText, setPreviewText] = useState("Ghi âm/Hình ảnh");

  const targetSenderId = message?.quotedMessage?.senderId || message?.quotedMessage?.id_sender;
  const fallbackNameFromMsg = message?.quotedMessage?.sender?.name ||
    message?.quotedMessage?.senderName ||
    message?.quotedMessage?.sender?.displayName ||
    message?.quotedMessage?.sender?.username;
  const quotedMessageId = message?.quotedMessageId || message?.quotedMessage?.id || message?.quotedMessage?._id || message?.replyTo;

  const [fetchedTargetId, setFetchedTargetId] = useState("");

  useEffect(() => {
    if (!isQuoted) return;

    let targetId = targetSenderId;
    let fallbackName = fallbackNameFromMsg;
    let textPreview = message?.quotedMessagePreview || message?.quotedMessage?.text;

    // Nếu không có thông tin từ quotedMessage, fallback tìm trong mảng messages
    if ((!fallbackName || !textPreview) && quotedMessageId) {
      const originalMessage = messages?.find(m => String(m.id || m._id) === String(quotedMessageId));
      if (originalMessage) {
        if (!fallbackName) {
           fallbackName = originalMessage.senderName || originalMessage.sender?.displayName || originalMessage.sender?.name;
        }
        if (!targetId) targetId = originalMessage.senderId || originalMessage.id_sender;
        if (!textPreview) {
           textPreview = originalMessage.text;
        }
      }
    }

    if (textPreview) {
        setPreviewText(textPreview);
    }

    if (fallbackName) {
      setFetchedSenderName(fallbackName);
      setFetchedTargetId(targetId);
    } else if (targetId && targetId !== fetchedTargetId && targetId !== "me") {
      // Fetch if we only have ID and haven't fetched it yet
      setFetchedTargetId(targetId); // Prevent duplicate calls immediately
      userService.getUserById(targetId)
        .then((res) => {
          if (res) {
            setFetchedSenderName(res.displayName || res.fullName || res.lastName || res.name || "Unknown");
          }
        })
        .catch(() => setFetchedSenderName("Unknown"));
    } else if (!targetId) {
      setFetchedSenderName("Unknown");
    }
  }, [isQuoted, targetSenderId, fallbackNameFromMsg, quotedMessageId, messages, message, fetchedTargetId]);

  if (!isQuoted) return null;

  let senderName = fetchedSenderName || "Unknown";
  if (mine && currentUserId && (fetchedTargetId === currentUserId || targetSenderId === currentUserId || fetchedTargetId === "me")) {
    senderName = "Bạn";
  }

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
