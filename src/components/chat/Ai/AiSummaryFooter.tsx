import React from "react";
import { CheckCircle, Copy } from "lucide-react";

interface AiSummaryFooterProps {
  copied: boolean;
  onClose: () => void;
  onCopy: () => void;
}

export const AiSummaryFooter: React.FC<AiSummaryFooterProps> = ({
  copied,
  onClose,
  onCopy,
}) => (
  <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
    <button
      type="button"
      onClick={onClose}
      className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-xl font-medium transition-colors"
    >
      Đóng
    </button>
    <button
      type="button"
      onClick={onCopy}
      className={`flex items-center gap-2 px-5 py-2 text-white rounded-xl font-medium transition-all ${
        copied ? "bg-green-500 hover:bg-green-600" : "bg-blue-600 hover:bg-blue-700"
      }`}
    >
      {copied ? (
        <>
          <CheckCircle className="w-4 h-4" />
          Đã sao chép
        </>
      ) : (
        <>
          <Copy className="w-4 h-4" />
          Sao chép text
        </>
      )}
    </button>
  </div>
);
