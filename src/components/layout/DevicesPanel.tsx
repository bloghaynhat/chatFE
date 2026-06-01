import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiArrowLeft,
  FiMonitor,
  FiRefreshCw,
  FiSmartphone,
  FiTrash2,
  FiXCircle,
} from "react-icons/fi";
import { authService } from "../../services/authService";

type SessionDevice = {
  deviceId: string;
  deviceType?: string;
  displayLabel?: string;
  platform?: string;
  ip?: string;
  location?: string;
  createdAt?: string;
  lastActive?: string;
  isCurrent?: boolean;
};

const formatDateTime = (value?: string) => {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  });
};

const getDeviceTitle = (session: SessionDevice) =>
  session.displayLabel ||
  `${session.platform || "Unknown"} ${session.deviceType || "device"}`;

const getDeviceSubtitle = (session: SessionDevice) => {
  const parts = [session.platform, session.deviceType]
    .filter(Boolean)
    .map((part) => String(part));
  return parts.length > 0 ? parts.join(", ") : "Unknown device";
};

const DeviceIcon = ({ session }: { session: SessionDevice }) => {
  const value = `${session.platform || ""} ${session.deviceType || ""}`.toLowerCase();
  const Icon = value.includes("mobile") || value.includes("app") || value.includes("phone")
    ? FiSmartphone
    : FiMonitor;

  return (
    <div className="h-10 w-10 rounded-full bg-blue-50 dark:bg-slate-800 text-blue-500 dark:text-blue-300 flex items-center justify-center shrink-0">
      <Icon className="text-xl" />
    </div>
  );
};

const SessionRow = ({
  session,
  onRevoke,
  isRevoking,
}: {
  session: SessionDevice;
  onRevoke: (deviceId: string) => void;
  isRevoking: boolean;
}) => (
  <div className="py-3 hover:bg-gray-50 dark:hover:bg-slate-800 transition -mx-5 px-5 flex justify-between gap-4">
    <div className="flex gap-3 min-w-0">
      <DeviceIcon session={session} />
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[15px] font-medium text-gray-900 dark:text-white leading-tight truncate">
            {getDeviceTitle(session)}
          </p>
          {session.isCurrent && (
            <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded-full">
              Current
            </span>
          )}
        </div>
        <p className="text-[14px] text-gray-500 dark:text-gray-400 leading-snug truncate">
          {getDeviceSubtitle(session)}
        </p>
        <p className="text-[14px] text-gray-400 dark:text-gray-500 leading-snug truncate">
          {session.location || session.ip || "Unknown location"}
        </p>
      </div>
    </div>

    <div className="flex items-start gap-2 shrink-0">
      <span className="text-[13px] text-gray-400 mt-0.5">
        {formatDateTime(session.lastActive || session.createdAt)}
      </span>
      {!session.isCurrent && (
        <button
          onClick={() => onRevoke(session.deviceId)}
          disabled={isRevoking}
          className="h-8 w-8 inline-flex items-center justify-center rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition"
          title="Log out this device"
        >
          {isRevoking ? (
            <FiRefreshCw className="text-[16px] animate-spin" />
          ) : (
            <FiTrash2 className="text-[16px]" />
          )}
        </button>
      )}
    </div>
  </div>
);

export const DevicesPanel = ({ isCollapsed, onBack }: any) => {
  const [sessions, setSessions] = useState<SessionDevice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [revokingDeviceId, setRevokingDeviceId] = useState<string | null>(null);
  const [isRevokingOthers, setIsRevokingOthers] = useState(false);

  const loadSessions = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await authService.getSessions();
      setSessions(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.message || "Could not load active sessions.");
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const currentSession = useMemo(
    () => sessions.find((session) => session.isCurrent) || null,
    [sessions],
  );
  const otherSessions = useMemo(
    () => sessions.filter((session) => !session.isCurrent),
    [sessions],
  );

  const revokeSession = async (deviceId: string) => {
    const confirmed = window.confirm("Log out this device?");
    if (!confirmed) return;

    setRevokingDeviceId(deviceId);
    setError("");
    try {
      await authService.revokeSession(deviceId);
      setSessions((prev) => prev.filter((session) => session.deviceId !== deviceId));
      window.dispatchEvent(new Event("auth:sessions-changed"));
    } catch (err: any) {
      setError(err?.message || "Could not log out this device.");
    } finally {
      setRevokingDeviceId(null);
    }
  };

  const revokeOtherSessions = async () => {
    if (otherSessions.length === 0) return;
    const confirmed = window.confirm("Log out all other devices?");
    if (!confirmed) return;

    setIsRevokingOthers(true);
    setError("");
    try {
      await authService.revokeOtherSessions();
      await loadSessions();
      window.dispatchEvent(new Event("auth:sessions-changed"));
    } catch (err: any) {
      setError(err?.message || "Could not log out other devices.");
    } finally {
      setIsRevokingOthers(false);
    }
  };

  if (isCollapsed) {
    return (
      <div className="flex-1 flex flex-col items-center py-4 bg-white dark:bg-slate-900 border-l border-gray-100 dark:border-slate-800">
        <button onClick={onBack} className="p-2 mb-4 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full text-gray-500 dark:text-gray-400">
          <FiArrowLeft className="text-xl" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-slate-900 shadow-sm z-10 shrink-0">
        <button onClick={onBack} className="text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 p-2 rounded-full transition -ml-2">
          <FiArrowLeft className="text-xl" />
        </button>
        <h2 className="text-[19px] font-medium text-gray-900 dark:text-white flex-1">Active Sessions</h2>
        <button
          onClick={loadSessions}
          disabled={isLoading}
          className="h-9 w-9 inline-flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-50 transition"
          title="Refresh"
        >
          <FiRefreshCw className={isLoading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900">
        {error && (
          <div className="mx-5 mt-4 rounded-lg border border-red-100 dark:border-red-900/40 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-600 dark:text-red-300 flex items-center gap-2">
            <FiXCircle className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="px-5 pt-4 pb-2">
          <h3 className="text-[15px] font-medium text-blue-500 mb-3 tracking-wide">This device</h3>

          {isLoading && !currentSession ? (
            <div className="py-4 text-sm text-gray-500 dark:text-gray-400">Loading sessions...</div>
          ) : currentSession ? (
            <div className="mb-4">
              <SessionRow
                session={currentSession}
                onRevoke={revokeSession}
                isRevoking={false}
              />
            </div>
          ) : (
            <div className="py-4 text-sm text-gray-500 dark:text-gray-400">Current device not found.</div>
          )}

          <button
            onClick={revokeOtherSessions}
            disabled={isRevokingOthers || otherSessions.length === 0}
            className="flex items-center gap-4 text-red-500 hover:text-red-600 disabled:text-gray-300 dark:disabled:text-gray-600 transition w-full py-1"
          >
            {isRevokingOthers ? (
              <FiRefreshCw className="text-2xl shrink-0 stroke-[1.5] animate-spin" />
            ) : (
              <FiTrash2 className="text-2xl shrink-0 stroke-[1.5]" />
            )}
            <span className="text-[15px] font-normal">Terminate All Other Sessions</span>
          </button>
        </div>

        <div className="bg-[#f4f4f5] dark:bg-slate-800/80 px-4 py-3 border-y border-gray-200/50 dark:border-slate-700/50">
          <p className="text-[13.5px] text-gray-500 dark:text-gray-400 leading-relaxed">
            Logs out all devices except for this one.
          </p>
        </div>

        <div className="px-5 pt-4 pb-2">
          <h3 className="text-[15px] font-medium text-blue-500 mb-2 tracking-wide">Active sessions</h3>

          {isLoading && sessions.length === 0 ? (
            <div className="py-6 text-sm text-gray-500 dark:text-gray-400">Loading active sessions...</div>
          ) : otherSessions.length === 0 ? (
            <div className="py-6 text-sm text-gray-500 dark:text-gray-400">No other active sessions.</div>
          ) : (
            otherSessions.map((session) => (
              <SessionRow
                key={session.deviceId}
                session={session}
                onRevoke={revokeSession}
                isRevoking={revokingDeviceId === session.deviceId}
              />
            ))
          )}
        </div>

        <div className="bg-[#f4f4f5] dark:bg-slate-800/80 px-4 py-3 border-t border-gray-200/50 dark:border-slate-700/50 pb-8 min-h-[50vh]">
          <p className="text-[13.5px] text-gray-500 dark:text-gray-400 leading-relaxed">
            You can review all logged-in devices and remotely log out sessions you no longer use.
          </p>
        </div>
      </div>
    </div>
  );
};
