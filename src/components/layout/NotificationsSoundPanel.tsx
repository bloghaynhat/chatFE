import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  FiArrowLeft,
  FiBell,
  FiMessageCircle,
  FiMonitor,
  FiPhoneCall,
  FiVolume2,
} from "react-icons/fi";
import { useLanguage } from "../../context";
import {
  getNotificationPreferences,
  NotificationPreferences,
  updateNotificationPreferences,
} from "../../services/notificationPreferences";
import {
  playNotificationSound,
  stopNotificationSound,
} from "../../services/notificationSound";

const copy = {
  en: {
    title: "Notifications and Sounds",
    sounds: "Sounds",
    messageSound: "Incoming message sound",
    messageSoundHint: "Play a short sound when a new message arrives.",
    callSound: "Incoming call ringtone",
    callSoundHint: "Loop the ringtone while an incoming call is ringing.",
    tab: "Browser tab",
    tabBadge: "Unread count on tab",
    tabBadgeHint: "Show unread count in the browser tab title and favicon.",
    allSounds: "Notification sounds",
    allSoundsHint: "Master switch for message and call sounds.",
    volume: "Sound volume",
    test: "Test",
  },
  vi: {
    title: "Thông báo và âm thanh",
    sounds: "Âm thanh",
    messageSound: "Âm tin nhắn đến",
    messageSoundHint: "Phát âm thanh ngắn khi có tin nhắn mới.",
    callSound: "Chuông cuộc gọi đến",
    callSoundHint: "Lặp chuông khi có cuộc gọi đến.",
    tab: "Thanh tab trình duyệt",
    tabBadge: "Số tin chưa đọc trên tab",
    tabBadgeHint: "Hiển thị số chưa đọc ở tiêu đề tab và favicon.",
    allSounds: "Âm thanh thông báo",
    allSoundsHint: "Công tắc tổng cho âm tin nhắn và chuông cuộc gọi.",
    volume: "Âm lượng",
    test: "Thử",
  },
};

const ToggleRow = ({
  icon,
  title,
  description,
  checked,
  onChange,
  disabled = false,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  action?: React.ReactNode;
}) => (
  <div className="flex items-center gap-3 px-4 py-3.5">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-300">
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <div className="text-[15px] font-medium text-gray-900 dark:text-white">
        {title}
      </div>
      <div className="mt-0.5 text-[13px] leading-snug text-gray-500 dark:text-gray-400">
        {description}
      </div>
    </div>
    {action}
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`flex h-6 w-11 shrink-0 items-center rounded-full p-1 transition-colors ${
        checked ? "bg-blue-500" : "bg-gray-300 dark:bg-slate-600"
      } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
      aria-pressed={checked}
    >
      <span
        className={`h-4 w-4 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  </div>
);

export const NotificationsSoundPanel = ({ isCollapsed, onBack }: any) => {
  const { language } = useLanguage();
  const labels = copy[language] || copy.en;
  const [preferences, setPreferences] = useState<NotificationPreferences>(() =>
    getNotificationPreferences(),
  );

  useEffect(() => {
    const handleChanged = (event: any) => {
      setPreferences(event?.detail || getNotificationPreferences());
    };

    window.addEventListener("notification-preferences:changed", handleChanged);
    return () =>
      window.removeEventListener("notification-preferences:changed", handleChanged);
  }, []);

  const update = (updates: Partial<NotificationPreferences>) => {
    setPreferences(updateNotificationPreferences(updates));
  };

  if (isCollapsed) {
    return (
      <div className="flex-1 flex flex-col items-center py-4 bg-white dark:bg-slate-900 border-l border-gray-100 dark:border-slate-800">
        <button onClick={onBack} className="p-2 mb-4 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full text-gray-500 dark:text-gray-400">
          <FiArrowLeft className="text-xl" />
        </button>
        <FiBell className="text-2xl text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden">
      <div className="flex items-center gap-5 px-4 py-2.5 bg-white dark:bg-slate-900 shadow-sm z-10 shrink-0">
        <button onClick={onBack} className="text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 p-2 rounded-full transition -ml-2">
          <FiArrowLeft className="text-xl" />
        </button>
        <h2 className="text-[19px] font-medium text-gray-900 dark:text-white">
          {labels.title}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900 pb-8">
        <div className="h-2 bg-gray-100/50 dark:bg-slate-950 w-full" />
        <div className="px-4 pb-1 pt-4 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {labels.sounds}
        </div>
        <ToggleRow
          icon={<FiVolume2 className="text-xl" />}
          title={labels.allSounds}
          description={labels.allSoundsHint}
          checked={preferences.soundEnabled}
          onChange={(checked) => update({ soundEnabled: checked })}
        />
        <div className={`px-4 pb-3 ${preferences.soundEnabled ? "" : "opacity-50"}`}>
          <div className="mb-2 flex items-center justify-between text-[13px] font-medium text-gray-600 dark:text-gray-300">
            <span>{labels.volume}</span>
            <span>{Math.round(preferences.soundVolume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            disabled={!preferences.soundEnabled}
            value={Math.round(preferences.soundVolume * 100)}
            onChange={(event) =>
              update({ soundVolume: Number(event.target.value) / 100 })
            }
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-gray-200 accent-blue-500 disabled:cursor-not-allowed dark:bg-slate-700"
            aria-label={labels.volume}
          />
        </div>
        <ToggleRow
          icon={<FiMessageCircle className="text-xl" />}
          title={labels.messageSound}
          description={labels.messageSoundHint}
          checked={preferences.messageSoundEnabled}
          disabled={!preferences.soundEnabled}
          onChange={(checked) => update({ messageSoundEnabled: checked })}
          action={
            <button
              type="button"
              disabled={!preferences.soundEnabled || !preferences.messageSoundEnabled}
              onClick={() => playNotificationSound("message")}
              className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-blue-300 dark:hover:bg-blue-500/10"
            >
              {labels.test}
            </button>
          }
        />
        <ToggleRow
          icon={<FiPhoneCall className="text-xl" />}
          title={labels.callSound}
          description={labels.callSoundHint}
          checked={preferences.callSoundEnabled}
          disabled={!preferences.soundEnabled}
          onChange={(checked) => {
            if (!checked) stopNotificationSound("call");
            update({ callSoundEnabled: checked });
          }}
          action={
            <button
              type="button"
              disabled={!preferences.soundEnabled || !preferences.callSoundEnabled}
              onClick={() => playNotificationSound("call")}
              className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-blue-300 dark:hover:bg-blue-500/10"
            >
              {labels.test}
            </button>
          }
        />

        <div className="h-2 bg-gray-100/50 dark:bg-slate-950 w-full" />
        <div className="px-4 pb-1 pt-4 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {labels.tab}
        </div>
        <ToggleRow
          icon={<FiMonitor className="text-xl" />}
          title={labels.tabBadge}
          description={labels.tabBadgeHint}
          checked={preferences.tabBadgeEnabled}
          onChange={(checked) => update({ tabBadgeEnabled: checked })}
        />
      </div>
    </div>
  );
};
