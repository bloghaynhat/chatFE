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
} from "react-icons/fi";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { AiSmartReply } from "../AiSmartReply";
import { AiToneAdjustMenu } from "../AiToneAdjustMenu";
import TextareaAutosize from "react-textarea-autosize";

// frequentEmojis removed

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
}) => {
  const [fetchedReplyingSender, setFetchedReplyingSender] = useState<any>(null);
  const [isSmartReplyOpen, setIsSmartReplyOpen] = useState(false);
  const [manualSmartReplyKey, setManualSmartReplyKey] = useState("");

  useEffect(() => {
    if (replyingMessage) {
      if (
        !replyingMessage.sender?.name &&
        !replyingMessage.senderName &&
        !replyingMessage.sender?.displayName
      ) {
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

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Trình duyệt của bạn không hỗ trợ nhận diện giọng nói!");
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
        setDraftMessage(
          (prev: string) => prev + (prev ? " " : "") + finalTranscript,
        );
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
          const file = new File(
            [audioBlob],
            `voice_message_${Date.now()}.mp3`,
            { type: "audio/mpeg" },
          );
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
      alert("Không thể truy cập Microphone");
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

    const isImage =
      msgType.includes("image") || msg.imageUrl || msg.type === "IMAGE";
    const isVideo =
      msgType.includes("video") || msg.videoUrl || msg.type === "VIDEO";
    const isAudio = msgType.includes("audio") || msg.type === "AUDIO";
    const isDoc =
      msgType === "document" || msgType === "file" || msg.type === "DOCUMENT";

    const files = msg.files || msg.media || msg.mediaItems || [];
    let mediaLabel = "";

    if (isImage) mediaLabel = "Photos";
    else if (isVideo) mediaLabel = "Video";
    else if (isAudio) mediaLabel = "Voice Message";
    else if (isDoc) mediaLabel = "Documents";
    else if (files && files.length > 0) {
      const firstFile = files[0];
      const type =
        typeof firstFile === "string"
          ? "image"
          : firstFile.type || firstFile.mimetype || "";
      const url =
        typeof firstFile === "string" ? firstFile : firstFile.url || "";
      if (
        type.toLowerCase().includes("image") ||
        url.match(/\.(jpeg|jpg|gif|png|webp|heic)$/i)
      )
        mediaLabel = "Photos";
      else if (
        type.toLowerCase().includes("video") ||
        url.match(/\.(mp4|mpeg|webm|ogg|mov)$/i)
      )
        mediaLabel = "Video";
      else if (
        type.toLowerCase().includes("audio") ||
        url.match(/\.(mp3|wav|ogg|m4a|aac)$/i)
      )
        mediaLabel = "Voice Message";
      else mediaLabel = "Documents";
    }

    if (mediaLabel) {
      return text ? `${mediaLabel}, ${text}` : mediaLabel;
    }
    return text || "Attachments";
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

  useEffect(() => {
    if (!canRequestSmartReply) {
      setIsSmartReplyOpen(false);
    }
  }, [canRequestSmartReply]);

  return (
    <div data-chat-input-root className="absolute left-0 right-0 bottom-3 px-4 lg:px-5 bg-transparent">
      {(forwardingMessage || replyingMessage) && !editingMessage && (
        <div className="relative z-40 mx-auto mb-2 flex max-w-4xl items-center overflow-hidden rounded-[22px] border border-white/70 bg-white/55 py-2 pl-4 pr-12 shadow-sm backdrop-blur-sm dark:border-slate-700/70 dark:bg-slate-900/35">
          <div className="absolute left-2 top-2 bottom-2 w-[3px] rounded-full bg-[#2ea6f3]" />
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 pl-2">
            <span className="flex items-center gap-1.5 text-[13px] font-semibold leading-none text-[#2ea6f3]">
              {editingMessage ? (
                <FiEdit2 className="text-[15px]" strokeWidth={2} />
              ) : replyingMessage ? (
                <FiCornerUpLeft className="text-[15px]" strokeWidth={2.5} />
              ) : (
                <FiCornerUpRight className="text-[14px]" strokeWidth={2.5} />
              )}
              <span className="truncate">
                {editingMessage
                  ? "Editing"
                  : replyingMessage
                    ? `Reply to ${replyingMessage?.senderId === currentUserId ? "You" : fetchedReplyingSender?.displayName || fetchedReplyingSender?.fullName || fetchedReplyingSender?.lastName || replyingMessage?.sender?.name || replyingMessage?.senderName || replyingMessage?.sender?.displayName || "Unknown"}`
                    : "Forward Message"}
              </span>
            </span>
            <p className="flex items-center gap-1 truncate text-[13px] leading-tight text-gray-500/90 dark:text-slate-400">
              {editingMessage || replyingMessage ? null : (
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {forwardingMessage?.senderId === currentUserId
                    ? "You"
                    : forwardingMessage?.sender?.name || "Someone"}
                  :
                </span>
              )}
              {editingMessage
                ? getPreviewText(editingMessage)
                : replyingMessage
                  ? getPreviewText(replyingMessage)
                  : forwardingMessage
                    ? getPreviewText(forwardingMessage)
                    : ""}
            </p>
          </div>
          <button
            onClick={() => {
              if (editingMessage) {
                setEditingMessage(null);
                setDraftMessage("");
              }
              if (replyingMessage) {
                setReplyingMessage(null);
              }
              if (forwardingMessage && onClearForwarding) {
                onClearForwarding();
              }
            }}
            className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-white/70 hover:text-[#2ea6f3] dark:hover:bg-slate-800"
            title="Cancel"
          >
            <FiX
              className="text-current"
              strokeWidth={1}
              style={{ fontSize: "21px" }}
            />
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

      <div
        className={`relative mx-auto flex max-w-4xl gap-2 ${editingMessage ? "items-end" : "items-center"
          }`}
      >
        {isRecordingAudio ? (
          <div className="relative flex-1 h-11 lg:h-12 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-between px-4 border border-red-500/20 shadow-lg">
            <div className="flex items-center gap-3 text-red-500">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></div>
              <span className="font-semibold text-[15px]">
                {formatRecordingTime(recordingTime)}
              </span>
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
            className={`relative flex-1 h-auto bg-white/95 dark:bg-slate-800/95 shadow-lg border outline outline-2 outline-transparent transition-all ${editingMessage
              ? "min-h-[106px] rounded-[16px] flex flex-col items-stretch py-2"
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

            {editingMessage && (
              <>
                <div className="absolute left-4 top-5 flex h-6 w-6 items-center justify-center text-[#ef5b7d]">
                  <FiEdit2 className="text-[20px]" strokeWidth={2} />
                </div>
                <div className="mx-12 rounded-[5px] bg-[#fae9ed] px-3 py-1.5 dark:bg-rose-950/35">
                  <div className="text-[13px] font-semibold leading-tight text-[#ef5b7d]">
                    Edit Message
                  </div>
                  <div className="truncate text-[13px] leading-tight text-gray-700 dark:text-slate-200">
                    {getPreviewText(editingMessage)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingMessage(null);
                    setDraftMessage("");
                  }}
                  className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full text-[#ef5b7d] transition-colors hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  title="Cancel editing"
                >
                  <FiX className="text-[24px]" strokeWidth={1.6} />
                </button>
              </>
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
                    <span className="font-semibold tracking-tight">
                      {action.label}
                    </span>
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
                onEmojiClick={(emojiData) =>
                  setDraftMessage((prev) => `${prev}${emojiData.emoji}`)
                }
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
              className={`absolute left-2 h-8 w-8 lg:h-9 lg:w-9 inline-flex items-center justify-center rounded-full text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition ${editingMessage
                ? "bottom-2"
                : "top-1/2 -translate-y-1/2"
                }`}
              title="Open emoji picker"
            >
              <FiSmile className="text-[20px] lg:text-[22px]" />
            </button>

            <TextareaAutosize
              minRows={1}
              maxRows={5}
              value={draftMessage}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !disabledReason) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={Boolean(disabledReason)}
              placeholder={disabledReason || "Message"}
              className={`w-full bg-transparent text-[14px] lg:text-[15px] text-gray-700 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none disabled:cursor-not-allowed resize-none pl-11 pr-[88px] ${editingMessage ? "pt-2 pb-1.5" : "py-[12px] lg:py-[14px]"
                }`}
            />

            <div
              className={`absolute right-9 flex items-center ${editingMessage ? "bottom-1.5 h-10" : "bottom-0 top-0"
                }`}
            >
              <AiToneAdjustMenu
                currentText={draftMessage}
                onApplyTone={(newText) => setDraftMessage(newText)}
              />
            </div>

            <button
              onClick={() => {
                if (disabledReason) return;
                setIsAttachMenuOpen((prev) => !prev);
                setIsMoreMenuOpen(false);
                setIsEmojiPickerOpen(false);
              }}
              className={`absolute right-1.5 flex w-8 lg:w-9 items-center justify-center text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white transition ${editingMessage ? "bottom-1.5 h-10" : "bottom-0 top-0 h-full"
                }`}
              title="Open attachment actions"
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
                title="Gợi ý trả lời AI"
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
                      {isListeningText ? "Dừng thuyết minh" : "Speech to Text"}
                    </span>
                    <span className="text-[12px] text-gray-500 truncate">
                      Text will be typed automatically
                    </span>
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
                      Record Audio
                    </span>
                    <span className="text-[12px] text-gray-500 truncate">
                      Send as an audio file
                    </span>
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
                if (
                  editingMessage ||
                  draftMessage.trim() ||
                  forwardingMessage ||
                  replyingMessage
                ) {
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
              {editingMessage ||
                draftMessage.trim() ||
                forwardingMessage ||
                replyingMessage ? (
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
