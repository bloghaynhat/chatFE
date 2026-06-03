import {
  canPlayNotificationSound,
  getNotificationSoundVolume,
} from "./notificationPreferences";

const NOTIFICATION_SOUNDS = {
  message: "/noti_message.mp3",
  call: "/noti_call.mp3",
} as const;

type NotificationSoundType = keyof typeof NOTIFICATION_SOUNDS;

const MIN_PLAY_INTERVAL_MS: Record<NotificationSoundType, number> = {
  message: 700,
  call: 1200,
};

const lastPlayedAt: Record<NotificationSoundType, number> = {
  message: 0,
  call: 0,
};

const audioCache = new Map<NotificationSoundType, HTMLAudioElement>();

const getAudio = (type: NotificationSoundType) => {
  if (typeof Audio === "undefined") return null;

  const cached = audioCache.get(type);
  if (cached) return cached;

  const audio = new Audio(NOTIFICATION_SOUNDS[type]);
  audio.preload = "auto";
  audioCache.set(type, audio);
  return audio;
};

const applyCurrentVolume = (audio: HTMLAudioElement) => {
  audio.volume = getNotificationSoundVolume();
};

export const playNotificationSound = (type: NotificationSoundType) => {
  if (!canPlayNotificationSound(type)) return;

  const now = Date.now();
  if (now - lastPlayedAt[type] < MIN_PLAY_INTERVAL_MS[type]) return;

  const audio = getAudio(type);
  if (!audio) return;

  lastPlayedAt[type] = now;
  audio.pause();
  applyCurrentVolume(audio);
  audio.currentTime = 0;
  void audio.play().catch(() => {
    // Browsers can block autoplay until the user interacts with the app.
  });
};

export const startLoopingNotificationSound = (type: NotificationSoundType) => {
  if (!canPlayNotificationSound(type)) return;

  const audio = getAudio(type);
  if (!audio) return;

  audio.loop = true;
  audio.pause();
  applyCurrentVolume(audio);
  audio.currentTime = 0;
  void audio.play().catch(() => {
    // Browsers can block autoplay until the user interacts with the app.
  });
};

export const stopNotificationSound = (type: NotificationSoundType) => {
  const audio = getAudio(type);
  if (!audio) return;

  audio.pause();
  audio.loop = false;
  audio.currentTime = 0;
};
