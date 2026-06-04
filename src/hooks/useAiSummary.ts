import { useEffect, useState } from "react";
import { aiService } from "../services/aiService";

const normalizeSummary = (value: unknown, members?: any[]): string[] => {
  let summaryArray: string[] = [];

  if (Array.isArray(value)) {
    summaryArray = value
      .filter((point): point is string => typeof point === "string")
      .map((point) => point.trim())
      .filter(Boolean);
  } else if (typeof value === "string") {
    summaryArray = value
      .split(/\n+/)
      .map((line) => line.replace(/^[-•*\d.)\s]+/, "").trim())
      .filter(Boolean);
  }

  if (!members || members.length === 0) return summaryArray;

  return summaryArray.map(point => {
    let replacedPoint = point;
    members.forEach((member) => {
      const user = member?.user || member;
      const userId = user?.id || user?._id || member?.userId;
      if (userId) {
        const shortId = String(userId).substring(0, 8);
        const name = user?.displayName || user?.name || user?.username || "Người dùng";
        
        const regex1 = new RegExp(`Người dùng ${userId}`, 'gi');
        const regex2 = new RegExp(`Người dùng ${shortId}`, 'gi');
        const regex3 = new RegExp(userId, 'gi');
        const regex4 = new RegExp(shortId, 'gi');
        
        replacedPoint = replacedPoint
          .replace(regex1, name)
          .replace(regex2, name)
          .replace(regex3, name)
          .replace(regex4, name);
      }
    });
    return replacedPoint;
  });
};

export const useAiSummary = (conversationId: string, isOpen: boolean, members?: any[]) => {
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
      setSummary(normalizeSummary(summaryData, members));
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
