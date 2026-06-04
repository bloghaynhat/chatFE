import { useEffect, useState, useRef } from "react";
import userService from "../../../services/userService";
import {
  FiSmile,
  FiPaperclip,
  FiMic,
  FiSend,
  FiCornerUpRight,
  FiCornerUpLeft,
  FiEdit2,
  FiX,
  FiType,
  FiTrash2,
  FiLock,
  FiZap,
  FiChevronDown,
} from "react-icons/fi";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { AiSmartReply } from "../AiSmartReply";
import { AiToneAdjustMenu } from "../AiToneAdjustMenu";
import TextareaAutosize from "react-textarea-autosize";
import { toast } from "sonner";
import { useLanguage } from "../../../context";

// frequentEmojis removed

const botMentionRegex = /(@bot\b)/gi;

const renderDraftWithBotMention = (text: string) =>
  text.split(botMentionRegex).map((part, index) =>
    part.toLowerCase() === "@bot" ? (
      <span key={index} className="font-semibold text-[#2ea6f3] dark:text-blue-300">
        {part}
      </span>
    ) : (
      <span key={index}>{part}</span>
    ),
  );

export const ChatInput = ({
  draftMessage,
  setDraftMessage,
  handleInputChange,
  handleSendMessage,
  isAttachMenuOpen,
  setIsAttachMenuOpen,
  isEmojiPickerOpen,
  setIsEmojiPickerOpen,
  isMoreMenuOpen,
  setIsMoreMenuOpen,
  attachMenuRef,
  emojiMenuRef,
  attachActions,
  editingMessage,
  setEditingMessage,
  replyingMessage,
  setReplyingMessage,
  forwardingMessage,
  onClearForwarding,
  currentUserId,
  handleSendVoice,
  disabledReason,
  selectedConversationId,
  smartReplyTriggerKey,
  isTyping,
  isLastMessageFromCurrentUser,
  disabledTone = "danger",
  onChatInteractionRead,
  onInputHeightChange,
  isScrolledUp = false,
  onScrollToBottom,
}) => {
  const { t } = useLanguage();
  const [fetchedReplyingSender, setFetchedReplyingSender] = useState<any>(null);
  const [isSmartReplyOpen, setIsSmartReplyOpen] = useState(false);
  const [manualSmartReplyKey, setManualSmartReplyKey] = useState("");
  const [isBotMentionOpen, setIsBotMentionOpen] = useState(false);
  const inputRootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (replyingMessage) {
      if (!replyingMessage.sender?.name && !replyingMessage.senderName && !replyingMessage.sender?.displayName) {
        const senderId = replyingMessage.senderId || replyingMessage.id_sender;
        if (senderId && senderId !== currentUserId) {
          userService
            .getUserById(senderId)
            .then((res) => {
              if (res) {
                setFetchedReplyingSender(res);
              }
            })
            .catch((err) => console.error("Error fetching sender info:", err));
        }
      }
    } else {
      setFetchedReplyingSender(null);
    }
  }, [replyingMessage, currentUserId]);

  const [isVoiceMenuOpen, setIsVoiceMenuOpen] = useState(false);
  const voiceMenuRef = useRef<HTMLDivElement>(null);

  const [isListeningText, setIsListeningText] = useState(false);
  const recognitionRef = useRef<any>(null);

  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<any>(null);
  const audioChunksRef = useRef<any[]>([]);
  const recordIntervalRef = useRef<any>(null);

  useEffect(() => {
    if (!isVoiceMenuOpen) return;
    const handleOutsideClick = (e: any) => {
      if (voiceMenuRef.current && !voiceMenuRef.current.contains(e.target)) {
        setIsVoiceMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isVoiceMenuOpen]);

  const toggleVoiceToText = () => {
    setIsVoiceMenuOpen(false);
    if (isListeningText) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListeningText(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Trình duyệt của bạn không hỗ trợ nhận diện giọng nói!");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "vi-VN";
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setDraftMessage((prev: string) => prev + (prev ? " " : "") + finalTranscript);
      }
    };

    recognition.onerror = (e: any) => console.error(e);
    recognition.onend = () => setIsListeningText(false);

    recognition.start();
    recognitionRef.current = recognition;
    setIsListeningText(true);
  };

  const startVoiceRecording = async () => {
    setIsVoiceMenuOpen(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (!mediaRecorderRef.current?.cancelRecording) {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/mpeg",
          });
          const file = new File([audioBlob], `voice_message_${Date.now()}.mp3`, { type: "audio/mpeg" });
          if (handleSendVoice) handleSendVoice(file);
        }
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecordingAudio(true);
      setRecordingTime(0);
      recordIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      toast.error("Không thể truy cập Microphone");
    }
  };

  const stopVoiceRecording = (cancel = false) => {
    if (mediaRecorderRef.current && isRecordingAudio) {
      if (cancel) {
        mediaRecorderRef.current.cancelRecording = true;
      } else {
        mediaRecorderRef.current.cancelRecording = false;
      }
      mediaRecorderRef.current.stop();
      setIsRecordingAudio(false);
      clearInterval(recordIntervalRef.current);
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const getPreviewText = (msg: any) => {
    if (!msg) return "";
    const text = (msg.text || msg.content || "").trim();
    const msgType = typeof msg.type === "string" ? msg.type.toLowerCase() : "";

    const isImage = msgType === "image" || msg.imageUrl;
    const isVideo = msgType === "video" || msg.videoUrl;
    const isVoice = msgType === "voice" || msgType.includes("audio");
    const isDoc = msgType === "file";
    const isSticker = msgType === "sticker";
    const isGif = msgType === "gif";

    const files = msg.files || msg.media || msg.mediaItems || [];
    let mediaLabel = "";

    if (isImage) mediaLabel = "Photos";
    else if (isVideo) mediaLabel = "Video";
    else if (isVoice) mediaLabel = "Voice Message";
    else if (isDoc) mediaLabel = "Documents";
    else if (isSticker) mediaLabel = "Sticker";
    else if (isGif) mediaLabel = "GIF";
    else if (files && files.length > 0) {
      const firstFile = files[0];
      const type = typeof firstFile === "string" ? "image" : firstFile.type || firstFile.mimetype || "";
      const url = typeof firstFile === "string" ? firstFile : firstFile.url || "";
      if (type.toLowerCase().includes("image") || url.match(/\.(jpeg|jpg|gif|png|webp|heic)$/i)) mediaLabel = "Photos";
      else if (type.toLowerCase().includes("video") || url.match(/\.(mp4|mpeg|webm|ogg|mov)$/i)) mediaLabel = "Video";
      else if (type.toLowerCase().includes("voice") || type.toLowerCase().includes("audio") || url.match(/\.(mp3|wav|ogg|m4a|aac)$/i))
        mediaLabel = "Voice Message";
      else mediaLabel = "Documents";
    }

    if (mediaLabel) {
      return text ? `${mediaLabel}, ${text}` : mediaLabel;
    }
    return text || "Attachments";
  };

  const getMessageSenderName = (msg: any) => {
    if (!msg) return t("app.unknown");
    if (msg.senderId === currentUserId || msg.id_sender === currentUserId || msg.sender?.id === currentUserId) {
      return t("app.you");
    }
    return (
      msg.sender?.displayName ||
      msg.sender?.name ||
      msg.senderName ||
      msg.displayName ||
      msg.name ||
      t("app.unknown")
    );
  };

  const canRequestSmartReply =
    Boolean(selectedConversationId) &&
    !draftMessage.trim() &&
    !isTyping &&
    !isLastMessageFromCurrentUser &&
    !editingMessage &&
    !replyingMessage &&
    !forwardingMessage &&
    !disabledReason;

  const insertBotMention = () => {
    setDraftMessage((prev: string) => {
      const lastAtIndex = prev.lastIndexOf("@");
      if (lastAtIndex === -1) {
        return `${prev ? `${prev.trimEnd()} ` : ""}@bot `;
      }

      const beforeAt = prev.slice(0, lastAtIndex);
      const afterAt = prev.slice(lastAtIndex + 1);
      const afterTokenEnd = afterAt.search(/\s/);
      const rest = afterTokenEnd === -1 ? "" : afterAt.slice(afterTokenEnd);
      return `${beforeAt}@bot ${rest.trimStart()}`;
    });
    setIsBotMentionOpen(false);
  };
  const hasBotMentionInDraft = /@bot\b/i.test(draftMessage);

  useEffect(() => {
    if (!canRequestSmartReply) {
      setIsSmartReplyOpen(false);
    }
  }, [canRequestSmartReply]);

  useEffect(() => {
    const root = inputRootRef.current;
    if (!root || !onInputHeightChange) return;

    const reportHeight = () => {
      onInputHeightChange(Math.ceil(root.getBoundingClientRect().height));
    };

    reportHeight();
    const observer = new ResizeObserver(reportHeight);
    observer.observe(root);

    return () => observer.disconnect();
  }, [onInputHeightChange]);

  return (
    <div
      ref={inputRootRef}
      data-chat-input-root
      className={`absolute left-0 right-0 bottom-0 px-4 pb-3 lg:px-5 bg-transparent transition-[border-color] duration-200 ${isScrolledUp
          ? "border-t border-gray-300/45 bg-white/20 pt-3 backdrop-blur-[1px] dark:border-slate-600/45 dark:bg-slate-950/20"
          : "border-t border-transparent pt-0"
        }`}
      onPointerDown={onChatInteractionRead}
      onFocus={onChatInteractionRead}
    >
      {isScrolledUp && (
        <button
          type="button"
          onClick={onScrollToBottom}
          className="scroll-to-bottom-button absolute bottom-[70px] z-[70] flex h-11 w-11 items-center justify-center rounded-full border border-white/75 bg-white/95 text-gray-500 shadow-lg transition hover:bg-white hover:text-[#2ea6f3] active:scale-95 lg:bottom-[74px] lg:h-12 lg:w-12 dark:border-slate-700/70 dark:bg-slate-800/95 dark:text-slate-200 dark:hover:text-blue-300"
          style={{ right: "max(1rem, calc((100% - 56rem) / 2))" }}
          title="Scroll to bottom"
          aria-label="Scroll to bottom"
        >
          <FiChevronDown className="text-[28px]" strokeWidth={2.2} />
        </button>
      )}

      {forwardingMessage && !editingMessage && !replyingMessage && (
        <div className="relative z-40 mx-auto mb-2 flex max-w-4xl items-center overflow-hidden rounded-[22px] border border-white/70 bg-white/55 py-2 pl-4 pr-12 shadow-sm backdrop-blur-sm dark:border-slate-700/70 dark:bg-slate-900/35">
          <div className="absolute left-2 top-2 bottom-2 w-[3px] rounded-full bg-[#2ea6f3]" />
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 pl-2">
            <span className="flex items-center gap-1.5 text-[13px] font-semibold leading-none text-[#2ea6f3]">
              <FiCornerUpRight className="text-[14px]" strokeWidth={2.5} />
              <span className="truncate">{t("chat.forwardMessage")}</span>
            </span>
            <p className="flex items-center gap-1 truncate text-[13px] leading-tight text-gray-500/90 dark:text-slate-400">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {forwardingMessage?.senderId === currentUserId ? t("app.you") : forwardingMessage?.sender?.name || t("chat.someone")}
                :
              </span>
              {getPreviewText(forwardingMessage)}
            </p>
          </div>
          <button
            onClick={() => {
              if (forwardingMessage && onClearForwarding) {
                onClearForwarding();
              }
            }}
            className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-white/70 hover:text-[#2ea6f3] dark:hover:bg-slate-800"
            title={t("app.cancel")}
          >
            <FiX className="text-current" strokeWidth={1} style={{ fontSize: "21px" }} />
          </button>
        </div>
      )}

      {/* Tích hợp AI Smart Reply ở đây */}
      <AiSmartReply
        conversationId={selectedConversationId}
        triggerKey={manualSmartReplyKey || smartReplyTriggerKey}
        userId={currentUserId}
        onSelectReply={(text) => {
          setDraftMessage(text);
          setIsSmartReplyOpen(false);
        }}
        onClose={() => setIsSmartReplyOpen(false)}
        shouldFetch={isSmartReplyOpen && canRequestSmartReply}
      />

      <div className={`relative mx-auto flex max-w-4xl gap-2 ${(editingMessage || replyingMessage) ? "items-end" : "items-center"}`}>
        {isRecordingAudio ? (
          <div className="relative flex-1 h-11 lg:h-12 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-between px-4 border border-red-500/20 shadow-lg">
            <div className="flex items-center gap-3 text-red-500">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></div>
              <span className="font-semibold text-[15px]">{formatRecordingTime(recordingTime)}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => stopVoiceRecording(true)}
                className="h-8 w-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-white/50 hover:text-red-500 dark:hover:bg-slate-700/50 transition-colors"
                title="Hủy ghi âm"
              >
                <FiTrash2 className="text-xl" />
              </button>
              <button
                onClick={() => stopVoiceRecording(false)}
                className="h-8 w-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
                title="Gửi voice"
              >
                <FiSend className="text-lg" />
              </button>
            </div>
          </div>
        ) : (
          <div
            ref={attachMenuRef}
            className={`relative flex-1 h-auto bg-white/95 dark:bg-slate-800/95 shadow-lg border outline outline-2 outline-transparent transition-all ${(editingMessage || replyingMessage)
                ? "min-h-[112px] rounded-[18px] flex flex-col items-stretch overflow-hidden px-3 py-3"
                : "min-h-[44px] lg:min-h-[48px] rounded-[24px] flex items-center"
              } ${disabledReason
                ? disabledTone === "neutral"
                  ? "border-blue-100 dark:border-slate-700"
                  : "border-red-200 dark:border-red-800"
                : isListeningText
                  ? "border-blue-300 dark:border-blue-500/50 shadow-blue-500/10"
                  : "border-white/90 dark:border-slate-700/90"
              }`}
          >
            {disabledReason && (
              <div
                className={`absolute inset-0 z-[80] flex items-center justify-center rounded-full px-5 text-center text-sm font-semibold backdrop-blur-sm ${disabledTone === "neutral"
                    ? "bg-white/95 text-gray-500 dark:bg-slate-800/95 dark:text-slate-300"
                    : "bg-red-50/95 text-red-600 dark:bg-red-950/90 dark:text-red-200"
                  }`}
              >
                <FiLock className="mr-2 shrink-0 text-[16px]" />
                <span className="truncate">{disabledReason}</span>
              </div>
            )}

            {(editingMessage || replyingMessage) && (
              <div className="flex items-center gap-3 pb-2">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center ${editingMessage ? "text-[#df5d7d]" : "text-[#2ea6f3]"}`}>
                  {editingMessage ? <FiEdit2 className="text-[25px]" strokeWidth={1.8} /> : <FiCornerUpLeft className="text-[25px]" strokeWidth={1.8} />}
                </div>
                <div className={`min-w-0 flex-1 rounded-[5px] border-l-[4px] px-3 py-1.5 ${editingMessage ? "border-[#df5d7d] bg-[#fae9ed] dark:bg-rose-950/35" : "border-[#2ea6f3] bg-[#eef6fc] dark:bg-blue-950/35"}`}>
                  <div className={`truncate text-[13px] font-semibold leading-tight ${editingMessage ? "text-[#df5d7d]" : "text-[#2ea6f3]"}`}>
                    {editingMessage
                      ? getMessageSenderName(editingMessage)
                      : replyingMessage?.senderId === currentUserId ? t("app.you") : fetchedReplyingSender?.displayName || fetchedReplyingSender?.fullName || fetchedReplyingSender?.lastName || replyingMessage?.sender?.name || replyingMessage?.senderName || replyingMessage?.sender?.displayName || t("app.unknown")}
                  </div>
                  <div className="truncate text-[14px] leading-tight text-gray-900 dark:text-slate-100">
                    {getPreviewText(editingMessage || replyingMessage)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (editingMessage) {
                      setEditingMessage(null);
                      setDraftMessage("");
                    }
                    if (replyingMessage) {
                      setReplyingMessage(null);
                    }
                  }}
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${editingMessage ? "text-[#df5d7d] hover:bg-rose-50 dark:hover:bg-rose-950/40" : "text-[#2ea6f3] hover:bg-blue-50 dark:hover:bg-blue-950/40"}`}
                  title={t("app.cancel")}
                >
                  <FiX className="text-[24px]" strokeWidth={1.6} />
                </button>
              </div>
            )}
            <div
              className={`absolute right-0 bottom-14 w-[260px] max-w-[78vw] rounded-2xl bg-[#edf4f1] dark:bg-slate-800 shadow-xl p-2 border border-white/70 dark:border-slate-700 z-50 origin-bottom-right will-change-transform transition-all duration-200 ease-out ${isAttachMenuOpen ? "opacity-100 scale-100 translate-y-0 pointer-events-auto" : "opacity-0 scale-95 translate-y-1 pointer-events-none"}`}
              aria-hidden={!isAttachMenuOpen}
            >
              {attachActions.map((action) => {
                const ActionIcon = action.icon;
                return (
                  <button
                    key={action.id}
                    onClick={() => {
                      if (disabledReason) return;
                      setIsAttachMenuOpen(false);
                      if (action.onClick) action.onClick();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-[14px] leading-none text-gray-900 dark:text-gray-100 hover:bg-white/75 dark:hover:bg-slate-700/80 transition"
                  >
                    <ActionIcon className="text-[18px] shrink-0" />
                    <span className="font-semibold tracking-tight">{action.label}</span>
                  </button>
                );
              })}
            </div>

            <div
              ref={emojiMenuRef}
              className={`absolute left-0 bottom-14 z-50 origin-bottom-left will-change-transform transition-all duration-200 ease-out ${isEmojiPickerOpen ? "opacity-100 scale-100 translate-y-0 pointer-events-auto" : "opacity-0 scale-95 translate-y-1 pointer-events-none"}`}
              aria-hidden={!isEmojiPickerOpen}
            >
              <EmojiPicker
                onEmojiClick={(emojiData) => setDraftMessage((prev) => `${prev}${emojiData.emoji}`)}
                theme={Theme.AUTO}
                width={350}
                height={400}
              />
            </div>

            <button
              onClick={() => {
                if (disabledReason) return;
                setIsEmojiPickerOpen((prev) => !prev);
                setIsAttachMenuOpen(false);
                setIsMoreMenuOpen(false);
              }}
              className={`absolute h-8 w-8 lg:h-9 lg:w-9 inline-flex items-center justify-center rounded-full text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition ${(editingMessage || replyingMessage) ? "bottom-2.5 left-3" : "left-2 top-1/2 -translate-y-1/2"
                }`}
              title={t("chat.openEmoji")}
            >
              <FiSmile className="text-[20px] lg:text-[22px]" />
            </button>

            <TextareaAutosize
              minRows={1}
              maxRows={5}
              value={draftMessage}
              onChange={(e) => {
                handleInputChange(e);
                const value = e.target.value;
                const lastAtIndex = value.lastIndexOf("@");
                const mentionQuery = lastAtIndex >= 0 ? value.slice(lastAtIndex + 1) : "";
                const shouldShow =
                  lastAtIndex >= 0 &&
                  !/\s/.test(mentionQuery) &&
                  "bot".startsWith(mentionQuery.toLowerCase());
                setIsBotMentionOpen(Boolean(shouldShow));
              }}
              onKeyDown={(e) => {
                if (isBotMentionOpen && (e.key === "Tab" || e.key === "Enter")) {
                  e.preventDefault();
                  insertBotMention();
                  return;
                }
                if (e.key === "Escape" && isBotMentionOpen) {
                  e.preventDefault();
                  setIsBotMentionOpen(false);
                  return;
                }
                if (e.key === "Enter" && !e.shiftKey && !disabledReason) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={Boolean(disabledReason)}
              placeholder={disabledReason || t("chat.messagePlaceholder")}
              className={`w-full bg-transparent text-[14px] lg:text-[15px] placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none disabled:cursor-not-allowed resize-none pl-11 pr-[88px] ${hasBotMentionInDraft
                  ? "text-transparent caret-gray-700 dark:caret-gray-100"
                  : "text-gray-700 dark:text-gray-100"
                } ${(editingMessage || replyingMessage) ? "py-[10px]" : "py-[12px] lg:py-[14px]"
                }`}
            />

            {isBotMentionOpen && !disabledReason && (
              <div className="absolute bottom-[calc(100%+8px)] left-10 z-[90] w-[220px] rounded-xl border border-white/70 bg-white/95 p-1.5 shadow-xl backdrop-blur-sm dark:border-slate-700/70 dark:bg-slate-800/95">
                <button
                  type="button"
                  onClick={insertBotMention}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-gray-800 transition hover:bg-blue-50 hover:text-[#2ea6f3] dark:text-slate-100 dark:hover:bg-slate-700"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-[#2ea6f3] dark:bg-blue-950/50">
                    @
                  </span>
                  <span>@bot</span>
                </button>
              </div>
            )}

            {hasBotMentionInDraft && (
              <div
                aria-hidden="true"
                className={`pointer-events-none absolute inset-0 whitespace-pre-wrap break-words text-[14px] leading-[1.32] text-gray-700 dark:text-gray-100 lg:text-[15px] ${(editingMessage || replyingMessage) ? "py-[10px] pl-11 pr-[88px]" : "py-[12px] pl-11 pr-[88px] lg:py-[14px]"
                  }`}
              >
                {renderDraftWithBotMention(draftMessage)}
              </div>
            )}

            <div
              className={`absolute right-9 flex items-center ${(editingMessage || replyingMessage) ? "bottom-2 h-10" : "bottom-0 top-0"}`}
            >
              <AiToneAdjustMenu currentText={draftMessage} onApplyTone={(newText) => setDraftMessage(newText)} />
            </div>

            <button
              onClick={() => {
                if (disabledReason) return;
                setIsAttachMenuOpen((prev) => !prev);
                setIsMoreMenuOpen(false);
                setIsEmojiPickerOpen(false);
              }}
              className={`absolute right-1.5 flex w-8 lg:w-9 items-center justify-center text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white transition ${(editingMessage || replyingMessage) ? "bottom-2 h-10" : "bottom-0 top-0 h-full"
                }`}
              title={t("chat.openAttachments")}
            >
              <FiPaperclip className="text-[20px] lg:text-[22px]" />
            </button>
          </div>
        )}

        {!isRecordingAudio && (
          <div className="relative flex items-center shrink-0">
            {canRequestSmartReply && (
              <button
                type="button"
                onClick={() => {
                  setIsSmartReplyOpen((prev) => !prev);
                  setManualSmartReplyKey(`manual-${Date.now()}`);
                  setIsVoiceMenuOpen(false);
                }}
                className={`absolute bottom-[calc(100%+12px)] right-0 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-white/70 shadow-md backdrop-blur-sm transition lg:h-12 lg:w-12 ${isSmartReplyOpen
                    ? "bg-blue-50 text-blue-600"
                    : "animate-pulse bg-white/80 text-gray-600 ring-2 ring-blue-400/25 hover:bg-white hover:text-blue-600"
                  } dark:border-slate-700/70 dark:bg-slate-800/85 dark:text-slate-200 dark:hover:text-blue-300`}
                title={t("chat.aiSmartReply")}
              >
                <FiZap className="text-[20px] lg:text-[22px]" />
              </button>
            )}

            {isVoiceMenuOpen && (
              <div
                ref={voiceMenuRef}
                className="absolute right-0 bottom-[calc(100%+12px)] w-[220px] rounded-2xl bg-[#edf4f1] dark:bg-slate-800 shadow-xl p-2 border border-black/5 dark:border-white/10 z-[100] origin-bottom-right animate-in fade-in zoom-in-95 duration-200"
              >
                <button
                  onClick={() => {
                    if (disabledReason) return;
                    toggleVoiceToText();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-white/50 dark:hover:bg-slate-700/80 transition-colors"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isListeningText ? "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400 animate-pulse" : "bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-300"}`}
                  >
                    <FiType className="text-[15px]" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col">
                    <span className="text-[14px] font-semibold text-gray-800 dark:text-gray-100 leading-tight">
                      {isListeningText ? t("chat.stopSpeechToText") : t("chat.speechToText")}
                    </span>
                    <span className="text-[12px] text-gray-500 truncate">{t("chat.textWillBeTyped")}</span>
                  </div>
                </button>
                <button
                  onClick={() => {
                    if (disabledReason) return;
                    startVoiceRecording();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-white/50 dark:hover:bg-slate-700/80 transition-colors mt-1"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center shrink-0 text-gray-600 dark:text-gray-300">
                    <FiMic className="text-[16px]" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col">
                    <span className="text-[14px] font-semibold text-gray-800 dark:text-gray-100 leading-tight">
                      {t("chat.recordAudio")}
                    </span>
                    <span className="text-[12px] text-gray-500 truncate">{t("chat.sendAudioFile")}</span>
                  </div>
                </button>
              </div>
            )}

            <button
              className={`h-11 w-11 lg:h-12 lg:w-12 rounded-full inline-flex items-center justify-center shadow-md transition cursor-pointer z-50 relative ${disabledReason
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : isListeningText
                    ? "bg-blue-100 text-blue-600 animate-pulse hover:bg-blue-200"
                    : "bg-[#2ea6f3] text-white hover:bg-[#1f97e5]"
                }`}
              onClick={() => {
                if (disabledReason) return;
                if (editingMessage || draftMessage.trim() || forwardingMessage || replyingMessage) {
                  handleSendMessage();
                } else if (isListeningText) {
                  toggleVoiceToText();
                } else {
                  setIsVoiceMenuOpen(!isVoiceMenuOpen);
                  setIsAttachMenuOpen(false);
                  setIsEmojiPickerOpen(false);
                }
              }}
            >
              {editingMessage || draftMessage.trim() || forwardingMessage || replyingMessage ? (
                <FiSend className="text-[20px] lg:text-[22px]" />
              ) : (
                <FiMic className="text-[20px] lg:text-[22px]" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
