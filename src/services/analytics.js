import { supabase } from './supabase'
import { getUserId } from './votes'

/**
 * Get analytics stats for the current user's polls
 * @returns {Promise<Object>} User stats
 */
export async function getUserStats() {
  const userId = await getUserId()

  // Get user's created polls with vote counts
  const { data: polls, error: pollsError } = await supabase
    .from('polls')
    .select(`
      id,
      poster_gender,
      context,
      created_at,
      vote_counts (
        total_votes,
        votes_a,
        votes_b
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (pollsError) {
    console.error('Failed to fetch user polls:', pollsError)
    throw new Error('Failed to fetch analytics')
  }

  // Get user's votes
  const { data: votes, error: votesError } = await supabase
    .from('votes')
    .select('voted_for, voter_gender, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (votesError) {
    console.error('Failed to fetch user votes:', votesError)
  }

  // Calculate stats
  const totalPolls = polls?.length || 0
  const totalVotesReceived = polls?.reduce((sum, p) => sum + (p.vote_counts?.total_votes || 0), 0) || 0
  const totalVotesCast = votes?.length || 0

  // A vs B wins
  let aWins = 0
  let bWins = 0
  let ties = 0

  polls?.forEach(poll => {
    const votesA = poll.vote_counts?.votes_a || 0
    const votesB = poll.vote_counts?.votes_b || 0
    if (votesA > votesB) aWins++
    else if (votesB > votesA) bWins++
    else if (votesA > 0 || votesB > 0) ties++
  })

  // Context breakdown
  const contextCounts = {}
  polls?.forEach(poll => {
    const ctx = poll.context || 'none'
    contextCounts[ctx] = (contextCounts[ctx] || 0) + 1
  })

  // Votes by gender (for polls user created)
  // We'd need to join votes to get this - simplified for now

  // Recent activity (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const recentPolls = polls?.filter(p => new Date(p.created_at) > sevenDaysAgo).length || 0
  const recentVotes = votes?.filter(v => new Date(v.created_at) > sevenDaysAgo).length || 0

  // Average votes per poll
  const avgVotesPerPoll = totalPolls > 0 ? Math.round(totalVotesReceived / totalPolls) : 0

  return {
    totalPolls,
    totalVotesReceived,
    totalVotesCast,
    aWins,
    bWins,
    ties,
    avgVotesPerPoll,
    contextCounts,
    recentPolls,
    recentVotes,
    polls: polls || [],
    votes: votes || [],
  }
}

/**
 * Get vote distribution over time for user's polls
 * @param {number} days - Number of days to look back
 * @returns {Promise<Array>} Vote counts by day
 */
export async function getVoteTimeline(days = 7) {
  const userId = await getUserId()

  // Get user's poll IDs
  const { data: userPolls } = await supabase
    .from('polls')
    .select('id')
    .eq('user_id', userId)

  if (!userPolls || userPolls.length === 0) {
    return []
  }

  const pollIds = userPolls.map(p => p.id)
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  // Get votes for user's polls
  const { data: votes, error } = await supabase
    .from('votes')
    .select('created_at')
    .in('poll_id', pollIds)
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Failed to fetch vote timeline:', error)
    return []
  }

  // Group by day
  const timeline = {}
  for (let i = 0; i < days; i++) {
    const date = new Date()
    date.setDate(date.getDate() - (days - 1 - i))
    const key = date.toISOString().split('T')[0]
    timeline[key] = 0
  }

  votes?.forEach(vote => {
    const key = vote.created_at.split('T')[0]
    if (timeline[key] !== undefined) {
      timeline[key]++
    }
  })

  return Object.entries(timeline).map(([date, count]) => ({
    date,
    count,
    label: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
  }))
}
