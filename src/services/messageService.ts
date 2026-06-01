import { api } from "./api";

export interface SendProfileCardPayload {
  userId: string;
}

export const sendProfileCard = async (
  conversationId: string,
  payload: SendProfileCardPayload,
) => {
  return api.post(`/conversations/${conversationId}/profile-cards`, payload);
};

export const messageService = {
  sendProfileCard,
};

export default messageService;
