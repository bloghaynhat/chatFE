import { useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  FiAtSign,
  FiCheck,
  FiInfo,
  FiMail,
  FiMessageCircle,
  FiPhone,
  FiUserPlus,
  FiUserX,
  FiX,
} from "react-icons/fi";
import {
  acceptFriendRequest,
  cancelFriendRequest,
  checkFriendRequestStatus,
  rejectFriendRequest,
  sendFriendRequest,
} from "../../services/friendService";
import { userService } from "../../services/userService";

const unwrapApiData = (payload: any) => {
  if (!payload || typeof payload !== "object") return payload;
  if ("status" in payload && "data" in payload) return payload.data;
  return payload.data || payload;
};

const getDisplayName = (user: any) =>
  user?.displayName || user?.name || user?.username || "Người dùng";

const getAvatarUrl = (user: any) =>
  user?.avatarUrl || user?.avatar || user?.profilePicture || "";

const getJoinedYear = (value: any) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return String(date.getFullYear());
};

const getCurrentUserId = () => {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    const user = JSON.parse(raw);
    return user?.id || user?._id || null;
  } catch {
    return null;
  }
};

export const PublicProfileModal = ({
  isOpen,
  userId,
  onClose,
  onOpenChat,
}: {
  isOpen: boolean;
  userId: string | null;
  onClose: () => void;
  onOpenChat?: (chat: any) => void;
}) => {
  const queryClient = useQueryClient();
  const currentUserId = useMemo(() => getCurrentUserId(), []);
  const isSelf = Boolean(userId && currentUserId && String(userId) === String(currentUserId));

  const profileQuery = useQuery({
    queryKey: ["public-profile", userId],
    queryFn: async () => unwrapApiData(await userService.getUserById(userId as string)),
    enabled: isOpen && Boolean(userId),
    staleTime: 5 * 60 * 1000,
  });

  const statusQuery = useQuery({
    queryKey: ["public-profile-friend-status", userId],
    queryFn: async () => unwrapApiData(await checkFriendRequestStatus(userId)),
    enabled: isOpen && Boolean(userId) && !isSelf,
  });

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const invalidateStatus = () => {
    queryClient.invalidateQueries({ queryKey: ["public-profile-friend-status", userId] });
    window.dispatchEvent(new Event("friendList_refresh"));
    window.dispatchEvent(new Event("chatList:refresh"));
  };

  const addFriendMutation = useMutation({
    mutationFn: () => sendFriendRequest(userId),
    onSuccess: () => {
      toast.success("Đã gửi lời mời kết bạn");
      invalidateStatus();
    },
    onError: (error: any) => toast.error(error?.message || "Không thể gửi lời mời"),
  });

  const cancelMutation = useMutation({
    mutationFn: (requestId: string) => cancelFriendRequest(requestId),
    onSuccess: () => {
      toast.success("Đã hủy lời mời");
      invalidateStatus();
    },
    onError: (error: any) => toast.error(error?.message || "Không thể hủy lời mời"),
  });

  const acceptMutation = useMutation({
    mutationFn: (requestId: string) => acceptFriendRequest(requestId),
    onSuccess: () => {
      toast.success("Đã chấp nhận lời mời");
      invalidateStatus();
    },
    onError: (error: any) => toast.error(error?.message || "Không thể chấp nhận lời mời"),
  });

  const rejectMutation = useMutation({
    mutationFn: (requestId: string) => rejectFriendRequest(requestId),
    onSuccess: () => {
      toast.success("Đã từ chối lời mời");
      invalidateStatus();
    },
    onError: (error: any) => toast.error(error?.message || "Không thể từ chối lời mời"),
  });

  const profile = profileQuery.data || {};
  const displayName = getDisplayName(profile);
  const avatarUrl = getAvatarUrl(profile);
  const joinedYear = getJoinedYear(profile?.createdAt);
  const status = isSelf ? "SELF" : statusQuery.data?.status || "NONE";
  const direction = statusQuery.data?.direction || null;
  const requestId = statusQuery.data?.requestId || null;
  const isActionLoading =
    addFriendMutation.isPending ||
    cancelMutation.isPending ||
    acceptMutation.isPending ||
    rejectMutation.isPending;

  const openChat = () => {
    if (!userId || !onOpenChat) return;
    onOpenChat({
      id: `temp-${userId}`,
      targetUserId: userId,
      type: "private",
      name: displayName,
      displayName,
      avatarUrl,
      targetUser: profile,
    });
    onClose();
  };

  const rows = [
    profile?.username
      ? { icon: FiAtSign, label: "Username", value: profile.username }
      : null,
    profile?.phone ? { icon: FiPhone, label: "Phone", value: profile.phone } : null,
    profile?.email ? { icon: FiMail, label: "Email", value: profile.email } : null,
    profile?.bio ? { icon: FiInfo, label: "Bio", value: profile.bio } : null,
  ].filter(Boolean) as Array<{ icon: any; label: string; value: string }>;

  const renderRelationshipActions = () => {
    if (profileQuery.isLoading || statusQuery.isLoading) {
      return (
        <div className="h-11 w-full rounded-xl bg-gray-100 dark:bg-slate-800 animate-pulse" />
      );
    }

    if (isSelf || status === "SELF") {
      return (
        <div className="min-h-[44px] w-full rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 text-sm font-semibold inline-flex items-center justify-center">
          Đây là bạn
        </div>
      );
    }

    if (status === "ACCEPTED") {
      return (
        <button
          onClick={openChat}
          className="min-h-[46px] w-full max-w-[260px] rounded-full bg-blue-500 px-5 text-white text-sm font-semibold inline-flex items-center justify-center gap-2.5 hover:bg-blue-600 active:scale-[0.98] transition shadow-[0_10px_24px_-14px_rgba(37,99,235,0.9)]"
        >
          <span className="h-7 w-7 rounded-full bg-white/18 inline-flex items-center justify-center">
            <FiMessageCircle className="text-[16px]" />
          </span>
          Nhắn tin
        </button>
      );
    }

    if (status === "PENDING" && direction === "OUTGOING") {
      return (
        <div className="grid w-full grid-cols-[1fr_auto] gap-2">
          <button
            disabled
            className="min-h-[44px] rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300 text-sm font-semibold inline-flex items-center justify-center gap-2"
          >
            <FiCheck />
            Đã gửi lời mời
          </button>
          <button
            disabled={!requestId || isActionLoading}
            onClick={() => requestId && cancelMutation.mutate(requestId)}
            className="min-h-[44px] px-4 rounded-xl border border-slate-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60"
          >
            Hủy
          </button>
        </div>
      );
    }

    if (status === "PENDING" && direction === "INCOMING") {
      return (
        <div className="grid w-full grid-cols-2 gap-2">
          <button
            disabled={!requestId || isActionLoading}
            onClick={() => requestId && acceptMutation.mutate(requestId)}
            className="min-h-[44px] rounded-xl bg-blue-500 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-blue-600 disabled:opacity-60"
          >
            <FiCheck />
            Chấp nhận
          </button>
          <button
            disabled={!requestId || isActionLoading}
            onClick={() => requestId && rejectMutation.mutate(requestId)}
            className="min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60"
          >
            <FiUserX />
            Từ chối
          </button>
        </div>
      );
    }

    return (
      <div className="grid w-full grid-cols-2 gap-2">
        <button
          onClick={openChat}
          className="min-h-[44px] rounded-xl bg-blue-500 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-blue-600 transition"
        >
          <FiMessageCircle />
          Nhắn tin
        </button>
        <button
          disabled={isActionLoading}
          onClick={() => addFriendMutation.mutate()}
          className="min-h-[44px] rounded-xl border border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-blue-100 dark:hover:bg-blue-900/50 disabled:opacity-60"
        >
          <FiUserPlus />
          Kết bạn
        </button>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center bg-black/45 p-0 sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="w-full sm:max-w-[460px] max-h-[78dvh] sm:max-h-[86vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-white/70 dark:border-slate-700"
          >
            <div className="sticky top-0 z-10 flex justify-end p-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur">
              <button
                onClick={onClose}
                className="h-9 w-9 rounded-full inline-flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 dark:text-gray-300"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            <div className="px-5 pb-5 -mt-2">
              {profileQuery.isError ? (
                <div className="py-12 text-center">
                  <p className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">
                    Không thể tải hồ sơ
                  </p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Hồ sơ này có thể bị giới hạn bởi cài đặt quyền riêng tư.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex flex-col items-center text-center">
                    <div className="relative h-24 w-24 rounded-full bg-blue-100 text-blue-600 overflow-hidden flex items-center justify-center text-4xl font-bold shadow-sm border-4 border-white dark:border-slate-800">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                      ) : (
                        displayName.charAt(0).toUpperCase()
                      )}
                      {profile?.status === "online" && (
                        <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-800" />
                      )}
                    </div>
                    <h2 className="mt-3 text-xl font-semibold text-gray-900 dark:text-gray-100 break-words">
                      {profileQuery.isLoading ? "Đang tải..." : displayName}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {profile?.username
                        ? `@${profile.username}`
                        : joinedYear
                          ? `Đã tham gia từ ${joinedYear}`
                          : profile?.phone || "Hồ sơ người dùng"}
                    </p>
                    {status === "ACCEPTED" && (
                      <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[12px] font-semibold text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300">
                        <FiCheck className="text-[13px]" />
                        Bạn bè
                      </div>
                    )}
                  </div>

                  <div className="mt-5 flex justify-center">{renderRelationshipActions()}</div>

                  <div className="mt-5 border-t border-gray-100 dark:border-slate-800 pt-3">
                    {rows.length === 0 ? (
                      <div className="rounded-xl bg-gray-50 dark:bg-slate-800/70 px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        Người dùng chưa cập nhật thông tin công khai.
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {rows.map(({ icon: Icon, label, value }) => (
                          <div
                            key={label}
                            className="flex items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-800/70 transition"
                          >
                            <Icon className="mt-0.5 text-[18px] text-blue-500 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-[13px] text-gray-500 dark:text-gray-400">{label}</p>
                              <p className="text-[14px] font-medium text-gray-900 dark:text-gray-100 break-words">
                                {value}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PublicProfileModal;
