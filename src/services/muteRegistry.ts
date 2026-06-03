const STORAGE_KEY = "muted_conversations";

const readStoredMutedConversations = () => {
  if (typeof window === "undefined") return new Map<string, string | null>();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return new Map<string, string | null>(
      Object.entries(parsed).map(([conversationId, mutedUntil]) => [
        conversationId,
        typeof mutedUntil === "string" ? mutedUntil : null,
      ]),
    );
  } catch {
    return new Map<string, string | null>();
  }
};

const mutedConversations = readStoredMutedConversations();

const persistMutedConversations = () => {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(Object.fromEntries(mutedConversations.entries())),
  );
};

const getConversationId = (conversation: any) =>
  conversation?.conversationId || conversation?.id || conversation?._id || null;

const getMutedUntil = (conversation: any) =>
  conversation?.mutedUntil ||
  conversation?.muteUntil ||
  conversation?.notificationsMutedUntil ||
  conversation?.notificationMutedUntil ||
  null;

const hasMuteInfo = (conversation: any) =>
  conversation &&
  (
    "muted" in conversation ||
    "isMuted" in conversation ||
    "notificationsMuted" in conversation ||
    "notificationsEnabled" in conversation ||
    "mutedUntil" in conversation ||
    "muteUntil" in conversation ||
    "notificationsMutedUntil" in conversation ||
    "notificationMutedUntil" in conversation
  );

export const isConversationMutedValue = (conversation: any) => {
  if (!conversation) return false;

  const muted =
    conversation.muted === true ||
    conversation.isMuted === true ||
    conversation.notificationsMuted === true ||
    conversation.notificationsEnabled === false;

  if (!muted) return false;

  const mutedUntil = getMutedUntil(conversation);
  if (!mutedUntil) return true;

  const mutedUntilTime = new Date(mutedUntil).getTime();
  return Number.isNaN(mutedUntilTime) || mutedUntilTime > Date.now();
};

export const syncMutedConversations = (conversations: any[] = []) => {
  conversations.forEach((conversation) => {
    const conversationId = getConversationId(conversation);
    if (!conversationId) return;
    if (!hasMuteInfo(conversation)) return;

    if (isConversationMutedValue(conversation)) {
      mutedConversations.set(String(conversationId), getMutedUntil(conversation));
    } else {
      mutedConversations.delete(String(conversationId));
    }
  });
  persistMutedConversations();
};

export const setConversationMuted = (
  conversationId: string,
  muted: boolean,
  mutedUntil: string | null = null,
) => {
  if (!conversationId) return;

  if (muted) {
    mutedConversations.set(String(conversationId), mutedUntil);
  } else {
    mutedConversations.delete(String(conversationId));
  }
  persistMutedConversations();

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("conversation:mute-local-changed", {
        detail: { conversationId: String(conversationId), muted, mutedUntil },
      }),
    );
  }
};

export const isConversationMuted = (conversationId?: string | null) => {
  if (!conversationId) return false;

  const mutedUntil = mutedConversations.get(String(conversationId));
  if (mutedUntil === undefined) return false;
  if (!mutedUntil) return true;

  const mutedUntilTime = new Date(mutedUntil).getTime();
  if (Number.isNaN(mutedUntilTime) || mutedUntilTime > Date.now()) return true;

  mutedConversations.delete(String(conversationId));
  persistMutedConversations();
  return false;
};
