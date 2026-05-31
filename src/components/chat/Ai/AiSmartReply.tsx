import React from "react";
import { ArrowRight, Sparkles, X } from "lucide-react";
import { useAiSmartReplies } from "../../../hooks/useAiSmartReplies";

interface AiSmartReplyProps {
  conversationId: string;
  onSelectReply: (reply: string) => void;
  shouldFetch?: boolean;
  triggerKey?: string;
  userId?: string;
}

const SmartReplySkeleton = () => (
  <div className="flex gap-2 px-4 py-2 overflow-x-auto no-scrollbar mask-edges animate-in slide-in-from-bottom-2 duration-300">
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        className="h-8 w-24 bg-gray-200/60 rounded-full animate-pulse flex-shrink-0"
      />
    ))}
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
  <div className="flex items-center gap-2 px-4 py-2 overflow-x-auto no-scrollbar mask-edges whitespace-nowrap bg-white/50 backdrop-blur-sm border-t border-gray-100 animate-in slide-in-from-bottom-2 duration-300">
    <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 shadow-sm border border-blue-100">
      <Sparkles className="w-3.5 h-3.5" /> AI
    </div>
    {error && (
      <span className="text-xs text-gray-500 flex-shrink-0">Gợi ý nhanh</span>
    )}

    {replies.map((reply, index) => (
      <button
        key={`${reply}-${index}`}
        type="button"
        onClick={() => {
          onSelectReply(reply);
          onClose();
        }}
        className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white border border-blue-100 text-[14px] text-gray-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-all shadow-sm flex-shrink-0 active:scale-95"
      >
        {reply}
        <ArrowRight className="w-3.5 h-3.5 opacity-50" />
      </button>
    ))}

    <div className="flex-1" />
    <button
      type="button"
      onClick={onClose}
      className="p-1.5 bg-gray-50 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 transition-colors flex-shrink-0 ml-2"
      title="Ẩn gợi ý AI"
    >
      <X className="w-4 h-4" />
    </button>
  </div>
);

export const AiSmartReply: React.FC<AiSmartReplyProps> = ({
  conversationId,
  onSelectReply,
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

  return (
    <SmartReplyList
      error={error}
      replies={replies}
      onSelectReply={onSelectReply}
      onClose={hide}
    />
  );
};
