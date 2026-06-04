import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { FiBell, FiEdit3, FiX } from "react-icons/fi";
import type {
  CreateNoteRequest,
  CreateReminderRequest,
  GroupNote,
  Reminder,
} from "../../../../services/groupUtilitiesService";

const toDateTimeInputValue = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

interface NoteFormModalProps {
  isOpen: boolean;
  note?: GroupNote | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateNoteRequest) => Promise<void>;
}

export const NoteFormModal = ({
  isOpen,
  note,
  isSubmitting,
  onClose,
  onSubmit,
}: NoteFormModalProps) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setTitle(note?.title || "");
    setContent(note?.content || "");
    setError("");
  }, [isOpen, note]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!content.trim()) {
      setError("Content is required.");
      return;
    }
    try {
      setError("");
      await onSubmit({ title: title.trim(), content: content.trim() });
    } catch (error: any) {
      setError(error?.message || "Could not save note.");
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[130] flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-h-[90dvh] w-full max-w-[520px] overflow-hidden rounded-t-[24px] border border-gray-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              <FiEdit3 />
            </span>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              {note ? "Edit note" : "Create note"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close note form"
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800"
          >
            <FiX className="text-xl" />
          </button>
        </div>

        <div className="max-h-[calc(90dvh-132px)] space-y-4 overflow-y-auto custom-scrollbar overscroll-contain px-5 py-4">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Title"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Write a note for this group"
            rows={9}
            className="min-h-[180px] w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm leading-6 text-gray-900 outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
          {error && <p className="text-sm font-medium text-red-500">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {isSubmitting ? "Saving..." : "Save"}
          </button>
        </div>
      </motion.div>
    </div>,
    document.body,
  );
};

interface ReminderFormModalProps {
  isOpen: boolean;
  reminder?: Reminder | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateReminderRequest) => Promise<void>;
}

export const ReminderFormModal = ({
  isOpen,
  reminder,
  isSubmitting,
  onClose,
  onSubmit,
}: ReminderFormModalProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [remindAt, setRemindAt] = useState("");
  const [repeatRule, setRepeatRule] = useState("none");
  const [notifyBeforeMinutes, setNotifyBeforeMinutes] = useState("10");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setTitle(reminder?.title || "");
    setDescription(reminder?.description || "");
    setRemindAt(toDateTimeInputValue(reminder?.remindAt));
    setRepeatRule(reminder?.repeatRule || "none");
    setNotifyBeforeMinutes(String(reminder?.notifyBeforeMinutes ?? 10));
    setError("");
  }, [isOpen, reminder]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!remindAt) {
      setError("Reminder time is required.");
      return;
    }

    const selectedTime = new Date(remindAt);
    if (Number.isNaN(selectedTime.getTime())) {
      setError("Reminder time is invalid.");
      return;
    }

    try {
      setError("");
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        remindAt: selectedTime.toISOString(),
        repeatRule,
        notifyBeforeMinutes: Math.max(0, Number(notifyBeforeMinutes) || 0),
      });
    } catch (error: any) {
      setError(error?.message || "Could not save reminder.");
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[130] flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-h-[90dvh] w-full max-w-[520px] overflow-hidden rounded-t-[24px] border border-gray-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
              <FiBell />
            </span>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              {reminder ? "Edit reminder" : "Create reminder"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close reminder form"
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800"
          >
            <FiX className="text-xl" />
          </button>
        </div>

        <div className="max-h-[calc(90dvh-132px)] space-y-4 overflow-y-auto custom-scrollbar overscroll-contain px-5 py-4">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Title"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-amber-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Description"
            rows={3}
            className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-amber-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
          <input
            type="datetime-local"
            value={remindAt}
            onChange={(event) => setRemindAt(event.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-amber-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
              Repeat
              <select
                value={repeatRule}
                onChange={(event) => setRepeatRule(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-normal text-gray-900 outline-none focus:border-amber-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="none">None</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </label>
            <label className="space-y-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
              Notify before
              <select
                value={notifyBeforeMinutes}
                onChange={(event) => setNotifyBeforeMinutes(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-normal text-gray-900 outline-none focus:border-amber-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="0">At time</option>
                <option value="5">5 minutes</option>
                <option value="10">10 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
                <option value="1440">1 day</option>
              </select>
            </label>
          </div>
          {error && <p className="text-sm font-medium text-red-500">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-60"
          >
            {isSubmitting ? "Saving..." : "Save"}
          </button>
        </div>
      </motion.div>
    </div>,
    document.body,
  );
};
