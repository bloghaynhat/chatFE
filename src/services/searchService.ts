import { api } from "./api";

const unwrapApiData = (payload: any) => {
  if (!payload || typeof payload !== "object") return payload;
  if ("status" in payload && "data" in payload) return payload.data;
  return payload.data || payload;
};

export type GlobalSearchType = "ALL" | "USERS" | "MESSAGES" | "GROUPS" | "MEDIA" | "LINKS";

export interface GlobalSearchParams {
  query: string;
  type?: GlobalSearchType;
  conversationId?: string;
  mediaType?: "all" | "image" | "video" | "file" | "voice";
  from?: string;
  to?: string;
  senderId?: string;
  cursor?: string;
  limit?: number;
  contextLimit?: number;
}

export const searchService = {
  async globalSearch(params: GlobalSearchParams) {
    const response = await api.get("/search", {
      params: {
        query: params.query,
        type: params.type || "ALL",
        conversationId: params.conversationId,
        mediaType: params.mediaType,
        from: params.from,
        to: params.to,
        senderId: params.senderId,
        cursor: params.cursor,
        limit: params.limit ?? 10,
        contextLimit: params.contextLimit,
      },
    });

    return unwrapApiData(response);
  },
};

export default searchService;
