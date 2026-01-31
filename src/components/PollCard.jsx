import { useState } from 'react'
import ProgressBar from './ProgressBar'

export default function PollCard({
  poll,
  showResults = false,
  onVote,
  votedFor = null,
  isVoting = false,
  onReport,
}) {
  const [selectedOption, setSelectedOption] = useState(null)
  const [imageALoaded, setImageALoaded] = useState(false)
  const [imageBLoaded, setImageBLoaded] = useState(false)
  const [imageAError, setImageAError] = useState(false)
  const [imageBError, setImageBError] = useState(false)

  const handleVote = (option) => {
    if (showResults || isVoting || votedFor) return
    setSelectedOption(option)
    onVote?.(option)
  }

  const totalVotes = (poll.votes_a || 0) + (poll.votes_b || 0)
  const percentA = totalVotes > 0 ? Math.round((poll.votes_a / totalVotes) * 100) : 50
  const percentB = totalVotes > 0 ? Math.round((poll.votes_b / totalVotes) * 100) : 50
  const winner = percentA > percentB ? 'A' : percentB > percentA ? 'B' : null

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg dark:shadow-gray-900/50 overflow-hidden border border-gray-200 dark:border-gray-700">
      {/* Header with context and report */}
      <div className="flex items-center justify-between px-4 pt-4">
        {poll.context ? (
          <span className="inline-block px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm rounded-full capitalize">
            {poll.context}
          </span>
        ) : (
          <span />
        )}
        {onReport && (
          <button
            onClick={() => onReport(poll.id)}
            className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
            aria-label="Report poll"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
            </svg>
          </button>
        )}
      </div>

      {/* Images */}
      <div className="grid grid-cols-2 gap-2 md:gap-4 p-4 md:p-6">
        {/* Option A */}
        <button
          onClick={() => handleVote('A')}
          disabled={showResults || isVoting || votedFor}
          className={`relative aspect-[3/4] rounded-xl overflow-hidden transition-all select-none ${
            !showResults && !votedFor ? 'active:scale-[0.98]' : ''
          } ${
            (selectedOption === 'A' || votedFor === 'A') ? 'ring-4 ring-primary' : ''
          }`}
        >
          {/* Loading skeleton */}
          {!imageALoaded && !imageAError && (
            <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
          )}
          {/* Error fallback */}
          {imageAError && (
            <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          <img
            src={poll.image_a_url}
            alt="Outfit A"
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              imageALoaded && !imageAError ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageALoaded(true)}
            onError={() => setImageAError(true)}
            draggable={false}
          />
          <div className={`absolute top-2 left-2 md:top-3 md:left-3 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold text-base md:text-lg shadow-md ${
            showResults && winner === 'A'
              ? 'bg-green-500 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
          }`}>
            A
          </div>
          {votedFor === 'A' && (
            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
              <span className="bg-primary text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                Your vote
              </span>
            </div>
          )}
        </button>

        {/* Option B */}
        <button
          onClick={() => handleVote('B')}
          disabled={showResults || isVoting || votedFor}
          className={`relative aspect-[3/4] rounded-xl overflow-hidden transition-all select-none ${
            !showResults && !votedFor ? 'active:scale-[0.98]' : ''
          } ${
            (selectedOption === 'B' || votedFor === 'B') ? 'ring-4 ring-secondary' : ''
          }`}
        >
          {/* Loading skeleton */}
          {!imageBLoaded && !imageBError && (
            <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
          )}
          {/* Error fallback */}
          {imageBError && (
            <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          <img
            src={poll.image_b_url}
            alt="Outfit B"
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              imageBLoaded && !imageBError ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageBLoaded(true)}
            onError={() => setImageBError(true)}
            draggable={false}
          />
          <div className={`absolute top-2 left-2 md:top-3 md:left-3 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold text-base md:text-lg shadow-md ${
            showResults && winner === 'B'
              ? 'bg-green-500 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
          }`}>
            B
          </div>
          {votedFor === 'B' && (
            <div className="absolute inset-0 bg-secondary/20 flex items-center justify-center">
              <span className="bg-secondary text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                Your vote
              </span>
            </div>
          )}
        </button>
      </div>

      {/* Results */}
      {showResults && (
        <div className="px-4 pb-4 space-y-3">
          <ProgressBar
            label="A"
            percent={percentA}
            votes={poll.votes_a || 0}
            isWinner={winner === 'A'}
            color="primary"
          />
          <ProgressBar
            label="B"
            percent={percentB}
            votes={poll.votes_b || 0}
            isWinner={winner === 'B'}
            color="secondary"
          />
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
          </p>
        </div>
      )}
    </div>
  )
}
