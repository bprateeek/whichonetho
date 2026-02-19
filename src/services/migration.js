/**
 * Migration utilities for anonymous to permanent user conversion
 *
 * With Supabase anonymous auth, when a user converts from anonymous to permanent,
 * their user_id remains the same (the anonymous user is upgraded, not replaced).
 * This means no data migration is needed - all their polls, votes, etc. are
 * already linked to their user_id.
 */

/**
 * Placeholder for any future migration needs
 * Currently no-op since Supabase anonymous auth preserves user_id on upgrade
 */
export async function migrateAnonymousHistory() {
  // No migration needed - Supabase anonymous auth preserves user_id
  return { success: true, migratedPolls: 0, migratedVotes: 0 }
}
