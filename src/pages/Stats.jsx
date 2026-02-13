import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import StatsCard from "../components/StatsCard";
import { BarChart, DonutChart, ComparisonBar } from "../components/SimpleChart";
import Spinner from "../components/Spinner";
import { getUserStats, getVoteTimeline } from "../services/analytics";
import { useAuth } from "../context/AuthContext";

// Preview data for unauthenticated users
const previewStats = {
  totalPolls: 12,
  totalVotesReceived: 48,
  totalVotesCast: 36,
  avgVotesPerPoll: 4,
  aWins: 7,
  bWins: 4,
  ties: 1,
};

const previewTimeline = [
  { label: "Mon", count: 5 },
  { label: "Tue", count: 8 },
  { label: "Wed", count: 12 },
  { label: "Thu", count: 6 },
  { label: "Fri", count: 9 },
  { label: "Sat", count: 15 },
  { label: "Sun", count: 11 },
];

const previewContextData = [
  { label: "Date", count: 5 },
  { label: "Work", count: 3 },
  { label: "Casual", count: 4 },
];

// Blurred preview component for unauthenticated users
function StatsPreview() {
  return (
    <div className="relative">
      {/* Blurred preview */}
      <div
        className="blur-sm pointer-events-none select-none"
        aria-hidden="true"
      >
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="font-geist text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
              Your Stats
            </h1>
            <p className="font-geist text-gray-500 dark:text-gray-400 mt-1">
              Track your poll performance and voting activity
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <StatsCard
              label="Polls Created"
              value={previewStats.totalPolls}
              icon="📋"
            />
            <StatsCard
              label="Votes Received"
              value={previewStats.totalVotesReceived}
              icon="📥"
            />
            <StatsCard
              label="Votes Cast"
              value={previewStats.totalVotesCast}
              icon="🗳️"
            />
            <StatsCard
              label="Avg Votes/Poll"
              value={previewStats.avgVotesPerPoll}
              icon="📈"
            />
          </div>

          {/* A vs B Results */}
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="font-geist text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              A vs B Results
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ComparisonBar
                valueA={previewStats.aWins}
                valueB={previewStats.bWins}
                labelA="A Wins"
                labelB="B Wins"
              />
              <div className="flex justify-center">
                <DonutChart
                  value={previewStats.aWins + previewStats.bWins}
                  total={previewStats.totalPolls}
                  label="Polls with votes"
                />
              </div>
            </div>
          </div>

          {/* Votes Over Time */}
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="font-geist text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Votes This Week
            </h2>
            <BarChart data={previewTimeline} />
          </div>

          {/* Context Breakdown */}
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="font-geist text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Polls by Context
            </h2>
            <BarChart data={previewContextData} color="secondary" />
          </div>
        </div>
      </div>

      {/* Auth prompt overlay */}
      <div className="absolute inset-0 flex items-start justify-center pt-24">
        <div className="text-center bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 max-w-sm mx-4">
          <div className="text-4xl mb-4">📊</div>
          <h2 className="font-geist text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Sign in to view stats
          </h2>
          <p className="font-geist text-gray-500 dark:text-gray-400 mb-6">
            Track your poll performance and voting activity across all your
            devices
          </p>
          <div className="flex flex-col gap-3">
            <Link
              to="/login"
              state={{ from: { pathname: "/stats" } }}
              className="font-geist w-full py-3 px-6 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="font-geist w-full py-3 px-6 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition-colors"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Stats() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Only fetch stats if authenticated
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [userStats, voteTimeline] = await Promise.all([
          getUserStats(),
          getVoteTimeline(7),
        ]);

        setStats(userStats);
        setTimeline(voteTimeline);
      } catch (err) {
        console.error("Failed to fetch stats:", err);
        setError("Failed to load stats");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [isAuthenticated]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  // Show blurred preview for unauthenticated users
  if (!isAuthenticated) {
    return <StatsPreview />;
  }

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
        <button
          onClick={() => window.location.reload()}
          className="font-geist inline-block py-3 px-6 bg-primary text-white font-semibold rounded-xl"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Empty state
  if (!stats || (stats.totalPolls === 0 && stats.totalVotesCast === 0)) {
    return (
      <div className="text-center space-y-4 py-12">
        <div className="text-5xl">📊</div>
        <h1 className="font-geist text-2xl font-bold text-gray-900 dark:text-gray-100">
          No stats Yet
        </h1>
        <p className="font-geist text-gray-500 dark:text-gray-400">
          Create polls and vote to see your stats here.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/create"
            className="font-geist inline-block py-3 px-6 bg-primary text-white font-semibold rounded-xl"
          >
            Create a Poll
          </Link>
          <Link
            to="/vote"
            className="font-geist inline-block py-3 px-6 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-xl"
          >
            Start Voting
          </Link>
        </div>
      </div>
    );
  }

  // Context data for bar chart
  const contextData = Object.entries(stats.contextCounts || {}).map(
    ([label, count]) => ({
      label:
        label === "none"
          ? "General"
          : label.charAt(0).toUpperCase() + label.slice(1),
      count,
    }),
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-geist text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
          Your Stats
        </h1>
        <p className="font-geist text-gray-500 dark:text-gray-400 mt-1">
          Track your poll performance and voting activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatsCard
          label="Polls Created"
          value={stats.totalPolls}
          icon="📋"
          trend={stats.recentPolls > 0 ? stats.recentPolls : null}
        />
        <StatsCard
          label="Votes Received"
          value={stats.totalVotesReceived}
          icon="📥"
        />
        <StatsCard
          label="Votes Cast"
          value={stats.totalVotesCast}
          icon="🗳️"
          trend={stats.recentVotes > 0 ? stats.recentVotes : null}
        />
        <StatsCard
          label="Avg Votes/Poll"
          value={stats.avgVotesPerPoll}
          icon="📈"
        />
      </div>

      {/* A vs B Results */}
      {stats.totalPolls > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="font-geist text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            A vs B Results
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <ComparisonBar
                valueA={stats.aWins}
                valueB={stats.bWins}
                labelA="A Wins"
                labelB="B Wins"
              />
              {stats.ties > 0 && (
                <p className="font-geist text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
                  {stats.ties} tie{stats.ties !== 1 ? "s" : ""}
                </p>
              )}
            </div>
            <div className="flex justify-center">
              <DonutChart
                value={stats.aWins + stats.bWins}
                total={stats.totalPolls}
                label="Polls with votes"
              />
            </div>
          </div>
        </div>
      )}

      {/* Votes Over Time */}
      {timeline.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="font-geist text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Votes This Week
          </h2>
          <BarChart data={timeline} />
        </div>
      )}

      {/* Context Breakdown */}
      {contextData.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="font-geist text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Polls by Context
          </h2>
          <BarChart data={contextData} color="secondary" />
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          to="/history"
          className="font-geist flex-1 py-3 px-6 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-700 font-medium rounded-xl text-center transition-colors"
        >
          View History
        </Link>
        <Link
          to="/create"
          className="font-geist flex-1 py-3 px-6 bg-primary hover:bg-primary-dark text-white font-medium rounded-xl text-center transition-colors"
        >
          Create New Poll
        </Link>
      </div>
    </div>
  );
}
