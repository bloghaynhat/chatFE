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
  const draftsRef = useRef<Record<string, string>>({});
  
  // Timer for debouncing save
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Caching fetched conversation drafts to avoid multiple API calls
  const fetchedConversations = useRef<Set<string>>(new Set());
  const serverDraftConversations = useRef<Set<string>>(new Set());
  const pendingDeleteAfterSave = useRef<Set<string>>(new Set());

  useEffect(() => {
    draftsRef.current = drafts;
  }, [drafts]);

  const ignoreMissingDraftError = (error: any) => {
    const message = String(error?.message || error?.payload?.msg || "").toLowerCase();
    const code = String(error?.code || error?.payload?.code || "").toUpperCase();
    return (
      error?.status === 400 &&
      code === "BAD_REQUEST" &&
      (message.includes("not found") || message.includes("not exist"))
    );
  };

  const deleteServerDraft = useCallback(async (conversationId: string) => {
    if (!serverDraftConversations.current.has(conversationId)) return;

    try {
      await conversationService.deleteDraft(conversationId);
    } catch (error) {
      if (!ignoreMissingDraftError(error)) {
        console.error("Failed to delete draft for conversation", conversationId, error);
      }
    } finally {
      serverDraftConversations.current.delete(conversationId);
      pendingDeleteAfterSave.current.delete(conversationId);
    }
  }, []);

  const loadDrafts = useCallback(async (conversationId: string) => {
    if (!user || fetchedConversations.current.has(conversationId)) return;

    try {
      const fetchedDrafts = await conversationService.getDrafts(conversationId);
      if (fetchedDrafts && fetchedDrafts.length > 0) {
        // Find current draft for text
        const currentDraft = fetchedDrafts.find((d: any) => d.text);
        if (currentDraft?.text) {
          serverDraftConversations.current.add(conversationId);
          setDrafts((prev) => ({
            ...prev,
            [conversationId]: currentDraft.text,
          }));
          draftsRef.current = {
            ...draftsRef.current,
            [conversationId]: currentDraft.text,
          };
        }
      }
      fetchedConversations.current.add(conversationId);
    } catch (error) {
      console.error("Failed to load drafts for conversation", conversationId, error);
    }
  }, [user]);

  const setDraft = useCallback((conversationId: string, text: string) => {
    const previousText = draftsRef.current[conversationId] || "";
    if (previousText === text) return;

    draftsRef.current = {
      ...draftsRef.current,
      [conversationId]: text,
    };

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
      pendingDeleteAfterSave.current.add(conversationId);
      void deleteServerDraft(conversationId);
      return;
    }

    pendingDeleteAfterSave.current.delete(conversationId);

    // Set new debounce timer to save
    debounceTimers.current[conversationId] = setTimeout(() => {
      conversationService
        .saveDraft(conversationId, text)
        .then(() => {
          serverDraftConversations.current.add(conversationId);
          if (
            pendingDeleteAfterSave.current.has(conversationId) ||
            !draftsRef.current[conversationId]?.trim()
          ) {
            void deleteServerDraft(conversationId);
          }
        })
        .catch((error) => {
          console.error("Failed to save draft for conversation", conversationId, error);
        });
    }, 1000); // 1-second debounce
  }, [deleteServerDraft]);

  const getDraft = useCallback((conversationId: string) => {
    return drafts[conversationId] || "";
  }, [drafts]);

  const clearDraft = useCallback((conversationId: string) => {
    draftsRef.current = {
      ...draftsRef.current,
    };
    delete draftsRef.current[conversationId];

    setDrafts((prev) => {
      const next = { ...prev };
      delete next[conversationId];
      return next;
    });

    if (debounceTimers.current[conversationId]) {
      clearTimeout(debounceTimers.current[conversationId]);
      delete debounceTimers.current[conversationId];
    }

    pendingDeleteAfterSave.current.add(conversationId);
    void deleteServerDraft(conversationId);
  }, [deleteServerDraft]);

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
