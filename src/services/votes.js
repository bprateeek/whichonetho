import { supabase } from './supabase'

// In-memory cache for anonymous ID (fetched from cookie via edge function)
let cachedAnonId = null

/**
 * Get anonymous ID from server-set cookie (via edge function)
 * The edge function manages the HttpOnly cookie and returns the ID
 * @returns {Promise<string>} - The anonymous user ID
 */
export async function getAnonId() {
  // Return cached value if available
  if (cachedAnonId) return cachedAnonId

  try {
    const { data, error } = await supabase.functions.invoke('get-anon-id', {
      method: 'GET',
    })

    if (error) {
      console.error('Failed to get anon_id from edge function:', error)
    }

    if (data?.anon_id) {
      cachedAnonId = data.anon_id
      return cachedAnonId
    }
  } catch (error) {
    console.error('Failed to invoke get-anon-id function:', error)
  }

  // Fallback: generate client-side UUID (shouldn't happen normally)
  console.warn('Using fallback client-side UUID generation')
  cachedAnonId = crypto.randomUUID()
  return cachedAnonId
}

/**
 * Get user identifier for database operations
 * Returns user_id if authenticated, or anon_id if anonymous
 * @returns {Promise<{user_id: string|null, anon_id: string|null}>}
 */
export async function getUserIdentifier() {
  const { data: { user } } = await supabase.auth.getUser()

  if (user?.id) {
    return { user_id: user.id, anon_id: null }
  }

  const anonId = await getAnonId()
  return { user_id: null, anon_id: anonId }
}

/**
 * Cast a vote on a poll
 * @param {string} pollId - The poll to vote on
 * @param {'A' | 'B'} choice - Which outfit to vote for
 * @param {string} voterGender - The voter's gender
 * @returns {Promise<{success: boolean, alreadyVoted?: boolean}>}
 */
export async function castVote(pollId, choice, voterGender) {
  const { user_id, anon_id } = await getUserIdentifier()

  const { error } = await supabase
    .from('votes')
    .insert({
      poll_id: pollId,
      voted_for: choice,
      voter_gender: voterGender,
      user_id,
      anon_id,
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
  const { user_id, anon_id } = await getUserIdentifier()

  let query = supabase
    .from('votes')
    .select('voted_for')
    .eq('poll_id', pollId)

  // Check by user_id if authenticated, otherwise by anon_id
  if (user_id) {
    query = query.eq('user_id', user_id)
  } else {
    query = query.eq('anon_id', anon_id)
  }

  const { data, error } = await query.maybeSingle()

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
