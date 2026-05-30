import { api } from "./api";

export interface AiTaskExtractRequest {
  conversationId: string;
  maxMessages?: number;
}

export interface AiToneAdjustRequest {
  message: string;
  tone: "formal" | "casual" | "funny" | "professional";
}

export interface AiTranslateRequest {
  text: string;
  targetLang: string;
  sourceLang?: string;
}

export const aiService = {
  /**
   * Tóm tắt tự động khoảng 50 - 200 tin nhắn gần nhất trong một cuộc trò chuyện.
   */
  summarizeConversation: (conversationId: string, maxMessages = 50) => {
    return api.post("/ai/summarize", { conversationId, maxMessages });
  },

  /**
   * Đưa ra 3-5 gợi ý phản hồi ngữ cảnh tự động
   */
  smartReply: (conversationId: string, userId?: string) => {
    return api.post("/ai/smart-reply", {
      conversationId,
      ...(userId ? { userId } : {}),
    });
  },

  /**
   * Sửa lại câu văn soạn thảo theo các tone
   */
  toneAdjust: (data: AiToneAdjustRequest) => {
    return api.post("/ai/tone-adjust", data);
  },

  /**
   * Dịch tin nhắn
   */
  translateMessage: (data: AiTranslateRequest) => {
    return api.post("/ai/translate", data);
  },

  /**
   * Phát hiện ngôn ngữ của văn bản
   */
  detectLanguage: (text: string) => {
    return api.post("/ai/detect-language", { text });
  },

  /**
   * Tìm kiếm thông minh bằng AI
   */
  smartSearch: (query: string, conversationId?: string) => {
    return api.post("/ai/smart-search", { query, conversationId });
  },

  /**
   * Trích xuất công việc và nhắc nhở
   */
  extractTasks: (data: AiTaskExtractRequest) => {
    return api.post("/ai/extract-tasks", data);
  },
};
