import { api } from "./api";
import { socketService } from "./socketService";

export type ReminderStatus = "active" | "done" | "cancelled" | string;
export type ReminderRepeatRule = "none" | "daily" | "weekly" | "monthly" | string;

export interface Reminder {
  id?: string;
  _id?: string;
  title: string;
  description?: string;
  remindAt: string;
  repeatRule?: ReminderRepeatRule;
  notifyBeforeMinutes?: number;
  status?: ReminderStatus;
  pinned?: boolean;
  isPinned?: boolean;
  createdBy?: any;
  createdById?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateReminderRequest {
  title: string;
  description?: string;
  remindAt: string;
  repeatRule?: ReminderRepeatRule;
  notifyBeforeMinutes?: number;
}

export type UpdateReminderRequest = Partial<CreateReminderRequest> & {
  status?: ReminderStatus;
};

export interface GroupNote {
  id?: string;
  _id?: string;
  title: string;
  content: string;
  createdBy?: any;
  createdById?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateNoteRequest {
  title: string;
  content: string;
}

export type UpdateNoteRequest = Partial<CreateNoteRequest>;

const unwrapPayload = (payload: any) => {
  if (!payload || typeof payload !== "object") return payload;
  if ("status" in payload && "data" in payload) return payload.data;
  return payload.data || payload;
};

const normalizeList = <T>(payload: any, keys: string[]): T[] => {
  const data = unwrapPayload(payload);
  if (Array.isArray(data)) return data;
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

const normalizeItem = <T>(payload: any, keys: string[]): T => {
  const data = unwrapPayload(payload);
  for (const key of keys) {
    if (data?.[key]) return data[key];
  }
  return data;
};

const emitUtilityWithAck = async <TPayload, TResult>(
  event: string,
  payload: TPayload,
  timeoutMs = 10000,
): Promise<TResult> => {
  const socket = await socketService.initMessagesSocket();
  if (!socket?.connected) {
    throw new Error("Socket is not connected");
  }

  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error("Socket request timeout"));
    }, timeoutMs);

    socket.emit(event, payload, (response: any) => {
      window.clearTimeout(timer);

      if (!response?.success) {
        reject(new Error(response?.error || response?.message || "Socket request failed"));
        return;
      }

      resolve(response as TResult);
    });
  });
};

export const getUtilityId = (item: { id?: string; _id?: string }) =>
  item.id || item._id || "";

export const groupUtilitiesService = {
  async getReminders(groupId: string): Promise<Reminder[]> {
    const response = await api.get(`/groups/${groupId}/reminders`);
    return normalizeList<Reminder>(response, ["reminders"]);
  },

  async createReminder(
    groupId: string,
    payload: CreateReminderRequest,
  ): Promise<Reminder> {
    const response = await emitUtilityWithAck<
      CreateReminderRequest & { conversationId: string },
      { reminder: Reminder }
    >("createReminder", {
      conversationId: groupId,
      ...payload,
    });
    return response.reminder;
  },

  async updateReminder(
    groupId: string,
    reminderId: string,
    payload: UpdateReminderRequest,
  ): Promise<Reminder> {
    const response = await emitUtilityWithAck<
      UpdateReminderRequest & { reminderId: string; conversationId: string },
      { reminder: Reminder }
    >("updateReminder", {
      conversationId: groupId,
      reminderId,
      ...payload,
    });
    return response.reminder;
  },

  async deleteReminder(groupId: string, reminderId: string): Promise<any> {
    return emitUtilityWithAck("deleteReminder", {
      conversationId: groupId,
      reminderId,
    });
  },

  async pinReminder(groupId: string, reminderId: string): Promise<Reminder> {
    const response = await emitUtilityWithAck<
      { reminderId: string; conversationId: string },
      { reminder: Reminder }
    >("pinReminder", { reminderId, conversationId: groupId });
    return response.reminder;
  },

  async unpinReminder(groupId: string, reminderId: string): Promise<Reminder> {
    const response = await emitUtilityWithAck<
      { reminderId: string; conversationId: string },
      { reminder: Reminder }
    >("unpinReminder", { reminderId, conversationId: groupId });
    return response.reminder;
  },

  async getNotes(groupId: string): Promise<GroupNote[]> {
    const response = await api.get(`/groups/${groupId}/notes`);
    return normalizeList<GroupNote>(response, ["notes"]);
  },

  async createNote(groupId: string, payload: CreateNoteRequest): Promise<GroupNote> {
    const response = await emitUtilityWithAck<
      CreateNoteRequest & { conversationId: string },
      { note: GroupNote }
    >("createNote", {
      conversationId: groupId,
      ...payload,
    });
    return response.note;
  },

  async updateNote(
    groupId: string,
    noteId: string,
    payload: UpdateNoteRequest,
  ): Promise<GroupNote> {
    const response = await emitUtilityWithAck<
      UpdateNoteRequest & { noteId: string; conversationId: string },
      { note: GroupNote }
    >("updateNote", {
      conversationId: groupId,
      noteId,
      ...payload,
    });
    return response.note;
  },

  async deleteNote(groupId: string, noteId: string): Promise<any> {
    return emitUtilityWithAck("deleteNote", {
      conversationId: groupId,
      noteId,
    });
  },
};
