"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { useState } from "react"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"

// Signup page component for OptiBuild application
// Handles new user registration with form validation and authentication
export default function SignupPage() {
  // Loading state for form submission and account creation process
  const [isLoading, setIsLoading] = useState(false)
  // Form state variables for user registration data
  const [role, setRole] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  
  // Authentication context function for email signup
  const { signUpWithEmail } = useAuth()
  // Router hook for navigation after successful signup
  const router = useRouter()
  
  // Handle form submission for user registration
  // Validates form data and creates new user account
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate that passwords match before proceeding
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    
    // Validate role selection is required
    if (!role) {
      toast.error('Please select your role')
      return
    }
    
    setIsLoading(true)
    
    try {
      // Combine first and last name into full name
      const fullName = `${firstName} ${lastName}`.trim()
      // Attempt to create user account with provided credentials
      await signUpWithEmail(email, password, fullName)
      
      // Show success message to user
      toast.success('Account created successfully! Please check your email for verification.')
      
      // Redirect to login page for user to sign in
      router.push('/login')
    } catch (error) {
      console.error('Signup error:', error)
      toast.error('Failed to create account. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex">
      {/* Left side - animated background with construction imagery and benefits */}
      <motion.div
        className="hidden lg:block lg:w-1/2 relative overflow-hidden"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Base gradient background layer */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800 z-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        ></motion.div>
        {/* Semi-transparent overlay for better text readability */}
        <motion.div
          className="absolute inset-0 bg-black/50 z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        ></motion.div>
        {/* Background construction image with scale and fade animation */}
        <motion.div 
          className="absolute inset-0 w-full h-full bg-cover bg-center z-[5]"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=1920&auto=format&fit=crop')"
          }}
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        ></motion.div>
        {/* Content overlay with welcome message and platform benefits */}
        <div className="absolute inset-0 z-20 flex items-center justify-center p-12">
          <div className="text-white max-w-md">
            {/* Main welcome content with staggered animations */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
            >
              {/* Welcome headline with delayed animation */}
              <motion.h1 
                className="text-4xl font-bold mb-6 text-white"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.8 }}
              >Join OptiBuild Today</motion.h1>
              {/* Welcome description with delayed animation */}
              <motion.p 
                className="text-xl mb-8 text-white"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 0.8 }}
              >Transform your construction project management with our AI-powered platform</motion.p>
              {/* Platform benefits list with staggered entrance animations */}
              <ul className="space-y-4">
                {/* Cost reduction benefit highlight */}
                <motion.li 
                  className="flex items-start space-x-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.4, duration: 0.5 }}
                >
                  <div className="bg-white/20 p-2 rounded-full mt-0.5">
                    <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-white">Reduce project costs by optimizing resource allocation</p>
                </motion.li>
                {/* Delay minimization benefit highlight */}
                <motion.li 
                  className="flex items-start space-x-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.6, duration: 0.5 }}
                >
                  <div className="bg-white/20 p-2 rounded-full mt-0.5">
                    <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-white">Minimize delays with AI-powered forecasting and scheduling</p>
                </motion.li>
                {/* Sustainability benefit highlight */}
                <motion.li 
                  className="flex items-start space-x-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.8, duration: 0.5 }}
                >
                  <div className="bg-white/20 p-2 rounded-full mt-0.5">
                    <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-white">Lower your carbon footprint with sustainable resource planning</p>
                </motion.li>
              </ul>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Right side - signup form with user registration fields */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 md:p-8 bg-white dark:bg-black">
        {/* Form container with entrance animation */}
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20, x: 20 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          {/* Back to home navigation link with animation */}
          <motion.div 
            className="mb-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Link href="/" className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to home
            </Link>
          </motion.div>

          {/* Main signup form container */}
          <div className="bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-gray-800 p-8">
            {/* Form header with title and description */}
            <div className="space-y-2 mb-6">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Create an account</h2>
              <p className="text-gray-600 dark:text-gray-400">Enter your information to get started</p>
            </div>

            {/* Registration form with all required fields */}
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                {/* First name input field */}
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-gray-900 dark:text-white">First Name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="Enter your first name"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="bg-white dark:bg-black border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                {/* Last name input field */}
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-gray-900 dark:text-white">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Enter your last name"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="bg-white dark:bg-black border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                {/* Email input field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-900 dark:text-white">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white dark:bg-black border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                {/* Password input field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-900 dark:text-white">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white dark:bg-black border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                {/* Confirm password input field for validation */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-gray-900 dark:text-white">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-white dark:bg-black border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                {/* Role selection dropdown */}
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-gray-900 dark:text-white">Role</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger id="role" className="bg-white dark:bg-black border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrator</SelectItem>
                      <SelectItem value="manager">Project Manager</SelectItem>
                      <SelectItem value="engineer">Engineer</SelectItem>
                      <SelectItem value="worker">Site Worker</SelectItem>
                      <SelectItem value="client">Client</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Terms and conditions agreement checkbox */}
                <div className="flex items-center space-x-2">
                  <Checkbox id="terms" required className="border-gray-300 dark:border-gray-700" />
                  <Label htmlFor="terms" className="text-sm text-gray-600 dark:text-gray-400">
                    I agree to the{" "}
                    <Link href="/terms" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                      Privacy Policy
                    </Link>
                  </Label>
                </div>
              </div>

              {/* Submit button with loading state */}
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>

              {/* Divider with "Or continue with" text */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-700" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-black px-2 text-gray-600 dark:text-gray-400">Or continue with</span>
                </div>
              </div>

              {/* Google sign-up button (currently placeholder) */}
              <Button variant="outline" className="w-full border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800">
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Google
              </Button>

              {/* Sign in link for existing users */}
              <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                  Sign in
                </Link>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

