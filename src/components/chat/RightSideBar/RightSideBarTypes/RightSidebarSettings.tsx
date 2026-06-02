import React from "react";
import {
  FiAtSign,
  FiBell,
  FiImage,
  FiInfo as FiInfoIcon,
  FiPhone,
  FiTrash2,
} from "react-icons/fi";
import { WALLPAPER_PRESETS } from "../../../../constants/wallpaperPresets";
import { useLanguage } from "../../../../context";

interface RightSidebarSettingsProps {
  isGroup: boolean;
  targetUserDetails?: any;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
  onOpenInviteLink?: () => void;
  canOpenInviteLink?: boolean;
  wallpaperUrl?: string | null;
  isWallpaperUpdating?: boolean;
  onChangeWallpaper?: () => void;
  onRemoveWallpaper?: () => void;
  onSelectWallpaperPreset?: (value: string | null) => void;
}

const formatProfileValue = (value: any, fallback: string) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  return String(value);
};

export const RightSidebarSettings: React.FC<RightSidebarSettingsProps> = ({
  isGroup,
  targetUserDetails,
  notificationsEnabled,
  setNotificationsEnabled,
  onOpenInviteLink,
  canOpenInviteLink = true,
  wallpaperUrl,
  isWallpaperUpdating = false,
  onChangeWallpaper,
  onRemoveWallpaper,
  onSelectWallpaperPreset,
}) => {
  const { t } = useLanguage();

  const profileRows = targetUserDetails
    ? [
        {
          icon: FiPhone,
          label: t("settings.phone"),
          value: formatProfileValue(targetUserDetails.phone, t("contacts.notAvailable")),
        },
        {
          icon: FiAtSign,
          label: t("profile.email"),
          value: formatProfileValue(targetUserDetails.email, t("contacts.notAvailable")),
        },
        {
          icon: FiInfoIcon,
          label: t("profile.bio"),
          value: targetUserDetails.bio ? String(targetUserDetails.bio) : "",
        },
      ]
    : [];

  return (
    <div className="py-2 border-b border-gray-100 dark:border-slate-800">
      {!isGroup &&
        profileRows.map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors group"
          >
            <Icon className="text-[#aab8c2] group-hover:text-blue-500 text-xl flex-shrink-0" />
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-[15px] font-medium text-gray-800 dark:text-gray-200 truncate">
                {value}
              </span>
              <span className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">
                {label}
              </span>
            </div>
          </div>
        ))}

      {isGroup && (
        <button
          type="button"
          disabled={!canOpenInviteLink}
          onClick={canOpenInviteLink ? onOpenInviteLink : undefined}
          className="w-full flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group text-left disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
        >
          <FiInfoIcon className="text-[#aab8c2] group-hover:text-blue-500 text-xl mr-4" />
          <div className="flex-1">
            <div className="text-[15px] font-medium text-gray-800 dark:text-gray-200">{t("sidebar.inviteLink")}</div>
            <div className="text-[13px] text-gray-500">
              {canOpenInviteLink
                ? t("sidebar.inviteManage")
                : t("sidebar.inviteRestricted")}
            </div>
          </div>
        </button>
      )}

      <button
        type="button"
        disabled={isWallpaperUpdating}
        onClick={onChangeWallpaper}
        className="w-full flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group text-left disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent"
      >
        <FiImage className="text-[#aab8c2] group-hover:text-blue-500 text-xl mr-4" />
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-medium text-gray-800 dark:text-gray-200">
            {isWallpaperUpdating ? t("sidebar.updatingWallpaper") : t("sidebar.changeWallpaper")}
          </div>
          <div className="text-[13px] text-gray-500 truncate">
            {t("sidebar.wallpaperFormats")}
          </div>
        </div>
      </button>

      <div className="px-4 py-3">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="text-[15px] font-medium text-gray-800 dark:text-gray-200">
            {t("sidebar.backgroundColor")}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {WALLPAPER_PRESETS.map((preset) => {
            const isSelected = preset.value === (wallpaperUrl || null);
            return (
              <button
                key={preset.id}
                type="button"
                disabled={isWallpaperUpdating}
                onClick={() => onSelectWallpaperPreset?.(preset.value)}
                className={`group flex flex-col items-center gap-1.5 rounded-lg p-1.5 text-center transition hover:bg-gray-50 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 ${
                  isSelected
                    ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/30"
                    : ""
                }`}
                title={preset.label}
              >
                <span
                  className="block h-10 w-full rounded-md border border-gray-200 dark:border-slate-700 shadow-sm"
                  style={{ backgroundImage: preset.preview }}
                />
                <span className="max-w-full truncate text-[11px] font-medium text-gray-600 dark:text-gray-300">
                  {preset.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {wallpaperUrl && (
        <button
          type="button"
          disabled={isWallpaperUpdating}
          onClick={onRemoveWallpaper}
          className="w-full flex items-center px-4 py-3 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer transition-colors group text-left disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent"
        >
          <FiTrash2 className="text-red-500 text-xl mr-4" />
          <div className="text-[15px] font-medium text-red-600 dark:text-red-400">
            {t("sidebar.removeWallpaper")}
          </div>
        </button>
      )}

      <div
        className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group"
        onClick={() => setNotificationsEnabled(!notificationsEnabled)}
      >
        <div className="flex items-center">
          <FiBell className="text-[#aab8c2] group-hover:text-blue-500 text-xl mr-4" />
          <div className="text-[15px] font-medium text-gray-800 dark:text-gray-200">{t("sidebar.notifications")}</div>
        </div>
        <div
          className={`w-10 h-5 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
            notificationsEnabled ? "bg-blue-500" : "bg-gray-300 dark:bg-slate-600"
          }`}
        >
          <div
            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
              notificationsEnabled ? "translate-x-4" : ""
            }`}
          ></div>
        </div>
      </div>
    </div>
  );
};
