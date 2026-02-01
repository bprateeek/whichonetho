import { supabase } from './supabase'

/**
 * Sign up a new user with email, password, and username
 * @param {string} email
 * @param {string} password
 * @param {string} username
 * @returns {Promise<{user: Object, error: Error|null}>}
 */
export async function signUp(email, password, username) {
  // First check if username is available
  const isAvailable = await checkUsernameAvailable(username)
  if (!isAvailable) {
    return { user: null, error: new Error('Username is already taken') }
  }

  // Create the auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (authError) {
    return { user: null, error: authError }
  }

  if (!authData.user) {
    return { user: null, error: new Error('Failed to create user') }
  }

  // Create the user profile with username
  const { error: profileError } = await supabase
    .from('user_profiles')
    .insert({
      id: authData.user.id,
      username: username.toLowerCase(),
    })

  if (profileError) {
    // If profile creation fails, we should handle this gracefully
    // The user is created but profile failed - they can try again
    console.error('Failed to create user profile:', profileError)
    return { user: null, error: new Error('Failed to create user profile') }
  }

  return { user: authData.user, error: null }
}

/**
 * Sign in an existing user
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{user: Object, error: Error|null}>}
 */
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { user: null, error }
  }

  return { user: data.user, error: null }
}

/**
 * Sign out the current user
 * @returns {Promise<{error: Error|null}>}
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

/**
 * Send a password reset email
 * @param {string} email
 * @returns {Promise<{error: Error|null}>}
 */
export async function resetPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  return { error }
}

/**
 * Get the current authenticated user with their profile
 * @returns {Promise<{user: Object|null, profile: Object|null}>}
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return { user: null, profile: null }
  }

  // Fetch the user's profile
  const profile = await getProfile(user.id)

  return { user, profile }
}

/**
 * Get a user's profile by their user ID
 * @param {string} userId
 * @returns {Promise<Object|null>}
 */
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Failed to fetch profile:', error)
    return null
  }

  return data
}

/**
 * Check if a username is available
 * @param {string} username
 * @returns {Promise<boolean>}
 */
export async function checkUsernameAvailable(username) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('username', username.toLowerCase())
    .maybeSingle()

  if (error) {
    console.error('Failed to check username availability:', error)
    return false
  }

  return data === null
}

/**
 * Subscribe to auth state changes
 * @param {Function} callback - Called with (event, session)
 * @returns {Function} Unsubscribe function
 */
export function onAuthStateChange(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback)
  return () => subscription.unsubscribe()
}

/**
 * Validate username format
 * @param {string} username
 * @returns {{valid: boolean, error: string|null}}
 */
export function validateUsername(username) {
  if (!username) {
    return { valid: false, error: 'Username is required' }
  }

  if (username.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters' }
  }

  if (username.length > 30) {
    return { valid: false, error: 'Username must be 30 characters or less' }
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { valid: false, error: 'Username can only contain letters, numbers, and underscores' }
  }

  return { valid: true, error: null }
}
