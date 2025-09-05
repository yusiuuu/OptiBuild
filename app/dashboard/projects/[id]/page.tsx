"use client"

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
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
  Target
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { 
  projectsService, 
  tasksService, 
  resourcesService, 
  optimizationService,
  Project, 
  Task, 
  Resource 
} from '@/lib/data-service'
import { optimizationEngine } from '@/lib/optimization-engine'
import { GanttChart } from '@/components/visualization/gantt-chart'
import { ResourceHistogram } from '@/components/visualization/resource-histogram'
import { BudgetCostBreakdown } from '@/components/visualization/budget-cost-breakdown'
import { WhatIfAnalysis } from '@/components/analysis/what-if-analysis'
import { ReportGenerator } from '@/components/reports/report-generator'
import { toast } from 'sonner'

export default function ProjectDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { user, canManageProjects, canViewAnalytics, canGenerateReports } = useAuth()
  
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [optimizationResults, setOptimizationResults] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  const projectId = params.id as string

  // Load project data
  useEffect(() => {
    const loadProjectData = async () => {
      if (!user) return

      try {
        setIsLoading(true)
        
        // Load project details
        const projects = await projectsService.getProjects()
        const currentProject = projects.find(p => p.id === projectId)
        
        if (!currentProject) {
          toast.error('Project not found')
          router.push('/dashboard')
          return
        }
        
        setProject(currentProject)

        // Load tasks and resources
        const [tasksData, resourcesData] = await Promise.all([
          tasksService.getTasks(projectId),
          resourcesService.getResources(projectId)
        ])
        
        setTasks(tasksData)
        setResources(resourcesData)

        // Load optimization results
        try {
          const optimizationData = await optimizationService.getOptimizationResults(projectId)
          if (optimizationData.length > 0) {
            setOptimizationResults(optimizationData[0])
          }
        } catch (error) {
          console.log('No optimization results found')
        }

      } catch (error) {
        console.error('Error loading project data:', error)
        toast.error('Failed to load project data')
      } finally {
        setIsLoading(false)
      }
    }

    loadProjectData()
  }, [projectId, user, router])

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
    completedTasks: tasks.filter(t => t.status === 'completed').length,
    totalResources: resources.length,
    totalBudget: project?.budget || 0,
    actualCost: tasks.reduce((sum, task) => sum + (task.actual_cost || 0), 0) +
                resources.reduce((sum, resource) => sum + (resource.total_cost || 0), 0),
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
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="budget">Budget</TabsTrigger>
            {canViewAnalytics() && <TabsTrigger value="analysis">Analysis</TabsTrigger>}
            {canGenerateReports() && <TabsTrigger value="reports">Reports</TabsTrigger>}
          </TabsList>

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
                      <p className="text-sm text-gray-900">{project.area_sqft?.toLocaleString()} sq ft</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Floors</p>
                      <p className="text-sm text-gray-900">{project.floors}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Structure</p>
                      <p className="text-sm text-gray-900 capitalize">{project.structure_type}</p>
                    </div>
                  </div>
                  
                  {project.description && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Description</p>
                      <p className="text-sm text-gray-900">{project.description}</p>
                    </div>
                  )}
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

          {/* Schedule Tab */}
          <TabsContent value="schedule">
            <GanttChart 
              tasks={tasks}
              startDate={project.start_date ? new Date(project.start_date) : undefined}
              endDate={project.end_date ? new Date(project.end_date) : undefined}
              onTaskUpdate={canManageProjects() ? async (taskId, updates) => {
                try {
                  await tasksService.updateTask(taskId, updates)
                  setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t))
                  toast.success('Task updated successfully')
                } catch (error) {
                  toast.error('Failed to update task')
                }
              } : undefined}
              readonly={!canManageProjects()}
            />
          </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="resources">
            <ResourceHistogram 
              resources={resources}
              startDate={project.start_date ? new Date(project.start_date) : undefined}
              endDate={project.end_date ? new Date(project.end_date) : undefined}
              onResourceUpdate={canManageProjects() ? async (resourceId, updates) => {
                try {
                  await resourcesService.updateResource(resourceId, updates)
                  setResources(prev => prev.map(r => r.id === resourceId ? { ...r, ...updates } : r))
                  toast.success('Resource updated successfully')
                } catch (error) {
                  toast.error('Failed to update resource')
                }
              } : undefined}
              readonly={!canManageProjects()}
            />
          </TabsContent>

          {/* Budget Tab */}
          <TabsContent value="budget">
            <BudgetCostBreakdown 
              tasks={tasks}
              resources={resources}
              totalBudget={project.budget || 0}
              onBudgetUpdate={canManageProjects() ? (updates) => {
                // Handle budget updates
                console.log('Budget update:', updates)
              } : undefined}
              readonly={!canManageProjects()}
            />
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
    </div>
  )
}