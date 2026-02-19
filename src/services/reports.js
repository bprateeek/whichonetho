import { supabase } from './supabase'
import { getUserId } from './votes'

// Storage key for locally reported polls
const REPORTED_POLLS_KEY = 'whichonetho_reported_polls'

/**
 * Get list of locally reported poll IDs
 * @returns {string[]} - Array of poll IDs
 */
export function getLocalReportedList() {
  const stored = localStorage.getItem(REPORTED_POLLS_KEY)
  return stored ? JSON.parse(stored) : []
}

/**
 * Check if a poll has been locally reported
 * @param {string} pollId - The poll ID to check
 * @returns {boolean}
 */
export function isLocallyReported(pollId) {
  const reportedList = getLocalReportedList()
  return reportedList.includes(pollId)
}

/**
 * Add a poll to the local reported list
 * @param {string} pollId - The poll ID to add
 */
function addToLocalReportedList(pollId) {
  const reportedList = getLocalReportedList()
  if (!reportedList.includes(pollId)) {
    reportedList.push(pollId)
    localStorage.setItem(REPORTED_POLLS_KEY, JSON.stringify(reportedList))
  }
}

/**
 * Report a poll for inappropriate content
 * @param {string} pollId - The poll to report
 * @param {'inappropriate' | 'spam' | 'offensive' | 'other'} reason - Report reason
 * @returns {Promise<{success: boolean, alreadyReported?: boolean}>}
 */
export async function reportPoll(pollId, reason) {
  const userId = await getUserId()

  const { error } = await supabase
    .from('poll_reports')
    .insert({
      poll_id: pollId,
      user_id: userId,
      reason,
    })

  if (error) {
    // Check if it's a duplicate report error (unique constraint violation)
    if (error.code === '23505') {
      // Still add to local list so UI hides it
      addToLocalReportedList(pollId)
      return { success: false, alreadyReported: true }
    }
    throw new Error(`Failed to report poll: ${error.message}`)
  }

  // Add to local storage so poll is hidden immediately
  addToLocalReportedList(pollId)

  return { success: true }
}
