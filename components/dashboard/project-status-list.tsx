"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock } from "lucide-react"
import Link from "next/link"

// Project status list component for dashboard overview
// Displays current status, progress, and key metrics for all active construction projects
export function ProjectStatusList() {
  // State to store project data from Supabase
  const [projects, setProjects] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load projects from Supabase on component mount
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const { projectsService } = await import('@/lib/data-service')
        const userProjects = await projectsService.getProjects()
        
        // Format projects for display
        const formattedProjects = userProjects.map((project: any) => ({
          id: project.id,
          title: project.name,
          progress: project.progress || 0,
          status: getProjectStatus(project.progress || 0),
          dueDate: project.end_date || project.start_date,
          budget: project.budget ? `₹${(project.budget / 10000000).toFixed(1)} Cr` : 'N/A',
          budgetStatus: 'on-budget' // Can be calculated from expenses if needed
        }))
        
        setProjects(formattedProjects)
      } catch (error) {
        console.error('Error loading projects:', error)
        setProjects([])
      } finally {
        setIsLoading(false)
      }
    }

    loadProjects()
  }, [])

  // Determine project status based on completion percentage
  // Returns appropriate status for progress tracking and risk assessment
  const getProjectStatus = (progress: number) => {
    if (progress >= 90) return 'on-track'
    if (progress >= 60) return 'on-track'
    if (progress >= 30) return 'delayed'
    return 'at-risk'
  }

  // Generate status badge with appropriate color coding
  // Visual indicators for project health and progress status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'on-track':
        return <Badge className="bg-green-500">On Track</Badge>
      case 'delayed':
        return <Badge className="bg-amber-500">Delayed</Badge>
      case 'at-risk':
        return <Badge className="bg-red-500">At Risk</Badge>
      default:
        return <Badge>Unknown</Badge>
    }
  }

  // Generate budget status badge with color coding
  // Visual indicators for budget performance and financial health
  const getBudgetStatusBadge = (status: string) => {
    switch (status) {
      case 'under':
        return (
          <Badge variant="outline" className="border-green-500 text-green-600">
            Under Budget
          </Badge>
        )
      case 'over':
        return (
          <Badge variant="outline" className="border-red-500 text-red-600">
            Over Budget
          </Badge>
        )
      case 'on-budget':
        return (
          <Badge variant="outline" className="border-blue-500 text-blue-600">
            On Budget
          </Badge>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <Card className="h-full flex flex-col w-full">
      {/* Card header with title and description */}
      <CardHeader className="px-3 sm:px-4 pt-3 sm:pt-4 pb-2 sm:pb-3 flex-shrink-0">
        <CardTitle className="text-sm sm:text-base">Project Status</CardTitle>
        <CardDescription className="text-xs hidden sm:block">Current status of active projects</CardDescription>
      </CardHeader>
      
      {/* Card content with project list */}
      <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4 flex-1 min-h-0 overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="text-center py-6 text-gray-500 text-sm">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-6 text-gray-500 text-sm">No projects found. Create a new project to get started.</div>
        ) : (
          <div className="space-y-3 flex-1 overflow-y-auto min-h-0">
            {/* Map through all projects and display their status information */}
            {projects.map((project) => (
              <div key={project.id} className="space-y-1.5 pb-2 border-b last:border-0">
                {/* Project title and status badge row */}
                <div className="flex items-center justify-between">
                  <Link 
                    href={`/dashboard/projects/${project.id}`}
                    className="font-medium text-sm hover:text-blue-600 transition-colors truncate flex-1 mr-2"
                  >
                    {project.title}
                  </Link>
                  {getStatusBadge(project.status)}
                </div>
                
                {/* Due date and progress percentage row */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center">
                    <Clock className="mr-1 h-3 w-3" />
                    {project.dueDate ? new Date(project.dueDate).toLocaleDateString() : 'No due date'}
                  </div>
                  <div className="font-medium">{project.progress}%</div>
                </div>
                
                {/* Progress bar showing completion percentage */}
                <Progress value={project.progress} className="h-1.5" />
                
                {/* Budget information and status row */}
                <div className="flex justify-between items-center">
                  <div className="text-xs">Budget: {project.budget}</div>
                  {getBudgetStatusBadge(project.budgetStatus)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      {/* Card footer with refresh button */}
      <CardFooter className="px-3 sm:px-4 pb-3 sm:pb-4 pt-2 sm:pt-3 flex-shrink-0">
        <Button variant="outline" size="sm" className="w-full text-xs sm:text-sm h-8 sm:h-9" onClick={() => window.location.reload()}>
          Refresh Projects
        </Button>
      </CardFooter>
    </Card>
  )
}

