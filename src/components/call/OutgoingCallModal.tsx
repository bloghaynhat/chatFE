import { FiPhone, FiPhoneOff } from "react-icons/fi";
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#dceefb]/85 p-4 backdrop-blur-md">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(64,169,255,0.28),transparent_30%),radial-gradient(circle_at_82%_75%,rgba(36,145,232,0.24),transparent_34%)]" />
      <div className="relative w-full max-w-[23rem] overflow-hidden rounded-[28px] border border-white/80 bg-white/85 p-6 shadow-[0_24px_70px_rgba(35,95,145,0.28)] backdrop-blur-2xl">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#37a9f2] via-[#229ed9] to-[#5cc6ff]" />

        <div className="flex flex-col items-center gap-4">
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#5fc3ff] to-[#229ed9] text-white shadow-[0_18px_40px_rgba(34,158,217,0.32)]">
            <span className="absolute inset-[-7px] animate-ping rounded-full border border-[#229ed9]/40" />
            <FiPhone className="h-10 w-10" />
          </div>

          <div className="text-center">
            <p className="text-xl font-semibold text-slate-900">Dang goi...</p>
            <p className="mt-1 text-sm font-medium text-[#229ed9]">
              {state.type === "video" ? "Goi video" : "Goi thoai"}
            </p>
            {participants.length > 0 && (
              <p className="mt-2 text-xs text-slate-500">
                {ringingCount} dang do chuong
                {declinedCount > 0 ? ` - ${declinedCount} khong san sang` : ""}
              </p>
            )}
          </div>
        </div>

        <div className="mt-7 flex items-center justify-center">
          <button
            onClick={callV2.leaveCallV2}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-[#ff4d5e] shadow-[0_14px_28px_rgba(255,77,94,0.34)] transition hover:-translate-y-0.5 hover:bg-[#e94352]"
          >
            <FiPhoneOff className="h-6 w-6 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
