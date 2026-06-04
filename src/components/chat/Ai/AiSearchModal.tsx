import React, { useEffect, useState } from "react";
import { Zap, X, Sparkles, AlertCircle } from "lucide-react";
import { aiService } from "../../../services/aiService";

interface AiSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  query: string;
  conversationId: string;
}

export const AiSearchModal: React.FC<AiSearchModalProps> = ({
  isOpen,
  onClose,
  query,
  conversationId,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSearch = async () => {
    if (!query) return;
    setIsLoading(true);
    setError(null);
    try {
      const result: any = await aiService.smartSearch(query, conversationId);
      const resAnswer = result?.answer || result?.data?.answer || null;
      if (resAnswer) {
        setAnswer(resAnswer);
      } else {
        setAnswer("Không tìm thấy kết quả phù hợp với câu hỏi của bạn.");
      }
    } catch (err: any) {
      setError(err?.message || "Lỗi khi tìm kiếm bằng AI.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && query) {
      fetchSearch();
    } else {
      setAnswer(null);
      setError(null);
    }
  }, [isOpen, query, conversationId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            Kết quả Tìm kiếm (AI)
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-white/50 p-1.5 rounded-full transition-colors focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 min-h-[200px]">
          <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Câu hỏi của bạn:</p>
            <p className="text-gray-800 font-medium">"{query}"</p>
          </div>

          {isLoading ? (
            <div className="h-[200px] flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-indigo-100" />
                <div className="w-12 h-12 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin absolute top-0 left-0" />
                <Sparkles className="w-5 h-5 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="text-gray-500 font-medium animate-pulse">
                AI đang tìm kiếm câu trả lời...
              </p>
            </div>
          ) : error ? (
            <div className="h-[200px] flex flex-col items-center justify-center text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-red-500" />
              <p className="text-red-600 font-medium">{error}</p>
              <button
                type="button"
                onClick={fetchSearch}
                className="mt-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-sm font-medium transition-colors"
              >
                Thử lại
              </button>
            </div>
          ) : answer ? (
            <div className="space-y-4">
              <div className="text-gray-700 leading-relaxed bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/50 whitespace-pre-wrap">
                {answer}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
