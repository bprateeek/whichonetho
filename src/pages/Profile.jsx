import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "../lib/toast";
import { getUserStats } from "../services/analytics";
import StatsCard from "../components/StatsCard";
import Spinner from "../components/Spinner";

export default function Profile() {
  const navigate = useNavigate();
  const { user, profile, isLoading: authLoading, signOut } = useAuth();

  const [stats, setStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const userStats = await getUserStats();
        setStats(userStats);
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      } finally {
        setIsLoadingStats(false);
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      const { error } = await signOut();
      if (error) {
        toast.error("Failed to sign out");
      } else {
        toast.success("Signed out successfully");
        navigate("/", { replace: true });
      }
    } catch (err) {
      console.error("Sign out error:", err);
      toast.error("Failed to sign out");
    } finally {
      setIsSigningOut(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <span className="text-3xl font-bold text-primary">
            {profile?.username?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
          </span>
        </div>
        <h1 className="font-geist text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
          @{profile?.username || "user"}
        </h1>
        <p className="font-geist text-gray-500 dark:text-gray-400 mt-1">
          {user.email}
        </p>
        <p className="font-geist text-xs text-gray-400 dark:text-gray-500 mt-2">
          Member since{" "}
          {new Date(user.created_at).toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Stats */}
      {isLoadingStats ? (
        <div className="flex items-center justify-center py-8">
          <Spinner />
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <StatsCard label="Polls Created" value={stats.totalPolls} icon="📋" />
          <StatsCard
            label="Votes Received"
            value={stats.totalVotesReceived}
            icon="📥"
          />
          <StatsCard label="Votes Cast" value={stats.totalVotesCast} icon="🗳️" />
          <StatsCard
            label="Avg Votes/Poll"
            value={stats.avgVotesPerPoll}
            icon="📈"
          />
        </div>
      ) : null}

      {/* Quick Links */}
      <div className="space-y-3">
        <Link
          to="/stats"
          className="font-geist flex items-center justify-between w-full py-4 px-5 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
        >
          <span className="flex items-center gap-3">
            <span className="text-xl">📊</span>
            <span className="text-gray-900 dark:text-gray-100">
              View Stats
            </span>
          </span>
          <svg
            className="w-5 h-5 text-gray-400"
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
        </Link>

        <Link
          to="/history"
          className="font-geist flex items-center justify-between w-full py-4 px-5 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
        >
          <span className="flex items-center gap-3">
            <span className="text-xl">📜</span>
            <span className="text-gray-900 dark:text-gray-100">
              View History
            </span>
          </span>
          <svg
            className="w-5 h-5 text-gray-400"
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
        </Link>

        <Link
          to="/create"
          className="font-geist flex items-center justify-between w-full py-4 px-5 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
        >
          <span className="flex items-center gap-3">
            <span className="text-xl">➕</span>
            <span className="text-gray-900 dark:text-gray-100">
              Create New Poll
            </span>
          </span>
          <svg
            className="w-5 h-5 text-gray-400"
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
        </Link>
      </div>

      {/* Account Info */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 space-y-3">
        <h2 className="font-geist text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Account Info
        </h2>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-geist text-gray-600 dark:text-gray-300">
              Username
            </span>
            <span className="font-geist text-gray-900 dark:text-gray-100 font-medium">
              @{profile?.username}
            </span>
          </div>
          <p className="font-geist text-xs text-gray-400 dark:text-gray-500">
            Usernames are permanent and cannot be changed
          </p>
        </div>
      </div>

      {/* Sign Out */}
      <button
        onClick={handleSignOut}
        disabled={isSigningOut}
        className="font-geist w-full py-3 px-6 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl border border-gray-200 dark:border-gray-700 transition-colors disabled:opacity-50"
      >
        {isSigningOut ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Signing out...
          </span>
        ) : (
          "Sign Out"
        )}
      </button>
    </div>
  );
}
