import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// Utility function for combining and merging CSS class names
// Combines clsx for conditional class logic with tailwind-merge for deduplication
// This prevents duplicate Tailwind classes and resolves conflicts automatically
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Generate avatar initials from company name or user name
export function getAvatarInitials(companyName?: string, fullName?: string, email?: string): string {
  // Priority: company_name > full_name > email
  if (companyName) {
    const words = companyName.trim().split(/\s+/).filter(w => w.length > 0)
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase()
    }
    return companyName.substring(0, 2).toUpperCase()
  }
  
  if (fullName) {
    const words = fullName.trim().split(/\s+/).filter(w => w.length > 0)
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase()
    }
    return fullName.substring(0, 2).toUpperCase()
  }
  
  if (email) {
    return email.substring(0, 2).toUpperCase()
  }
  
  return 'CB' // Default fallback
}