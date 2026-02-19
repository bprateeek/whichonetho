import { supabase } from './supabase'

/**
 * Get user identifier for database operations
 * With anonymous auth, all users (including anonymous) have a user_id
 * @returns {Promise<string|null>}
 */
export async function getUserId() {
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id || null
}

/**
 * Cast a vote on a poll
 * @param {string} pollId - The poll to vote on
 * @param {'A' | 'B'} choice - Which outfit to vote for
 * @param {string} voterGender - The voter's gender
 * @returns {Promise<{success: boolean, alreadyVoted?: boolean}>}
 */
export async function castVote(pollId, choice, voterGender) {
  const userId = await getUserId()

  const { error } = await supabase
    .from('votes')
    .insert({
      poll_id: pollId,
      voted_for: choice,
      voter_gender: voterGender,
      user_id: userId,
    })

  if (error) {
    // Check if it's a duplicate vote error (unique constraint violation)
    if (error.code === '23505') {
      return { success: false, alreadyVoted: true }
    }
    throw new Error(`Failed to cast vote: ${error.message}`)
  }

  return { success: true }
}

/**
 * Check if the current user has voted on a poll
 * @param {string} pollId - The poll to check
 * @returns {Promise<{hasVoted: boolean, votedFor?: 'A' | 'B'}>}
 */
export async function hasVoted(pollId) {
  const userId = await getUserId()

  const { data, error } = await supabase
    .from('votes')
    .select('voted_for')
    .eq('poll_id', pollId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to check vote status: ${error.message}`)
  }

  return {
    hasVoted: !!data,
    votedFor: data?.voted_for,
  }
}

/**
 * Subscribe to real-time vote count updates for a poll
 * @param {string} pollId - The poll to subscribe to
 * @param {function} callback - Called with updated vote counts
 * @returns {function} - Unsubscribe function
 */
export function subscribeToVoteCounts(pollId, callback) {
  const channel = supabase
    .channel(`vote_counts:${pollId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'vote_counts',
        filter: `poll_id=eq.${pollId}`,
      },
      (payload) => {
        callback({
          votes_a: payload.new.votes_a,
          votes_b: payload.new.votes_b,
          total_votes: payload.new.total_votes,
        })
      }
    )
    .subscribe()

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel)
  }
}
