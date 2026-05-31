import React from "react";
import { AlertCircle, Sparkles } from "lucide-react";

interface AiSummaryContentProps {
  error: string | null;
  isLoading: boolean;
  onRetry: () => void;
  summary: string[];
}

const SummaryLoadingState = () => (
  <div className="h-full flex flex-col items-center justify-center space-y-4">
    <div className="relative">
      <div className="w-12 h-12 rounded-full border-4 border-blue-100" />
      <div className="w-12 h-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin absolute top-0 left-0" />
      <Sparkles className="w-5 h-5 text-blue-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
    </div>
    <p className="text-gray-500 font-medium animate-pulse">
      AI đang đọc và phân tích tin nhắn...
    </p>
  </div>
);

interface SummaryErrorStateProps {
  error: string;
  onRetry: () => void;
}

const SummaryErrorState: React.FC<SummaryErrorStateProps> = ({
  error,
  onRetry,
}) => (
  <div className="h-full flex flex-col items-center justify-center text-center space-y-3">
    <AlertCircle className="w-10 h-10 text-red-500" />
    <p className="text-red-600 font-medium">{error}</p>
    <button
      type="button"
      onClick={onRetry}
      className="mt-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-sm font-medium transition-colors"
    >
      Thử lại
    </button>
  </div>
);

interface SummaryListProps {
  summary: string[];
}

const SummaryList: React.FC<SummaryListProps> = ({ summary }) => (
  <div className="space-y-4">
    <ul className="space-y-3">
      {summary.map((point, index) => (
        <li
          key={`${point}-${index}`}
          className="flex gap-3 text-gray-700 leading-relaxed bg-blue-50/50 p-3 rounded-xl"
        >
          <span className="text-blue-500 font-bold mt-0.5">•</span>
          <span>{point}</span>
        </li>
      ))}
    </ul>
  </div>
);

const SummaryEmptyState = () => (
  <div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
    <p>Không có đủ dữ liệu để tóm tắt.</p>
  </div>
);

export const AiSummaryContent: React.FC<AiSummaryContentProps> = ({
  error,
  isLoading,
  onRetry,
  summary,
}) => (
  <div className="p-5 overflow-y-auto flex-1 h-[300px]">
    {isLoading ? (
      <SummaryLoadingState />
    ) : error ? (
      <SummaryErrorState error={error} onRetry={onRetry} />
    ) : summary.length > 0 ? (
      <SummaryList summary={summary} />
    ) : (
      <SummaryEmptyState />
    )}
  </div>
);
