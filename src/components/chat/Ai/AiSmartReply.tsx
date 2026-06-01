import React from "react";
import { ArrowRight, Sparkles, X } from "lucide-react";
import { useAiSmartReplies } from "../../../hooks/useAiSmartReplies";

interface AiSmartReplyProps {
  conversationId: string;
  onSelectReply: (reply: string) => void;
  onClose?: () => void;
  shouldFetch?: boolean;
  triggerKey?: string;
  userId?: string;
}

const SmartReplySkeleton = () => (
  <div className="mx-auto mb-2 flex w-full max-w-4xl gap-2 animate-in slide-in-from-bottom-2 duration-300">
    <div className="flex min-h-[42px] flex-1 gap-2 overflow-x-auto rounded-[22px] border border-white/55 bg-white/55 p-1.5 shadow-sm backdrop-blur-sm no-scrollbar mask-edges dark:border-slate-700/60 dark:bg-slate-900/35">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-8 w-28 flex-shrink-0 animate-pulse rounded-full bg-white/70 dark:bg-slate-700/70"
        />
      ))}
    </div>
    <div className="h-11 w-11 shrink-0 lg:h-12 lg:w-12" />
  </div>
);

interface SmartReplyListProps {
  error?: string | null;
  replies: string[];
  onSelectReply: (reply: string) => void;
  onClose: () => void;
}

const SmartReplyList: React.FC<SmartReplyListProps> = ({
  error,
  replies,
  onSelectReply,
  onClose,
}) => (
  <div className="mx-auto mb-2 flex w-full max-w-4xl gap-2 animate-in slide-in-from-bottom-2 duration-300">
    <div className="flex min-h-[42px] flex-1 items-center gap-2 overflow-x-auto whitespace-nowrap rounded-[22px] border border-white/55 bg-white/55 p-1.5 shadow-sm backdrop-blur-sm no-scrollbar mask-edges dark:border-slate-700/60 dark:bg-slate-900/35">
      <div className="flex h-8 flex-shrink-0 items-center gap-1.5 rounded-full border border-blue-100 bg-white/95 px-3 text-xs font-semibold text-blue-600 shadow-sm dark:border-blue-500/20 dark:bg-slate-800/95 dark:text-blue-300">
        <Sparkles className="h-3.5 w-3.5" /> AI
      </div>
      {error && (
        <span className="flex-shrink-0 text-xs text-gray-500 dark:text-slate-400">
          Gợi ý nhanh
        </span>
      )}

      {replies.map((reply, index) => (
        <button
          key={`${reply}-${index}`}
          type="button"
          onClick={() => {
            onSelectReply(reply);
            onClose();
          }}
          className="flex h-8 max-w-[280px] flex-shrink-0 items-center gap-1.5 rounded-full border border-white/90 bg-white/95 px-4 text-[14px] text-gray-700 shadow-sm transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 active:scale-95 dark:border-slate-700/90 dark:bg-slate-800/95 dark:text-slate-100 dark:hover:border-blue-500/40 dark:hover:bg-slate-700"
        >
          <span className="truncate">{reply}</span>
          <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 opacity-50" />
        </button>
      ))}

      <div className="flex-1" />
      <button
        type="button"
        onClick={onClose}
        className="ml-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/90 text-gray-400 shadow-sm transition-colors hover:bg-gray-100 hover:text-gray-700 dark:bg-slate-800/95 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
        title="Ẩn gợi ý AI"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
    <div className="h-11 w-11 shrink-0 lg:h-12 lg:w-12" />
  </div>
);

export const AiSmartReply: React.FC<AiSmartReplyProps> = ({
  conversationId,
  onSelectReply,
  onClose,
  shouldFetch = false,
  triggerKey,
  userId,
}) => {
  const { error, replies, isLoading, isVisible, hide } = useAiSmartReplies(
    conversationId,
    shouldFetch,
    userId,
    triggerKey,
  );

  if (!isVisible) return null;
  if (!shouldFetch && replies.length === 0 && !isLoading) return null;
  if (isLoading) return <SmartReplySkeleton />;
  if (replies.length === 0) return null;

  const handleClose = () => {
    hide();
    onClose?.();
  };

  return (
    <SmartReplyList
      error={error}
      replies={replies}
      onSelectReply={onSelectReply}
      onClose={handleClose}
    />
  );
};
