import { useQuery } from "@tanstack/react-query";
import { checkBlockStatus } from "../services/blockService";

export const useBlockStatus = (userId?: string) => {
  return useQuery({
    queryKey: ["block-status", userId],
    queryFn: async () => {
      if (!userId) {
        return {
          blockedByMe: false,
          blockedMe: false,
          isBlocked: false,
          isBlocking: false,
        };
      }
      try {
        const resp: any = await checkBlockStatus(userId);
        const payload = resp?.data || resp;
        const blockedByMe = Boolean(
          payload?.blockedByMe ??
            payload?.isBlocked ??
            payload?.blocked ??
            payload?.isBlockedByMe,
        );
        const blockedMe = Boolean(
          payload?.blockedMe ??
            payload?.isBlocking ??
            payload?.isBlockedByUser ??
            payload?.isBlockedByTarget ??
            payload?.isBlockedByPeer,
        );

        return {
          blockedByMe,
          blockedMe,
          isBlocked: blockedByMe,
          isBlocking: blockedMe,
        };
      } catch (err: any) {
        if (err?.status === 404) {
          return {
            blockedByMe: false,
            blockedMe: false,
            isBlocked: false,
            isBlocking: false,
          };
        }
        throw err;
      }
    },
    enabled: !!userId,
    // Add some reasonable staleTime to avoid over-fetching
    staleTime: 60 * 1000,
  });
};
