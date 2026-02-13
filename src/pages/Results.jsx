import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import PollCard from "../components/PollCard";
import CountdownTimer from "../components/CountdownTimer";
import Spinner from "../components/Spinner";
import ShareButtons from "../components/ShareButtons";
import { getPollById, isCurrentUserPollCreator } from "../services/polls";
import { subscribeToVoteCounts, hasVoted, castVote } from "../services/votes";
import { useMetaTags } from "../hooks/useMetaTags";

export default function Results() {
  const { pollId } = useParams();
  const [poll, setPoll] = useState(null);
  const [userVote, setUserVote] = useState(null);
  const [isCreator, setIsCreator] = useState(false);
  const [creatorPick, setCreatorPick] = useState(null);
  const [isVoting, setIsVoting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dynamic meta tags for sharing
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareTitle = poll
    ? `Vote on my outfit poll - WhichOneTho`
    : "WhichOneTho - Outfit Opinions";
  const shareDescription = poll?.context
    ? `Help me decide which outfit is better for ${poll.context}!`
    : "Help me decide which outfit is better!";

  useMetaTags({
    title: shareTitle,
    description: shareDescription,
    image: poll?.image_a_url,
    url: shareUrl,
  });

  useEffect(() => {
    let unsubscribe = null;

    const fetchPoll = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch poll data
        const pollData = await getPollById(pollId);
        setPoll(pollData);

        // Check if current user is the creator
        const creator = await isCurrentUserPollCreator(pollData);
        setIsCreator(creator);

        // Check if user has voted on this poll
        const voteStatus = await hasVoted(pollId);
        if (voteStatus.hasVoted) {
          setUserVote(voteStatus.votedFor);
          // If creator voted, that's their "pick"
          if (creator) {
            setCreatorPick(voteStatus.votedFor);
          }
        }

        // Subscribe to real-time vote updates
        unsubscribe = subscribeToVoteCounts(pollId, (newCounts) => {
          setPoll((prev) => ({
            ...prev,
            votes_a: newCounts.votes_a,
            votes_b: newCounts.votes_b,
            total_votes: newCounts.total_votes,
          }));
        });
      } catch (err) {
        console.error("Failed to fetch poll:", err);
        setError("Failed to load poll");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPoll();

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [pollId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div className="text-center space-y-4 py-12">
        <h1 className="font-geist text-2xl font-bold text-gray-900 dark:text-gray-100">
          Poll not found
        </h1>
        <p className="font-geist text-gray-500 dark:text-gray-400">
          This poll may have expired or been removed.
        </p>
        <Link
          to="/"
          className="font-geist inline-block py-3 px-6 bg-primary text-white font-semibold rounded-xl"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  const totalVotes = (poll.votes_a || 0) + (poll.votes_b || 0);
  const winner =
    poll.votes_a > poll.votes_b
      ? "A"
      : poll.votes_b > poll.votes_a
      ? "B"
      : null;
  const winnerPercent =
    totalVotes > 0
      ? winner === "A"
        ? Math.round((poll.votes_a / totalVotes) * 100)
        : winner === "B"
        ? Math.round((poll.votes_b / totalVotes) * 100)
        : 50
      : 0;

  // Calculate if expired
  const expiresAt = new Date(poll.expires_at);
  const now = new Date();
  const isExpired = expiresAt < now || poll.status === "closed";

  // Handle creator voting on their own poll
  const handleCreatorVote = async (choice) => {
    if (isVoting || userVote || isExpired) return;

    setIsVoting(true);
    try {
      const result = await castVote(pollId, choice, poll.poster_gender);
      if (result.success) {
        setUserVote(choice);
        setCreatorPick(choice);
      }
    } catch (err) {
      console.error("Failed to cast vote:", err);
    } finally {
      setIsVoting(false);
    }
  };

  // Creator can vote if they haven't voted yet and poll is not expired
  const canCreatorVote = isCreator && !userVote && !isExpired;

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Final Results Badge (when expired) */}
      {isExpired && (
        <div className="flex justify-center">
          <span className="font-geist inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-full">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Final Results
          </span>
        </div>
      )}

      {/* Header */}
      <div className="text-center">
        <h1 className="font-geist text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
          {totalVotes === 0
            ? "Waiting for votes..."
            : winner
            ? `Outfit ${winner} ${isExpired ? "won!" : "is winning!"}`
            : "It's a tie!"}
        </h1>
        {winner && totalVotes > 0 && (
          <p className="font-geist text-gray-500 dark:text-gray-400 mt-1">
            {winnerPercent}% of voters prefer this look
          </p>
        )}
      </div>

      {/* Status */}
      <div className="text-center">
        {isExpired ? (
          <p className="font-geist text-gray-500 dark:text-gray-400">
            Poll Ended
          </p>
        ) : (
          <p className="font-geist text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
            <span>Time remaining:</span>
            <CountdownTimer expiresAt={poll.expires_at} />
            <span>· Votes update in real-time</span>
          </p>
        )}
      </div>

      {/* Poll with results */}
      <PollCard
        poll={poll}
        showResults={true}
        votedFor={userVote}
        onVote={canCreatorVote ? handleCreatorVote : undefined}
        isVoting={isVoting}
        creatorPick={creatorPick}
      />

      {/* Share Options */}
      <ShareButtons url={shareUrl} title={shareTitle} text={shareDescription} />

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          to="/vote"
          className="font-geist py-3 px-6 bg-primary hover:bg-primary-dark text-white font-medium rounded-xl text-center transition-colors"
        >
          Vote on Polls
        </Link>
        <Link
          to="/create"
          className="font-geist py-3 px-6 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-700 font-medium rounded-xl text-center transition-colors"
        >
          Post Another
        </Link>
      </div>
    </div>
  );
}
