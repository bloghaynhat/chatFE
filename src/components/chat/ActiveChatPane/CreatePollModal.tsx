import { useState } from "react";
import {
  FiBarChart2,
  FiCheck,
  FiPlus,
  FiTrash2,
} from "react-icons/fi";
import { useLanguage } from "../../../context";

const SettingRow = ({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) => (
  <label className="flex min-h-[44px] cursor-pointer items-center gap-3 px-4">
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      className="h-4 w-4 shrink-0 accent-[#3390ec]"
    />
    <span className="min-w-0 flex-1 text-[15px] font-medium text-gray-900 dark:text-gray-100">
      {label}
    </span>
  </label>
);

export const CreatePollModal = ({
  isOpen,
  onClose,
  onCreate,
  isCreating,
}: any) => {
  const { t } = useLanguage();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [isMultipleChoice, setIsMultipleChoice] = useState(false);
  const [allowChangeVote, setAllowChangeVote] = useState(true);
  const [showResultsBeforeClose, setShowResultsBeforeClose] = useState(true);
  const [allowAddOption, setAllowAddOption] = useState(true);
  const [hideVoters, setHideVoters] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const resetAndClose = () => {
    setQuestion("");
    setOptions(["", ""]);
    setIsMultipleChoice(false);
    setAllowChangeVote(true);
    setShowResultsBeforeClose(true);
    setAllowAddOption(true);
    setHideVoters(false);
    setError("");
    onClose?.();
  };

  const handleSubmit = async () => {
    const cleanedOptions = options.map((option) => option.trim()).filter(Boolean);

    if (!question.trim()) {
      setError(t("poll.questionRequired"));
      return;
    }
    if (cleanedOptions.length < 2) {
      setError(t("poll.minOptions"));
      return;
    }

    setError("");
    await onCreate?.({
      question: question.trim(),
      options: cleanedOptions,
      isMultipleChoice,
      allowChangeVote,
      showResultsBeforeClose,
      allowAddOption,
      hideVoters,
    });
    resetAndClose();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/35 px-0 sm:items-center sm:px-4">
      <div className="flex max-h-[90vh] w-full max-w-[420px] flex-col overflow-hidden rounded-t-[20px] border border-gray-200 bg-[#f5f7fa] shadow-2xl dark:border-slate-700 dark:bg-slate-950 sm:rounded-[20px]">
        <div className="flex items-center justify-between bg-white px-4 py-3 dark:bg-slate-900">
          <button
            onClick={resetAndClose}
            className="inline-flex h-9 min-w-[58px] items-center justify-start text-[15px] font-semibold text-[#3390ec]"
          >
            {t("app.cancel")}
          </button>
          <div className="flex items-center gap-2 text-[16px] font-semibold text-gray-950 dark:text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3390ec] text-white">
              <FiBarChart2 className="text-[17px]" />
            </span>
            {t("poll.title")}
          </div>
          <button
            onClick={handleSubmit}
            disabled={isCreating}
            className="inline-flex h-9 min-w-[58px] items-center justify-end text-[15px] font-semibold text-[#3390ec] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isCreating ? "..." : t("app.create")}
          </button>
        </div>

        <div className="space-y-2 overflow-y-auto custom-scrollbar px-3 py-3">
          <section className="overflow-hidden rounded-xl bg-white dark:bg-slate-900">
            <div className="flex items-start gap-3 px-4 py-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e7f3ff] text-[#3390ec] dark:bg-[#172b3e]">
                <FiBarChart2 className="text-[17px]" />
              </span>
              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder={t("poll.question")}
                rows={2}
                className="min-h-[54px] flex-1 resize-none bg-transparent py-1 text-[16px] font-medium leading-6 text-gray-950 outline-none placeholder:text-gray-400 dark:text-white"
              />
            </div>
          </section>

          <section className="overflow-hidden rounded-xl bg-white dark:bg-slate-900">
            {options.map((option, index) => (
              <div
                key={index}
                className="group flex min-h-[50px] items-center gap-3 border-b border-gray-100 px-4 last:border-b-0 dark:border-slate-800"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-[#3390ec]/35 text-[#3390ec]">
                  {option.trim() ? <FiCheck className="text-[14px]" /> : index + 1}
                </span>
                <input
                  value={option}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setOptions((prev) => {
                      const next = prev.map((item, i) => (i === index ? nextValue : item));
                      const isLastOption = index === prev.length - 1;
                      if (isLastOption && nextValue.trim() && prev.length < 10) {
                        return [...next, ""];
                      }
                      return next;
                    });
                  }}
                  placeholder={`${t("poll.option")} ${index + 1}`}
                  className="min-w-0 flex-1 bg-transparent py-3 text-[15px] text-gray-950 outline-none placeholder:text-gray-400 dark:text-white"
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => setOptions((prev) => prev.filter((_, i) => i !== index))}
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-300 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                    title={t("poll.removeOption")}
                  >
                    <FiTrash2 />
                  </button>
                )}
              </div>
            ))}
            {options.length < 10 && (
              <button
                type="button"
                onClick={() => setOptions((prev) => [...prev, ""])}
                className="flex min-h-[46px] w-full items-center gap-3 px-4 text-left text-[15px] font-semibold text-[#3390ec]"
              >
                <FiPlus className="h-5 w-5 shrink-0" />
                {t("poll.addOption")}
              </button>
            )}
            {options.length >= 10 && (
              <div className="px-4 py-2 text-[12px] font-medium text-gray-400">
                {t("poll.maxOptions")}
              </div>
            )}
          </section>

          <section className="overflow-hidden rounded-xl bg-white dark:bg-slate-900">
            <SettingRow label={t("poll.allowChangeVote")} checked={allowChangeVote} onChange={setAllowChangeVote} />
            <div className="ml-10 h-px bg-gray-100 dark:bg-slate-800" />
            <SettingRow label={t("poll.showResultsEarly")} checked={showResultsBeforeClose} onChange={setShowResultsBeforeClose} />
            <div className="ml-10 h-px bg-gray-100 dark:bg-slate-800" />
            <SettingRow label={t("poll.membersCanAddOptions")} checked={allowAddOption} onChange={setAllowAddOption} />
            <div className="ml-10 h-px bg-gray-100 dark:bg-slate-800" />
            <SettingRow label={t("poll.multipleVotes")} checked={isMultipleChoice} onChange={setIsMultipleChoice} />
            <div className="ml-10 h-px bg-gray-100 dark:bg-slate-800" />
            <SettingRow label={t("poll.hideVoters")} checked={hideVoters} onChange={setHideVoters} />
          </section>

          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-[13px] font-semibold text-red-500 dark:bg-red-950/30">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
