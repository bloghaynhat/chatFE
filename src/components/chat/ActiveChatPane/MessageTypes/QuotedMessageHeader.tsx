import React, { useState, useEffect } from "react";
import userService from "../../../../services/userService";

export const QuotedMessageHeader = ({ message, messages = [], mine, currentUserId, onNavigateToMessage }: any) => {
  const isQuoted = Boolean(message?.quotedMessageId || message?.quotedMessage || message?.replyTo);
  
  const [fetchedSenderName, setFetchedSenderName] = useState("");
  const [previewText, setPreviewText] = useState("Tệp đính kèm");

  const targetSenderId = message?.quotedMessage?.senderId || message?.quotedMessage?.id_sender || message?.quotedMessage?.sender?.id || message?.quotedMessage?.sender?._id;
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
    const determinePreview = (msg: any, fallbackText: string) => {
       const text = (msg?.text || msg?.content || fallbackText || "").trim();
       const msgType = typeof msg?.type === 'string' ? msg.type.toLowerCase() : "";
       
       const isImage = msgType.includes("image") || msg?.imageUrl || msg?.type === 'IMAGE';
       const isVideo = msgType.includes("video") || msg?.videoUrl || msg?.type === 'VIDEO';
       const isAudio = msgType.includes("audio") || msg?.type === 'AUDIO';
       const isDoc = msgType === "document" || msgType === "file" || msg?.type === 'DOCUMENT';
       
       const files = msg?.files || msg?.media || msg?.mediaItems || [];
       let mediaLabel = "";
       
       if (isImage) mediaLabel = "Photos";
       else if (isVideo) mediaLabel = "Video";
       else if (isAudio) mediaLabel = "Voice Message";
       else if (isDoc) mediaLabel = "Documents";
       else if (files && files.length > 0) {
          const firstFile = files[0];
          const type = typeof firstFile === 'string' ? "image" : (firstFile.type || firstFile.mimetype || "");
          const url = typeof firstFile === 'string' ? firstFile : (firstFile.url || "");
          if (type.toLowerCase().includes("image") || url.match(/\.(jpeg|jpg|gif|png|webp|heic)$/i)) mediaLabel = "Hình ảnh";
          else if (type.toLowerCase().includes("video") || url.match(/\.(mp4|mpeg|webm|ogg|mov)$/i)) mediaLabel = "Video";
          else if (type.toLowerCase().includes("audio") || url.match(/\.(mp3|wav|ogg|m4a|aac)$/i)) mediaLabel = "Ghi âm";
          else mediaLabel = "Documents";
       }
       
       if (mediaLabel) {
         return text ? `${mediaLabel}, ${text}` : mediaLabel;
       }
       return text || "Attachments";
    };

    let textPreview = message?.quotedMessagePreview || message?.quotedMessage?.text || message?.quotedMessage?.content || "";

    // If quotedMessage has enough shape, use it immediately
    if (message?.quotedMessage && typeof message.quotedMessage === 'object' && Object.keys(message.quotedMessage).length > 1) {
       const preview = determinePreview(message.quotedMessage, typeof textPreview === "string" ? textPreview : "");
       setPreviewText(preview);
    } else if (textPreview && typeof textPreview === "string" && textPreview.trim()) {
       setPreviewText(textPreview);
    }


    const extractStringId = (idField: any): string | undefined => {
      if (!idField) return undefined;
      if (typeof idField === 'string') return idField;
      if (typeof idField === 'object') return idField._id || idField.id || undefined;
      return String(idField);
    };

    // Build the most robust targetId finder possible
    const findTargetUser = () => {
      // Direct pass from quoting a message with sender explicitly fully populated
      if (fallbackName) return { id: extractStringId(targetId), name: fallbackName };

      // Look in local messages cache if backend didn't push full quote object
      if (quotedMessageId && messages && messages.length > 0) {
        const originalMessage = messages.find(m => String(m.id || m._id) === String(quotedMessageId));
        if (originalMessage) {
           const foundName = originalMessage.senderName || originalMessage.sender?.displayName || originalMessage.sender?.name || originalMessage.sender?.username || originalMessage.senderId?.displayName;
           const foundId = extractStringId(originalMessage.senderId) || extractStringId(originalMessage.id_sender) || extractStringId(originalMessage.sender?.id) || extractStringId(originalMessage.sender?._id) || extractStringId(originalMessage.user_id);

           const localPreview = determinePreview(originalMessage, typeof textPreview === "string" ? textPreview : "");
           if (localPreview && localPreview !== "Tệp đính kèm" && localPreview !== "") {
               setPreviewText(localPreview);
           }

           return { id: foundId, name: foundName };
        }
      }
      return { id: extractStringId(targetId), name: fallbackName };
    };

    const target = findTargetUser();
    targetId = target.id;
    fallbackName = target.name;

    if (fallbackName) {
      setFetchedSenderName(fallbackName);
      setFetchedTargetId(targetId || "");
    } else if (targetId && targetId !== fetchedTargetId && targetId !== "me") {
      setFetchedTargetId(targetId);
      userService.getUserById(targetId)
        .then((res: any) => {
          if (res) {
            const data = res.data?.data || res.data?.user || res.data || res.user || res;
            const name = data.displayName || data.fullName || data.lastName || data.name || data.username || "Unknown";
            setFetchedSenderName(name);
          }
        })
        .catch((err) => {
          console.error("Failed fetching sender name for Quoted Message", targetId, err);
          setFetchedSenderName("Unknown");
        });
    } else if (!targetId) {
      setFetchedSenderName("Unknown");
    }
  }, [isQuoted, targetSenderId, fallbackNameFromMsg, quotedMessageId, messages, message, fetchedTargetId]);

  if (!isQuoted) return null;

  let senderName = fetchedSenderName || "Unknown";
  if (currentUserId && (fetchedTargetId === currentUserId || targetSenderId === currentUserId || fetchedTargetId === "me")) {
    senderName = "Bạn";
  }

  return (
    <div className={`mx-2 mt-[6px] mb-1 px-3 py-[6px] rounded-[6px] relative overflow-hidden flex flex-col justify-center cursor-pointer ${
      mine ? "bg-[#d1f1cb] dark:bg-emerald-800/40" : "bg-black/5 dark:bg-white/5"
    }`} onClick={(e) => {
        if (quotedMessageId && onNavigateToMessage) {
            e.stopPropagation();
            onNavigateToMessage(quotedMessageId);
        }
    }}>
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
