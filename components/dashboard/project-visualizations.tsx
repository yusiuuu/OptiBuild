"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts"
import { projectsService, projectDetailsService } from "@/lib/data-service"
import { format } from "date-fns"
import { GanttChart } from "@/components/visualization/gantt-chart"
import { useAuth } from "@/contexts/AuthContext"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#ffc658"]

// Project visualizations component for dashboard
// Displays various charts and graphs for project data
export function ProjectVisualizations({ refreshKey }: { refreshKey?: number }) {
  const { user } = useAuth()
  const [projects, setProjects] = useState<any[]>([])
  const [allTasks, setAllTasks] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    const loadData = async () => {
      if (!user) return
      
      try {
        setIsLoading(true)
        // Load all projects
        const userProjects = await projectsService.getProjects()
        setProjects(userProjects)

        // Load tasks from all projects
        const tasksPromises = userProjects.map(async (project: any) => {
          try {
            const details = await projectDetailsService.getProjectDetails(project.id)
            return details.tasks || []
          } catch (error) {
            console.error(`Error loading tasks for project ${project.id}:`, error)
            return []
          }
        })

        const tasksArrays = await Promise.all(tasksPromises)
        const flatTasks = tasksArrays.flat()
        setAllTasks(flatTasks)
      } catch (error) {
        console.error('Error loading project data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [user, refreshKey])

  // Prepare data for status distribution pie chart
  const statusData = projects.reduce((acc: any, project: any) => {
    const status = project.status || 'Unknown'
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {})

  const statusChartData = Object.entries(statusData).map(([name, value]) => ({
    name,
    value
  }))

  // Prepare data for progress bar chart
  const progressData = projects.map((project: any) => ({
    name: project.name?.substring(0, 15) || 'Unnamed',
    progress: project.progress || 0,
    budget: project.budget ? project.budget / 1000000 : 0 // Convert to millions
  }))

  // Prepare data for budget comparison
  const budgetData = projects.map((project: any) => ({
    name: project.name?.substring(0, 15) || 'Unnamed',
    budget: project.budget ? project.budget / 1000000 : 0,
    spent: 0 // Will be calculated from expenses if available
  }))

  // Prepare data for timeline (projects by start date)
  const timelineData = projects
    .filter((p: any) => p.start_date)
    .map((project: any) => ({
      name: project.name?.substring(0, 15) || 'Unnamed',
      startDate: new Date(project.start_date).getTime(),
      endDate: project.end_date ? new Date(project.end_date).getTime() : new Date(project.start_date).getTime() + (30 * 24 * 60 * 60 * 1000),
      progress: project.progress || 0
    }))
    .sort((a: any, b: any) => a.startDate - b.startDate)

  // Prepare data for project type distribution
  const typeData = projects.reduce((acc: any, project: any) => {
    const type = project.type || 'Other'
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {})

  const typeChartData = Object.entries(typeData).map(([name, value]) => ({
    name,
    value
  }))

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Project Visualizations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">Loading project data...</div>
        </CardContent>
      </Card>
    )
  }

  if (projects.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Project Visualizations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            No projects found. Create a project to see visualizations.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full flex flex-col">
      <CardHeader className="px-4 pt-4 pb-3">
        <CardTitle className="text-base">Project Analytics & Visualizations</CardTitle>
        <CardDescription className="text-xs">Comprehensive visual analysis of your projects</CardDescription>
      </CardHeader>
      <CardContent className="px-4 pb-4 flex-1 flex flex-col min-h-0">
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="budget">Budget</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-4 flex-1 overflow-y-auto min-h-0">
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              {/* Status Distribution Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Project Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Project Type Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Project Type Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={typeChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {typeChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress" className="space-y-4 mt-4 flex-1 overflow-y-auto min-h-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Project Progress Comparison</CardTitle>
                <CardDescription>Progress percentage across all projects</CardDescription>
              </CardHeader>
              <CardContent>
                {progressData.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No project progress data available</div>
                ) : (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={progressData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        interval={0}
                      />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(value: number) => `${value}%`} />
                      <Legend />
                      <Bar dataKey="progress" fill="#0088FE" name="Progress %" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Budget Tab */}
          <TabsContent value="budget" className="space-y-4 mt-4 flex-1 overflow-y-auto min-h-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Project Budget Comparison</CardTitle>
                <CardDescription>Budget allocation across projects (in millions)</CardDescription>
              </CardHeader>
              <CardContent>
                {budgetData.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No budget data available</div>
                ) : (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={budgetData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        interval={0}
                      />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number) => `₹${value.toFixed(2)}M`}
                      />
                      <Legend />
                      <Bar dataKey="budget" fill="#00C49F" name="Budget (₹M)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Timeline Tab - Gantt Chart */}
          <TabsContent value="timeline" className="space-y-4 mt-4 flex-1 overflow-y-auto min-h-0">
            {allTasks.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Project Timeline - Gantt Chart</CardTitle>
                  <CardDescription>Visual timeline of all tasks across projects</CardDescription>
                </CardHeader>
                <CardContent>
                  <GanttChart 
                    tasks={allTasks}
                    readonly={true}
                  />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Project Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    No tasks found. Add tasks to projects to see the timeline.
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Project Timeline Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Project Start Dates Timeline</CardTitle>
                <CardDescription>Projects ordered by start date</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart 
                    data={timelineData}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" dataKey="startDate" />
                    <YAxis dataKey="name" type="category" width={120} />
                    <Tooltip 
                      formatter={(value: number) => format(new Date(value), 'MMM dd, yyyy')}
                    />
                    <Bar dataKey="progress" fill="#FF8042" name="Progress %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

