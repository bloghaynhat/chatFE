import { FiInfo, FiLock } from "react-icons/fi";

interface BlockNoticeProps {
  title: string;
  description: string;
  variant?: "blockedByMe" | "contactUnavailable";
  actionLabel?: string;
  isActionLoading?: boolean;
  onAction?: () => void;
}

export const BlockNotice = ({
  title,
  description,
  variant = "contactUnavailable",
  actionLabel,
  isActionLoading = false,
  onAction,
}: BlockNoticeProps) => {
  const isBlockedByMe = variant === "blockedByMe";
  const tone = isBlockedByMe
    ? {
        wrapper:
          "bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800/30",
        icon: "bg-red-100 text-red-600 dark:bg-red-800/40 dark:text-red-300",
        title: "text-red-700 dark:text-red-300",
        body: "text-red-600/90 dark:text-red-300/90",
        button:
          "bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-800/40 dark:hover:bg-red-800/60 dark:text-red-300",
      }
    : {
        wrapper:
          "bg-amber-50 dark:bg-amber-900/15 border-amber-100 dark:border-amber-800/30",
        icon: "bg-amber-100 text-amber-700 dark:bg-amber-800/30 dark:text-amber-300",
        title: "text-amber-800 dark:text-amber-200",
        body: "text-amber-700/90 dark:text-amber-200/90",
        button:
          "bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-800/30 dark:hover:bg-amber-800/50 dark:text-amber-200",
      };

  const Icon = isBlockedByMe ? FiLock : FiInfo;

  return (
    <div
      className={`mx-4 mb-4 p-4 border rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left transition-all shadow-sm ${tone.wrapper}`}
    >
      <div className="flex items-start gap-3 min-w-0">
        <div
          className={`mt-0.5 h-8 w-8 rounded-full inline-flex items-center justify-center shrink-0 ${tone.icon}`}
        >
          <Icon className="text-lg" />
        </div>
        <div className="min-w-0">
          <p className={`text-[14px] font-semibold ${tone.title}`}>{title}</p>
          <p className={`mt-0.5 text-[13px] leading-5 ${tone.body}`}>
            {description}
          </p>
        </div>
      </div>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          disabled={isActionLoading}
          className={`px-4 py-2 font-semibold rounded-xl text-sm transition shrink-0 whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed ${tone.button}`}
        >
          {isActionLoading ? "Đang xử lý..." : actionLabel}
        </button>
      )}
    </div>
  );
};
