import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { conversationService } from "../services/conversationService";
import { useAuth } from "../hooks/useAuth";

interface DraftContextType {
  drafts: Record<string, string>;
  setDraft: (conversationId: string, text: string) => void;
  getDraft: (conversationId: string) => string;
  clearDraft: (conversationId: string) => void;
  loadDrafts: (conversationId: string) => Promise<void>;
}

const DraftContext = createContext<DraftContextType | undefined>(undefined);

export const DraftProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const { user } = useAuth();
  
  // Timer for debouncing save
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Caching fetched conversation drafts to avoid multiple API calls
  const fetchedConversations = useRef<Set<string>>(new Set());

  const loadDrafts = useCallback(async (conversationId: string) => {
    if (!user || fetchedConversations.current.has(conversationId)) return;

    try {
      const fetchedDrafts = await conversationService.getDrafts(conversationId);
      if (fetchedDrafts && fetchedDrafts.length > 0) {
        // Find current draft for text
        const currentDraft = fetchedDrafts.find((d: any) => d.text);
        if (currentDraft?.text) {
          setDrafts((prev) => ({
            ...prev,
            [conversationId]: currentDraft.text,
          }));
        }
      }
      fetchedConversations.current.add(conversationId);
    } catch (error) {
      console.error("Failed to load drafts for conversation", conversationId, error);
    }
  }, [user]);

  const setDraft = useCallback((conversationId: string, text: string) => {
    setDrafts((prev) => {
      // Avoid unnecessary state updates if it's the same text
      if (prev[conversationId] === text) return prev;
      return { ...prev, [conversationId]: text };
    });

    // Clear existing timer
    if (debounceTimers.current[conversationId]) {
      clearTimeout(debounceTimers.current[conversationId]);
    }

    if (!text.trim()) {
      // If text is empty, delete immediately
      conversationService.deleteDraft(conversationId).catch((error) => {
        console.error("Failed to delete draft immediately", error);
      });
      return;
    }

    // Set new debounce timer to save
    debounceTimers.current[conversationId] = setTimeout(() => {
      conversationService.saveDraft(conversationId, text).catch((error) => {
        console.error("Failed to save draft for conversation", conversationId, error);
      });
    }, 1000); // 1-second debounce
  }, []);

  const getDraft = useCallback((conversationId: string) => {
    return drafts[conversationId] || "";
  }, [drafts]);

  const clearDraft = useCallback((conversationId: string) => {
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[conversationId];
      return next;
    });

    if (debounceTimers.current[conversationId]) {
      clearTimeout(debounceTimers.current[conversationId]);
      delete debounceTimers.current[conversationId];
    }

    conversationService.deleteDraft(conversationId).catch((error) => {
      console.error("Failed to clear draft for conversation", conversationId, error);
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(clearTimeout);
    };
  }, []);

  return (
    <DraftContext.Provider value={{ drafts, setDraft, getDraft, clearDraft, loadDrafts }}>
      {children}
    </DraftContext.Provider>
  );
};

export const useDraft = () => {
  const context = useContext(DraftContext);
  if (!context) {
    throw new Error("useDraft must be used within a DraftProvider");
  }
  return context;
};
