import { api } from "./api";

const unwrap = (response: any) => response?.data || response;

export const pollService = {
  async createPoll(
    groupId: string,
    payload: {
      question: string;
      options: string[];
      isMultipleChoice?: boolean;
      allowAddOption?: boolean;
      allowChangeVote?: boolean;
      showResultsBeforeClose?: boolean;
      hideVoters?: boolean;
      expiresAt?: string;
    },
  ) {
    const response = await api.post(`/groups/${groupId}/polls`, payload);
    return unwrap(response);
  },

  async getPolls(
    groupId: string,
    params?: {
      cursor?: string;
      limit?: number;
      status?: "active" | "closed" | "expired";
    },
  ) {
    const response = await api.get(`/groups/${groupId}/polls`, { params });
    return unwrap(response);
  },

  async getPoll(groupId: string, pollId: string) {
    const response = await api.get(`/groups/${groupId}/polls/${pollId}`);
    return unwrap(response);
  },

  async votePoll(groupId: string, pollId: string, optionIds: string[]) {
    const response = await api.post(`/groups/${groupId}/polls/${pollId}/vote`, {
      optionIds,
    });
    return unwrap(response);
  },

  async closePoll(groupId: string, pollId: string) {
    const response = await api.post(`/groups/${groupId}/polls/${pollId}/lock`);
    return unwrap(response);
  },

  async addOption(groupId: string, pollId: string, text: string) {
    const response = await api.post(`/groups/${groupId}/polls/${pollId}/options`, {
      text,
    });
    return unwrap(response);
  },

  async pinPoll(groupId: string, pollId: string) {
    const response = await api.post(`/groups/${groupId}/polls/${pollId}/pin`);
    return unwrap(response);
  },

  async unpinPoll(groupId: string, pollId: string) {
    const response = await api.delete(`/groups/${groupId}/polls/${pollId}/pin`);
    return unwrap(response);
  },

  async deletePoll(groupId: string, pollId: string) {
    const response = await api.delete(`/groups/${groupId}/polls/${pollId}`);
    return unwrap(response);
  },

  async getResults(groupId: string, pollId: string) {
    const response = await api.get(`/groups/${groupId}/polls/${pollId}/results`);
    return unwrap(response);
  },
};
