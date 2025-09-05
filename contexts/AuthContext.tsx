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

  // Initialize authentication state and set up auth state change listeners
  useEffect(() => {
    // Check for existing active session on component mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        refreshUserProfile()
      }
      setLoading(false)
    })

    // Set up real-time listener for authentication state changes
    // Handles sign in, sign out, token refresh, etc.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        refreshUserProfile()
      } else {
        setUserProfile(null)
      }
      setLoading(false)
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
  // Refreshes profile data after successful update and shows success toast
  const updateUserProfile = async (profile: Partial<UserProfile>) => {
    try {
      if (!user) throw new Error('No user logged in')
      
      const { error } = await supabase
        .from('user_profiles')
        .update(profile)
        .eq('id', user.id)
      
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

  // Fetch and refresh user profile data from the database
  // Called after authentication state changes or profile updates
  const refreshUserProfile = async () => {
    try {
      if (!user) return
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (error) throw error
      
      setUserProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
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
    return hasRole('company_admin') || hasRole('project_manager')
  }

  const canViewAnalytics = () => {
    return hasRole('company_admin') || hasRole('project_manager')
  }

  const canGenerateReports = () => {
    return hasRole('company_admin') || hasRole('project_manager')
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
    canGenerateReports
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