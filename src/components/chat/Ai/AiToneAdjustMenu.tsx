import React, { useState } from "react";
import { Check, MessageSquare, RefreshCw, Sparkles, X } from "lucide-react";
import { TONE_OPTIONS } from "../../../types/ai";
import type { ToneType } from "../../../types/ai";
import { useAiToneAdjust } from "../../../hooks/useAiToneAdjust";

interface AiToneAdjustMenuProps {
  currentText: string;
  onApplyTone: (newText: string) => void;
}

interface ToneOptionsGridProps {
  disabled?: boolean;
  onSelectTone: (tone: ToneType) => void;
}

const ToneOptionsGrid: React.FC<ToneOptionsGridProps> = ({
  disabled = false,
  onSelectTone,
}) => (
  <div className="grid grid-cols-2 gap-2">
    {TONE_OPTIONS.map((tone) => (
      <button
        key={tone.id}
        type="button"
        disabled={disabled}
        onClick={() => onSelectTone(tone.id)}
        className="flex flex-col items-center justify-center p-3 border border-gray-100 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all text-sm group disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white disabled:hover:border-gray-100"
      >
        <span className={`text-xl mb-1 group-hover:scale-110 transition-transform ${tone.iconClassName}`}>
          {tone.icon}
        </span>
        <span className="font-medium text-gray-700 group-hover:text-blue-700">
          {tone.label}
        </span>
      </button>
    ))}
  </div>
);

const EmptyToneState = () => (
  <div className="text-center p-4 text-gray-500 text-sm flex flex-col items-center">
    <MessageSquare className="w-6 h-6 mb-2 text-gray-300" />
    Vui lòng nhập nội dung cần viết lại...
  </div>
);

const ToneLoadingState = () => (
  <div className="p-6 flex flex-col items-center justify-center gap-3">
    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    <span className="text-sm text-gray-500">AI đang phân tích...</span>
  </div>
);

interface TonePreviewProps {
  adjustedText: string;
  onApply: () => void;
  onCancel: () => void;
}

const TonePreview: React.FC<TonePreviewProps> = ({
  adjustedText,
  onApply,
  onCancel,
}) => (
  <div className="space-y-3">
    <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-800 relative">
      {adjustedText}
    </div>
    <div className="flex gap-2">
      <button
        type="button"
        onClick={onApply}
        className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        <Check className="w-4 h-4" /> Dùng
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
      >
        <RefreshCw className="w-4 h-4" /> Hủy
      </button>
    </div>
  </div>
);

interface TonePanelProps {
  hasText: boolean;
  cooldownSeconds: number;
  error: string | null;
  isLoading: boolean;
  adjustedText: string | null;
  onSelectTone: (tone: ToneType) => void;
  onApply: () => void;
  onCancelPreview: () => void;
  onClose: () => void;
}

const TonePanel: React.FC<TonePanelProps> = ({
  hasText,
  cooldownSeconds,
  error,
  isLoading,
  adjustedText,
  onSelectTone,
  onApply,
  onCancelPreview,
  onClose,
}) => (
  <div className="absolute bottom-12 right-0 mb-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
    <div className="p-3 border-b flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50">
      <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
        <Sparkles className="w-4 h-4 text-blue-600" /> AI Viết lại
      </h3>
      <button
        type="button"
        onClick={onClose}
        className="text-gray-400 hover:text-gray-600 p-1"
      >
        <X className="w-4 h-4" />
      </button>
    </div>

    <div className="p-2">
      {!hasText ? (
        <EmptyToneState />
      ) : adjustedText ? (
        <TonePreview
          adjustedText={adjustedText}
          onApply={onApply}
          onCancel={onCancelPreview}
        />
      ) : isLoading ? (
        <ToneLoadingState />
      ) : (
        <div className="space-y-2">
          {error && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
              {error}
            </div>
          )}
          <ToneOptionsGrid
            disabled={cooldownSeconds > 0}
            onSelectTone={onSelectTone}
          />
        </div>
      )}
    </div>
  </div>
);

export const AiToneAdjustMenu: React.FC<AiToneAdjustMenuProps> = ({
  currentText,
  onApplyTone,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    adjustedText,
    cooldownSeconds,
    error,
    isLoading,
    adjustTone,
    clearAdjustedText,
  } =
    useAiToneAdjust(currentText);

  const closeMenu = () => {
    setIsOpen(false);
    clearAdjustedText();
  };

  const applyText = () => {
    if (!adjustedText) return;
    onApplyTone(adjustedText);
    closeMenu();
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors focus:outline-none"
        title="AI Viết lại"
      >
        <Sparkles className="w-5 h-5" />
      </button>

      {isOpen && (
        <TonePanel
          hasText={Boolean(currentText.trim())}
          cooldownSeconds={cooldownSeconds}
          error={error}
          isLoading={isLoading}
          adjustedText={adjustedText}
          onSelectTone={adjustTone}
          onApply={applyText}
          onCancelPreview={clearAdjustedText}
          onClose={closeMenu}
        />
      )}
    </div>
  );
};
