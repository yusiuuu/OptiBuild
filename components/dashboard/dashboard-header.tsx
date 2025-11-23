"use client"

import { Button } from "@/components/ui/button"
import { Filter, Calendar } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Props interface for the dashboard header component
// Manages filter state and date range selection for dashboard data
interface DashboardHeaderProps {
  activeFilter: string
  setActiveFilter: (filter: string) => void
  dateRange: string
  setDateRange: (range: string) => void
}

// Dashboard header component that provides filtering and date range controls
// Displays dashboard title and allows users to filter projects by status and time period
export function DashboardHeader({ activeFilter, setActiveFilter, dateRange, setDateRange }: DashboardHeaderProps) {
  // Available project status filters for dashboard data
  const filters = [
    { id: "all", label: "All Projects" },
    { id: "active", label: "Active Only" },
    { id: "delayed", label: "Delayed" },
    { id: "completed", label: "Completed" },
  ]

  // Available date ranges for time-based filtering
  const dateRanges = ["Apr 2025", "Mar 2025", "Feb 2025", "Jan 2025", "Q1 2025", "Q4 2024"]

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 mb-2 sm:mb-4">
      {/* Left side: Dashboard title and description */}
      <div className="flex-shrink-0">
        <h1 className="text-base sm:text-lg md:text-xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Monitor and optimize your construction resources</p>
      </div>
      
      {/* Right side: Filter and date range controls */}
      <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
        {/* Project status filter dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex-1 sm:flex-initial text-xs sm:text-sm h-8 sm:h-9">
              <Filter className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              {/* Display current active filter label or default text */}
              <span className="hidden sm:inline">{filters.find((f) => f.id === activeFilter)?.label || "Filter"}</span>
              <span className="sm:hidden">Filter</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Filter Projects</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {/* Render filter options with active state highlighting */}
            {filters.map((filter) => (
              <DropdownMenuItem
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={activeFilter === filter.id ? "bg-gray-100 dark:bg-gray-800" : ""}
              >
                {filter.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Date range selection dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex-1 sm:flex-initial text-xs sm:text-sm h-8 sm:h-9">
              <Calendar className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              {/* Display currently selected date range */}
              <span className="truncate">{dateRange}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Select Time Period</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {/* Render date range options with current selection highlighting */}
            {dateRanges.map((range) => (
              <DropdownMenuItem
                key={range}
                onClick={() => setDateRange(range)}
                className={dateRange === range ? "bg-gray-100 dark:bg-gray-800" : ""}
              >
                {range}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

