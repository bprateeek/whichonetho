import { supabase } from './supabase'
import { compressImage, deleteImages } from './storage'
import { moderateAndUploadImages, ModerationError } from './moderation'
import { getVoterHash } from './votes'

/**
 * Create a new poll with images
 * @param {Object} params
 * @param {string} params.posterGender - 'male' | 'female' | 'nonbinary'
 * @param {string} [params.bodyType] - Optional body type
 * @param {string} [params.context] - Optional context (date, work, etc.)
 * @param {number} [params.duration=60] - Poll duration in minutes (15, 60, 240, or 480)
 * @param {File} params.imageAFile - First outfit image file
 * @param {File} params.imageBFile - Second outfit image file
 * @returns {Promise<{id: string}>} - Created poll
 */
export async function createPoll({ posterGender, bodyType, context, duration = 60, imageAFile, imageBFile }) {
  // Check rate limit first
  const creatorHash = await getVoterHash()
  const rateLimit = await checkPollRateLimit()

  if (!rateLimit.canCreate) {
    const error = new Error('RATE_LIMIT_EXCEEDED')
    error.resetAt = rateLimit.resetAt
    throw error
  }

  // Generate a temporary ID for the folder structure
  const tempId = crypto.randomUUID()

  try {
    // Compress images first
    const [compressedA, compressedB] = await Promise.all([
      compressImage(imageAFile),
      compressImage(imageBFile),
    ])

    // Moderate and upload images via Edge Function
    const { imageAUrl, imageBUrl } = await moderateAndUploadImages(compressedA, compressedB, tempId)

    // Calculate expires_at based on duration (in minutes)
    const expiresAt = new Date(Date.now() + duration * 60 * 1000).toISOString()

    // Create the poll record
    const { data, error } = await supabase
      .from('polls')
      .insert({
        poster_gender: posterGender,
        body_type: bodyType || null,
        context: context || null,
        image_a_url: imageAUrl,
        image_b_url: imageBUrl,
        creator_ip_hash: creatorHash,
        expires_at: expiresAt,
      })
      .select('id')
      .single()

    if (error) {
      // Cleanup uploaded images on failure
      await deleteImages(tempId)
      throw new Error(`Failed to create poll: ${error.message}`)
    }

    // Log poll creation for rate limiting
    await logPollCreation(creatorHash)

    return data
  } catch (error) {
    // Don't cleanup for moderation errors (images were never uploaded)
    if (!(error instanceof ModerationError)) {
      await deleteImages(tempId).catch(() => {})
    }
    throw error
  }
}

/**
 * Get a poll by ID with its vote counts
 * @param {string} pollId
 * @returns {Promise<Object>} - Poll with vote counts
 */
export async function getPollById(pollId) {
  const { data, error } = await supabase
    .from('polls')
    .select(`
      *,
      vote_counts (
        total_votes,
        votes_a,
        votes_b
      )
    `)
    .eq('id', pollId)
    .single()

  if (error) {
    throw new Error(`Failed to fetch poll: ${error.message}`)
  }

  // Flatten the vote counts
  return {
    ...data,
    votes_a: data.vote_counts?.votes_a || 0,
    votes_b: data.vote_counts?.votes_b || 0,
    total_votes: data.vote_counts?.total_votes || 0,
  }
}

/**
 * Get active polls for the voting feed
 * @param {string} voterGender - The voter's gender (to show opposite gender polls)
 * @param {number} [limit=20] - Max number of polls to fetch
 * @param {string[]} [reportedPollIds=[]] - Poll IDs to exclude (locally reported)
 * @returns {Promise<Array>} - List of polls
 */
export async function getActivePolls(voterGender, limit = 20, reportedPollIds = []) {
  const voterHash = await getVoterHash()

  // Build the query for opposite gender polls
  let query = supabase
    .from('polls')
    .select(`
      *,
      vote_counts (
        total_votes,
        votes_a,
        votes_b
      )
    `)
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(limit)

  // Filter by opposite gender (if not viewing all)
  if (voterGender && voterGender !== 'all') {
    query = query.neq('poster_gender', voterGender)
  }

  const { data: polls, error } = await query

  if (error) {
    throw new Error(`Failed to fetch polls: ${error.message}`)
  }

  // Get polls the user has already voted on
  const { data: votedPolls } = await supabase
    .from('votes')
    .select('poll_id')
    .eq('voter_ip_hash', voterHash)

  const votedPollIds = new Set(votedPolls?.map(v => v.poll_id) || [])
  const reportedSet = new Set(reportedPollIds)

  // Filter out already-voted polls, reported polls, and flatten vote counts
  return polls
    .filter(poll => !votedPollIds.has(poll.id) && !reportedSet.has(poll.id))
    .map(poll => ({
      ...poll,
      votes_a: poll.vote_counts?.votes_a || 0,
      votes_b: poll.vote_counts?.votes_b || 0,
      total_votes: poll.vote_counts?.total_votes || 0,
    }))
}

/**
 * Get polls filtered by specific gender (for "Women's outfits" / "Men's outfits" buttons)
 * @param {'male' | 'female'} posterGender - Show polls from this gender
 * @param {number} [limit=20] - Max number of polls to fetch
 * @param {string[]} [reportedPollIds=[]] - Poll IDs to exclude (locally reported)
 * @returns {Promise<Array>} - List of polls
 */
export async function getPollsByGender(posterGender, limit = 20, reportedPollIds = []) {
  const voterHash = await getVoterHash()

  const { data: polls, error } = await supabase
    .from('polls')
    .select(`
      *,
      vote_counts (
        total_votes,
        votes_a,
        votes_b
      )
    `)
    .eq('status', 'active')
    .eq('poster_gender', posterGender)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(`Failed to fetch polls: ${error.message}`)
  }

  // Get polls the user has already voted on
  const { data: votedPolls } = await supabase
    .from('votes')
    .select('poll_id')
    .eq('voter_ip_hash', voterHash)

  const votedPollIds = new Set(votedPolls?.map(v => v.poll_id) || [])
  const reportedSet = new Set(reportedPollIds)

  // Filter out already-voted polls, reported polls, and flatten vote counts
  return polls
    .filter(poll => !votedPollIds.has(poll.id) && !reportedSet.has(poll.id))
    .map(poll => ({
      ...poll,
      votes_a: poll.vote_counts?.votes_a || 0,
      votes_b: poll.vote_counts?.votes_b || 0,
      total_votes: poll.vote_counts?.total_votes || 0,
    }))
}

// Rate limit: 5 polls per day per user
const POLLS_PER_DAY_LIMIT = 5

/**
 * Check if user can create a new poll (rate limiting)
 * @returns {Promise<{canCreate: boolean, remaining: number, resetAt: Date}>}
 */
export async function checkPollRateLimit() {
  const creatorHash = await getVoterHash()

  // Get the start of today (24 hours ago)
  const twentyFourHoursAgo = new Date()
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

  const { data, error } = await supabase
    .from('poll_creation_log')
    .select('created_at')
    .eq('creator_ip_hash', creatorHash)
    .gte('created_at', twentyFourHoursAgo.toISOString())
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Failed to check rate limit:', error)
    // On error, allow creation but log the issue
    return { canCreate: true, remaining: POLLS_PER_DAY_LIMIT, resetAt: null }
  }

  const pollsCreatedToday = data?.length || 0
  const remaining = Math.max(0, POLLS_PER_DAY_LIMIT - pollsCreatedToday)
  const canCreate = remaining > 0

  // Calculate when the oldest poll in the window expires (when user gets a slot back)
  let resetAt = null
  if (!canCreate && data && data.length > 0) {
    const oldestPoll = new Date(data[0].created_at)
    resetAt = new Date(oldestPoll.getTime() + 24 * 60 * 60 * 1000)
  }

  return { canCreate, remaining, resetAt }
}

/**
 * Log a poll creation for rate limiting purposes
 * @param {string} creatorHash - The creator's IP hash
 */
async function logPollCreation(creatorHash) {
  const { error } = await supabase
    .from('poll_creation_log')
    .insert({ creator_ip_hash: creatorHash })

  if (error) {
    console.error('Failed to log poll creation:', error)
    // Don't throw - this shouldn't block poll creation
  }
}

/**
 * Get polls created by the current user
 * @param {number} [limit=50] - Max number of polls to fetch
 * @returns {Promise<Array>} - List of polls with vote counts
 */
export async function getUserCreatedPolls(limit = 50) {
  const creatorHash = await getVoterHash()

  const { data: polls, error } = await supabase
    .from('polls')
    .select(`
      *,
      vote_counts (
        total_votes,
        votes_a,
        votes_b
      )
    `)
    .eq('creator_ip_hash', creatorHash)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(`Failed to fetch created polls: ${error.message}`)
  }

  return polls.map(poll => ({
    ...poll,
    votes_a: poll.vote_counts?.votes_a || 0,
    votes_b: poll.vote_counts?.votes_b || 0,
    total_votes: poll.vote_counts?.total_votes || 0,
  }))
}

/**
 * Get polls the current user has voted on
 * @param {number} [limit=50] - Max number of polls to fetch
 * @returns {Promise<Array>} - List of polls with the user's vote choice
 */
export async function getUserVotedPolls(limit = 50) {
  const voterHash = await getVoterHash()

  // Get votes with their associated polls
  const { data: votes, error } = await supabase
    .from('votes')
    .select(`
      voted_for,
      created_at,
      poll:polls (
        id,
        image_a_url,
        image_b_url,
        context,
        poster_gender,
        status,
        expires_at,
        created_at,
        vote_counts (
          total_votes,
          votes_a,
          votes_b
        )
      )
    `)
    .eq('voter_ip_hash', voterHash)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(`Failed to fetch voted polls: ${error.message}`)
  }

  // Transform the data to include the user's vote choice
  return votes
    .filter(v => v.poll) // Filter out any votes where poll was deleted
    .map(v => ({
      ...v.poll,
      votes_a: v.poll.vote_counts?.votes_a || 0,
      votes_b: v.poll.vote_counts?.votes_b || 0,
      total_votes: v.poll.vote_counts?.total_votes || 0,
      userVote: v.voted_for,
      votedAt: v.created_at,
    }))
}
