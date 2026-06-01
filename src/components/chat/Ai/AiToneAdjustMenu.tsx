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
        className="group flex flex-col items-center justify-center rounded-2xl border border-white/80 bg-white/90 p-3 text-sm shadow-sm transition-all hover:border-blue-200 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-white/80 disabled:hover:bg-white/90 dark:border-slate-700 dark:bg-slate-800/95 dark:hover:border-blue-500/40 dark:hover:bg-slate-700"
      >
        <span className={`text-xl mb-1 group-hover:scale-110 transition-transform ${tone.iconClassName}`}>
          {tone.icon}
        </span>
        <span className="font-medium text-gray-700 group-hover:text-blue-700 dark:text-slate-100 dark:group-hover:text-blue-300">
          {tone.label}
        </span>
      </button>
    ))}
  </div>
);

const EmptyToneState = () => (
  <div className="flex flex-col items-center p-4 text-center text-sm text-gray-500 dark:text-slate-400">
    <MessageSquare className="mb-2 h-6 w-6 text-gray-300 dark:text-slate-500" />
    Vui lòng nhập nội dung cần viết lại...
  </div>
);

const ToneLoadingState = () => (
  <div className="flex flex-col items-center justify-center gap-3 p-6">
    <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
    <span className="text-sm text-gray-500 dark:text-slate-400">AI đang phân tích...</span>
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
    <div className="relative rounded-2xl bg-white/90 p-3 text-sm text-gray-800 shadow-sm dark:bg-slate-800/95 dark:text-slate-100">
      {adjustedText}
    </div>
    <div className="flex gap-2">
      <button
        type="button"
        onClick={onApply}
        className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#2ea6f3] py-2 text-sm font-medium text-white transition-colors hover:bg-[#1f97e5]"
      >
        <Check className="w-4 h-4" /> Dùng
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="flex flex-1 items-center justify-center gap-2 rounded-full bg-white/90 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
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
  <div className="absolute bottom-12 right-0 z-50 mb-2 w-72 overflow-hidden rounded-[22px] border border-white/80 bg-white/80 shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-200 dark:border-slate-700/80 dark:bg-slate-900/85">
    <div className="flex items-center justify-between px-3 py-2.5">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-slate-100">
        <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-300" /> AI Viết lại
      </h3>
      <button
        type="button"
        onClick={onClose}
        className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-white/80 hover:text-gray-700 dark:hover:bg-slate-800 dark:hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>
    </div>

    <div className="p-2 pt-0">
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
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
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
        className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-blue-600 focus:outline-none dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-blue-300"
        title="AI Viết lại"
      >
        <Sparkles className="h-5 w-5" />
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
