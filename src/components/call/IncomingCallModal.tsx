import { useState } from "react";
import { FiPhone, FiPhoneOff, FiVideo } from "react-icons/fi";
import { useCallV2 } from "../../providers/CallV2SocketProvider";

export default function IncomingCallModal() {
  const callV2 = useCallV2();
  const state = callV2.state;

  const [isAccepting, setIsAccepting] = useState(false);

  if (state.status !== "incoming") return null;

  const handleAccept = async () => {
    if (isAccepting) return;
    setIsAccepting(true);
    try {
      await callV2.joinCallV2();
    } finally {
      setIsAccepting(false);
    }
  };

  const handleReject = async () => {
    await callV2.rejectCallV2();
  };

  const busyCount = state.busyUserIds?.length || 0;
  const peerName = state.remotePeer?.name || "Caller";
  const peerInitial = peerName.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#dceefb]/85 p-4 backdrop-blur-md">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(64,169,255,0.28),transparent_32%),radial-gradient(circle_at_78%_78%,rgba(36,145,232,0.24),transparent_34%)]" />
      <div className="relative w-full max-w-[23rem] overflow-hidden rounded-[28px] border border-white/80 bg-white/85 p-6 shadow-[0_24px_70px_rgba(35,95,145,0.28)] backdrop-blur-2xl">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#37a9f2] via-[#229ed9] to-[#5cc6ff]" />

        <div className="flex flex-col items-center gap-4">
          <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#5fc3ff] to-[#229ed9] text-white shadow-[0_18px_40px_rgba(34,158,217,0.32)]">
            <span className="absolute inset-0 z-10 rounded-full border border-white/55" />
            {state.remotePeer?.avatarUrl ? (
              <img src={state.remotePeer.avatarUrl} alt={peerName} className="h-full w-full object-cover" />
            ) : (
              <span className="text-4xl font-semibold">{peerInitial}</span>
            )}
          </div>

          <div className="text-center">
            <p className="max-w-[18rem] truncate text-xl font-semibold text-slate-900">{peerName}</p>
            <p className="mt-1 flex items-center justify-center gap-1.5 text-sm font-medium text-[#229ed9]">
              {state.type === "video" ? <FiVideo className="h-4 w-4" /> : <FiPhone className="h-4 w-4" />}
              {state.type === "video" ? "Video call" : "Voice call"}
              {busyCount > 0 ? ` - ${busyCount} busy` : ""}
            </p>
            <p className="mt-1 text-xs text-slate-500">is calling you</p>
          </div>
        </div>

        <div className="mt-7 flex items-center justify-center gap-8">
          <button
            onClick={handleReject}
            aria-label="Reject call"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-[#ff4d5e] shadow-[0_14px_28px_rgba(255,77,94,0.34)] transition hover:-translate-y-0.5 hover:bg-[#e94352]"
          >
            <FiPhoneOff className="h-6 w-6 text-white" />
          </button>
          <button
            onClick={handleAccept}
            disabled={isAccepting}
            aria-label="Accept call"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-[#34c759] shadow-[0_14px_28px_rgba(52,199,89,0.32)] transition hover:-translate-y-0.5 hover:bg-[#2eb84f] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiPhone className="h-6 w-6 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
