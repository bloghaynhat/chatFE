export const getMessageId = (message, index) =>
  message?.id || message?._id || `${index}-${message?.createdAt || "msg"}`;

export const getMessageText = (message) =>
  message?.text || message?.content || message?.message || "";

export const getMessageTime = (message) => {
  const value = message?.createdAt || message?.updatedAt || message?.time;
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export const getDateLabel = (dateValue) => {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
};

export const CALENDAR_WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

export const groupMediaMessages = (messages: any[]) => {
  const groupedMessages: any[] = [];
  
  messages.forEach((msg) => {
    if (groupedMessages.length === 0) {
      groupedMessages.push({ ...msg, media: [...(msg.media || [])] });
      return;
    }
    const lastMsg = groupedMessages[groupedMessages.length - 1];
    
    const getSenderId = (m: any) => m?.senderId || m?.sender?._id || m?.id_sender;
    const msgSender = getSenderId(msg);
    const lastMsgSender = getSenderId(lastMsg);
    
    const hasMedia = (m: any) => (m.media && m.media.length > 0) || m.type === "image" || m.type === "video";
    
    // Valid media limits grouping strictly to unquoted media messages
    const isMsgMediaValid = hasMedia(msg) && !msg.quotedMessageId && !msg.replyTo && !msg.originalMessageId;
    const isLastMsgMediaValid = hasMedia(lastMsg) && !lastMsg.quotedMessageId && !lastMsg.replyTo && !lastMsg.originalMessageId;

    const timeDiff = Math.abs(new Date(msg.createdAt).getTime() - new Date(lastMsg.createdAt).getTime());
    const textMatches = msg.text === lastMsg.text;

    // Group if: same sender, same text (even if not empty), both have media, sent within 5 seconds
    if (
      msgSender && lastMsgSender &&
      String(msgSender) === String(lastMsgSender) &&
      isMsgMediaValid && isLastMsgMediaValid &&
      textMatches &&
      timeDiff < 5000
    ) {
      // Merge media arrays safely
      lastMsg.media = [...(lastMsg.media || []), ...(msg.media || [])];
    } else {
      groupedMessages.push({ ...msg, media: [...(msg.media || [])] });
    }
  });
  
  return groupedMessages;
};
