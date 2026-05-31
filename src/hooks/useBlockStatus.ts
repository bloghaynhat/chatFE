import { useQuery } from "@tanstack/react-query";
import { checkBlockStatus } from "../services/blockService";

export const useBlockStatus = (userId?: string) => {
  return useQuery({
    queryKey: ["block-status", userId],
    queryFn: async () => {
      if (!userId) return { isBlocked: false, isBlocking: false };
      try {
        const resp: any = await checkBlockStatus(userId);
        const payload = resp?.data || resp;
        const isBlocked = Boolean(
          payload?.isBlocked ??
            payload?.blocked ??
            payload?.blockedByMe ??
            payload?.isBlockedByMe,
        );
        const isBlocking = Boolean(
          payload?.isBlocking ??
            payload?.blockedMe ??
            payload?.isBlockedByUser ??
            payload?.isBlockedByTarget ??
            payload?.isBlockedByPeer,
        );

        return {
          isBlocked,
          isBlocking,
        };
      } catch (err: any) {
        if (err?.status === 404) {
          return { isBlocked: false, isBlocking: false };
        }
        throw err;
      }
    },
    enabled: !!userId,
    // Add some reasonable staleTime to avoid over-fetching
    staleTime: 60 * 1000,
  });
};
