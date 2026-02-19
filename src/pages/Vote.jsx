import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PollCard from "../components/PollCard";
import FilterChip from "../components/FilterChip";
import ReportModal from "../components/ReportModal";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import { getFilteredPolls } from "../services/polls";
import { castVote } from "../services/votes";
import { reportPoll, getLocalReportedList } from "../services/reports";
import { toast } from "../lib/toast";
import { useAuth } from "../context/AuthContext";

export default function Vote() {
  const { isLoading: authLoading } = useAuth();

  // Filter state
  const [selectedGenders, setSelectedGenders] = useState(
    new Set(["female", "male", "nonbinary"]),
  );
  const [timeFilter, setTimeFilter] = useState("all");

  // Poll state
  const [polls, setPolls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [votingPollId, setVotingPollId] = useState(null);
  const [votedPolls, setVotedPolls] = useState(new Map());
  const [error, setError] = useState(null);

  // Report state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportingPollId, setReportingPollId] = useState(null);
  const [isReporting, setIsReporting] = useState(false);

  // Fetch polls when filters change (wait for auth to be ready)
  useEffect(() => {
    // Don't fetch until auth is ready
    if (authLoading) return;

    const fetchPolls = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const reportedPollIds = getLocalReportedList();
        const fetchedPolls = await getFilteredPolls({
          genders: Array.from(selectedGenders),
          timeFilter,
          limit: 20,
          excludeIds: reportedPollIds,
        });
        setPolls(fetchedPolls);
      } catch (err) {
        console.error("Failed to fetch polls:", err);
        setError("Failed to load polls. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPolls();
  }, [selectedGenders, timeFilter, authLoading]);

  const toggleGender = (gender) => {
    setSelectedGenders((prev) => {
      const next = new Set(prev);
      if (next.has(gender)) {
        next.delete(gender);
      } else {
        next.add(gender);
      }
      return next;
    });
  };

  const handleVote = async (pollId, votedOption) => {
    if (votingPollId || votedPolls.has(pollId)) return;

    setVotingPollId(pollId);

    try {
      const result = await castVote(pollId, votedOption, "nonbinary");

      if (result.alreadyVoted) {
        toast.info("You've already voted on this poll");
      }

      setVotedPolls((prev) => new Map(prev).set(pollId, votedOption));
    } catch (err) {
      console.error("Failed to cast vote:", err);
      toast.error("Failed to submit vote. Please try again.");
    } finally {
      setVotingPollId(null);
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
      setPolls((prev) => prev.filter((p) => p.id !== reportingPollId));
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

  return (
    <div className="space-y-4">
      {/* Filter card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 p-3">
        {/* Gender filters - multi-select */}
        {/* <p className="font-geist text-xs text-gray-500 dark:text-gray-400 mb-1">
          Show outfits from
        </p> */}
        <div className="grid grid-cols-3 gap-3 mb-2">
          <FilterChip
            label="Women"
            selected={selectedGenders.has("female")}
            onClick={() => toggleGender("female")}
          />
          <FilterChip
            label="Men"
            selected={selectedGenders.has("male")}
            onClick={() => toggleGender("male")}
          />
          <FilterChip
            label="Others"
            selected={selectedGenders.has("nonbinary")}
            onClick={() => toggleGender("nonbinary")}
          />
        </div>

        {/* Time filters - single-select */}
        {/* <p className="font-geist text-xs text-gray-500 dark:text-gray-400 mb-1">
          Time remaining
        </p> */}
        <div className="grid grid-cols-4 gap-2">
          <FilterChip
            label="< 15m"
            selected={timeFilter === "soon"}
            onClick={() => setTimeFilter("soon")}
          />
          <FilterChip
            label="< 1h"
            selected={timeFilter === "hour"}
            onClick={() => setTimeFilter("hour")}
          />
          <FilterChip
            label="< 4h"
            selected={timeFilter === "4hours"}
            onClick={() => setTimeFilter("4hours")}
          />
          <FilterChip
            label="All"
            selected={timeFilter === "all"}
            onClick={() => setTimeFilter("all")}
          />
        </div>
      </div>

      {/* Loading state */}
      {(isLoading || authLoading) && (
        <div className="flex items-center justify-center py-12">
          <Spinner />
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="text-center space-y-4 py-12">
          <p className="font-geist text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="font-geist py-2 px-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300"
          >
            Try Again
          </button>
        </div>
      )}

      {/* No polls available */}
      {!isLoading && !error && polls.length === 0 && (
        <EmptyState
          icon="🎉"
          title="No polls available"
          description={
            selectedGenders.size === 0
              ? "Select at least one gender filter to see polls"
              : "No polls match your current filters. Try adjusting them or check back later."
          }
          action={
            selectedGenders.size > 0 && (
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
            )
          }
        />
      )}

      {/* Poll list */}
      {!isLoading && !error && polls.length > 0 && (
        <div className="space-y-6">
          {polls.map((poll) => (
            <PollCard
              key={poll.id}
              poll={poll}
              onVote={(choice) => handleVote(poll.id, choice)}
              isVoting={votingPollId === poll.id}
              votedFor={votedPolls.get(poll.id)}
              showResults={votedPolls.has(poll.id)}
              onReport={handleReportClick}
            />
          ))}
        </div>
      )}

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
