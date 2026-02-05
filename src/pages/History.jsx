import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import { getUserCreatedPolls, getUserVotedPolls } from "../services/polls";

export default function History() {
  const [activeTab, setActiveTab] = useState("created");
  const [createdPolls, setCreatedPolls] = useState([]);
  const [votedPolls, setVotedPolls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [created, voted] = await Promise.all([
          getUserCreatedPolls(),
          getUserVotedPolls(),
        ]);

        setCreatedPolls(created);
        setVotedPolls(voted);
      } catch (err) {
        console.error("Failed to fetch history:", err);
        setError("Failed to load history");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center space-y-4 py-12">
        <h1 className="font-geist text-2xl font-bold text-gray-900 dark:text-gray-100">
          Something went wrong
        </h1>
        <p className="font-geist text-gray-500 dark:text-gray-400">{error}</p>
        <Link
          to="/"
          className="font-geist inline-block py-3 px-6 bg-primary text-white font-semibold rounded-xl"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  const activePollList = activeTab === "created" ? createdPolls : votedPolls;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="font-geist text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
          My History
        </h1>
        <p className="font-geist text-gray-500 dark:text-gray-400 mt-1">
          Your polls and votes
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
        <button
          onClick={() => setActiveTab("created")}
          className={`font-geist flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "created"
              ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          }`}
        >
          My Polls ({createdPolls.length})
        </button>
        <button
          onClick={() => setActiveTab("voted")}
          className={`font-geist flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "voted"
              ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          }`}
        >
          Voted On ({votedPolls.length})
        </button>
      </div>

      {/* Content */}
      {activePollList.length === 0 ? (
        <EmptyState
          icon={activeTab === "created" ? "📝" : "✓"}
          title={activeTab === "created" ? "No polls yet" : "No votes yet"}
          description={
            activeTab === "created"
              ? "Create your first poll to get outfit feedback"
              : "Vote on polls to help others choose"
          }
          action={
            <Link
              to={activeTab === "created" ? "/create" : "/vote"}
              className="font-geist inline-block py-2 px-4 bg-primary text-white font-medium rounded-lg text-sm"
            >
              {activeTab === "created" ? "Create Poll" : "Start Voting"}
            </Link>
          }
        />
      ) : (
        <div className="space-y-4 md:space-y-5">
          {activePollList.map((poll) => (
            <HistoryPollCard
              key={poll.id}
              poll={poll}
              showUserVote={activeTab === "voted"}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function HistoryPollCard({ poll, showUserVote }) {
  const totalVotes = poll.total_votes || 0;
  const percentA =
    totalVotes > 0 ? Math.round((poll.votes_a / totalVotes) * 100) : 50;
  const percentB =
    totalVotes > 0 ? Math.round((poll.votes_b / totalVotes) * 100) : 50;
  const winner = percentA > percentB ? "A" : percentB > percentA ? "B" : null;

  // Calculate status
  const expiresAt = new Date(poll.expires_at);
  const now = new Date();
  const isExpired = expiresAt < now || poll.status === "closed";

  // Format time
  const timeAgo = formatTimeAgo(new Date(poll.created_at));

  return (
    <Link
      to={`/results/${poll.id}`}
      className="block bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* Header: username, context, time, status */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <div className="flex items-center gap-2 text-sm min-w-0">
          <span className="font-geist text-gray-500 dark:text-gray-400 truncate">
            {poll.username ? (
              <span className="font-medium text-gray-700 dark:text-gray-300">
                @{poll.username}
              </span>
            ) : (
              "Anonymous"
            )}
          </span>
          {poll.context && (
            <span className="font-geist shrink-0 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded-full capitalize">
              {poll.context}
            </span>
          )}
          <span className="font-geist text-gray-400 dark:text-gray-500 text-xs shrink-0">
            · {timeAgo}
          </span>
        </div>
        <span
          className={`font-geist shrink-0 px-2 py-0.5 text-xs rounded-full ${
            isExpired
              ? "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
              : "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400"
          }`}
        >
          {isExpired ? "Ended" : "Active"}
        </span>
      </div>

      {/* Images: side-by-side with aspect ratio */}
      <div className="grid grid-cols-2 gap-2 px-3">
        <div className="relative aspect-[3/4] rounded-lg overflow-hidden">
          <img
            src={poll.image_a_url}
            alt="Outfit A"
            className="w-full h-full object-cover"
          />
          <div
            className={`font-geist absolute top-1.5 left-1.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${
              winner === "A"
                ? "bg-green-500 text-white"
                : "bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-300"
            }`}
          >
            A
          </div>
          {showUserVote && poll.userVote === "A" && (
            <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-white drop-shadow-md"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
        </div>
        <div className="relative aspect-[3/4] rounded-lg overflow-hidden">
          <img
            src={poll.image_b_url}
            alt="Outfit B"
            className="w-full h-full object-cover"
          />
          <div
            className={`font-geist absolute top-1.5 left-1.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${
              winner === "B"
                ? "bg-green-500 text-white"
                : "bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-300"
            }`}
          >
            B
          </div>
          {showUserVote && poll.userVote === "B" && (
            <div className="absolute inset-0 bg-secondary/30 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-white drop-shadow-md"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Footer: progress bar + votes + arrow */}
      <div className="flex items-center gap-3 px-3 py-2.5">
        <div className="flex-1">
          <div className="font-geist flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>A: {percentA}%</span>
            <span>B: {percentB}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex">
            <div
              className={`h-full ${
                winner === "A" ? "bg-green-500" : "bg-primary"
              }`}
              style={{ width: `${percentA}%` }}
            />
            <div
              className={`h-full ${
                winner === "B" ? "bg-green-500" : "bg-secondary"
              }`}
              style={{ width: `${percentB}%` }}
            />
          </div>
        </div>
        <span className="font-geist text-xs text-gray-500 dark:text-gray-400 shrink-0">
          {totalVotes} {totalVotes === 1 ? "vote" : "votes"}
        </span>
        <svg
          className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </Link>
  );
}

function formatTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}
