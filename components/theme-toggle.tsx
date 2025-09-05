"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Theme toggle component for switching between light, dark, and system themes
// Provides a dropdown menu with animated sun/moon icons that change based on current theme
export function ThemeToggle() {
  // Hook to access theme switching functionality from next-themes
  const { setTheme } = useTheme()

  return (
    <DropdownMenu>
      {/* Trigger button with animated sun/moon icons */}
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          {/* Sun icon: visible in light mode, hidden in dark mode with rotation animation */}
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          {/* Moon icon: hidden in light mode, visible in dark mode with rotation animation */}
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      
      {/* Theme selection dropdown menu */}
      <DropdownMenuContent align="end">
        {/* Light theme option */}
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        {/* Dark theme option */}
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        {/* System theme option (follows OS preference) */}
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 