import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Spinner from '../components/Spinner'
import EmptyState from '../components/EmptyState'
import { getUserCreatedPolls, getUserVotedPolls } from '../services/polls'

export default function History() {
  const [activeTab, setActiveTab] = useState('created')
  const [createdPolls, setCreatedPolls] = useState([])
  const [votedPolls, setVotedPolls] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const [created, voted] = await Promise.all([
          getUserCreatedPolls(),
          getUserVotedPolls(),
        ])

        setCreatedPolls(created)
        setVotedPolls(voted)
      } catch (err) {
        console.error('Failed to fetch history:', err)
        setError('Failed to load history')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center space-y-4 py-12">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Something went wrong</h1>
        <p className="text-gray-500 dark:text-gray-400">{error}</p>
        <Link
          to="/"
          className="inline-block py-3 px-6 bg-primary text-white font-semibold rounded-xl"
        >
          Back to Home
        </Link>
      </div>
    )
  }

  const activePollList = activeTab === 'created' ? createdPolls : votedPolls

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">My History</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Your polls and votes</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
        <button
          onClick={() => setActiveTab('created')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'created'
              ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          My Polls ({createdPolls.length})
        </button>
        <button
          onClick={() => setActiveTab('voted')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'voted'
              ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Voted On ({votedPolls.length})
        </button>
      </div>

      {/* Content */}
      {activePollList.length === 0 ? (
        <EmptyState
          icon={activeTab === 'created' ? '📝' : '✓'}
          title={activeTab === 'created' ? 'No polls yet' : 'No votes yet'}
          description={
            activeTab === 'created'
              ? 'Create your first poll to get outfit feedback'
              : 'Vote on polls to help others choose'
          }
          action={
            <Link
              to={activeTab === 'created' ? '/create' : '/vote'}
              className="inline-block py-2 px-4 bg-primary text-white font-medium rounded-lg text-sm"
            >
              {activeTab === 'created' ? 'Create Poll' : 'Start Voting'}
            </Link>
          }
        />
      ) : (
        <div className="space-y-4 md:space-y-5">
          {activePollList.map((poll) => (
            <HistoryPollCard
              key={poll.id}
              poll={poll}
              showUserVote={activeTab === 'voted'}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function HistoryPollCard({ poll, showUserVote }) {
  const totalVotes = poll.total_votes || 0
  const percentA = totalVotes > 0 ? Math.round((poll.votes_a / totalVotes) * 100) : 50
  const percentB = totalVotes > 0 ? Math.round((poll.votes_b / totalVotes) * 100) : 50
  const winner = percentA > percentB ? 'A' : percentB > percentA ? 'B' : null

  // Calculate status
  const expiresAt = new Date(poll.expires_at)
  const now = new Date()
  const isExpired = expiresAt < now || poll.status === 'closed'

  // Format time
  const timeAgo = formatTimeAgo(new Date(poll.created_at))

  return (
    <Link
      to={`/results/${poll.id}`}
      className="block bg-white dark:bg-gray-900 rounded-xl shadow-sm dark:shadow-gray-900/50 overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="flex">
        {/* Images */}
        <div className="flex shrink-0">
          <div className="relative w-20 h-24 md:w-24 md:h-28">
            <img
              src={poll.image_a_url}
              alt="Outfit A"
              className="w-full h-full object-cover"
            />
            {showUserVote && poll.userVote === 'A' && (
              <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
          <div className="relative w-20 h-24 md:w-24 md:h-28">
            <img
              src={poll.image_b_url}
              alt="Outfit B"
              className="w-full h-full object-cover"
            />
            {showUserVote && poll.userVote === 'B' && (
              <div className="absolute inset-0 bg-secondary/30 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              {poll.context && (
                <span className="inline-block px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded-full capitalize truncate">
                  {poll.context}
                </span>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{timeAgo}</p>
            </div>
            <span className={`shrink-0 px-2 py-0.5 text-xs rounded-full ${
              isExpired
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                : 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-400'
            }`}>
              {isExpired ? 'Ended' : 'Active'}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-2">
            <div className="flex-1">
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span>A: {percentA}%</span>
                <span>B: {percentB}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex">
                <div
                  className={`h-full ${winner === 'A' ? 'bg-green-500' : 'bg-primary'}`}
                  style={{ width: `${percentA}%` }}
                />
                <div
                  className={`h-full ${winner === 'B' ? 'bg-green-500' : 'bg-secondary'}`}
                  style={{ width: `${percentB}%` }}
                />
              </div>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
              {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
            </span>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex items-center pr-3">
          <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  )
}

function formatTimeAgo(date) {
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString()
}
