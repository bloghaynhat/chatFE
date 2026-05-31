import { useState } from "react";
import { FiBarChart2, FiTrash2, FiX } from "react-icons/fi";

export const CreatePollModal = ({
  isOpen,
  onClose,
  onCreate,
  isCreating,
}: any) => {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [isMultipleChoice, setIsMultipleChoice] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const resetAndClose = () => {
    setQuestion("");
    setOptions(["", ""]);
    setIsMultipleChoice(false);
    setError("");
    onClose?.();
  };

  const handleSubmit = async () => {
    const cleanedOptions = options.map((option) => option.trim()).filter(Boolean);
    if (!question.trim()) {
      setError("Question is required.");
      return;
    }
    if (cleanedOptions.length < 2) {
      setError("Poll needs at least 2 options.");
      return;
    }

    setError("");
    await onCreate?.({
      question: question.trim(),
      options: cleanedOptions,
      isMultipleChoice,
      allowChangeVote: false,
      showResultsBeforeClose: true,
      allowAddOption: false,
      hideVoters: false,
    });
    resetAndClose();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-[420px] rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 flex items-center justify-center">
              <FiBarChart2 className="text-lg" />
            </div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Create Poll</h2>
          </div>
          <button
            onClick={resetAndClose}
            className="h-8 w-8 rounded-full inline-flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800"
          >
            <FiX className="text-xl" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Question"
            className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-400"
          />

          <div className="space-y-2">
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
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
                  placeholder={`Option ${index + 1}`}
                  className="flex-1 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-400"
                />
                {options.length > 2 && (
                  <button
                    onClick={() => setOptions((prev) => prev.filter((_, i) => i !== index))}
                    className="h-9 w-9 rounded-full inline-flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <FiTrash2 />
                  </button>
                )}
              </div>
            ))}
          </div>

          <label className="flex items-center justify-between gap-3 text-sm text-gray-700 dark:text-gray-200">
            Multiple choice
            <input type="checkbox" checked={isMultipleChoice} onChange={(event) => setIsMultipleChoice(event.target.checked)} />
          </label>

          {error && <p className="text-sm font-medium text-red-500">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100 dark:border-slate-800">
          <button
            onClick={resetAndClose}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isCreating}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {isCreating ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
};
