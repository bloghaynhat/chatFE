import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { FiMessageCircle, FiUser } from "react-icons/fi";
import { PublicProfileModal } from "../../../common/PublicProfileModal";
import { userService } from "../../../../services/userService";

const unwrapUser = (payload: any) => {
  if (!payload || typeof payload !== "object") return payload;
  if ("status" in payload && "data" in payload) return payload.data;
  return payload.data || payload;
};

export const extractProfileCardUserId = (message: any, text?: string) => {
  const candidates = [
    message?.profileCard?.userId,
    message?.profileCardUserId,
    message?.profileUserId,
    message?.targetUserId,
    message?.sharedUserId,
    message?.systemRefId,
    message?.refId,
    message?.metadata?.userId,
    message?.meta?.userId,
    text,
    message?.text,
    message?.content,
  ];

  return candidates.find(
    (value) => typeof value === "string" && value.trim().length >= 8,
  )?.trim();
};

export const ProfileCardMessage = ({ message, text, mine, onOpenChat }: any) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const userId = useMemo(() => extractProfileCardUserId(message, text), [message, text]);

  const userQuery = useQuery({
    queryKey: ["profile-card-user", userId],
    queryFn: async () => unwrapUser(await userService.getUserById(userId)),
    enabled: Boolean(userId),
    staleTime: 5 * 60 * 1000,
  });

  const user = userQuery.data || message?.profileCard || {};
  const displayName =
    user?.displayName || user?.name || user?.username || (userQuery.isLoading ? "Đang tải..." : "Người dùng");
  const avatarUrl = user?.avatarUrl || user?.avatar || user?.profilePicture;
  const subtitle = user?.createdAt
    ? `Đã tham gia từ ${new Date(user.createdAt).getFullYear()}`
    : user?.bio || user?.phone || "Danh thiếp liên hệ";

  const handleOpenChat = () => {
    if (!userId) {
      toast.error("Không tìm thấy người dùng trong danh thiếp");
      return;
    }

    if (!onOpenChat) {
      toast.error("Không thể mở cuộc trò chuyện lúc này");
      return;
    }

    onOpenChat({
      id: `temp-${userId}`,
      targetUserId: userId,
      type: "private",
      name: displayName,
      displayName,
      avatarUrl,
      targetUser: user,
    });
  };

  return (
    <div className="px-3 pt-3 pb-1">
      <div
        className={`w-[280px] max-w-[72vw] rounded-2xl border shadow-sm backdrop-blur-md transition-transform hover:-translate-y-0.5 ${
          mine
            ? "bg-white/70 dark:bg-slate-800/70 border-emerald-200/70 dark:border-slate-700"
            : "bg-white/70 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700"
        }`}
      >
        <div className="p-4 flex items-center gap-3">
          <div className="relative h-14 w-14 rounded-full border-2 border-blue-500/20 bg-blue-100 text-blue-600 overflow-hidden flex items-center justify-center text-xl font-bold shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              displayName.charAt(0).toUpperCase()
            )}
            <span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-800" />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-semibold leading-tight text-gray-900 dark:text-gray-100 truncate">
              {displayName}
            </p>
            <p className="text-[13px] text-gray-500 dark:text-gray-400 truncate">
              {userQuery.isError ? "Không thể tải hồ sơ" : subtitle}
            </p>
          </div>
        </div>

        <div className="border-t border-slate-200/50 dark:border-slate-700/70 p-3 flex gap-2">
          <button
            disabled={!userId}
            onClick={handleOpenChat}
            className="min-h-[44px] flex-1 rounded-xl bg-blue-500 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-blue-600 disabled:opacity-60"
          >
            <FiMessageCircle />
            Nhắn tin
          </button>
          <button
            onClick={() => {
              if (!userId) {
                toast.error("Không tìm thấy người dùng trong danh thiếp");
                return;
              }
              setIsProfileOpen(true);
            }}
            className="min-h-[44px] flex-1 rounded-xl border border-slate-300 dark:border-slate-600 text-gray-700 dark:text-gray-100 text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <FiUser />
            Xem hồ sơ
          </button>
        </div>
      </div>

      <PublicProfileModal
        isOpen={isProfileOpen}
        userId={userId || null}
        onClose={() => setIsProfileOpen(false)}
        onOpenChat={onOpenChat}
      />
    </div>
  );
};
