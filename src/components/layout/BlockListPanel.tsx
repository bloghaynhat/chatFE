import { useCallback, useEffect, useState } from "react";
import { FiArrowLeft, FiSlash } from "react-icons/fi";
import { Avatar } from "../contacts/shared";
import { getBlockedUsers, socketService, unblockUser, userService } from "../../services";
import { toast } from "sonner";

const unwrapApiData = (payload: any) => {
  if (!payload || typeof payload !== "object") return payload;
  if ("status" in payload && "data" in payload) return payload.data;
  return payload.data || payload;
};

const getBlockedUserId = (item: any) =>
  item?.blockedUserId ||
  item?.blockedUser?.id ||
  item?.blockedUser?._id ||
  item?.user?.id ||
  item?.user?._id;

const getDisplayUser = (item: any) => item?.profile || item?.blockedUser || item?.user || {};

export const BlockListPanel = ({ isCollapsed, onBack }: any) => {
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadBlockedUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getBlockedUsers({ page: 1, limit: 100 });
      const payload = unwrapApiData(response) || {};
      const items = Array.isArray(payload) ? payload : payload.items || [];

      const enriched = await Promise.all(
        items.map(async (item: any) => {
          const blockedUserId = getBlockedUserId(item);
          if (!blockedUserId) return item;

          try {
            const profileResponse = await userService.getUserById(blockedUserId);
            const profile = unwrapApiData(profileResponse);
            return { ...item, profile };
          } catch (err) {
            return item;
          }
        }),
      );

      setBlockedUsers(enriched);
    } catch (err: any) {
      console.error("[BlockListPanel] Failed to load blocked users:", err);
      setError(err?.message || "Failed to load blocked users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBlockedUsers();
  }, [loadBlockedUsers]);

  useEffect(() => {
    void socketService.initBlocksSocket();

    const refreshBlockList = () => {
      void loadBlockedUsers();
    };

    const unsubscribeBlockStatus = socketService.on("blockStatus:changed", refreshBlockList);
    const unsubscribeBlocked = socketService.on("block:blocked", refreshBlockList);
    const unsubscribeUnblocked = socketService.on("block:unblocked", refreshBlockList);

    window.addEventListener("blockStatus:changed", refreshBlockList);
    return () => {
      unsubscribeBlockStatus();
      unsubscribeBlocked();
      unsubscribeUnblocked();
      window.removeEventListener("blockStatus:changed", refreshBlockList);
    };
  }, [loadBlockedUsers]);

  const handleUnblock = async (item: any) => {
    const blockedUserId = getBlockedUserId(item);
    if (!blockedUserId) return;

    try {
      setProcessingId(blockedUserId);
      await unblockUser(blockedUserId);
      setBlockedUsers((prev) => prev.filter((blocked) => getBlockedUserId(blocked) !== blockedUserId));
      window.dispatchEvent(
        new CustomEvent("blockStatus:changed", {
          detail: { userId: blockedUserId, isBlocked: false },
        }),
      );
      window.dispatchEvent(new Event("chatList:refresh"));
    } catch (err: any) {
      console.error("[BlockListPanel] Failed to unblock user:", err);
      toast.error(err?.message || "Failed to unblock user");
    } finally {
      setProcessingId(null);
    }
  };

  if (isCollapsed) {
    return (
      <div className="flex-1 flex flex-col items-center py-4 bg-white dark:bg-slate-900 border-l border-gray-100 dark:border-slate-800">
        <button onClick={onBack} className="p-2 mb-4 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full text-gray-500 dark:text-gray-400">
          <FiArrowLeft className="text-xl" />
        </button>
        <FiSlash className="text-2xl text-red-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden">
      <div className="flex items-center gap-5 px-4 py-2.5 bg-white dark:bg-slate-900 shadow-sm z-10 shrink-0">
        <button onClick={onBack} className="text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 p-2 rounded-full transition -ml-2">
          <FiArrowLeft className="text-xl" />
        </button>
        <h2 className="text-[19px] font-medium text-gray-900 dark:text-white">Block List</h2>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900">
        {loading && (
          <div className="px-5 py-4 text-[14px] text-gray-500 dark:text-gray-400">
            Loading blocked users...
          </div>
        )}

        {error && (
          <div className="mx-4 my-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}

        {!loading && !error && blockedUsers.length === 0 && (
          <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
            <FiSlash className="mb-3 text-4xl text-gray-300 dark:text-slate-600" />
            <p className="text-[15px] font-medium text-gray-900 dark:text-white">No blocked users</p>
            <p className="mt-1 text-[13.5px] leading-relaxed text-gray-500 dark:text-gray-400">
              People you block will appear here.
            </p>
          </div>
        )}

        {blockedUsers.length > 0 && (
          <div className="flex flex-col py-2">
            {blockedUsers.map((item) => {
              const blockedUserId = getBlockedUserId(item);
              const user = getDisplayUser(item);
              const name = user?.displayName || user?.name || user?.username || blockedUserId || "Unknown";
              const phone = user?.phone || "";
              const avatarUrl = user?.avatarUrl || user?.avatar || null;
              const isProcessing = processingId === blockedUserId;

              return (
                <div
                  key={item?.id || blockedUserId}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-800 transition"
                >
                  <Avatar name={name} src={avatarUrl} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium text-gray-900 dark:text-white">{name}</p>
                    <p className="truncate text-[13px] text-gray-500 dark:text-gray-400">
                      {phone || blockedUserId}
                    </p>
                  </div>
                  <button
                    onClick={() => handleUnblock(item)}
                    disabled={isProcessing}
                    className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    {isProcessing ? "..." : "Unblock"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
