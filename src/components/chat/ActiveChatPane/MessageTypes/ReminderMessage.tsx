import { FiBell, FiClock, FiRepeat } from "react-icons/fi";
import { getMessageText } from "../../../../utils/chatUtils";

const getReminderDateParts = (value?: string) => {
  if (!value) return { month: "--", day: "--", time: "" };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { month: "--", day: "--", time: "" };

  return {
    month: date.toLocaleString(undefined, { month: "short" }),
    day: date.toLocaleString(undefined, { day: "2-digit" }),
    time: date.toLocaleString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
};

const getRelativeTime = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = date.getTime() - Date.now();
  const absMinutes = Math.abs(Math.round(diffMs / 60000));
  if (absMinutes < 1) return diffMs >= 0 ? "Due now" : "Just now";
  if (absMinutes < 60) return diffMs >= 0 ? `In ${absMinutes}m` : `${absMinutes}m ago`;
  const absHours = Math.round(absMinutes / 60);
  if (absHours < 24) return diffMs >= 0 ? `In ${absHours}h` : `${absHours}h ago`;
  const absDays = Math.round(absHours / 24);
  return diffMs >= 0 ? `In ${absDays}d` : `${absDays}d ago`;
};

export const extractReminderFromMessage = (message: any, text?: string) => {
  const directReminder =
    message?.reminder ||
    message?.metadata?.reminder ||
    message?.payload?.reminder ||
    message?.data?.reminder ||
    null;

  if (directReminder) return directReminder;

  const rawText = typeof text === "string" ? text : getMessageText(message);
  const trimmedText = typeof rawText === "string" ? rawText.trim() : "";
  const normalizedText = trimmedText.toLowerCase();
  const isReminderType =
    message?.type === "reminder" ||
    message?.type === "REMINDER" ||
    message?.metadata?.type === "reminder";

  if (
    !isReminderType &&
    !normalizedText.startsWith("nhắc hẹn:") &&
    !normalizedText.startsWith("nhac hen:")
  ) {
    return null;
  }

  return {
    title:
      trimmedText
        .replace(/^nhắc hẹn:\s*/i, "")
        .replace(/^nhac hen:\s*/i, "")
        .trim() || "Reminder",
    description: message?.metadata?.description || message?.description || "",
    remindAt:
      message?.metadata?.remindAt ||
      message?.remindAt ||
      message?.scheduledAt ||
      message?.createdAt,
    repeatRule: message?.metadata?.repeatRule || message?.repeatRule || "none",
    notifyBeforeMinutes:
      message?.metadata?.notifyBeforeMinutes || message?.notifyBeforeMinutes,
    status: message?.metadata?.status || message?.status || "active",
  };
};

export const ReminderMessage = ({ message, text, mine }: any) => {
  const reminder = extractReminderFromMessage(message, text);
  if (!reminder) return null;

  const status = String(reminder.status || "active").toLowerCase();
  const relativeTime = getRelativeTime(reminder.remindAt);
  const dateParts = getReminderDateParts(reminder.remindAt);
  const isCancelled = status === "cancelled";
  const isDone = status === "done";

  return (
    <div className="min-w-[300px] max-w-[420px] px-2.5 pt-2.5 pb-1">
      <div
        className={`overflow-hidden rounded-xl border bg-white shadow-sm dark:bg-slate-900 ${
          isCancelled
            ? "border-slate-200 opacity-70 dark:border-slate-700"
            : isDone
              ? "border-emerald-200 dark:border-emerald-800"
              : mine
                ? "border-emerald-200 dark:border-emerald-700"
                : "border-amber-200 dark:border-amber-800"
        }`}
      >
        <div className="flex">
          <div className={`w-1.5 shrink-0 ${isDone ? "bg-emerald-400" : "bg-amber-400"}`} />
          <div className="flex min-w-0 flex-1 items-start gap-3 px-3 py-3">
            <div className="mt-0.5 w-12 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <div className={`px-1 py-1 text-[10px] font-bold uppercase text-white ${isDone ? "bg-emerald-500" : "bg-amber-500"}`}>
                {dateParts.month}
              </div>
              <div className="px-1 py-1.5 text-lg font-bold leading-none text-gray-900 dark:text-white">
                {dateParts.day}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                <FiBell className={isDone ? "text-emerald-500" : "text-amber-500"} />
                <span>Group reminder</span>
                {isCancelled && <span className="text-slate-400">cancelled</span>}
                {isDone && <span className="text-emerald-500">done</span>}
              </div>

              <h3
                className={`mt-1 break-words text-[15px] font-semibold leading-snug text-gray-950 dark:text-white ${
                  isDone ? "line-through opacity-75" : ""
                }`}
              >
                {reminder.title}
              </h3>

              {reminder.description && (
                <p className="mt-1 line-clamp-3 whitespace-pre-wrap break-words text-sm leading-5 text-gray-600 dark:text-gray-300">
                  {reminder.description}
                </p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                {dateParts.time && (
                  <span className="inline-flex items-center gap-1 text-gray-700 dark:text-gray-200">
                    <FiClock />
                    {dateParts.time}
                  </span>
                )}
                {relativeTime && <span>{relativeTime}</span>}
                {reminder.repeatRule && reminder.repeatRule !== "none" && (
                  <span className="inline-flex items-center gap-1">
                    <FiRepeat />
                    {reminder.repeatRule}
                  </span>
                )}
                {Number(reminder.notifyBeforeMinutes) > 0 && (
                  <span>{reminder.notifyBeforeMinutes}m before</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
