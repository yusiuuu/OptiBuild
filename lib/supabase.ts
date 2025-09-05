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

// Create and export Supabase client instance
// This client is used throughout the application for database operations and authentication
export const supabase = createClient(supabaseUrl, supabaseAnonKey) 