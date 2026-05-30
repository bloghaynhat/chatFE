import { useEffect, useState } from "react";
import { aiService } from "../services/aiService";

const FALLBACK_REPLIES = [
  "Mình hiểu rồi",
  "Cảm ơn bạn nhé",
  "Để mình xem lại",
];

const REPLY_CACHE_TTL_MS = 30_000;
const SLOW_RESPONSE_FALLBACK_MS = 9_000;

const replyCache = new Map<string, { replies: string[]; expiresAt: number }>();
const inflightRequests = new Map<string, Promise<string[]>>();

const normalizeReply = (reply: string) => {
  const trimmed = reply.trim();
  const normalized = trimmed.toLowerCase();

  if (["u", "ừ", "uh", "ừm"].includes(normalized)) {
    return "Ừ, mình hiểu rồi";
  }
  if (["ok", "okay", "oke"].includes(normalized)) {
    return "Ok, mình biết rồi";
  }
  if (["biet roi", "biết rồi"].includes(normalized)) {
    return "Biết rồi, cảm ơn bạn";
  }

  return trimmed;
};

const extractReplies = (response: any): string[] => {
  const rawReplies =
    response?.replies ||
    response?.data?.replies ||
    response?.data?.data?.replies ||
    response?.suggestions ||
    response?.data?.suggestions ||
    [];

  return Array.isArray(rawReplies)
    ? rawReplies
        .filter((reply) => typeof reply === "string" && reply.trim())
        .map(normalizeReply)
    : [];
};

const getCacheKey = (conversationId: string, userId?: string, triggerKey?: string) =>
  [conversationId, userId || "current-user", triggerKey || "latest"].join(":");

const fetchSmartReplies = async (
  conversationId: string,
  userId: string | undefined,
  cacheKey: string,
) => {
  const cached = replyCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.replies;
  }

  const inflight = inflightRequests.get(cacheKey);
  if (inflight) {
    return inflight;
  }

  const request = aiService
    .smartReply(conversationId, userId)
    .then((res) => {
      const fetchedReplies = extractReplies(res);
      if (fetchedReplies.length > 0) {
        replyCache.set(cacheKey, {
          replies: fetchedReplies,
          expiresAt: Date.now() + REPLY_CACHE_TTL_MS,
        });
      }
      return fetchedReplies;
    })
    .finally(() => {
      inflightRequests.delete(cacheKey);
    });

  inflightRequests.set(cacheKey, request);
  return request;
};

export const useAiSmartReplies = (
  conversationId: string,
  shouldFetch = false,
  userId?: string,
  triggerKey?: string,
) => {
  const [replies, setReplies] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsVisible(true);
    setError(null);
    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const fetchReplies = async () => {
      if (!conversationId || !shouldFetch) {
        setReplies([]);
        setIsLoading(false);
        return;
      }

      const cacheKey = getCacheKey(conversationId, userId, triggerKey);
      const cached = replyCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        setReplies(cached.replies);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      timeoutId = setTimeout(() => {
        if (!isMounted) return;
        setReplies(FALLBACK_REPLIES);
        setError("AI phản hồi chậm, đang dùng gợi ý nhanh.");
        setIsLoading(false);
      }, SLOW_RESPONSE_FALLBACK_MS);

      try {
        const fetchedReplies = await fetchSmartReplies(
          conversationId,
          userId,
          cacheKey,
        );

        if (isMounted) {
          setReplies(fetchedReplies.length > 0 ? fetchedReplies : FALLBACK_REPLIES);
          setError(fetchedReplies.length > 0 ? null : "AI chưa trả về gợi ý phù hợp.");
        }
      } catch (error) {
        console.error("Lỗi khi lấy gợi ý trả lời:", error);
        if (isMounted) {
          setReplies(FALLBACK_REPLIES);
          setError("Không lấy được gợi ý AI, đang dùng gợi ý nhanh.");
        }
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchReplies();

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [conversationId, shouldFetch, triggerKey, userId]);

  return {
    error,
    replies,
    isLoading,
    isVisible,
    hide: () => setIsVisible(false),
  };
};
