import { FiAlertTriangle, FiCheck, FiShield, FiUserX } from "react-icons/fi";

interface StrangerChatBannerProps {
  name?: string;
  insight?: string;
  isAccepting?: boolean;
  isRejecting?: boolean;
  isBlocking?: boolean;
  onAccept: () => void;
  onReject: () => void;
  onBlock?: () => void;
}

export const StrangerChatBanner = ({
  name = "Người này",
  insight = "Không có liên kết nào",
  isAccepting = false,
  isRejecting = false,
  isBlocking = false,
  onAccept,
  onReject,
  onBlock,
}: StrangerChatBannerProps) => {
  const isBusy = isAccepting || isRejecting || isBlocking;

  return (
    <div className="border-t border-slate-200/80 dark:border-slate-700/70 bg-slate-50/95 dark:bg-slate-900/80 px-4 py-3 shadow-[0_-8px_24px_-18px_rgba(15,23,42,0.45)] animate-[slideUp_180ms_ease-out]">
      <div className="max-w-4xl mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3 min-w-0">
          <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-500 flex items-center justify-center shrink-0">
            <FiAlertTriangle className="text-xl" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {name} không nằm trong danh sách bạn bè của bạn.
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Chấp nhận tin nhắn để bắt đầu trò chuyện.
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              {insight}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:justify-end">
          <button
            type="button"
            onClick={onReject}
            disabled={isBusy}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-red-200 px-3 text-sm font-semibold text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-900/20 disabled:opacity-60"
          >
            <FiUserX />
            Từ chối
          </button>
          {onBlock && (
            <button
              type="button"
              onClick={onBlock}
              disabled={isBusy}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-600 hover:bg-white dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 disabled:opacity-60"
            >
              <FiShield />
              Chặn
            </button>
          )}
          <button
            type="button"
            onClick={onAccept}
            disabled={isBusy}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            <FiCheck />
            {isAccepting ? "Đang nhận..." : "Chấp nhận"}
          </button>
        </div>
      </div>
    </div>
  );
};
