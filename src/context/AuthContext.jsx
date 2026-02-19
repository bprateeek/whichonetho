import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  signUp as authSignUp,
  signIn as authSignIn,
  signOut as authSignOut,
  getCurrentUser,
  onAuthStateChange,
  getProfile,
} from '../services/auth'
import { migrateAnonymousHistory } from '../services/migration'
import { supabase } from '../services/supabase'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize auth state on mount
  useEffect(() => {
    let isMounted = true

    const initAuth = async () => {
      try {
        const { user, profile } = await getCurrentUser()
        if (!isMounted) return  // Ignore if unmounted

        if (user) {
          setUser(user)
          setProfile(profile)
        } else {
          // No user exists - sign in anonymously
          const { data, error } = await supabase.auth.signInAnonymously()
          if (!isMounted) return  // Ignore if unmounted

          if (error) {
            // Ignore abort errors (caused by StrictMode remount)
            if (error.name !== 'AbortError' && !error.message?.includes('aborted')) {
              console.error('Failed to sign in anonymously:', error)
            }
          } else if (data.user) {
            setUser(data.user)
            // Anonymous users don't have profiles
          }
        }
      } catch (error) {
        // Ignore abort errors (caused by StrictMode remount)
        if (error.name !== 'AbortError' && !error.message?.includes('aborted')) {
          console.error('Failed to initialize auth:', error)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    initAuth()

    // Subscribe to auth state changes
    const unsubscribe = onAuthStateChange(async (event, session) => {
      if (!isMounted) return

      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user)
        const userProfile = await getProfile(session.user.id)
        if (isMounted) {
          setProfile(userProfile)
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
      }
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  const signUp = useCallback(async (email, password, username) => {
    const result = await authSignUp(email, password, username)
    if (result.user && !result.error) {
      setUser(result.user)
      const userProfile = await getProfile(result.user.id)
      setProfile(userProfile)

      // Migrate anonymous history to the new user account
      try {
        await migrateAnonymousHistory(result.user.id)
      } catch (migrationError) {
        console.error('Failed to migrate history on signup:', migrationError)
        // Don't block signup on migration failure
      }
    }
    return result
  }, [])

  const signIn = useCallback(async (email, password) => {
    const result = await authSignIn(email, password)
    if (result.user && !result.error) {
      setUser(result.user)
      const userProfile = await getProfile(result.user.id)
      setProfile(userProfile)

      // Migrate anonymous history to the user account
      try {
        await migrateAnonymousHistory(result.user.id)
      } catch (migrationError) {
        console.error('Failed to migrate history on login:', migrationError)
        // Don't block login on migration failure
      }
    }
    return result
  }, [])

  const signOut = useCallback(async () => {
    const result = await authSignOut()
    if (!result.error) {
      setUser(null)
      setProfile(null)
    }
    return result
  }, [])

  const value = {
    user,
    profile,
    isLoading,
    isAnonymous: user?.is_anonymous ?? false,
    isAuthenticated: !!user && !user.is_anonymous,  // Only true for permanent users
    signUp,
    signIn,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
