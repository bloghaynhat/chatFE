import { FiPhone, FiPhoneIncoming, FiPhoneMissed, FiVideo } from "react-icons/fi";

type CallStatus = "completed" | "missed" | "rejected" | "cancelled";
type CallType = "audio" | "video";

interface ParsedCallMessage {
  callType: CallType;
  status: CallStatus;
  durationSeconds?: number;
}

const formatDuration = (seconds?: number) => {
  if (seconds === undefined || seconds === null || Number.isNaN(seconds)) return "";
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60)
    .toString()
    .padStart(2, "0");
  const rest = (safeSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${rest}`;
};

const parseDurationText = (value?: string) => {
  if (!value) return undefined;
  const match = value.match(/(\d{1,2}):(\d{2})/);
  if (!match) return undefined;
  return Number(match[1]) * 60 + Number(match[2]);
};

export const parseCallMessage = (message: any, text?: string): ParsedCallMessage | null => {
  const call = message?.call || message?.callMetadata || message?.metadata?.call;
  if (message?.type === "call" || message?.type === "CALL" || call) {
    return {
      callType: call?.callType === "video" ? "video" : "audio",
      status: call?.status || "completed",
      durationSeconds: call?.durationSeconds,
    };
  }

  const normalized = (text || "").trim().toLowerCase();
  if (!normalized) return null;

  const looksLikeCall =
    normalized.includes("cuộc gọi") ||
    normalized.includes("cuoc goi") ||
    normalized.includes("voice call") ||
    normalized.includes("video call");
  if (!looksLikeCall) return null;

  const callType = normalized.includes("video") ? "video" : "audio";
  const status: CallStatus = normalized.includes("nhỡ") || normalized.includes("nho") || normalized.includes("missed")
    ? "missed"
    : normalized.includes("từ chối") || normalized.includes("tu choi") || normalized.includes("rejected")
      ? "rejected"
      : normalized.includes("hủy") || normalized.includes("huy") || normalized.includes("cancel")
        ? "cancelled"
        : "completed";

  return {
    callType,
    status,
    durationSeconds: parseDurationText(normalized),
  };
};

export function CallMessageBubble({ message, text, mine }: { message: any; text?: string; mine: boolean }) {
  const call = parseCallMessage(message, text);
  if (!call) return null;

  const isVideo = call.callType === "video";
  const isCompleted = call.status === "completed";
  const isMissed = call.status === "missed";
  const duration = formatDuration(call.durationSeconds);

  const Icon = isMissed ? FiPhoneMissed : isVideo ? FiVideo : isCompleted ? FiPhoneIncoming : FiPhone;
  const title = isVideo ? "Video call" : "Voice call";
  const subtitle = isCompleted
    ? duration
      ? `Duration ${duration}`
      : "Completed"
    : call.status === "missed"
      ? "Missed"
      : call.status === "rejected"
        ? "Declined"
        : "Cancelled";

  return (
    <div className="px-3 pb-4 pt-2">
      <div className="flex min-w-[220px] items-center gap-3 pr-12">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            isMissed || call.status === "rejected"
              ? "bg-rose-500 text-white"
              : isVideo
                ? "bg-[#229ed9] text-white"
                : "bg-emerald-500 text-white"
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14.5px] font-semibold leading-5">{title}</div>
          <div
            className={`truncate text-[12.5px] font-medium ${
              isMissed || call.status === "rejected"
                ? "text-rose-600 dark:text-rose-200"
                : "text-slate-500 dark:text-slate-300"
            }`}
          >
            {subtitle}
          </div>
        </div>
      </div>
    </div>
  );
}
