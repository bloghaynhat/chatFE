import { useState, useEffect, useCallback } from "react";
import { aiService } from "../../services/aiService";
import { Message } from "../../types/conversation";
import { getMessageText } from "../../utils/chatUtils";
import { FiX, FiCheck, FiRefreshCw, FiChevronDown, FiGlobe } from "react-icons/fi";

interface AiTranslateMessageProps {
  message: Message;
  targetLanguage?: string;
  onClose: () => void;
  onApply?: (translatedText: string) => void;
}

const SUPPORTED_LANGUAGES = [
  { code: "vi", name: "Tiếng Việt" },
  { code: "en", name: "English" },
  { code: "zh", name: "中文 (Chinese)" },
  { code: "ja", name: "日本語 (Japanese)" },
  { code: "ko", name: "한국어 (Korean)" },
  { code: "fr", name: "Français (French)" },
  { code: "de", name: "Deutsch (German)" },
  { code: "ru", name: "Русский (Russian)" },
];

export const AiTranslateMessage = ({
  message,
  targetLanguage: initialTarget = "vi",
  onClose,
  onApply,
}: AiTranslateMessageProps) => {
  const [translatedText, setTranslatedText] = useState<string>("");
  const [detectedLanguage, setDetectedLanguage] = useState<string>("");
  const [targetLang, setTargetLang] = useState<string>(initialTarget);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [isDetecting, setIsDetecting] = useState<boolean>(false);

  const translate = useCallback(async (currentTranslateTarget: string) => {
    try {
      setIsLoading(true);
      setError("");
      const text = getMessageText(message);
      if (!text) {
        setError("Không có nội dung văn bản để dịch.");
        return;
      }

      const res: any = await aiService.translateMessage({
        text,
        targetLang: currentTranslateTarget,
      });

      const translated =
        res?.translated ||
        res?.translatedText ||
        res?.data?.translated ||
        res?.data?.translatedText ||
        "";
      const sourceLang =
        res?.sourceLang ||
        res?.detectedLanguage ||
        res?.data?.sourceLang ||
        res?.data?.detectedLanguage ||
        "";

      if (translated) {
        setTranslatedText(translated);
        if (sourceLang) setDetectedLanguage(sourceLang);
      } else {
        setError("Có lỗi xảy ra khi dịch tin nhắn.");
      }
    } catch (err) {
      setError("Lỗi kết nối đến dịch vụ AI.");
    } finally {
      setIsLoading(false);
    }
  }, [message]);

  useEffect(() => {
    const initTranslation = async () => {
      const text = getMessageText(message);
      if (!text) return;

      setIsDetecting(true);
      let autoTarget = targetLang;

      try {
        // First detect language to be smart about the target
        const detectRes: any = await aiService.detectLanguage(text);
        const sourceLang = detectRes?.language || detectRes?.data?.language || "";
        
        if (sourceLang) {
          setDetectedLanguage(sourceLang);
          
          // If source matches target (e.g. both are VI), switch target
          if (sourceLang.toLowerCase().includes("vi") && targetLang === "vi") {
            autoTarget = "en";
            setTargetLang("en");
          } else if (sourceLang.toLowerCase().includes("en") && targetLang === "en") {
            autoTarget = "vi";
            setTargetLang("vi");
          }
        }
      } catch (err) {
        console.warn("Language detection failed, falling back to default target", err);
      } finally {
        setIsDetecting(false);
      }

      translate(autoTarget);
    };

    initTranslation();
  }, [message]); // Only run on mount or when message changes

  const handleTargetLangChange = (newLang: string) => {
    setTargetLang(newLang);
    translate(newLang);
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-[2px] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-slate-800">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/10 dark:bg-blue-500/20 p-2 rounded-xl text-blue-600 dark:text-blue-400">
              <FiGlobe className="text-xl" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 dark:text-gray-100 leading-tight">
                AI Translator
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">
                Powered by Advanced AI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-500 dark:text-gray-400 transition-all active:scale-90"
          >
            <FiX className="text-xl" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-6">
          {/* Source Text Section */}
          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <span className="text-[12px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                Bản gốc
                {detectedLanguage && !isDetecting && (
                  <span className="normal-case font-medium text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full text-[11px]">
                    {detectedLanguage.toUpperCase()}
                  </span>
                )}
                {isDetecting && (
                  <span className="animate-pulse normal-case font-medium text-gray-400">
                    Phát hiện ngôn ngữ...
                  </span>
                )}
              </span>
            </div>
            <div className="bg-gray-50 dark:bg-slate-950 p-4 rounded-xl border border-gray-100 dark:border-slate-800 text-gray-700 dark:text-gray-300 text-[15px] leading-relaxed max-h-[120px] overflow-y-auto custom-scrollbar">
              {getMessageText(message)}
            </div>
          </div>

          {/* Translation Controls & Result */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-[12px] font-bold text-blue-500 uppercase tracking-widest">
                Bản dịch
              </span>
              
              {/* Language Selector */}
              <div className="relative group">
                <select
                  value={targetLang}
                  onChange={(e) => handleTargetLangChange(e.target.value)}
                  className="appearance-none bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-semibold px-4 py-1.5 pr-8 rounded-full border border-blue-100 dark:border-blue-900/30 outline-none cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code} className="dark:bg-slate-900 dark:text-gray-100">
                      Đến {lang.name}
                    </option>
                  ))}
                </select>
                <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none group-hover:text-blue-600" />
              </div>
            </div>

            <div className="bg-blue-50/30 dark:bg-blue-900/5 p-4 rounded-xl border border-blue-100/50 dark:border-blue-900/20 text-gray-800 dark:text-gray-100 text-[15px] leading-relaxed min-h-[100px] flex flex-col">
              {isLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 text-blue-500 py-4">
                  <FiRefreshCw className="animate-spin text-2xl" />
                  <span className="text-sm font-medium animate-pulse">Đang dịch qua AI...</span>
                </div>
              ) : error ? (
                <div className="flex-1 flex items-center justify-center text-red-500 text-center px-4 py-2 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/20">
                  <p className="text-sm font-medium">{error}</p>
                </div>
              ) : (
                <div className="flex-1 whitespace-pre-wrap">{translatedText}</div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-800 flex justify-end gap-3 bg-gray-50/50 dark:bg-slate-900/50">
          <button
            onClick={onClose}
            className="px-5 py-2.5 font-bold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm transition-colors"
          >
            Hủy bỏ
          </button>
          
          {!isLoading && !error && (
            <div className="flex gap-2">
              <button
                onClick={() => translate(targetLang)}
                className="p-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300 rounded-xl transition-all shadow-sm active:scale-95 group"
                title="Dịch lại"
              >
                <FiRefreshCw className="group-hover:rotate-180 transition-transform duration-500" />
              </button>
              
              {onApply && (
                <button
                  onClick={() => {
                    onApply(translatedText);
                    onClose();
                  }}
                  className="px-6 py-2.5 font-bold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98] flex items-center gap-2"
                >
                  <FiCheck className="text-lg" />
                  Áp dụng vào Input
                </button>
              )}
              
              {!onApply && (
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 font-bold bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98]"
                >
                  Xong
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
