"use client"

import { useEffect, useState } from "react"

// Custom hook for detecting mobile device viewport
// Returns boolean indicating if current screen width is below mobile breakpoint (768px)
// Automatically updates on window resize for responsive design
export function useIsMobile() {
  // State to track mobile device status
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Function to check if current viewport is mobile-sized
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    // Perform initial check on component mount
    checkIsMobile()

    // Add resize event listener to update state on window resize
    window.addEventListener("resize", checkIsMobile)

    // Clean up event listener on component unmount
    return () => {
      window.removeEventListener("resize", checkIsMobile)
    }
  }, [])

  return isMobile
}

