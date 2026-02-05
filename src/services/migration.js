import { supabase } from './supabase'

/**
 * Migrate anonymous history to a newly created user account
 * This links all polls, votes, and reports created with the localStorage hash
 * to the new user's account
 *
 * @param {string} userId - The new user's ID
 * @returns {Promise<{success: boolean, migratedPolls: number, migratedVotes: number}>}
 */
export async function migrateAnonymousHistory(userId) {
  const voterHash = localStorage.getItem('whichonetho_voter_hash')

  if (!voterHash) {
    return { success: true, migratedPolls: 0, migratedVotes: 0 }
  }

  let migratedPolls = 0
  let migratedVotes = 0

  try {
    // Migrate polls created by this user
    const { data: pollsData, error: pollsError } = await supabase
      .from('polls')
      .update({ user_id: userId })
      .eq('creator_ip_hash', voterHash)
      .select('id')

    if (pollsError) {
      console.error('Failed to migrate polls:', pollsError)
    } else {
      migratedPolls = pollsData?.length || 0
    }

    // Migrate votes cast by this user
    const { data: votesData, error: votesError } = await supabase
      .from('votes')
      .update({ user_id: userId })
      .eq('voter_ip_hash', voterHash)
      .select('id')

    if (votesError) {
      console.error('Failed to migrate votes:', votesError)
    } else {
      migratedVotes = votesData?.length || 0
    }

    // Migrate poll reports
    const { error: reportsError } = await supabase
      .from('poll_reports')
      .update({ user_id: userId })
      .eq('reporter_ip_hash', voterHash)

    if (reportsError) {
      console.error('Failed to migrate reports:', reportsError)
    }

    // Migrate poll creation log entries
    const { error: logError } = await supabase
      .from('poll_creation_log')
      .update({ user_id: userId })
      .eq('creator_ip_hash', voterHash)

    if (logError) {
      console.error('Failed to migrate creation log:', logError)
    }

    return {
      success: true,
      migratedPolls,
      migratedVotes,
    }
  } catch (error) {
    console.error('Migration failed:', error)
    return {
      success: false,
      migratedPolls,
      migratedVotes,
    }
  }
}
