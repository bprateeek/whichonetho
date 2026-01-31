import { useState, useEffect, useCallback } from 'react'

/**
 * Live countdown timer that updates every second
 * Shows HH:MM:SS format while active, "Expired" when time runs out
 */
export default function CountdownTimer({ expiresAt, onExpire }) {
  const calculateTimeRemaining = useCallback(() => {
    const now = new Date()
    const expiry = new Date(expiresAt)
    const diff = expiry - now

    if (diff <= 0) {
      return null
    }

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    return { hours, minutes, seconds, totalMs: diff }
  }, [expiresAt])

  const [timeRemaining, setTimeRemaining] = useState(() => calculateTimeRemaining())
  const [isExpired, setIsExpired] = useState(() => calculateTimeRemaining() === null)

  useEffect(() => {
    // Update every second
    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining()
      if (remaining) {
        setTimeRemaining(remaining)
      } else {
        setIsExpired(true)
        setTimeRemaining(null)
        onExpire?.()
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [calculateTimeRemaining, onExpire])

  if (isExpired) {
    return (
      <span className="text-gray-500 dark:text-gray-400">Expired</span>
    )
  }

  if (!timeRemaining) {
    return null
  }

  const { hours, minutes, seconds } = timeRemaining
  const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

  // Show urgency styling when under 1 hour
  const isUrgent = hours === 0

  return (
    <span className={isUrgent ? 'text-orange-500 font-medium' : 'text-gray-500 dark:text-gray-400'}>
      {formattedTime}
    </span>
  )
}
