import { useEffect, useState } from "react";
import { aiService } from "../services/aiService";

const normalizeSummary = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .filter((point): point is string => typeof point === "string")
      .map((point) => point.trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/\n+/)
      .map((line) => line.replace(/^[-•*\d.)\s]+/, "").trim())
      .filter(Boolean);
  }

  return [];
};

export const useAiSummary = (conversationId: string, isOpen: boolean) => {
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const summarize = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await aiService.summarizeConversation(conversationId);
      const summaryData =
        res?.summary ||
        res?.data?.summary ||
        res?.data?.data?.summary ||
        res?.result?.summary ||
        [];
      setSummary(normalizeSummary(summaryData));
    } catch (err: any) {
      console.error("Lỗi khi tóm tắt:", err);
      setError(err?.message || "Có lỗi xảy ra khi tóm tắt cuộc trò chuyện.");
    } finally {
      setIsLoading(false);
    }
  };

  const copySummary = () => {
    if (summary.length === 0) return;

    const textToCopy = summary.map((point) => `• ${point}`).join("\n");
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  useEffect(() => {
    if (isOpen && conversationId) {
      summarize();
    } else {
      setSummary([]);
      setError(null);
      setCopied(false);
    }
  }, [isOpen, conversationId]);

  return {
    copied,
    error,
    isLoading,
    summary,
    copySummary,
    retry: summarize,
  };
};
