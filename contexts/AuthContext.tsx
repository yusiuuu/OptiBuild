"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

// Extended user profile type with additional construction industry specific fields
type UserProfile = {
  id: string
  email: string
  full_name?: string
  company_name?: string
  phone?: string
  role?: 'company_admin' | 'project_manager' | 'engineer'
  department?: string
  location?: string
  address?: string
  gst?: string
  pan?: string
  cin?: string
  website?: string
  about?: string
  avatar_url?: string
  permissions?: Record<string, any>
  created_at: string
  updated_at: string
}

// Authentication context interface defining all available auth functions and state
type AuthContextType = {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string, fullName?: string) => Promise<void>
  signOut: () => Promise<void>
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>
  refreshUserProfile: () => Promise<void>
  hasRole: (role: 'company_admin' | 'project_manager' | 'engineer') => boolean
  hasPermission: (permission: string) => boolean
  canManageProjects: () => boolean
  canViewAnalytics: () => boolean
  canGenerateReports: () => boolean
  hasFullAccess: () => boolean
}

// Create React context for authentication state management
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Authentication provider component that wraps the app and manages auth state
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Current authenticated user from Supabase
  const [user, setUser] = useState<User | null>(null)
  // Extended user profile data from custom profiles table
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  // Loading state while checking authentication status
  const [loading, setLoading] = useState(true)

  // Fetch and refresh user profile data from the database
  // Called after authentication state changes or profile updates
  const refreshUserProfile = async (userId?: string) => {
    try {
      const targetUserId = userId || user?.id
      if (!targetUserId) return
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', targetUserId)
        .single()
      
      if (error) {
        // Handle specific error cases
        if (error.code === 'PGRST116') {
          // Profile doesn't exist yet, that's okay
          console.log('User profile not found, will be created on first update')
          return
        }
        throw error
      }
      
      setUserProfile(data)
    } catch (error: any) {
      // Handle network errors gracefully
      if (error?.message === 'Failed to fetch' || error?.name === 'NetworkError') {
        console.warn('Network error while fetching profile, will retry later')
        return
      }
      console.error('Error fetching profile:', error)
    }
  }

  // Initialize authentication state and set up auth state change listeners
  useEffect(() => {
    // Check for existing active session on component mount
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          console.error('Error getting session:', error)
          // Don't throw, just set loading to false and continue
        }
        setUser(session?.user ?? null)
        if (session?.user) {
          refreshUserProfile(session.user.id)
        }
        setLoading(false)
      })
      .catch((error) => {
        // Handle network errors gracefully
        console.warn('Failed to fetch session, this may be due to connectivity issues:', error)
        setLoading(false)
        // Don't set user to null on network errors, allow retry
      })

    // Set up real-time listener for authentication state changes
    // Handles sign in, sign out, token refresh, etc.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Handle errors during auth state changes
      if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        setUser(session?.user ?? null)
        if (session?.user) {
          refreshUserProfile(session.user.id)
        } else {
          setUserProfile(null)
        }
        setLoading(false)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setUserProfile(null)
        setLoading(false)
      }
    })

    // Cleanup subscription on component unmount
    return () => subscription.unsubscribe()
  }, [])

  // Handle Google OAuth authentication
  // Redirects user to dashboard after successful authentication
  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      })
      if (error) throw error
    } catch (error) {
      console.error('Error signing in with Google:', error)
      throw error
    }
  }

  // Handle email/password authentication
  // Shows success toast on successful sign in
  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      toast.success('Signed in successfully')
    } catch (error) {
      console.error('Error signing in with email:', error)
      throw error
    }
  }

  // Handle new user registration with email/password
  // Sends verification email and stores additional user data
  const signUpWithEmail = async (email: string, password: string, fullName?: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            full_name: fullName
          }
        }
      })
      if (error) throw error
      toast.success('Verification email sent. Please check your inbox.')
    } catch (error) {
      console.error('Error signing up with email:', error)
      throw error
    }
  }

  // Handle user sign out
  // Clears local user profile state and signs out from Supabase
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUserProfile(null)
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  // Update user profile information in the database
  // Creates profile if it doesn't exist, updates if it does
  // Refreshes profile data after successful update and shows success toast
  const updateUserProfile = async (profile: Partial<UserProfile>) => {
    try {
      if (!user) throw new Error('No user logged in')
      
      // Use upsert to create or update the profile
      const profileData = {
        id: user.id,
        email: user.email || '',
        ...profile,
        updated_at: new Date().toISOString()
      }
      
      const { error } = await supabase
        .from('user_profiles')
        .upsert(profileData, {
          onConflict: 'id'
        })
      
      if (error) throw error
      
      // Refresh the profile to get updated data
      await refreshUserProfile()
      toast.success('Profile updated successfully')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
      throw error
    }
  }

  // Role-based permission checking functions
  const hasRole = (role: 'company_admin' | 'project_manager' | 'engineer') => {
    return userProfile?.role === role
  }

  const hasPermission = (permission: string) => {
    if (!userProfile?.permissions) return false
    return userProfile.permissions[permission] === true
  }

  const canManageProjects = () => {
    // Company admin has full access to everything
    return hasRole('company_admin') || hasRole('project_manager')
  }

  const canViewAnalytics = () => {
    return hasRole('company_admin') || hasRole('project_manager')
  }

  const canGenerateReports = () => {
    return hasRole('company_admin') || hasRole('project_manager')
  }

  // Company admin has full access to all operations
  const hasFullAccess = () => {
    return hasRole('company_admin')
  }

  // Context value object containing all auth state and functions
  const value = {
    user,
    userProfile,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    updateUserProfile,
    refreshUserProfile,
    hasRole,
    hasPermission,
    canManageProjects,
    canViewAnalytics,
    canGenerateReports,
    hasFullAccess
  }

  // Render children only after initial auth check is complete
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

// Custom hook to access authentication context
// Must be used within an AuthProvider component
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 