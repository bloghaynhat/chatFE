import { useEffect, useState, useRef } from "react";
import userService from "../../../services/userService";
import {
  FiMessageCircle,
  FiClock,
  FiSmile,
  FiPaperclip,
  FiMic,
  FiSend,
  FiHeart,
  FiThumbsUp,
  FiThumbsDown,
  FiZap,
  FiFilm,
  FiDelete,
  FiCornerUpRight,
  FiCornerUpLeft,
  FiEdit2,
  FiX,
  FiSearch,
  FiType,
  FiTrash2,
} from "react-icons/fi";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { AiSmartReply } from "../AiSmartReply";
import { AiToneAdjustMenu } from "../AiToneAdjustMenu";

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
  selectedConversationId,
  smartReplyTriggerKey,
  isTyping,
  isLastMessageFromCurrentUser,
}) => {
  const [fetchedReplyingSender, setFetchedReplyingSender] = useState<any>(null);

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
      alert("Trình duyệt của bạn không hỗ trợ nhận diện giọng nói!");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
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
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mpeg' });
          const file = new File([audioBlob], `voice_message_${Date.now()}.mp3`, { type: 'audio/mpeg' });
          if (handleSendVoice) handleSendVoice(file);
        }
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecordingAudio(true);
      setRecordingTime(0);
      recordIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
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
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const getPreviewText = (msg: any) => {
    if (!msg) return "";
    const text = (msg.text || msg.content || "").trim();
    const msgType = typeof msg.type === 'string' ? msg.type.toLowerCase() : "";
    
    const isImage = msgType.includes("image") || msg.imageUrl || msg.type === 'IMAGE';
    const isVideo = msgType.includes("video") || msg.videoUrl || msg.type === 'VIDEO';
    const isAudio = msgType.includes("audio") || msg.type === 'AUDIO';
    const isDoc = msgType === "document" || msgType === "file" || msg.type === 'DOCUMENT';
    
    const files = msg.files || msg.media || msg.mediaItems || [];
    let mediaLabel = "";
    
    if (isImage) mediaLabel = "Photos";
    else if (isVideo) mediaLabel = "Video";
    else if (isAudio) mediaLabel = "Voice Message";
    else if (isDoc) mediaLabel = "Documents";
    else if (files && files.length > 0) {
      const firstFile = files[0];
      const type = typeof firstFile === 'string' ? "image" : (firstFile.type || firstFile.mimetype || "");
      const url = typeof firstFile === 'string' ? firstFile : (firstFile.url || "");
      if (type.toLowerCase().includes("image") || url.match(/\.(jpeg|jpg|gif|png|webp|heic)$/i)) mediaLabel = "Photos";
      else if (type.toLowerCase().includes("video") || url.match(/\.(mp4|mpeg|webm|ogg|mov)$/i)) mediaLabel = "Video";
      else if (type.toLowerCase().includes("audio") || url.match(/\.(mp3|wav|ogg|m4a|aac)$/i)) mediaLabel = "Voice Message";
      else mediaLabel = "Documents";
    }

    if (mediaLabel) {
      return text ? `${mediaLabel}, ${text}` : mediaLabel;
    }
    return text || "Attachments";
  };

  return (
    <div className="absolute left-0 right-0 bottom-3 px-4 lg:px-5 bg-transparent">
      {(forwardingMessage || editingMessage || replyingMessage) && (
        <div className="max-w-4xl mx-auto mb-2 flex bg-[#edf4f1] dark:bg-slate-800/95 rounded-t-[10px] overflow-hidden relative z-40 p-[8px] pl-[14px] items-center">
          <div className="flex-1 flex flex-col justify-center min-w-0 pr-6 gap-[5px]">
            <span className="text-[14px] font-medium text-[#2ea6f3] flex items-center gap-1.5 leading-none">
              {editingMessage ? (
                <FiEdit2 className="text-[17px]" strokeWidth={2} />
              ) : replyingMessage ? (
                <FiCornerUpLeft className="text-[16px]" strokeWidth={2.5} />
              ) : (
                <FiCornerUpRight className="text-[14px]" strokeWidth={2.5} />
              )}
              <span className="text-[14.5px] tracking-tight">
                {editingMessage
                  ? "Editing"
                  : replyingMessage
                    ? `Reply to ${replyingMessage?.senderId === currentUserId ? "You" : fetchedReplyingSender?.displayName || fetchedReplyingSender?.fullName || fetchedReplyingSender?.lastName || replyingMessage?.sender?.name || replyingMessage?.senderName || replyingMessage?.sender?.displayName || "Unknown"}`
                    : "Forward Message"}
              </span>
            </span>
            <p className="text-[13.5px] text-gray-500/90 dark:text-gray-400 truncate leading-none flex gap-1 items-center pb-0.5">
              {editingMessage || replyingMessage ? null : (
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {forwardingMessage?.senderId === currentUserId ? "You" : forwardingMessage?.sender?.name || "Someone"}
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
            className="absolute right-3 text-gray-400 hover:text-[#2ea6f3] transition-colors p-[8px]"
          >
            <FiX className="text-[#3e3e3e]" strokeWidth={1} style={{ fontSize: "22px" }} />
          </button>
          <div className="absolute left-[3px] top-1/2 -translate-y-1/2 w-[3px] h-[70%] bg-[#2ea6f3] rounded-[5px]"></div>
        </div>
      )}

      {/* Tích hợp AI Smart Reply ở đây */}
      <AiSmartReply 
        conversationId={selectedConversationId}
        triggerKey={smartReplyTriggerKey}
        userId={currentUserId}
        onSelectReply={(text) => {
          setDraftMessage(text);
        }}
        shouldFetch={
          Boolean(selectedConversationId) &&
          !draftMessage.trim() &&
          !isTyping &&
          !isLastMessageFromCurrentUser &&
          !editingMessage &&
          !replyingMessage &&
          !forwardingMessage
        }
      />

      <div
        className={`flex items-center gap-2 max-w-4xl mx-auto ${forwardingMessage || editingMessage || replyingMessage ? "-mt-4 z-40 relative" : ""}`}
      >
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
          className={`relative flex-1 h-11 lg:h-12 rounded-full bg-white/95 dark:bg-slate-800/95 shadow-lg border outline outline-2 outline-transparent transition-all ${isListeningText ? "border-blue-300 dark:border-blue-500/50 shadow-blue-500/10" : "border-white/90 dark:border-slate-700/90"}`}
        >
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
              setIsEmojiPickerOpen((prev) => !prev);
              setIsAttachMenuOpen(false);
              setIsMoreMenuOpen(false);
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 lg:h-9 lg:w-9 inline-flex items-center justify-center rounded-full text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition"
            title="Open emoji picker"
          >
            <FiSmile className="text-[20px] lg:text-[22px]" />
          </button>

          <input
            type="text"
            value={draftMessage}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSendMessage();
            }}
            placeholder="Message"
            className="absolute left-11 right-20 top-1/2 -translate-y-1/2 h-8 bg-transparent text-[14px] lg:text-[15px] text-gray-700 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none"
          />

          <div className="absolute right-9 top-1/2 -translate-y-1/2">
            <AiToneAdjustMenu 
              currentText={draftMessage}
              onApplyTone={(newText) => setDraftMessage(newText)}
            />
          </div>

          <button
            onClick={() => {
              setIsAttachMenuOpen((prev) => !prev);
              setIsMoreMenuOpen(false);
              setIsEmojiPickerOpen(false);
            }}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 lg:h-9 lg:w-9 inline-flex items-center justify-center rounded-full text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition"
            title="Open attachment actions"
          >
            <FiPaperclip className="text-[20px] lg:text-[22px]" />
          </button>
        </div>
        )}

        {!isRecordingAudio && (
          <div className="relative flex items-center shrink-0">
            {isVoiceMenuOpen && (
              <div 
                ref={voiceMenuRef}
                className="absolute right-0 bottom-[calc(100%+12px)] w-[220px] rounded-2xl bg-[#edf4f1] dark:bg-slate-800 shadow-xl p-2 border border-black/5 dark:border-white/10 z-[100] origin-bottom-right animate-in fade-in zoom-in-95 duration-200"
              >
                <button
                  onClick={toggleVoiceToText}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-white/50 dark:hover:bg-slate-700/80 transition-colors"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isListeningText ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400 animate-pulse' : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-300'}`}>
                    <FiType className="text-[15px]" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col">
                    <span className="text-[14px] font-semibold text-gray-800 dark:text-gray-100 leading-tight">
                      {isListeningText ? "Dừng thuyết minh" : "Speech to Text"}
                    </span>
                    <span className="text-[12px] text-gray-500 truncate">Text will be typed automatically</span>
                  </div>
                </button>
                <button
                  onClick={startVoiceRecording}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-white/50 dark:hover:bg-slate-700/80 transition-colors mt-1"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center shrink-0 text-gray-600 dark:text-gray-300">
                    <FiMic className="text-[16px]" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col">
                    <span className="text-[14px] font-semibold text-gray-800 dark:text-gray-100 leading-tight">Record Audio</span>
                    <span className="text-[12px] text-gray-500 truncate">Send as an audio file</span>
                  </div>
                </button>
              </div>
            )}
            
            <button
              className={`h-11 w-11 lg:h-12 lg:w-12 rounded-full inline-flex items-center justify-center shadow-md transition cursor-pointer z-50 relative ${
                isListeningText 
                  ? "bg-blue-100 text-blue-600 animate-pulse hover:bg-blue-200" 
                  : "bg-[#2ea6f3] text-white hover:bg-[#1f97e5]"
              }`}
              onClick={() => {
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
