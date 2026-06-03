const STORAGE_KEY = "notification_preferences";

export type NotificationPreferences = {
  soundEnabled: boolean;
  soundVolume: number;
  messageSoundEnabled: boolean;
  callSoundEnabled: boolean;
  tabBadgeEnabled: boolean;
};

const DEFAULT_PREFERENCES: NotificationPreferences = {
  soundEnabled: true,
  soundVolume: 0.8,
  messageSoundEnabled: true,
  callSoundEnabled: true,
  tabBadgeEnabled: true,
};

const normalizeVolume = (value: unknown) => {
  const volume = Number(value);
  if (!Number.isFinite(volume)) return DEFAULT_PREFERENCES.soundVolume;
  return Math.min(1, Math.max(0, volume));
};

const readPreferences = (): NotificationPreferences => {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = {
      ...DEFAULT_PREFERENCES,
      ...JSON.parse(raw),
    };
    return {
      ...parsed,
      soundVolume: normalizeVolume(parsed.soundVolume),
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
};

const writePreferences = (preferences: NotificationPreferences) => {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  window.dispatchEvent(
    new CustomEvent("notification-preferences:changed", {
      detail: preferences,
    }),
  );
};

export const getNotificationPreferences = () => readPreferences();

export const updateNotificationPreferences = (
  updates: Partial<NotificationPreferences>,
) => {
  const nextPreferences = {
    ...readPreferences(),
    ...updates,
  };
  nextPreferences.soundVolume = normalizeVolume(nextPreferences.soundVolume);
  writePreferences(nextPreferences);
  return nextPreferences;
};

export const canPlayNotificationSound = (type: "message" | "call") => {
  const preferences = readPreferences();
  if (!preferences.soundEnabled) return false;
  return type === "message"
    ? preferences.messageSoundEnabled
    : preferences.callSoundEnabled;
};

export const shouldShowTabUnread = () => readPreferences().tabBadgeEnabled;

export const getNotificationSoundVolume = () => readPreferences().soundVolume;
