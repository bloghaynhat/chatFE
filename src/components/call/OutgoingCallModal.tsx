import { FiPhoneCall, FiPhoneOff, FiUsers, FiVideo } from "react-icons/fi";
import { useCallV2 } from "../../providers/CallV2SocketProvider";

export default function OutgoingCallModal() {
  const callV2 = useCallV2();
  const state = callV2.state;

  if (state.status !== "calling") return null;

  const participants = Object.values(state.participants || {});
  const busyCount = state.busyUserIds?.length || 0;
  const ringingCount = participants.filter(
    (participant) => participant.status === "ringing" || participant.status === "invited",
  ).length;
  const declinedCount =
    participants.filter(
      (participant) =>
        participant.status === "declined" ||
        participant.status === "missed" ||
        participant.status === "busy",
    ).length + busyCount;
  const peerName = state.remotePeer?.name || "Recipient";
  const peerInitial = peerName.trim().charAt(0).toUpperCase() || "?";
  const isGroupCall = state.isGroup;
  const groupName = state.groupName || (isGroupCall ? peerName : "");
  const callLabel = isGroupCall
    ? state.type === "video"
      ? "Group video call"
      : "Group voice call"
    : state.type === "video"
      ? "Video call"
      : "Voice call";
  const statusText = isGroupCall ? "Waiting for members to answer..." : "Waiting for answer...";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-md">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_18%,rgba(125,211,252,0.24),transparent_30%),radial-gradient(circle_at_74%_82%,rgba(37,99,235,0.22),transparent_34%)]" />
      <div className="relative w-full max-w-[390px] overflow-hidden rounded-[24px] border border-white/70 bg-white/95 shadow-[0_28px_80px_rgba(15,23,42,0.28)] backdrop-blur-2xl dark:border-slate-700 dark:bg-slate-900/95">
        <div className="relative px-6 pt-6 pb-5">
          <div className="absolute left-1/2 top-6 h-28 w-28 -translate-x-1/2 rounded-full bg-sky-400/15 blur-2xl" />

          <div className="relative mx-auto flex h-[104px] w-[104px] items-center justify-center rounded-full bg-sky-50 ring-1 ring-sky-100 dark:bg-slate-800 dark:ring-slate-700">
            <span className="absolute inset-[-7px] animate-ping rounded-full border border-sky-300/50" />
            <span className="absolute inset-[-2px] rounded-full border border-white/80 dark:border-white/10" />
            <div className="h-[88px] w-[88px] overflow-hidden rounded-full bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-[0_16px_34px_rgba(37,99,235,0.28)]">
              {state.remotePeer?.avatarUrl ? (
                <img src={state.remotePeer.avatarUrl} alt={peerName} className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-4xl font-semibold">{peerInitial}</span>
              )}
            </div>
          </div>

          <div className="relative mt-4 text-center">
            <div className="mx-auto mb-2 inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-100 dark:bg-sky-950/40 dark:text-sky-300 dark:ring-sky-900">
              {state.type === "video" ? <FiVideo className="h-3.5 w-3.5" /> : <FiPhoneCall className="h-3.5 w-3.5" />}
              {callLabel}
              {busyCount > 0 ? ` · ${busyCount} busy` : ""}
            </div>

            <p className="mx-auto max-w-[19rem] truncate text-[22px] font-semibold leading-tight text-slate-950 dark:text-white">
              {peerName}
            </p>

            <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">{statusText}</p>

            {isGroupCall && (
              <div className="mx-auto mt-3 flex max-w-[19rem] items-center justify-center gap-2 rounded-2xl bg-slate-100/85 px-3 py-2 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700">
                <FiUsers className="h-4 w-4 shrink-0 text-sky-600 dark:text-sky-300" />
                <span className="truncate">{groupName}</span>
              </div>
            )}

            {participants.length > 0 && (
              <p className="mt-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                {ringingCount} ringing
                {declinedCount > 0 ? ` - ${declinedCount} unavailable` : ""}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center border-t border-slate-100 bg-slate-50/80 px-6 py-5 dark:border-slate-800 dark:bg-slate-950/35">
          <button
            onClick={callV2.leaveCallV2}
            aria-label="Cancel call"
            className="group flex flex-col items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-red-500"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white shadow-[0_14px_30px_rgba(239,68,68,0.34)] transition group-hover:-translate-y-0.5 group-hover:bg-red-600">
              <FiPhoneOff className="h-6 w-6" />
            </span>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
