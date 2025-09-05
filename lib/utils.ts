import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// Utility function for combining and merging CSS class names
// Combines clsx for conditional class logic with tailwind-merge for deduplication
// This prevents duplicate Tailwind classes and resolves conflicts automatically
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
