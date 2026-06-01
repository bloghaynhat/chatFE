import { useEffect, useMemo, useState } from "react";
import { FiBarChart2, FiCheck, FiLock, FiPlus } from "react-icons/fi";
import { pollService } from "../../../../services/pollService";
import userService from "../../../../services/userService";

const getVoterId = (voter: any) => {
  if (!voter) return null;
  if (typeof voter === "string") return voter;
  return voter.id || voter._id || voter.userId || null;
};

const getOptionVoters = (option: any) => option.votedUserIds || option.voters || option.userIds || option.votes || [];

const unwrapPoll = (response: any) => response?.poll || response?.data?.poll || response?.data || response;

const haveSameSelection = (left: string[] = [], right: string[] = []) => {
  if (left.length !== right.length) return false;
  const rightSet = new Set(right.map(String));
  return left.every((item) => rightSet.has(String(item)));
};

export const PollMessage = ({
  message,
  mine,
  currentUserId,
  onPollUpdated,
}: any) => {
  const initialPoll = message?.poll || message?.metadata?.poll || null;
  const [poll, setPoll] = useState(initialPoll);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voterProfiles, setVoterProfiles] = useState<Record<string, any>>({});
  const [pendingOptionIds, setPendingOptionIds] = useState<string[] | null>(null);
  const [newOptionText, setNewOptionText] = useState("");
  const [isAddingOption, setIsAddingOption] = useState(false);

  useEffect(() => {
    setPoll(initialPoll);
    setPendingOptionIds(null);
  }, [initialPoll]);

  const selectedOptionIds = useMemo(() => {
    if (!poll?.options || !currentUserId) return [];
    return poll.options
      .filter((option: any) =>
        getOptionVoters(option).some((voter: any) => String(getVoterId(voter)) === String(currentUserId)),
      )
      .map((option: any) => option.id);
  }, [poll, currentUserId]);

  useEffect(() => {
    if (!poll?.options) return;
    const voterIds = Array.from(
      new Set(
        poll.options
          .flatMap((option: any) => getOptionVoters(option))
          .map(getVoterId)
          .filter(Boolean),
      ),
    ) as string[];

    const missingIds = voterIds.filter((id) => !voterProfiles[id]);
    if (missingIds.length === 0) return;

    let active = true;
    Promise.all(
      missingIds.slice(0, 20).map((id) =>
        userService
          .getUserById(id)
          .then((response: any) => ({ id, user: response?.data || response }))
          .catch(() => ({ id, user: { id } })),
      ),
    ).then((users) => {
      if (!active) return;
      setVoterProfiles((prev) => {
        const next = { ...prev };
        users.forEach(({ id, user }) => {
          next[id] = user;
        });
        return next;
      });
    });

    return () => {
      active = false;
    };
  }, [poll, voterProfiles]);

  if (!poll) {
    return (
      <div className="px-3 py-2 min-w-[260px]">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <FiBarChart2 />
          <span>Poll</span>
        </div>
        <p className="mt-1 text-sm opacity-70">Poll details are not available.</p>
      </div>
    );
  }

  const totalVotes = Math.max(Number(poll.totalVotes || 0), 0);
  const isExpired = Boolean(poll.expiresAt && new Date(poll.expiresAt).getTime() <= Date.now());
  const isClosed = poll.status === "closed" || poll.closedAt || isExpired;
  const hasVoted = selectedOptionIds.length > 0;
  const canChangeVote = Boolean(poll.allowChangeVote);
  const canVote = !isClosed && !isSubmitting && (!hasVoted || canChangeVote);
  const isMultipleChoice = Boolean(poll.isMultipleChoice);
  const isCreator = String(poll.createdBy) === String(currentUserId);
  const showResults =
    poll.showResultsBeforeClose !== false || isClosed || isCreator;
  const showVoters = showResults && (!poll.hideVoters || isCreator);
  const canAddOption = Boolean(poll.allowAddOption) && !isClosed && !isSubmitting;
  const effectiveOptionIds = isMultipleChoice ? (pendingOptionIds ?? selectedOptionIds) : selectedOptionIds;
  const hasPendingSelection = pendingOptionIds !== null;
  const hasSelectionChanges = hasPendingSelection && !haveSameSelection(pendingOptionIds || [], selectedOptionIds);
  const canSubmitMultipleVote =
    isMultipleChoice &&
    canVote &&
    hasPendingSelection &&
    (hasVoted ? hasSelectionChanges : (pendingOptionIds?.length || 0) > 0);

  const submitVote = async (optionId: string) => {
    if (!canVote || !poll.conversationId || !poll.id) return;
    const optionIds = isMultipleChoice ? (pendingOptionIds ?? selectedOptionIds) : [optionId];
    if (!hasVoted && optionIds.length === 0) return;

    setIsSubmitting(true);
    try {
      const updatedPoll = unwrapPoll(await pollService.votePoll(poll.conversationId, poll.id, optionIds));
      setPoll(updatedPoll);
      setPendingOptionIds(null);
      onPollUpdated?.(updatedPoll);
    } catch (error: any) {
      alert(error?.message || "Could not vote this poll.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePendingOption = (optionId: string) => {
    if (!canVote) return;
    setPendingOptionIds((prev) => {
      const base = prev ?? selectedOptionIds;
      return base.includes(optionId) ? base.filter((id) => id !== optionId) : [...base, optionId];
    });
  };

  const closePoll = async () => {
    if (!poll.conversationId || !poll.id || isClosed) return;
    setIsSubmitting(true);
    try {
      const updatedPoll = unwrapPoll(await pollService.closePoll(poll.conversationId, poll.id));
      setPoll(updatedPoll);
      onPollUpdated?.(updatedPoll);
    } catch (error: any) {
      alert(error?.message || "Could not close this poll.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addOption = async () => {
    const text = newOptionText.trim();
    if (!text || !poll.conversationId || !poll.id || !canAddOption) return;
    setIsSubmitting(true);
    try {
      const updatedPoll = unwrapPoll(await pollService.addOption(poll.conversationId, poll.id, text));
      setPoll(updatedPoll);
      setNewOptionText("");
      setIsAddingOption(false);
      onPollUpdated?.(updatedPoll);
    } catch (error: any) {
      alert(error?.message || "Could not add this option.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-w-[280px] max-w-[420px] px-3 pt-2.5 pb-1 animate-in fade-in slide-in-from-bottom-1 duration-200">
      <div className="flex items-center gap-2.5">
        <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-105 ${mine ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-600"}`}>
          <FiBarChart2 />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="flex-1 min-w-0 text-[15px] font-semibold leading-tight break-words">{poll.question}</h3>
            {isClosed && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold opacity-70 shrink-0">
                <FiLock /> Closed
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {poll.options?.map((option: any) => {
          const voteCount = Number(option.voteCount || 0);
          const percent = showResults && totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
          const isSelected = selectedOptionIds.includes(option.id);
          const isEffectivelySelected = isMultipleChoice ? effectiveOptionIds.includes(option.id) : isSelected;
          const isPendingAdded = hasPendingSelection && !isSelected && isEffectivelySelected;
          const isPendingRemoved = hasPendingSelection && isSelected && !isEffectivelySelected;
          const optionVoters = getOptionVoters(option);

          return (
            <button
              key={option.id}
              onClick={() => {
                if (isMultipleChoice) {
                  togglePendingOption(option.id);
                } else {
                  submitVote(option.id);
                }
              }}
              disabled={!canVote}
              className={`relative w-full overflow-hidden rounded-xl border text-left transition-all duration-200 hover:-translate-y-[1px] hover:shadow-sm active:scale-[0.99] disabled:cursor-default disabled:hover:translate-y-0 disabled:hover:shadow-none ${
                isPendingRemoved
                  ? "border-red-200 bg-red-50/80 dark:border-red-900/60 dark:bg-red-950/25"
                  : isEffectivelySelected
                    ? "border-blue-300 bg-blue-50/90 dark:border-blue-700/70 dark:bg-blue-950/35"
                    : "border-black/5 bg-white/70 dark:border-white/10 dark:bg-slate-700/60"
              }`}
            >
              <div
                className={`${mine ? "bg-emerald-200/70 dark:bg-emerald-700/40" : "bg-blue-100 dark:bg-blue-900/40"} absolute inset-y-0 left-0 transition-[width] duration-500 ease-out`}
                style={{ width: `${percent}%` }}
              />
              <div className="relative flex items-center gap-2 px-3 py-2">
                <span className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${isEffectivelySelected ? "bg-blue-600 border-blue-600 text-white" : "border-gray-300 dark:border-slate-500"}`}>
                  {isEffectivelySelected && <FiCheck className="text-xs" />}
                </span>
                <span className="flex-1 min-w-0 text-sm font-medium truncate">{option.text}</span>
                {!showResults && (isPendingAdded || isPendingRemoved || isSelected) && (
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    isPendingRemoved
                      ? "bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-300"
                      : "bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300"
                  }`}>
                    {isPendingRemoved ? "Remove" : isPendingAdded ? "Add" : "Selected"}
                  </span>
                )}
                {showVoters && optionVoters.length > 0 && (
                  <span className="flex -space-x-1 shrink-0">
                    {optionVoters.slice(0, 4).map((voter: any, index: number) => {
                      const voterId = getVoterId(voter);
                      const profile = (voterId && voterProfiles[voterId]) || (typeof voter === "object" ? voter : null);
                      const avatarUrl = profile?.avatarUrl || profile?.avatar || profile?.profilePicture;
                      const label = profile?.displayName || profile?.username || profile?.name || "U";

                      return (
                        <span
                          key={`${voterId || index}-${index}`}
                          className="h-5 w-5 rounded-full overflow-hidden border border-white dark:border-slate-800 bg-blue-100 text-blue-600 text-[9px] font-bold flex items-center justify-center animate-in zoom-in-75 fade-in duration-200 transition-transform hover:scale-110"
                          title={label}
                        >
                          {avatarUrl ? (
                            <img src={avatarUrl} alt={label} className="h-full w-full object-cover" />
                          ) : (
                            label.charAt(0).toUpperCase()
                          )}
                        </span>
                      );
                    })}
                  </span>
                )}
                {showResults && <span className="text-xs font-semibold opacity-70">{percent}%</span>}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-2 flex items-center justify-between text-xs opacity-70">
        <span>{showResults ? `${totalVotes} vote${totalVotes === 1 ? "" : "s"}` : "Results hidden"}</span>
        <span>{isClosed ? "Closed" : hasVoted ? (canChangeVote ? "Change allowed" : "Voted") : isMultipleChoice ? "Multiple choice" : "Single choice"}</span>
      </div>

      {isMultipleChoice && canVote && (
        <button
          onClick={() => submitVote(effectiveOptionIds[0])}
          disabled={isSubmitting || !canSubmitMultipleVote}
          className="mt-2 w-full rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {hasVoted ? "Update vote" : "Vote"} {effectiveOptionIds.length > 0 ? `(${effectiveOptionIds.length})` : ""}
        </button>
      )}

      {canAddOption && !isAddingOption && (
        <button
          type="button"
          onClick={() => setIsAddingOption(true)}
          className="mt-2 flex w-full items-center gap-2 rounded-xl border border-dashed border-blue-300/80 bg-white/50 px-3 py-2 text-left text-sm font-semibold text-blue-600 transition hover:bg-blue-50 dark:border-blue-700/70 dark:bg-slate-700/40 dark:text-blue-300 dark:hover:bg-slate-700"
        >
          <FiPlus className="shrink-0" />
          Add option
        </button>
      )}

      {canAddOption && isAddingOption && (
        <div className="mt-2 flex items-center gap-2">
          <input
            value={newOptionText}
            onChange={(event) => setNewOptionText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") addOption();
            }}
            placeholder="Add option"
            autoFocus
            className="min-w-0 flex-1 rounded-xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-slate-700/60 px-3 py-2 text-sm outline-none focus:border-blue-400"
          />
          <button
            type="button"
            onClick={addOption}
            disabled={isSubmitting || !newOptionText.trim()}
            className="h-9 w-9 rounded-xl inline-flex items-center justify-center bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Add option"
          >
            <FiPlus />
          </button>
          <button
            type="button"
            onClick={() => {
              setNewOptionText("");
              setIsAddingOption(false);
            }}
            className="h-9 px-2 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700"
          >
            Cancel
          </button>
        </div>
      )}

      {!isClosed && isCreator && (
        <button
          onClick={closePoll}
          disabled={isSubmitting}
          className="mt-2 text-xs font-semibold text-red-500 hover:underline disabled:opacity-60"
        >
          Close poll
        </button>
      )}
    </div>
  );
};
