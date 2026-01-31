import { useState, useRef, useCallback } from 'react'

/**
 * Custom hook for detecting swipe gestures
 * @param {Object} options
 * @param {function} options.onSwipeLeft - Called when swiped left
 * @param {function} options.onSwipeRight - Called when swiped right
 * @param {number} options.threshold - Minimum distance to trigger swipe (default: 50)
 * @returns {Object} - handlers and swipe state
 */
export function useSwipe({ onSwipeLeft, onSwipeRight, threshold = 50 }) {
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const startX = useRef(0)
  const startY = useRef(0)
  const isHorizontalSwipe = useRef(false)

  const handleTouchStart = useCallback((e) => {
    startX.current = e.touches[0].clientX
    startY.current = e.touches[0].clientY
    isHorizontalSwipe.current = false
    setIsSwiping(true)
  }, [])

  const handleTouchMove = useCallback((e) => {
    if (!isSwiping) return

    const currentX = e.touches[0].clientX
    const currentY = e.touches[0].clientY
    const diffX = currentX - startX.current
    const diffY = currentY - startY.current

    // Determine if this is a horizontal or vertical swipe
    if (!isHorizontalSwipe.current && Math.abs(diffX) > 10) {
      // If horizontal movement is greater than vertical, it's a horizontal swipe
      isHorizontalSwipe.current = Math.abs(diffX) > Math.abs(diffY)
    }

    if (isHorizontalSwipe.current) {
      e.preventDefault()
      // Limit the offset with resistance at edges
      const maxOffset = 150
      const resistance = 0.5
      let offset = diffX
      if (Math.abs(offset) > maxOffset) {
        offset = maxOffset * Math.sign(offset) + (offset - maxOffset * Math.sign(offset)) * resistance
      }
      setSwipeOffset(offset)
    }
  }, [isSwiping])

  const handleTouchEnd = useCallback(() => {
    if (!isSwiping) return

    if (Math.abs(swipeOffset) > threshold) {
      if (swipeOffset > 0) {
        onSwipeRight?.()
        // Haptic feedback if available
        if (navigator.vibrate) {
          navigator.vibrate(10)
        }
      } else {
        onSwipeLeft?.()
        if (navigator.vibrate) {
          navigator.vibrate(10)
        }
      }
    }

    setSwipeOffset(0)
    setIsSwiping(false)
    isHorizontalSwipe.current = false
  }, [isSwiping, swipeOffset, threshold, onSwipeLeft, onSwipeRight])

  return {
    swipeOffset,
    isSwiping,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchEnd,
    },
  }
}
