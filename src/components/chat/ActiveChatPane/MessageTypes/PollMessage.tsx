import { useEffect, useMemo, useState } from "react";
import { FiBarChart2, FiCheck, FiLock } from "react-icons/fi";
import { pollService } from "../../../../services/pollService";
import userService from "../../../../services/userService";

const getVoterId = (voter: any) => {
  if (!voter) return null;
  if (typeof voter === "string") return voter;
  return voter.id || voter._id || voter.userId || null;
};

const getOptionVoters = (option: any) => option.votedUserIds || option.voters || option.userIds || option.votes || [];

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
  const [pendingOptionIds, setPendingOptionIds] = useState<string[]>([]);

  useEffect(() => {
    setPoll(initialPoll);
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
  const isClosed = poll.status === "closed" || poll.closedAt;
  const hasVoted = selectedOptionIds.length > 0;
  const canVote = !isClosed && !isSubmitting && !hasVoted;
  const isMultipleChoice = Boolean(poll.isMultipleChoice);

  const submitVote = async (optionId: string) => {
    if (!canVote || !poll.conversationId || !poll.id) return;
    const optionIds = isMultipleChoice ? pendingOptionIds : [optionId];
    if (optionIds.length === 0) return;

    setIsSubmitting(true);
    try {
      const updatedPoll = await pollService.votePoll(poll.conversationId, poll.id, optionIds);
      setPoll(updatedPoll);
      setPendingOptionIds([]);
      onPollUpdated?.(updatedPoll);
    } catch (error: any) {
      alert(error?.message || "Could not vote this poll.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePendingOption = (optionId: string) => {
    if (!canVote) return;
    setPendingOptionIds((prev) =>
      prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId],
    );
  };

  const closePoll = async () => {
    if (!poll.conversationId || !poll.id || isClosed) return;
    setIsSubmitting(true);
    try {
      const updatedPoll = await pollService.closePoll(poll.conversationId, poll.id);
      setPoll(updatedPoll);
      onPollUpdated?.(updatedPoll);
    } catch (error: any) {
      alert(error?.message || "Could not close this poll.");
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
          const percent = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
          const isSelected = selectedOptionIds.includes(option.id);
          const isPending = pendingOptionIds.includes(option.id);
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
              className="relative w-full overflow-hidden rounded-xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-slate-700/60 text-left transition-all duration-200 hover:-translate-y-[1px] hover:shadow-sm active:scale-[0.99] disabled:cursor-default disabled:hover:translate-y-0 disabled:hover:shadow-none"
            >
              <div
                className={`${mine ? "bg-emerald-200/70 dark:bg-emerald-700/40" : "bg-blue-100 dark:bg-blue-900/40"} absolute inset-y-0 left-0 transition-[width] duration-500 ease-out`}
                style={{ width: `${percent}%` }}
              />
              <div className="relative flex items-center gap-2 px-3 py-2">
                <span className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${isSelected || isPending ? "bg-blue-600 border-blue-600 text-white" : "border-gray-300 dark:border-slate-500"}`}>
                  {(isSelected || isPending) && <FiCheck className="text-xs" />}
                </span>
                <span className="flex-1 min-w-0 text-sm font-medium truncate">{option.text}</span>
                {optionVoters.length > 0 && (
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
                <span className="text-xs font-semibold opacity-70">{percent}%</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-2 flex items-center justify-between text-xs opacity-70">
        <span>{totalVotes} vote{totalVotes === 1 ? "" : "s"}</span>
        <span>{isClosed ? "Closed" : hasVoted ? "Voted" : isMultipleChoice ? "Multiple choice" : "Single choice"}</span>
      </div>

      {isMultipleChoice && canVote && (
        <button
          onClick={() => submitVote(pendingOptionIds[0])}
          disabled={isSubmitting || pendingOptionIds.length === 0}
          className="mt-2 w-full rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Vote {pendingOptionIds.length > 0 ? `(${pendingOptionIds.length})` : ""}
        </button>
      )}

      {!isClosed && poll.createdBy === currentUserId && (
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
