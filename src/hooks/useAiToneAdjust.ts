import { useEffect, useMemo, useState } from "react";
import { aiService } from "../services/aiService";
import type { ToneType } from "../types/ai";

const TONE_CACHE_TTL_MS = 2 * 60 * 1000;
const TONE_MIN_INTERVAL_MS = 8_000;
const TONE_RATE_LIMIT_COOLDOWN_MS = 45_000;

const toneCache = new Map<string, { adjustedText: string; expiresAt: number }>();
const inflightRequests = new Map<string, Promise<string | null>>();
let nextToneRequestAt = 0;

const getToneCacheKey = (message: string, tone: ToneType) =>
  `${tone}:${message.trim()}`;

const extractAdjustedText = (response: any): string | null => {
  const adjusted =
    response?.adjusted ||
    response?.data?.adjusted ||
    response?.data?.data?.adjusted ||
    response?.message ||
    null;

  return typeof adjusted === "string" && adjusted.trim() ? adjusted : null;
};

const getErrorStatus = (error: any) =>
  error?.status || error?.payload?.statusCode || error?.payload?.status || error?.code;

const getCooldownSeconds = () =>
  Math.max(0, Math.ceil((nextToneRequestAt - Date.now()) / 1000));

export const useAiToneAdjust = (currentText: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [adjustedText, setAdjustedText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  const trimmedText = useMemo(() => currentText.trim(), [currentText]);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;

    const timerId = window.setInterval(() => {
      setCooldownSeconds(getCooldownSeconds());
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [cooldownSeconds]);

  const adjustTone = async (tone: ToneType) => {
    if (!trimmedText || isLoading) return;

    const now = Date.now();
    const cacheKey = getToneCacheKey(trimmedText, tone);
    const cached = toneCache.get(cacheKey);

    if (cached && cached.expiresAt > now) {
      setAdjustedText(cached.adjustedText);
      setError(null);
      return;
    }

    if (now < nextToneRequestAt) {
      const seconds = getCooldownSeconds();
      setCooldownSeconds(seconds);
      setError(`AI dang gioi han toc do. Thu lai sau ${seconds}s.`);
      return;
    }

    setIsLoading(true);
    setError(null);
    setCooldownSeconds(0);
    nextToneRequestAt = now + TONE_MIN_INTERVAL_MS;

    try {
      const request =
        inflightRequests.get(cacheKey) ||
        aiService
          .toneAdjust({ message: trimmedText, tone })
          .then((res) => {
            const text = extractAdjustedText(res);
            if (text) {
              toneCache.set(cacheKey, {
                adjustedText: text,
                expiresAt: Date.now() + TONE_CACHE_TTL_MS,
              });
            }
            return text;
          })
          .finally(() => {
            inflightRequests.delete(cacheKey);
          });

      inflightRequests.set(cacheKey, request);
      const newText = await request;

      if (newText) {
        setAdjustedText(newText);
      } else {
        setError("AI chua tra ve noi dung da viet lai.");
      }
    } catch (error) {
      console.error("Lỗi khi điều chỉnh văn bản:", error);
      const status = getErrorStatus(error);

      if (Number(status) === 429 || status === "RATE_LIMITED") {
        nextToneRequestAt = Date.now() + TONE_RATE_LIMIT_COOLDOWN_MS;
        setCooldownSeconds(getCooldownSeconds());
        setError("AI dang bi gioi han tan suat. Vui long thu lai sau it giay.");
      } else {
        setError("Khong the viet lai luc nay. Vui long thu lai sau.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    adjustedText,
    cooldownSeconds,
    error,
    isLoading,
    adjustTone,
    clearAdjustedText: () => {
      setAdjustedText(null);
      setError(null);
    },
  };
};
