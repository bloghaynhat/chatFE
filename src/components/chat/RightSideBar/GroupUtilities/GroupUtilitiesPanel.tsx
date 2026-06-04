import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FiBell,
  FiCalendar,
  FiCheckCircle,
  FiEdit2,
  FiFileText,
  FiMaximize2,
  FiMoreHorizontal,
  FiPlus,
  FiRefreshCw,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { toast } from "sonner";
import {
  getUtilityId,
  groupUtilitiesService,
  type CreateNoteRequest,
  type CreateReminderRequest,
  type GroupNote,
  type Reminder,
} from "../../../../services/groupUtilitiesService";
import { socketService } from "../../../../services/socketService";
import { NoteFormModal, ReminderFormModal } from "./UtilityModal";

const queryKeys = {
  notes: (groupId: string) => ["group-utilities", groupId, "notes"],
  reminders: (groupId: string) => ["group-utilities", groupId, "reminders"],
};

const formatDateTime = (value?: string) => {
  if (!value) return "No time";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid time";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getRelativeTime = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = date.getTime() - Date.now();
  const absMinutes = Math.abs(Math.round(diffMs / 60000));
  if (absMinutes < 1) return diffMs >= 0 ? "Due now" : "Just now";
  if (absMinutes < 60) return diffMs >= 0 ? `In ${absMinutes}m` : `${absMinutes}m ago`;
  const absHours = Math.round(absMinutes / 60);
  if (absHours < 24) return diffMs >= 0 ? `In ${absHours}h` : `${absHours}h ago`;
  const absDays = Math.round(absHours / 24);
  return diffMs >= 0 ? `In ${absDays}d` : `${absDays}d ago`;
};

const getCreatorName = (createdBy: any) =>
  createdBy?.displayName ||
  createdBy?.name ||
  createdBy?.username ||
  (typeof createdBy === "string" ? "Member" : "Unknown");

const getCreatorInitial = (createdBy: any) =>
  getCreatorName(createdBy).trim().charAt(0).toUpperCase() || "U";

const getPayloadGroupId = (payload: any) => {
  const rawId =
    payload?.groupId ||
    payload?.conversationId ||
    payload?.note?.groupId ||
    payload?.note?.conversationId ||
    payload?.reminder?.groupId ||
    payload?.reminder?.conversationId ||
    payload?.data?.groupId ||
    payload?.data?.conversationId;

  if (rawId && typeof rawId === "object") {
    return rawId.id || rawId._id || rawId.groupId || rawId.conversationId;
  }

  return rawId;
};

const getReminderSortTime = (reminder: Reminder) => {
  const rawTime = reminder.remindAt || reminder.createdAt || reminder.updatedAt;
  const timestamp = rawTime ? new Date(rawTime).getTime() : 0;
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const sortReminders = (reminders: Reminder[]) =>
  [...reminders].sort((a, b) => {
    const aPinned = Boolean(a.pinned || a.isPinned);
    const bPinned = Boolean(b.pinned || b.isPinned);
    if (aPinned !== bPinned) return aPinned ? -1 : 1;
    return getReminderSortTime(a) - getReminderSortTime(b);
  });

const ReminderCard = ({
  reminder,
  onEdit,
  onDelete,
  onPinToggle,
}: {
  reminder: Reminder;
  onEdit: (reminder: Reminder) => void;
  onDelete: (reminder: Reminder) => void;
  onPinToggle: (reminder: Reminder) => void;
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const status = (reminder.status || "active").toLowerCase();
  const isPinned = Boolean(reminder.pinned || reminder.isPinned);
  const cardTone =
    status === "done"
      ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20"
      : status === "cancelled"
        ? "border-slate-200 bg-slate-50 opacity-60 dark:border-slate-700 dark:bg-slate-800/50"
        : "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20";

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94 }}
      whileHover={{ y: -2 }}
      className={`group relative rounded-lg border p-3 shadow-sm transition-shadow hover:shadow-md ${
        isMenuOpen ? "z-40" : "z-0"
      } ${cardTone}`}
    >
      <div className="flex gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/80 text-amber-600 shadow-sm dark:bg-slate-900/70 dark:text-amber-300">
          <FiCalendar />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <h3
              className={`min-w-0 flex-1 text-[15px] font-semibold leading-snug text-gray-900 dark:text-white ${
                status === "done" ? "line-through opacity-70" : ""
              }`}
            >
              {reminder.title}
            </h3>
            {isPinned && <span title="Pinned" className="text-sm text-amber-500">Pin</span>}
            <button
              type="button"
              onClick={() => setIsMenuOpen((value) => !value)}
              aria-label="Open reminder actions"
              className="flex h-7 w-7 items-center justify-center rounded-full text-gray-500 opacity-100 hover:bg-white/80 dark:text-gray-300 dark:hover:bg-slate-800 sm:opacity-0 sm:group-hover:opacity-100"
            >
              <FiMoreHorizontal />
            </button>
          </div>
          {reminder.description && (
            <p className="mt-1 line-clamp-2 text-sm leading-5 text-gray-600 dark:text-gray-300">
              {reminder.description}
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-medium">
            <span className="rounded-full bg-white/80 px-2 py-1 text-amber-700 dark:bg-slate-900/70 dark:text-amber-300">
              {formatDateTime(reminder.remindAt)}
            </span>
            <span className="text-amber-700 dark:text-amber-300">
              {getRelativeTime(reminder.remindAt)}
            </span>
            {reminder.repeatRule && reminder.repeatRule !== "none" && (
              <span className="rounded-full bg-white/70 px-2 py-1 text-gray-600 dark:bg-slate-900/60 dark:text-gray-300">
                {reminder.repeatRule}
              </span>
            )}
            {Number(reminder.notifyBeforeMinutes) > 0 && (
              <span className="text-gray-500 dark:text-gray-400">
                {reminder.notifyBeforeMinutes}m before
              </span>
            )}
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="absolute right-3 top-10 z-50 w-40 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 text-sm shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => {
              setIsMenuOpen(false);
              onEdit(reminder);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-slate-800"
          >
            <FiEdit2 /> Edit
          </button>
          <button
            type="button"
            onClick={() => {
              setIsMenuOpen(false);
              onPinToggle(reminder);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-slate-800"
          >
            <FiCheckCircle /> {isPinned ? "Unpin" : "Pin"}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsMenuOpen(false);
              onDelete(reminder);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <FiTrash2 /> Cancel
          </button>
        </div>
      )}
    </motion.article>
  );
};

const NoteCard = ({
  note,
  onEdit,
  onDelete,
  onExpand,
}: {
  note: GroupNote;
  onEdit: (note: GroupNote) => void;
  onDelete: (note: GroupNote) => void;
  onExpand: (note: GroupNote) => void;
}) => (
  <motion.article
    layout
    initial={{ opacity: 0, y: -16 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.94 }}
    whileHover={{ y: -2 }}
    tabIndex={0}
    className="group rounded-lg border border-emerald-100 bg-white/70 p-3 shadow-sm backdrop-blur-md transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800/60"
  >
    <div className="flex items-start gap-2">
      <button
        type="button"
        onClick={() => onExpand(note)}
        className="min-w-0 flex-1 text-left"
      >
        <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-gray-900 dark:text-white">
          {note.title}
        </h3>
        <p className="mt-2 line-clamp-3 text-sm leading-5 text-gray-600 dark:text-gray-300">
          {note.content}
        </p>
      </button>
      <div className="flex shrink-0 items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
        <button
          type="button"
          onClick={() => onExpand(note)}
          aria-label="Expand note"
          className="flex h-7 w-7 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700"
        >
          <FiMaximize2 />
        </button>
        <button
          type="button"
          onClick={() => onEdit(note)}
          aria-label="Edit note"
          className="flex h-7 w-7 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700"
        >
          <FiEdit2 />
        </button>
        <button
          type="button"
          onClick={() => onDelete(note)}
          aria-label="Delete note"
          className="flex h-7 w-7 items-center justify-center rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <FiTrash2 />
        </button>
      </div>
    </div>
    <div className="mt-4 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
        {getCreatorInitial(note.createdBy)}
      </span>
      <span className="min-w-0 truncate">{getCreatorName(note.createdBy)}</span>
      <span className="shrink-0">{formatDateTime(note.createdAt)}</span>
    </div>
  </motion.article>
);

const EmptyState = ({ type }: { type: "notes" | "reminders" }) => (
  <div className="flex h-full min-h-[220px] flex-col items-center justify-center px-6 text-center">
    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-2xl text-gray-400 dark:bg-slate-800 dark:text-gray-500">
      {type === "notes" ? <FiFileText /> : <FiBell />}
    </div>
    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
      {type === "notes" ? "No notes yet" : "No reminders yet"}
    </h3>
    <p className="mt-1 text-sm leading-5 text-gray-500 dark:text-gray-400">
      {type === "notes"
        ? "Create the first shared note for this group."
        : "Create a reminder so the group does not miss it."}
    </p>
  </div>
);

const ConfirmDialog = ({
  title,
  description,
  confirmLabel,
  isLoading,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  isLoading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) =>
  createPortal(
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[380px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
            <p className="mt-1 text-sm leading-5 text-gray-500 dark:text-gray-400">
              {description}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close confirmation"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800"
          >
            <FiX />
          </button>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4">
          <button
            type="button"
            disabled={isLoading}
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-60 dark:text-gray-300 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60"
          >
            {isLoading ? "Working..." : confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>,
    document.body,
  );

export const GroupNotesPanel = ({ groupId }: { groupId: string }) => {
  const queryClient = useQueryClient();
  const [editingNote, setEditingNote] = useState<GroupNote | null>(null);
  const [expandedNote, setExpandedNote] = useState<GroupNote | null>(null);
  const [deletingNote, setDeletingNote] = useState<GroupNote | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const notesQuery = useQuery({
    queryKey: queryKeys.notes(groupId),
    queryFn: () => groupUtilitiesService.getNotes(groupId),
    enabled: Boolean(groupId),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.notes(groupId) });

  useEffect(() => {
    if (!groupId) return;
    socketService.joinRoom(groupId).catch(() => {});
    return () => {
      socketService.leaveRoom(groupId).catch(() => {});
    };
  }, [groupId]);

  useEffect(() => {
    const handleNoteSocket = (payload: any) => {
      const payloadGroupId = getPayloadGroupId(payload);
      if (!payloadGroupId || String(payloadGroupId) === String(groupId)) {
        invalidate();
      }
    };

    const cleanups = [
      socketService.onGroupNoteCreated(handleNoteSocket),
      socketService.onGroupNoteUpdated(handleNoteSocket),
      socketService.onGroupNoteDeleted(handleNoteSocket),
    ];

    return () => cleanups.forEach((cleanup) => cleanup?.());
  }, [groupId, queryClient]);

  const saveMutation = useMutation({
    mutationFn: (payload: CreateNoteRequest) =>
      editingNote
        ? groupUtilitiesService.updateNote(groupId, getUtilityId(editingNote), payload)
        : groupUtilitiesService.createNote(groupId, payload),
    onSuccess: () => {
      toast.success(editingNote ? "Note updated" : "Note created");
      setIsFormOpen(false);
      setEditingNote(null);
      invalidate();
    },
    onError: (error: any) => toast.error(error?.message || "Could not save note"),
  });

  const deleteMutation = useMutation({
    mutationFn: (note: GroupNote) => groupUtilitiesService.deleteNote(groupId, getUtilityId(note)),
    onSuccess: () => {
      toast.success("Note deleted");
      setDeletingNote(null);
      invalidate();
    },
    onError: (error: any) => toast.error(error?.message || "Could not delete note"),
  });

  const notes = notesQuery.data || [];

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notes</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">{notes.length} shared notes</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingNote(null);
            setIsFormOpen(true);
          }}
          aria-label="Create note"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
        >
          <FiPlus />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {notesQuery.isLoading ? (
          <div className="flex h-48 items-center justify-center text-sm text-gray-500">Loading notes...</div>
        ) : notesQuery.isError ? (
          <div className="flex h-48 flex-col items-center justify-center gap-3 text-sm text-gray-500">
            <span>Could not load notes.</span>
            <button
              type="button"
              onClick={() => notesQuery.refetch()}
              className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 font-semibold dark:border-slate-700"
            >
              <FiRefreshCw /> Retry
            </button>
          </div>
        ) : notes.length === 0 ? (
          <EmptyState type="notes" />
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {notes.map((note) => (
                <NoteCard
                  key={getUtilityId(note)}
                  note={note}
                  onExpand={setExpandedNote}
                  onEdit={(value) => {
                    setEditingNote(value);
                    setIsFormOpen(true);
                  }}
                  onDelete={setDeletingNote}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <NoteFormModal
        isOpen={isFormOpen}
        note={editingNote}
        isSubmitting={saveMutation.isPending}
        onClose={() => {
          setIsFormOpen(false);
          setEditingNote(null);
        }}
        onSubmit={async (payload) => {
          await saveMutation.mutateAsync(payload);
        }}
      />

      {deletingNote && (
        <ConfirmDialog
          title="Delete note"
          description={`Delete "${deletingNote.title}" from this group?`}
          confirmLabel="Delete"
          isLoading={deleteMutation.isPending}
          onCancel={() => setDeletingNote(null)}
          onConfirm={() => deleteMutation.mutate(deletingNote)}
        />
      )}

      {expandedNote &&
        createPortal(
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-h-[84dvh] w-full max-w-[640px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-slate-800">
              <h2 className="min-w-0 text-lg font-semibold text-gray-900 dark:text-white">
                {expandedNote.title}
              </h2>
              <button
                type="button"
                onClick={() => setExpandedNote(null)}
                className="rounded-full px-3 py-1.5 text-sm font-semibold text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-800"
              >
                Close
              </button>
            </div>
            <div className="max-h-[calc(84dvh-72px)] overflow-y-auto whitespace-pre-wrap px-5 py-4 text-sm leading-6 text-gray-700 dark:text-gray-200">
              {expandedNote.content}
            </div>
          </motion.div>
        </div>,
        document.body,
      )}
    </div>
  );
};

export const GroupRemindersPanel = ({ groupId }: { groupId: string }) => {
  const queryClient = useQueryClient();
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [deletingReminder, setDeletingReminder] = useState<Reminder | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("active");

  const remindersQuery = useQuery({
    queryKey: queryKeys.reminders(groupId),
    queryFn: () => groupUtilitiesService.getReminders(groupId),
    enabled: Boolean(groupId),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.reminders(groupId) });
    queryClient.invalidateQueries({ queryKey: ["pinned-messages", groupId] });
    window.dispatchEvent(new Event("chatList:refresh"));
  };

  useEffect(() => {
    if (!groupId) return;
    socketService.joinRoom(groupId).catch(() => {});
    return () => {
      socketService.leaveRoom(groupId).catch(() => {});
    };
  }, [groupId]);

  useEffect(() => {
    const handleReminderSocket = (payload: any) => {
      const payloadGroupId = getPayloadGroupId(payload);
      if (!payloadGroupId || String(payloadGroupId) === String(groupId)) {
        invalidate();
      }
    };

    const cleanups = [
      socketService.onGroupReminderCreated(handleReminderSocket),
      socketService.onGroupReminderUpdated(handleReminderSocket),
      socketService.onGroupReminderDeleted(handleReminderSocket),
      socketService.onGroupReminderPinned(handleReminderSocket),
      socketService.onGroupReminderUnpinned(handleReminderSocket),
      socketService.onGroupReminderDue((payload: any) => {
        handleReminderSocket(payload);
        const reminder = payload?.reminder || payload?.data?.reminder;
        if (reminder?.title) {
          toast.info(`Reminder due: ${reminder.title}`);
        }
      }),
    ];

    return () => cleanups.forEach((cleanup) => cleanup?.());
  }, [groupId, queryClient]);

  useEffect(() => {
    const handleUtilitiesRefresh = (event: any) => {
      const payloadGroupId = event?.detail?.conversationId;
      if (!payloadGroupId || String(payloadGroupId) === String(groupId)) {
        invalidate();
      }
    };

    window.addEventListener("groupUtilities:refresh", handleUtilitiesRefresh);
    return () => window.removeEventListener("groupUtilities:refresh", handleUtilitiesRefresh);
  }, [groupId, queryClient]);

  const saveMutation = useMutation({
    mutationFn: (payload: CreateReminderRequest) =>
      editingReminder
        ? groupUtilitiesService.updateReminder(groupId, getUtilityId(editingReminder), payload)
        : groupUtilitiesService.createReminder(groupId, payload),
    onSuccess: () => {
      toast.success(editingReminder ? "Reminder updated" : "Reminder created");
      setIsFormOpen(false);
      setEditingReminder(null);
      invalidate();
    },
    onError: (error: any) => toast.error(error?.message || "Could not save reminder"),
  });

  const deleteMutation = useMutation({
    mutationFn: (reminder: Reminder) =>
      groupUtilitiesService.deleteReminder(groupId, getUtilityId(reminder)),
    onSuccess: () => {
      toast.success("Reminder cancelled");
      setDeletingReminder(null);
      invalidate();
    },
    onError: (error: any) => toast.error(error?.message || "Could not cancel reminder"),
  });

  const pinMutation = useMutation({
    mutationFn: (reminder: Reminder) => {
      const id = getUtilityId(reminder);
      return reminder.pinned || reminder.isPinned
        ? groupUtilitiesService.unpinReminder(groupId, id)
        : groupUtilitiesService.pinReminder(groupId, id);
    },
    onSuccess: () => {
      toast.success("Reminder pin updated");
      invalidate();
    },
    onError: (error: any) => toast.error(error?.message || "Could not update pin"),
  });

  const reminders = useMemo(
    () => sortReminders(remindersQuery.data || []),
    [remindersQuery.data],
  );
  const filteredReminders = useMemo(
    () =>
      sortReminders(
        reminders.filter((reminder) =>
        statusFilter === "all"
          ? true
          : (reminder.status || "active").toLowerCase() === statusFilter,
        ),
      ),
    [reminders, statusFilter],
  );

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Reminders</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">{reminders.length} group reminders</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingReminder(null);
            setIsFormOpen(true);
          }}
          aria-label="Create reminder"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500 text-white shadow-sm hover:bg-amber-600"
        >
          <FiPlus />
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto border-b border-gray-100 px-3 py-2 dark:border-slate-800">
        {["all", "active", "done", "cancelled"].map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${
              statusFilter === status
                ? "bg-amber-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {remindersQuery.isLoading ? (
          <div className="flex h-48 items-center justify-center text-sm text-gray-500">Loading reminders...</div>
        ) : remindersQuery.isError ? (
          <div className="flex h-48 flex-col items-center justify-center gap-3 text-sm text-gray-500">
            <span>Could not load reminders.</span>
            <button
              type="button"
              onClick={() => remindersQuery.refetch()}
              className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 font-semibold dark:border-slate-700"
            >
              <FiRefreshCw /> Retry
            </button>
          </div>
        ) : filteredReminders.length === 0 ? (
          <EmptyState type="reminders" />
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredReminders.map((reminder) => (
                <ReminderCard
                  key={getUtilityId(reminder)}
                  reminder={reminder}
                  onEdit={(value) => {
                    setEditingReminder(value);
                    setIsFormOpen(true);
                  }}
                  onDelete={setDeletingReminder}
                  onPinToggle={(value) => pinMutation.mutate(value)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <ReminderFormModal
        isOpen={isFormOpen}
        reminder={editingReminder}
        isSubmitting={saveMutation.isPending}
        onClose={() => {
          setIsFormOpen(false);
          setEditingReminder(null);
        }}
        onSubmit={async (payload) => {
          await saveMutation.mutateAsync(payload);
        }}
      />

      {deletingReminder && (
        <ConfirmDialog
          title="Cancel reminder"
          description={`Cancel "${deletingReminder.title}" for this group?`}
          confirmLabel="Cancel reminder"
          isLoading={deleteMutation.isPending}
          onCancel={() => setDeletingReminder(null)}
          onConfirm={() => deleteMutation.mutate(deletingReminder)}
        />
      )}
    </div>
  );
};
