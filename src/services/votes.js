import { supabase } from './supabase'

// Storage key for the voter hash
const VOTER_HASH_KEY = 'whichonetho_voter_hash'

/**
 * Generate or retrieve a consistent voter hash for this browser
 * Uses localStorage to persist across sessions
 * @returns {Promise<string>} - The voter hash
 */
export async function getVoterHash() {
  // Check if we already have a hash stored
  let hash = localStorage.getItem(VOTER_HASH_KEY)

  if (!hash) {
    // Generate a new hash based on random data + timestamp
    const randomData = crypto.randomUUID() + Date.now().toString()
    const encoder = new TextEncoder()
    const data = encoder.encode(randomData)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    // Store for future use
    localStorage.setItem(VOTER_HASH_KEY, hash)
  }

  return hash
}

/**
 * Cast a vote on a poll
 * @param {string} pollId - The poll to vote on
 * @param {'A' | 'B'} choice - Which outfit to vote for
 * @param {string} voterGender - The voter's gender
 * @returns {Promise<{success: boolean, alreadyVoted?: boolean}>}
 */
export async function castVote(pollId, choice, voterGender) {
  const voterHash = await getVoterHash()

  const { error } = await supabase
    .from('votes')
    .insert({
      poll_id: pollId,
      voted_for: choice,
      voter_gender: voterGender,
      voter_ip_hash: voterHash,
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
  const voterHash = await getVoterHash()

  const { data, error } = await supabase
    .from('votes')
    .select('voted_for')
    .eq('poll_id', pollId)
    .eq('voter_ip_hash', voterHash)
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
