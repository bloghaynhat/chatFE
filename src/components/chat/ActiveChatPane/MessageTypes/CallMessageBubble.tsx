import { FiPhone, FiPhoneIncoming, FiPhoneMissed, FiVideo } from "react-icons/fi";
import { useLanguage } from "../../../../context";

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

const normalizeCallStatus = (status?: string): CallStatus => {
  if (status === "missed" || status === "rejected" || status === "cancelled") return status;
  return "completed";
};

export const parseCallMessage = (message: any, _text?: string): ParsedCallMessage | null => {
  const call = message?.call || message?.callMetadata || message?.metadata?.call;
  const messageType = String(message?.type || message?.messageType || "").toLowerCase();
  if (messageType !== "call" && !call) return null;

  return {
    callType: call?.callType === "video" ? "video" : "audio",
    status: normalizeCallStatus(call?.status),
    durationSeconds: call?.durationSeconds,
  };
};

export function CallMessageBubble({ message, text, mine }: { message: any; text?: string; mine: boolean }) {
  const { t } = useLanguage();
  const call = parseCallMessage(message, text);
  if (!call) return null;

  const isVideo = call.callType === "video";
  const isCompleted = call.status === "completed";
  const isMissed = call.status === "missed";
  const duration = formatDuration(call.durationSeconds);

  const Icon = isMissed ? FiPhoneMissed : isVideo ? FiVideo : isCompleted ? FiPhoneIncoming : FiPhone;
  const title = isVideo ? t("call.video") : t("call.voice");
  const subtitle = isCompleted
    ? duration
      ? `${t("chat.duration")} ${duration}`
      : t("chat.completed")
    : call.status === "missed"
      ? t("chat.missed")
      : call.status === "rejected"
        ? t("chat.declined")
        : t("chat.cancelled");

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
