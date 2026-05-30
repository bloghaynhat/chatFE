import React from "react";
import { Sparkles, X } from "lucide-react";
import { AiSummaryContent } from "./AiSummaryContent";
import { AiSummaryFooter } from "./AiSummaryFooter";
import { useAiSummary } from "../../../hooks/useAiSummary";

interface AiSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
}

export const AiSummaryModal: React.FC<AiSummaryModalProps> = ({
  isOpen,
  onClose,
  conversationId,
}) => {
  const { copied, error, isLoading, summary, copySummary, retry } =
    useAiSummary(conversationId, isOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            Tóm tắt cuộc trò chuyện
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-white/50 p-1.5 rounded-full transition-colors focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <AiSummaryContent
          error={error}
          isLoading={isLoading}
          onRetry={retry}
          summary={summary}
        />

        {!isLoading && !error && summary.length > 0 && (
          <AiSummaryFooter
            copied={copied}
            onClose={onClose}
            onCopy={copySummary}
          />
        )}
      </div>
    </div>
  );
};
