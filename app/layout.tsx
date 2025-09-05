import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/AuthContext"
import { Toaster } from "@/components/ui/sonner"
import { Toaster as ReactHotToastToaster } from "react-hot-toast"

// Load Inter font from Google Fonts with Latin subset support
const inter = Inter({ subsets: ["latin"] })

// Define metadata for the application including title, description, and generator info
export const metadata: Metadata = {
  title: 'OptiBuild - Smart Construction Resource Management',
  description: 'AI-powered solutions for optimizing construction resource allocation',
  generator: 'v0.dev',
}

// Root layout component that wraps the entire application
// This function provides the base HTML structure and global providers
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} pt-8`}>
        {/* AuthProvider: Manages authentication state across the entire application */}
        <AuthProvider>
          {/* ThemeProvider: Handles theme switching (light/dark/system) with smooth transitions */}
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {/* Main content container with responsive max-width and padding */}
            <div className="mx-auto max-w-screen-2xl px-4">
              {children}
            </div>
          </ThemeProvider>
          {/* Sonner toast notifications for modern toast UI */}
          <Toaster />
          {/* React Hot Toast for additional toast notification support */}
          <ReactHotToastToaster />
        </AuthProvider>
      </body>
    </html>
  )
}
