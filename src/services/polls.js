import { supabase } from './supabase'
import { compressImage, deleteImages } from './storage'
import { moderateAndUploadImages, ModerationError } from './moderation'
import { getUserIdentifier } from './votes'

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
  const { user_id, anon_id: creatorAnonId } = await getUserIdentifier()
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
        user_id,
        creator_anon_id: creatorAnonId,
        expires_at: expiresAt,
      })
      .select('id')
      .single()

    if (error) {
      // Cleanup uploaded images on failure
      await deleteImages(tempId)
      throw new Error(`Failed to create poll: ${error.message}`)
    }

    // Note: poll creation is now logged automatically by database trigger
    // (see migration 004_security_hardening.sql)

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
 * Create a poll record in the database (used when images are already uploaded)
 * @param {Object} params
 * @param {string} params.posterGender - 'male' | 'female' | 'nonbinary'
 * @param {string} [params.bodyType] - Optional body type
 * @param {string} [params.context] - Optional context (date, work, etc.)
 * @param {number} [params.duration=60] - Poll duration in minutes
 * @param {string} params.imageAUrl - URL of first uploaded image
 * @param {string} params.imageBUrl - URL of second uploaded image
 * @param {string} params.tempId - Temp ID used for image folder (for cleanup on failure)
 * @returns {Promise<{id: string}>} - Created poll
 */
export async function createPollRecord({ posterGender, bodyType, context, duration = 60, imageAUrl, imageBUrl, tempId }) {
  const { user_id, anon_id: creatorAnonId } = await getUserIdentifier()

  // Calculate expires_at based on duration (in minutes)
  const expiresAt = new Date(Date.now() + duration * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('polls')
    .insert({
      poster_gender: posterGender,
      body_type: bodyType || null,
      context: context || null,
      image_a_url: imageAUrl,
      image_b_url: imageBUrl,
      user_id,
      creator_anon_id: creatorAnonId,
      expires_at: expiresAt,
    })
    .select('id')
    .single()

  if (error) {
    // Cleanup uploaded images on failure
    await deleteImages(tempId)
    throw new Error(`Failed to create poll: ${error.message}`)
  }

  return data
}

/**
 * Check if the current user is the creator of a poll
 * @param {Object} poll - The poll object with user_id and creator_anon_id
 * @returns {Promise<boolean>} - True if current user created this poll
 */
export async function isCurrentUserPollCreator(poll) {
  const { user_id, anon_id } = await getUserIdentifier()

  // Check by user_id if authenticated
  if (user_id && poll.user_id) {
    return user_id === poll.user_id
  }

  // Check by hash if anonymous
  if (anon_id && poll.creator_anon_id) {
    return anon_id === poll.creator_anon_id
  }

  return false
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
    username: null,
  }
}

/**
 * Get active polls for the voting feed
 * @param {string} voterGender - The voter's gender (to filter which polls to show)
 * @param {number} [limit=20] - Max number of polls to fetch
 * @param {string[]} [reportedPollIds=[]] - Poll IDs to exclude (locally reported)
 * @returns {Promise<Array>} - List of polls
 */
export async function getActivePolls(voterGender, limit = 20, reportedPollIds = []) {
  const { user_id, anon_id: voterAnonId } = await getUserIdentifier()

  // Build the query for polls to vote on
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

  // Filter by poster gender (if not viewing all)
  if (voterGender && voterGender !== 'all') {
    query = query.neq('poster_gender', voterGender)
  }

  const { data: polls, error } = await query

  if (error) {
    throw new Error(`Failed to fetch polls: ${error.message}`)
  }

  // Get polls the user has already voted on (check by user_id or anon_id)
  let votedQuery = supabase.from('votes').select('poll_id')
  if (user_id) {
    votedQuery = votedQuery.eq('user_id', user_id)
  } else {
    votedQuery = votedQuery.eq('anon_id', voterAnonId)
  }
  const { data: votedPolls } = await votedQuery

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
      username: null,
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
  const { user_id, anon_id: voterAnonId } = await getUserIdentifier()

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

  // Get polls the user has already voted on (check by user_id or anon_id)
  let votedQuery = supabase.from('votes').select('poll_id')
  if (user_id) {
    votedQuery = votedQuery.eq('user_id', user_id)
  } else {
    votedQuery = votedQuery.eq('anon_id', voterAnonId)
  }
  const { data: votedPolls } = await votedQuery

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
      username: null,
    }))
}

/**
 * Get polls with flexible filters (for the main vote feed)
 * @param {Object} options
 * @param {string[]} [options.genders] - Array of genders to include ('female', 'male', 'nonbinary')
 * @param {'soon'|'hour'|'4hours'|'all'} [options.timeFilter='all'] - Time remaining filter
 * @param {number} [options.limit=20] - Max number of polls to fetch
 * @param {string[]} [options.excludeIds=[]] - Poll IDs to exclude (locally reported)
 * @returns {Promise<Array>} - List of polls
 */
export async function getFilteredPolls({ genders = [], timeFilter = 'all', limit = 20, excludeIds = [] } = {}) {
  const { user_id, anon_id: voterAnonId } = await getUserIdentifier()

  const now = new Date()

  // Calculate time bounds based on filter
  let maxExpiresAt = null
  if (timeFilter === 'soon') {
    // Expiring within 15 minutes
    maxExpiresAt = new Date(now.getTime() + 15 * 60 * 1000)
  } else if (timeFilter === 'hour') {
    // Expiring within 1 hour
    maxExpiresAt = new Date(now.getTime() + 60 * 60 * 1000)
  } else if (timeFilter === '4hours') {
    // Expiring within 4 hours
    maxExpiresAt = new Date(now.getTime() + 4 * 60 * 60 * 1000)
  }

  // Build the query
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
    .gt('expires_at', now.toISOString())
    .order('created_at', { ascending: false })
    .limit(limit)

  // Filter by genders if specified
  if (genders.length > 0 && genders.length < 3) {
    query = query.in('poster_gender', genders)
  }

  // Filter by time remaining
  if (maxExpiresAt) {
    query = query.lt('expires_at', maxExpiresAt.toISOString())
  }

  const { data: polls, error } = await query

  if (error) {
    throw new Error(`Failed to fetch polls: ${error.message}`)
  }

  // Get polls the user has already voted on
  let votedQuery = supabase.from('votes').select('poll_id')
  if (user_id) {
    votedQuery = votedQuery.eq('user_id', user_id)
  } else {
    votedQuery = votedQuery.eq('anon_id', voterAnonId)
  }
  const { data: votedPolls } = await votedQuery

  const votedPollIds = new Set(votedPolls?.map(v => v.poll_id) || [])
  const excludeSet = new Set(excludeIds)

  // Filter out already-voted polls, excluded polls, and flatten vote counts
  return polls
    .filter(poll => !votedPollIds.has(poll.id) && !excludeSet.has(poll.id))
    .map(poll => ({
      ...poll,
      votes_a: poll.vote_counts?.votes_a || 0,
      votes_b: poll.vote_counts?.votes_b || 0,
      total_votes: poll.vote_counts?.total_votes || 0,
      username: null,
    }))
}

// Rate limit: 5 polls per day per user
const POLLS_PER_DAY_LIMIT = 5

/**
 * Check if user can create a new poll (rate limiting)
 * @returns {Promise<{canCreate: boolean, remaining: number, resetAt: Date}>}
 */
export async function checkPollRateLimit() {
  const { user_id, anon_id: creatorAnonId } = await getUserIdentifier()

  // Get the start of today (24 hours ago)
  const twentyFourHoursAgo = new Date()
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

  // Query by user_id if authenticated, otherwise by creator_anon_id
  let query = supabase
    .from('poll_creation_log')
    .select('created_at')
    .gte('created_at', twentyFourHoursAgo.toISOString())
    .order('created_at', { ascending: true })

  if (user_id) {
    query = query.eq('user_id', user_id)
  } else {
    query = query.eq('creator_anon_id', creatorAnonId)
  }

  const { data, error } = await query

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
 * Get polls created by the current user
 * @param {number} [limit=50] - Max number of polls to fetch
 * @returns {Promise<Array>} - List of polls with vote counts
 */
export async function getUserCreatedPolls(limit = 50) {
  const { user_id, anon_id: creatorAnonId } = await getUserIdentifier()

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
    .order('created_at', { ascending: false })
    .limit(limit)

  // Query by user_id if authenticated, otherwise by creator_anon_id
  if (user_id) {
    query = query.eq('user_id', user_id)
  } else {
    query = query.eq('creator_anon_id', creatorAnonId)
  }

  const { data: polls, error } = await query

  if (error) {
    throw new Error(`Failed to fetch created polls: ${error.message}`)
  }

  return polls.map(poll => ({
    ...poll,
    votes_a: poll.vote_counts?.votes_a || 0,
    votes_b: poll.vote_counts?.votes_b || 0,
    total_votes: poll.vote_counts?.total_votes || 0,
    username: null, // Username fetched separately if needed
  }))
}

/**
 * Get polls the current user has voted on
 * @param {number} [limit=50] - Max number of polls to fetch
 * @returns {Promise<Array>} - List of polls with the user's vote choice
 */
export async function getUserVotedPolls(limit = 50) {
  const { user_id, anon_id: voterAnonId } = await getUserIdentifier()

  // Build query - get votes with their associated polls
  let query = supabase
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
        user_id,
        vote_counts (
          total_votes,
          votes_a,
          votes_b
        )
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  // Query by user_id if authenticated, otherwise by anon_id
  if (user_id) {
    query = query.eq('user_id', user_id)
  } else {
    query = query.eq('anon_id', voterAnonId)
  }

  const { data: votes, error } = await query

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
      username: null, // Username fetched separately if needed
      userVote: v.voted_for,
      votedAt: v.created_at,
    }))
}
