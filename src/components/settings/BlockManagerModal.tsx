import React, { useEffect } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import {
  getBlockedUsersCursor,
  unblockUser,
} from "../../services/blockService";
import { Loader2, ShieldCheck, ShieldOff, X } from "lucide-react";
import { toast } from "sonner";

interface BlockManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BlockManagerModal: React.FC<BlockManagerProps> = ({
  isOpen,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const { ref, inView } = useInView();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ["blocked-users"],
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      const resp = await getBlockedUsersCursor({
        cursor: pageParam,
        limit: 20,
      });
      return (resp as any)?.data || resp;
    },
    getNextPageParam: (lastPage: any) => lastPage?.nextCursor || undefined,
    enabled: isOpen,
  });

  const unblockMutation = useMutation({
    mutationFn: (blockedUserId: string) => unblockUser(blockedUserId),
    onSuccess: (_, blockedUserId) => {
      toast.success("Đã gỡ chặn thành công");
      queryClient.invalidateQueries({ queryKey: ["blocked-users"] });
      queryClient.invalidateQueries({
        queryKey: ["block-status", blockedUserId],
      });
    },
    onError: () => {
      toast.error("Không thể gỡ chặn. Vui lòng thử lại.");
    },
  });

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  if (!isOpen) return null;

  const blockedUsers = data?.pages.flatMap((page) => page?.items || []) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <ShieldOff className="w-5 h-5 text-red-500" />
              Danh sách chặn
            </h2>
            {!isLoading && !isError && (
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                {blockedUsers.length} người dùng
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 inline-flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200 transition-colors"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 pb-2 border-b border-gray-100 dark:border-gray-700">
            Những người này sẽ không thể liên hệ hoặc xem hồ sơ của bạn.
          </p>

          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : isError ? (
            <div className="text-center p-6 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300">
              Không thể tải danh sách chặn. Vui lòng thử lại sau.
            </div>
          ) : blockedUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-gray-500">
              <ShieldCheck className="w-12 h-12 mb-2 opacity-50" />
              <p className="font-medium text-gray-700 dark:text-gray-200">
                Bạn chưa chặn ai
              </p>
              <p className="mt-1 text-sm text-center text-gray-500 dark:text-gray-400">
                Những người bạn chặn sẽ xuất hiện tại đây.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {blockedUsers.map((item, index) => {
                const blockedUser =
                  item.blockedUser ||
                  item.blocked ||
                  item.user ||
                  (typeof item.blockedUserId === "object"
                    ? item.blockedUserId
                    : null);
                const blockedUserId =
                  blockedUser?.id ||
                  blockedUser?._id ||
                  item.blockedUserId ||
                  item.blockedId;
                const isUnblocking =
                  unblockMutation.isPending &&
                  unblockMutation.variables === blockedUserId;

                return (
                  <li
                    key={item.id || blockedUserId || index}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden shrink-0 filter grayscale">
                        {blockedUser?.avatarUrl ? (
                          <img
                            src={blockedUser.avatarUrl}
                            alt={blockedUser.displayName || blockedUser.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 font-medium">
                            {(blockedUser?.displayName ||
                              blockedUser?.name ||
                              "?")
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
                        {blockedUser?.displayName ||
                          blockedUser?.name ||
                          "Người dùng ẩn"}
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        blockedUserId && unblockMutation.mutate(blockedUserId)
                      }
                      disabled={isUnblocking || !blockedUserId}
                      className="text-sm px-3 py-1.5 bg-gray-100 hover:bg-green-50 text-gray-600 hover:text-green-600 dark:bg-gray-700 dark:hover:bg-green-900/30 dark:text-gray-300 dark:hover:text-green-400 rounded-md transition-colors disabled:opacity-50 font-medium flex items-center shrink-0"
                    >
                      {isUnblocking ? "Đang gỡ..." : "Gỡ chặn"}
                    </button>
                  </li>
                );
              })}

              {/* Infinite scroll trigger */}
              <div ref={ref} className="h-4 w-full flex justify-center mt-4">
                {isFetchingNextPage && (
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                )}
              </div>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
