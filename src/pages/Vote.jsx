import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PollCard from "../components/PollCard";
import GenderSelect from "../components/GenderSelect";
import ReportModal from "../components/ReportModal";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import { getActivePolls, getPollsByGender } from "../services/polls";
import { castVote } from "../services/votes";
import { reportPoll, getLocalReportedList } from "../services/reports";
import { useSwipe } from "../hooks/useSwipe";
import { toast } from "../lib/toast";

export default function Vote() {
  const [voterGender, setVoterGender] = useState("");
  const [showFilter, setShowFilter] = useState("");
  const [polls, setPolls] = useState([]);
  const [currentPollIndex, setCurrentPollIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [voteCount, setVoteCount] = useState(0);
  const [error, setError] = useState(null);
  const [currentVote, setCurrentVote] = useState(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportingPollId, setReportingPollId] = useState(null);
  const [isReporting, setIsReporting] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Fetch polls when gender is selected
  useEffect(() => {
    if (!voterGender) return;

    const fetchPolls = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Get locally reported polls to filter out
        const reportedPollIds = getLocalReportedList();

        let fetchedPolls;
        if (showFilter) {
          // Viewing specific gender's outfits
          fetchedPolls = await getPollsByGender(
            showFilter,
            20,
            reportedPollIds
          );
        } else {
          // Viewing outfits based on voter's gender preference
          fetchedPolls = await getActivePolls(voterGender, 20, reportedPollIds);
        }
        setPolls(fetchedPolls);
      } catch (err) {
        console.error("Failed to fetch polls:", err);
        setError("Failed to load polls. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPolls();
  }, [voterGender, showFilter]);

  const currentPoll = polls[currentPollIndex];

  // Swipe gestures for voting
  const {
    swipeOffset,
    isSwiping,
    handlers: swipeHandlers,
  } = useSwipe({
    onSwipeLeft: () => {
      if (!isVoting && !currentVote && currentPoll) {
        handleVote("B");
      }
    },
    onSwipeRight: () => {
      if (!isVoting && !currentVote && currentPoll) {
        handleVote("A");
      }
    },
    threshold: 80,
  });

  // Determine swipe direction for visual feedback
  const swipeDirection =
    swipeOffset > 30 ? "A" : swipeOffset < -30 ? "B" : null;

  const handleVote = async (votedOption) => {
    if (isVoting || !currentPoll || currentVote) return;

    setIsVoting(true);
    setCurrentVote(votedOption);

    try {
      const result = await castVote(
        currentPoll.id,
        votedOption,
        voterGender === "viewing" ? "nonbinary" : voterGender
      );

      if (result.alreadyVoted) {
        // Skip to next poll if already voted
        console.log("Already voted on this poll");
      }

      setVoteCount((prev) => prev + 1);
      toast.success(`Voted for Outfit ${votedOption}!`);

      // Show results for 1.5 seconds before advancing with transition
      setTimeout(() => {
        setIsTransitioning(true);
        setTimeout(() => {
          setCurrentVote(null);
          if (currentPollIndex < polls.length - 1) {
            setCurrentPollIndex((prev) => prev + 1);
          } else {
            // Remove current poll from list (we've voted)
            setPolls((prev) => prev.filter((p) => p.id !== currentPoll.id));
            setCurrentPollIndex(0);
          }
          setIsTransitioning(false);
        }, 200);
      }, 1300);
    } catch (err) {
      console.error("Failed to cast vote:", err);
      toast.error("Failed to submit vote. Please try again.");
      setCurrentVote(null);
    } finally {
      setIsVoting(false);
    }
  };

  const handleSkip = () => {
    if (currentPollIndex < polls.length - 1) {
      setCurrentPollIndex((prev) => prev + 1);
    } else {
      // Remove current poll from list
      setPolls((prev) => prev.filter((p) => p.id !== currentPoll.id));
      setCurrentPollIndex(0);
    }
  };

  const handleReportClick = (pollId) => {
    setReportingPollId(pollId);
    setReportModalOpen(true);
  };

  const handleReportSubmit = async (reason) => {
    if (!reportingPollId) return;

    setIsReporting(true);
    try {
      await reportPoll(reportingPollId, reason);

      // Remove the reported poll from the list
      setPolls((prev) => prev.filter((p) => p.id !== reportingPollId));

      // Reset index if needed
      if (currentPollIndex >= polls.length - 1) {
        setCurrentPollIndex(0);
      }
    } catch (err) {
      console.error("Failed to report poll:", err);
    } finally {
      setIsReporting(false);
      setReportModalOpen(false);
      setReportingPollId(null);
    }
  };

  const handleReportCancel = () => {
    setReportModalOpen(false);
    setReportingPollId(null);
  };

  // Initial gender selection
  if (!voterGender) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="font-geist text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
            What's your gender?
          </h1>
          <p className="font-geist text-gray-500 dark:text-gray-400 mt-2">
            We'll show you outfits from others to vote on
          </p>
        </div>

        <GenderSelect value={voterGender} onChange={setVoterGender} />

        <div className="text-center">
          <p className="font-geist text-sm text-gray-500 dark:text-gray-400">
            Or choose which outfits to vote on:
          </p>
          <div className="flex gap-2 justify-center mt-3">
            <button
              onClick={() => {
                setShowFilter("female");
                setVoterGender("viewing");
              }}
              className="font-geist py-2 px-4 rounded-full border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300 text-sm"
            >
              Women's outfits
            </button>
            <button
              onClick={() => {
                setShowFilter("male");
                setVoterGender("viewing");
              }}
              className="font-geist py-2 px-4 rounded-full border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300 text-sm"
            >
              Men's outfits
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center space-y-4 py-12">
        <p className="font-geist text-red-600 dark:text-red-400">{error}</p>
        <button
          onClick={() => setVoterGender("")}
          className="font-geist py-2 px-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300"
        >
          Try Again
        </button>
      </div>
    );
  }

  // No more polls
  if (!currentPoll || polls.length === 0) {
    return (
      <EmptyState
        icon="🎉"
        title={
          voteCount > 0 ? "You've voted on all polls!" : "No polls available"
        }
        description={
          voteCount > 0
            ? `You've helped ${voteCount} ${
                voteCount === 1 ? "person" : "people"
              } today. Check back later for more polls.`
            : "Be the first to post a poll!"
        }
        action={
          <div className="space-y-3">
            <Link
              to="/create"
              className="font-geist block w-full py-3 px-6 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl text-center transition-colors"
            >
              Post Your Own Poll
            </Link>
            <Link
              to="/"
              className="font-geist block w-full py-3 px-6 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl text-center transition-colors"
            >
              Back to Home
            </Link>
          </div>
        }
      />
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Stats bar */}
      <div className="font-geist flex items-center justify-between text-sm">
        <span className="text-gray-500 dark:text-gray-400">
          {polls.length - currentPollIndex} polls remaining
        </span>
        {voteCount > 0 && (
          <span className="text-primary font-medium">
            {voteCount} {voteCount === 1 ? "vote" : "votes"} cast ✓
          </span>
        )}
      </div>

      {/* Current poll with swipe support */}
      <div
        {...swipeHandlers}
        className={`relative touch-pan-y transition-opacity duration-200 ${
          isTransitioning ? "opacity-0" : "opacity-100"
        }`}
        style={{
          transform: `translateX(${swipeOffset}px) rotate(${
            swipeOffset * 0.05
          }deg)`,
          transition: isSwiping ? "none" : "transform 0.3s ease-out",
        }}
      >
        {/* Swipe direction indicators */}
        {swipeDirection && !currentVote && (
          <div
            className={`absolute inset-0 z-10 flex items-center justify-center pointer-events-none ${
              swipeDirection === "A" ? "bg-primary/20" : "bg-secondary/20"
            } rounded-2xl`}
          >
            <span
              className={`font-geist text-4xl font-bold ${
                swipeDirection === "A" ? "text-primary" : "text-secondary"
              }`}
            >
              {swipeDirection}
            </span>
          </div>
        )}

        <PollCard
          poll={currentPoll}
          onVote={handleVote}
          isVoting={isVoting}
          votedFor={currentVote}
          showResults={!!currentVote}
          onReport={handleReportClick}
        />
      </div>

      {/* Swipe hint (only shown on first poll) */}
      {currentPollIndex === 0 && !currentVote && voteCount === 0 && (
        <p className="font-geist text-center text-xs text-gray-400 dark:text-gray-500">
          Swipe right for A, left for B — or tap to vote
        </p>
      )}

      {/* Skip option */}
      <button
        onClick={handleSkip}
        disabled={isVoting}
        className="font-geist w-full py-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-sm transition-colors disabled:opacity-50"
      >
        Skip this poll
      </button>

      {/* Report Modal */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={handleReportCancel}
        onSubmit={handleReportSubmit}
        isSubmitting={isReporting}
      />
    </div>
  );
}
