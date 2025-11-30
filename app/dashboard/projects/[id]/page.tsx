"use client"

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { 
  ArrowLeft, 
  Calendar, 
  Users, 
  DollarSign, 
  BarChart3, 
  Settings,
  Play,
  Pause,
  RotateCcw,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Plus,
  X,
  Trash2
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { 
  projectDetailsService,
  projectsService, 
  tasksService, 
  optimizationService,
  projectTeamMembersService,
  projectResourcesService,
  constraintsService,
  type ProjectDetails,
  type Project, 
  type Task, 
  type Resource 
} from '@/lib/data-service'
import { optimizationEngine } from '@/lib/optimization-engine'
import { GanttChart } from '@/components/visualization/gantt-chart'
import { ResourceHistogram } from '@/components/visualization/resource-histogram'
import { BudgetCostBreakdown } from '@/components/visualization/budget-cost-breakdown'
import { WhatIfAnalysis } from '@/components/analysis/what-if-analysis'
import { ReportGenerator } from '@/components/reports/report-generator'
import { toast } from 'sonner'
import { NewTaskDialog } from '@/components/projects/new-task-dialog'
import { AddTeamMemberDialog } from '@/components/projects/add-team-member-dialog'
import { AssignResourceDialog } from '@/components/projects/assign-resource-dialog'
import { AddConstraintDialog } from '@/components/projects/add-constraint-dialog'
import { AddBudgetCategoryDialog } from '@/components/projects/add-budget-category-dialog'
import { AddExpenseDialog } from '@/components/projects/add-expense-dialog'

export default function ProjectDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { user, canManageProjects, canViewAnalytics, canGenerateReports } = useAuth()
  
  const [projectDetails, setProjectDetails] = useState<ProjectDetails | null>(null)
  const [optimizationResults, setOptimizationResults] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  
  // Dialog states
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [teamMemberDialogOpen, setTeamMemberDialogOpen] = useState(false)
  const [resourceDialogOpen, setResourceDialogOpen] = useState(false)
  const [constraintDialogOpen, setConstraintDialogOpen] = useState(false)
  const [budgetCategoryDialogOpen, setBudgetCategoryDialogOpen] = useState(false)
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Derived state for easier access
  const project = projectDetails?.project || null
  const tasks = projectDetails?.tasks || []
  const resources = projectDetails?.resources || []
  const assignedResources = projectDetails?.assigned_resources || []
  const teamMembers = projectDetails?.team_members || []
  const constraints = projectDetails?.constraints || []
  const documents = projectDetails?.documents || []
  const budgetCategories = projectDetails?.budget_categories || []
  const expenses = projectDetails?.expenses || []

  const projectId = params.id as string

  // Load project data using comprehensive service
  useEffect(() => {
    const loadProjectData = async () => {
      if (!user) return

      try {
        setIsLoading(true)
        
        // Load comprehensive project details (all related data in one call)
        const details = await projectDetailsService.getProjectDetails(projectId)
        setProjectDetails(details)

        // Load optimization results
        try {
          const optimizationData = await optimizationService.getOptimizationResults(projectId)
          if (optimizationData.length > 0) {
            setOptimizationResults(optimizationData[0])
          }
        } catch (error) {
          console.log('No optimization results found')
        }

      } catch (error: any) {
        console.error('Error loading project data:', error)
        
        // Better error handling
        const errorMessage = error?.message || error?.details?.message || 'Unknown error'
        const errorCode = error?.code || error?.details?.code
        
        if (errorMessage.includes('not found') || errorCode === 'PGRST116' || errorCode === '42P01') {
          toast.error('Project not found')
          router.push('/dashboard')
        } else if (errorMessage.includes('Authentication') || errorMessage.includes('not authenticated')) {
          toast.error('Please log in to view this project')
          router.push('/login')
        } else {
          // More detailed error message
          const displayMessage = errorMessage || 'Failed to load project data'
          console.error('Full error details:', {
            message: errorMessage,
            code: errorCode,
            error: error
          })
          toast.error(`Failed to load project data: ${displayMessage}`)
        }
      } finally {
        setIsLoading(false)
      }
    }

    if (projectId) {
      loadProjectData()
    }
  }, [projectId, user, router])

  // Refresh project details
  const refreshProjectDetails = async () => {
    if (!user) return
    try {
      const details = await projectDetailsService.getProjectDetails(projectId)
      setProjectDetails(details)
    } catch (error) {
      console.error('Error refreshing project details:', error)
      toast.error('Failed to refresh project data')
    }
  }

  // Delete project
  const handleDeleteProject = async () => {
    if (!project) {
      toast.error('Project not found')
      return
    }

    if (!canManageProjects()) {
      toast.error('You do not have permission to delete this project')
      return
    }

    if (!projectId) {
      toast.error('Project ID is missing')
      return
    }

    setIsDeleting(true)
    try {
      console.log('Deleting project:', projectId)
      await projectsService.deleteProject(projectId)
      console.log('Project deleted successfully')
      toast.success('Project deleted successfully')
      setDeleteDialogOpen(false)
      // Small delay to show success message before redirect
      setTimeout(() => {
        router.push('/dashboard')
      }, 500)
    } catch (error: any) {
      console.error('Error deleting project:', error)
      const errorMessage = error?.message || error?.details?.message || 'Failed to delete project'
      toast.error(`Failed to delete project: ${errorMessage}`)
      // Don't close dialog on error so user can try again
    } finally {
      setIsDeleting(false)
    }
  }

  // Run optimization
  const runOptimization = async () => {
    if (!project || !canManageProjects()) {
      toast.error('You do not have permission to run optimization')
      return
    }

    setIsOptimizing(true)
    try {
      // Run task scheduling optimization
      const schedulingResult = await optimizationEngine.optimizeTaskScheduling(
        tasks,
        resources,
        project.constraints || {}
      )

      // Run resource leveling optimization
      const levelingResult = await optimizationEngine.optimizeResourceLeveling(
        tasks,
        resources,
        'minimize_peaks'
      )

      // Store results
      await optimizationService.createOptimizationResult({
        project_id: projectId,
        user_id: user?.id || '',
        optimization_type: 'scheduling',
        algorithm_used: 'genetic_algorithm',
        input_parameters: { tasks, resources, constraints: project.constraints },
        results: {
          scheduling: schedulingResult,
          leveling: levelingResult
        },
        performance_metrics: {
          schedulingFitness: schedulingResult.performance_metrics?.finalFitness,
          levelingFitness: levelingResult.performance_metrics?.finalFitness
        }
      })

      setOptimizationResults({
        scheduling: schedulingResult,
        leveling: levelingResult
      })

      toast.success('Optimization completed successfully!')
    } catch (error) {
      console.error('Error running optimization:', error)
      toast.error('Failed to run optimization')
    } finally {
      setIsOptimizing(false)
    }
  }

  // Get project status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'planning':
        return 'bg-yellow-100 text-yellow-800'
      case 'on_hold':
        return 'bg-gray-100 text-gray-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Calculate project statistics
  const projectStats = {
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.status === 'done').length,
    ongoingTasks: tasks.filter(t => t.status === 'ongoing').length,
    totalResources: assignedResources.length,
    totalTeamMembers: teamMembers.length,
    totalConstraints: constraints.length,
    totalDocuments: documents.length,
    totalBudget: project?.budget || 0,
    actualCost: expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0),
    budgetCategoriesCount: budgetCategories.length,
    progress: project?.progress || 0
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project details...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Project Not Found</h2>
          <p className="text-gray-600 mb-4">The project you're looking for doesn't exist or you don't have access to it.</p>
          <Button onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => router.push('/dashboard')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{project.name}</h1>
                <p className="text-sm text-gray-600">{project.location}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge className={getStatusColor(project.status)}>
                {project.status}
              </Badge>
              
              {canManageProjects() && (
                <>
                  <Button 
                    onClick={runOptimization}
                    disabled={isOptimizing}
                    className="flex items-center gap-2"
                  >
                    {isOptimizing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Optimizing...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        Run Optimization
                      </>
                    )}
                  </Button>
                  
                  <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="outline"
                        size="icon"
                        disabled={isDeleting}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        title="Delete Project"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Project</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                          <p>
                            Are you sure you want to delete <strong>"{project.name}"</strong>?
                          </p>
                          <p>This action cannot be undone. All project data including:</p>
                          <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                            <li>Tasks and schedules</li>
                            <li>Team members</li>
                            <li>Resources and assignments</li>
                            <li>Budget categories and expenses</li>
                            <li>Documents and constraints</li>
                          </ul>
                          <p className="font-semibold text-red-600 mt-2">
                            All of this data will be permanently deleted.
                          </p>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteProject}
                          disabled={isDeleting}
                          className="bg-red-600 hover:bg-red-700 focus:ring-red-600 text-white"
                        >
                          {isDeleting ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                              Deleting...
                            </>
                          ) : (
                            'Delete Project'
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Project Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Progress</p>
                  <p className="text-2xl font-bold text-gray-900">{projectStats.progress}%</p>
                </div>
                <Target className="h-8 w-8 text-blue-600" />
              </div>
              <Progress value={projectStats.progress} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tasks</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {projectStats.completedTasks}/{projectStats.totalTasks}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-sm text-gray-500 mt-1">Completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Budget</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{projectStats.actualCost.toLocaleString()}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                of ₹{projectStats.totalBudget.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Resources</p>
                  <p className="text-2xl font-bold text-gray-900">{projectStats.totalResources}</p>
                </div>
                <Users className="h-8 w-8 text-orange-600" />
              </div>
              <p className="text-sm text-gray-500 mt-1">Total allocated</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="w-full overflow-x-auto">
            <TabsList className="inline-flex w-full min-w-max h-10 gap-2 p-1.5">
              <TabsTrigger value="overview" className="whitespace-nowrap px-5 py-2">Overview</TabsTrigger>
              <TabsTrigger value="tasks" className="whitespace-nowrap px-5 py-2">Tasks</TabsTrigger>
              <TabsTrigger value="team" className="whitespace-nowrap px-5 py-2">Team</TabsTrigger>
              <TabsTrigger value="resources" className="whitespace-nowrap px-5 py-2">Resources</TabsTrigger>
              <TabsTrigger value="documents" className="whitespace-nowrap px-5 py-2">Documents</TabsTrigger>
              <TabsTrigger value="constraints" className="whitespace-nowrap px-5 py-2">Constraints</TabsTrigger>
              <TabsTrigger value="budget" className="whitespace-nowrap px-5 py-2">Budget</TabsTrigger>
              {canViewAnalytics() && <TabsTrigger value="analysis" className="whitespace-nowrap px-5 py-2">Analysis</TabsTrigger>}
              {canGenerateReports() && <TabsTrigger value="reports" className="whitespace-nowrap px-5 py-2">Reports</TabsTrigger>}
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Project Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Type</p>
                      <p className="text-sm text-gray-900 capitalize">{project.type}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Area</p>
                      <p className="text-sm text-gray-900">
                        {(project.total_area || project.area_sqft)?.toLocaleString()} sq ft
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Floors</p>
                      <p className="text-sm text-gray-900">{project.floors || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Structure</p>
                      <p className="text-sm text-gray-900 capitalize">{project.structure_type || 'N/A'}</p>
                    </div>
                    {project.building_height && (
                      <div>
                        <p className="text-sm font-medium text-gray-600">Building Height</p>
                        <p className="text-sm text-gray-900">{project.building_height} ft</p>
                      </div>
                    )}
                  </div>
                  
                  {project.description && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Description</p>
                      <p className="text-sm text-gray-900">{project.description}</p>
                    </div>
                  )}

                  {/* Constraints Badges */}
                  {constraints.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Constraints</p>
                      <div className="flex flex-wrap gap-2">
                        {constraints.map((pc) => (
                          <Badge key={pc.id} variant="outline">
                            {pc.constraint?.name || 'Unknown'}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Team Members</p>
                      <p className="text-lg font-bold text-gray-900">{projectStats.totalTeamMembers}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Documents</p>
                      <p className="text-lg font-bold text-gray-900">{projectStats.totalDocuments}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Timeline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Start Date</p>
                      <p className="text-sm text-gray-900">
                        {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'Not set'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">End Date</p>
                      <p className="text-sm text-gray-900">
                        {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Not set'}
                      </p>
                    </div>
                  </div>
                  
                  {project.start_date && project.end_date && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Duration</p>
                      <p className="text-sm text-gray-900">
                        {Math.ceil((new Date(project.end_date).getTime() - new Date(project.start_date).getTime()) / (1000 * 60 * 60 * 24))} days
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Optimization Results Summary */}
            {optimizationResults && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Optimization Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-600 font-medium">Schedule Optimization</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {optimizationResults.scheduling?.performance_metrics?.finalFitness?.toFixed(2) || 'N/A'}
                      </p>
                      <p className="text-xs text-blue-600">Fitness Score</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-600 font-medium">Resource Leveling</p>
                      <p className="text-2xl font-bold text-green-900">
                        {optimizationResults.leveling?.performance_metrics?.finalFitness?.toFixed(2) || 'N/A'}
                      </p>
                      <p className="text-xs text-green-600">Fitness Score</p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <p className="text-sm text-orange-600 font-medium">Total Cost</p>
                      <p className="text-2xl font-bold text-orange-900">
                        ₹{optimizationResults.scheduling?.results?.totalCost?.toLocaleString() || 'N/A'}
                      </p>
                      <p className="text-xs text-orange-600">Optimized Cost</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Project Tasks</h3>
              {canManageProjects() && (
                <Button onClick={() => setTaskDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
              )}
            </div>
            {tasks.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500">No tasks yet. Create your first task to get started.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {['todo', 'ongoing', 'done', 'blocked'].map((status) => {
                  const statusTasks = tasks.filter(t => t.status === status)
                  return (
                    <Card key={status}>
                      <CardHeader>
                        <CardTitle className="text-sm capitalize">{status} ({statusTasks.length})</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {statusTasks.map((task) => (
                          <div key={task.id} className="p-3 bg-gray-50 rounded-lg">
                            <p className="font-medium text-sm">{task.title}</p>
                            {task.description && (
                              <p className="text-xs text-gray-600 mt-1">{task.description}</p>
                            )}
                            <div className="flex items-center justify-between mt-2">
                              <Badge variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'default' : 'secondary'}>
                                {task.priority}
                              </Badge>
                              <Progress value={task.progress} className="w-16 h-2" />
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
            {/* Gantt Chart View */}
            {tasks.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Gantt Chart</CardTitle>
                </CardHeader>
                <CardContent>
                  <GanttChart 
                    tasks={tasks}
                    startDate={project.start_date ? new Date(project.start_date) : undefined}
                    endDate={project.end_date ? new Date(project.end_date) : undefined}
                    onTaskUpdate={canManageProjects() ? async (taskId, updates) => {
                      try {
                        await tasksService.updateTask(taskId, updates)
                        await refreshProjectDetails()
                        toast.success('Task updated successfully')
                      } catch (error) {
                        toast.error('Failed to update task')
                      }
                    } : undefined}
                    readonly={!canManageProjects()}
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Project Team</h3>
              {canManageProjects() && (
                <Button onClick={() => setTeamMemberDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Team Member
                </Button>
              )}
            </div>
            {teamMembers.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500">No team members assigned yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teamMembers.map((ptm) => (
                  <Card key={ptm.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{ptm.team_member?.name}</p>
                          <p className="text-sm text-gray-600">{ptm.team_member?.role}</p>
                          {ptm.role_in_project && (
                            <Badge variant="outline" className="mt-1">
                              {ptm.role_in_project}
                            </Badge>
                          )}
                        </div>
                        {canManageProjects() && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={async () => {
                              if (confirm(`Remove ${ptm.team_member?.name} from this project?`)) {
                                try {
                                  await projectTeamMembersService.removeTeamMemberFromProject(projectId, ptm.team_member_id)
                                  toast.success('Team member removed successfully')
                                  await refreshProjectDetails()
                                } catch (error) {
                                  toast.error('Failed to remove team member')
                                }
                              }
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="resources" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Assigned Resources</h3>
              {canManageProjects() && (
                <Button onClick={() => setResourceDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Assign Resource
                </Button>
              )}
            </div>
            {assignedResources.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500">No resources assigned yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {assignedResources.map((pr) => (
                  <Card key={pr.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{pr.resource?.name}</p>
                          <p className="text-sm text-gray-600">
                            {pr.quantity} {pr.resource?.unit} • {pr.resource?.type}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(pr.allocated_from).toLocaleDateString()} - {new Date(pr.allocated_to).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">₹{pr.total_cost?.toLocaleString()}</p>
                          {canManageProjects() && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="mt-2" 
                              onClick={async () => {
                                if (confirm(`Remove ${pr.resource?.name} from this project?`)) {
                                  try {
                                    await projectResourcesService.removeResourceFromProject(pr.id || '')
                                    toast.success('Resource removed successfully')
                                    await refreshProjectDetails()
                                  } catch (error) {
                                    toast.error('Failed to remove resource')
                                  }
                                }
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            {/* Resource Histogram */}
            {assignedResources.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Resource Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResourceHistogram 
                    resources={assignedResources.map(pr => ({
                      ...pr.resource,
                      quantity: pr.quantity,
                      availability_start: pr.allocated_from,
                      availability_end: pr.allocated_to
                    })) as Resource[]}
                    startDate={project.start_date ? new Date(project.start_date) : undefined}
                    endDate={project.end_date ? new Date(project.end_date) : undefined}
                    readonly={!canManageProjects()}
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Project Documents</h3>
              {canManageProjects() && (
                <Button onClick={() => toast.info('Upload document dialog coming soon')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Upload Document
                </Button>
              )}
            </div>
            {documents.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500">No documents uploaded yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map((doc) => (
                  <Card key={doc.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{doc.name}</p>
                          <p className="text-sm text-gray-600">{doc.type}</p>
                          {doc.size && <p className="text-xs text-gray-500">{doc.size}</p>}
                        </div>
                        {doc.file_url && (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Constraints Tab */}
          <TabsContent value="constraints" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Project Constraints</h3>
              {canManageProjects() && (
                <Button onClick={() => setConstraintDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Constraint
                </Button>
              )}
            </div>
            {constraints.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500">No constraints assigned yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {constraints.map((pc) => (
                  <Card key={pc.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <Badge variant="outline" className="mb-2">
                            {pc.constraint?.category || 'General'}
                          </Badge>
                          <p className="font-semibold">{pc.constraint?.name}</p>
                          {pc.constraint?.description && (
                            <p className="text-sm text-gray-600 mt-1">{pc.constraint.description}</p>
                          )}
                          {pc.details && (
                            <p className="text-sm text-gray-700 mt-2 p-2 bg-gray-50 rounded">
                              {pc.details}
                            </p>
                          )}
                        </div>
                        {canManageProjects() && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={async () => {
                              if (confirm(`Remove ${pc.constraint?.name} constraint?`)) {
                                try {
                                  await constraintsService.removeConstraintFromProject(projectId, pc.constraint_id)
                                  toast.success('Constraint removed successfully')
                                  await refreshProjectDetails()
                                } catch (error) {
                                  toast.error('Failed to remove constraint')
                                }
                              }
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Budget Tab */}
          <TabsContent value="budget" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Budget & Expenses</h3>
              {canManageProjects() && (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setBudgetCategoryDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Category
                  </Button>
                  <Button onClick={() => setExpenseDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Expense
                  </Button>
                </div>
              )}
            </div>
            
            {/* Budget Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600">Total Budget</p>
                  <p className="text-2xl font-bold">₹{projectStats.totalBudget.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600">Actual Cost</p>
                  <p className="text-2xl font-bold">₹{projectStats.actualCost.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600">Remaining</p>
                  <p className={`text-2xl font-bold ${projectStats.totalBudget - projectStats.actualCost < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ₹{(projectStats.totalBudget - projectStats.actualCost).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Budget Categories */}
            {budgetCategories.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Budget Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {budgetCategories.map((category) => {
                      const categoryExpenses = expenses.filter(e => e.category_id === category.id)
                      const categoryActual = categoryExpenses.reduce((sum, e) => sum + e.amount, 0)
                      return (
                        <div key={category.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-semibold">{category.name}</p>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">Planned: ₹{category.planned_amount.toLocaleString()}</p>
                              <p className="text-sm font-semibold">Actual: ₹{categoryActual.toLocaleString()}</p>
                            </div>
                          </div>
                          <Progress 
                            value={(categoryActual / category.planned_amount) * 100} 
                            className="h-2"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            {categoryExpenses.length} expense(s)
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Expenses List */}
            {expenses.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {expenses.slice(0, 10).map((expense) => (
                      <div key={expense.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{expense.description}</p>
                          <p className="text-sm text-gray-600">
                            {budgetCategories.find(c => c.id === expense.category_id)?.name} • {new Date(expense.date).toLocaleDateString()}
                          </p>
                        </div>
                        <p className="font-semibold">₹{expense.amount.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Budget Visualization */}
            <Card>
              <CardHeader>
                <CardTitle>Budget Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <BudgetCostBreakdown 
                  tasks={tasks}
                  resources={assignedResources.map(pr => ({
                    ...pr.resource,
                    total_cost: pr.total_cost
                  })) as Resource[]}
                  totalBudget={project.budget || 0}
                  readonly={!canManageProjects()}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analysis Tab */}
          {canViewAnalytics() && (
            <TabsContent value="analysis">
              <WhatIfAnalysis 
                projectId={projectId}
                tasks={tasks}
                resources={resources}
                baseScenario={optimizationResults}
                onScenarioSave={(scenario) => {
                  console.log('Scenario saved:', scenario)
                  toast.success('Scenario saved successfully')
                }}
              />
            </TabsContent>
          )}

          {/* Reports Tab */}
          {canGenerateReports() && (
            <TabsContent value="reports">
              <ReportGenerator 
                projectId={projectId}
                project={project}
                tasks={tasks}
                resources={resources}
                onReportGenerated={(report) => {
                  console.log('Report generated:', report)
                  toast.success('Report generated successfully')
                }}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Dialogs */}
      <NewTaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        projectId={projectId}
        onTaskCreated={refreshProjectDetails}
      />
      <AddTeamMemberDialog
        open={teamMemberDialogOpen}
        onOpenChange={setTeamMemberDialogOpen}
        projectId={projectId}
        onTeamMemberAdded={refreshProjectDetails}
      />
      <AssignResourceDialog
        open={resourceDialogOpen}
        onOpenChange={setResourceDialogOpen}
        projectId={projectId}
        onResourceAssigned={refreshProjectDetails}
      />
      <AddConstraintDialog
        open={constraintDialogOpen}
        onOpenChange={setConstraintDialogOpen}
        projectId={projectId}
        onConstraintAdded={refreshProjectDetails}
      />
      <AddBudgetCategoryDialog
        open={budgetCategoryDialogOpen}
        onOpenChange={setBudgetCategoryDialogOpen}
        projectId={projectId}
        onCategoryAdded={refreshProjectDetails}
      />
      <AddExpenseDialog
        open={expenseDialogOpen}
        onOpenChange={setExpenseDialogOpen}
        projectId={projectId}
        onExpenseAdded={refreshProjectDetails}
      />
    </div>
  )
}