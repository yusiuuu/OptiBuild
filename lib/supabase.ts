import { createClient } from '@supabase/supabase-js'

// Supabase configuration and client initialization
// Environment variables for Supabase project URL and anonymous key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Validate that required environment variables are present
// Throws error if Supabase configuration is incomplete
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create and export Supabase client instance with enhanced configuration
// This client is used throughout the application for database operations and authentication
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    // Handle errors gracefully
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
  global: {
    // Add fetch options to handle network errors better
    fetch: (url, options = {}) => {
      // Create abort controller for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
      
      return fetch(url, {
        ...options,
        signal: controller.signal,
      })
        .finally(() => clearTimeout(timeoutId))
        .catch((error) => {
          // Handle network errors gracefully
          if (error.name === 'AbortError' || error.message === 'Failed to fetch') {
            console.warn('Network request failed, this may be due to connectivity issues')
          }
          throw error
        })
    },
  },
}) 