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
    
    // Listen for task refresh events
    const handleTaskRefresh = () => {
      loadData()
    }
    
    window.addEventListener('task-refresh', handleTaskRefresh)
    
    // Also listen to storage events for cross-tab communication
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'task-refresh-timestamp') {
        handleTaskRefresh()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('task-refresh', handleTaskRefresh)
      window.removeEventListener('storage', handleStorageChange)
    }
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
    <Card className="w-full flex flex-col border-2 shadow-lg bg-gradient-to-br from-background to-muted/20">
      <CardHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-muted/30 to-transparent">
        <CardTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Project Analytics & Visualizations
        </CardTitle>
        <CardDescription className="text-sm mt-1">Comprehensive visual analysis of your projects</CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6 pt-6 flex-1 flex flex-col min-h-0">
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1 h-11">
            <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
              Overview
            </TabsTrigger>
            <TabsTrigger value="progress" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
              Progress
            </TabsTrigger>
            <TabsTrigger value="budget" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
              Budget
            </TabsTrigger>
            <TabsTrigger value="timeline" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
              Timeline
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6 flex-1 overflow-y-auto min-h-0">
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
              {/* Status Distribution Pie Chart */}
              <Card className="border-2 shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold">Project Status Distribution</CardTitle>
                  <CardDescription className="text-sm">Breakdown of project statuses</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <defs>
                        <linearGradient id="statusGradient1" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                          <stop offset="100%" stopColor="#1e40af" stopOpacity={1} />
                        </linearGradient>
                        <linearGradient id="statusGradient2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                          <stop offset="100%" stopColor="#059669" stopOpacity={1} />
                        </linearGradient>
                        <linearGradient id="statusGradient3" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f59e0b" stopOpacity={1} />
                          <stop offset="100%" stopColor="#d97706" stopOpacity={1} />
                        </linearGradient>
                        <linearGradient id="statusGradient4" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ef4444" stopOpacity={1} />
                          <stop offset="100%" stopColor="#dc2626" stopOpacity={1} />
                        </linearGradient>
                      </defs>
                      <Pie
                        data={statusChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        innerRadius={40}
                        fill="#8884d8"
                        dataKey="value"
                        stroke="#fff"
                        strokeWidth={2}
                      >
                        {statusChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`url(#statusGradient${(index % 4) + 1})`} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          padding: '8px 12px'
                        }}
                      />
                      <Legend 
                        wrapperStyle={{ paddingTop: '20px' }}
                        iconType="circle"
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Project Type Distribution */}
              <Card className="border-2 shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold">Project Type Distribution</CardTitle>
                  <CardDescription className="text-sm">Distribution by project type</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <defs>
                        <linearGradient id="typeGradient1" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                          <stop offset="100%" stopColor="#4f46e5" stopOpacity={1} />
                        </linearGradient>
                        <linearGradient id="typeGradient2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                          <stop offset="100%" stopColor="#059669" stopOpacity={1} />
                        </linearGradient>
                        <linearGradient id="typeGradient3" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f59e0b" stopOpacity={1} />
                          <stop offset="100%" stopColor="#d97706" stopOpacity={1} />
                        </linearGradient>
                      </defs>
                      <Pie
                        data={typeChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        innerRadius={40}
                        fill="#8884d8"
                        dataKey="value"
                        stroke="#fff"
                        strokeWidth={2}
                      >
                        {typeChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`url(#typeGradient${(index % 3) + 1})`} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          padding: '8px 12px'
                        }}
                      />
                      <Legend 
                        wrapperStyle={{ paddingTop: '20px' }}
                        iconType="circle"
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress" className="space-y-6 mt-6 flex-1 overflow-y-auto min-h-0">
            <Card className="border-2 shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">Project Progress Comparison</CardTitle>
                <CardDescription className="text-sm">Progress percentage across all projects</CardDescription>
              </CardHeader>
              <CardContent>
                {progressData.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">No project progress data available</div>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={progressData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                      <defs>
                        <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                          <stop offset="100%" stopColor="#1e40af" stopOpacity={1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                      <XAxis 
                        dataKey="name" 
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        interval={0}
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                      />
                      <YAxis 
                        domain={[0, 100]} 
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        label={{ value: 'Progress (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6b7280' } }}
                      />
                      <Tooltip 
                        formatter={(value: number) => [`${value}%`, 'Progress']}
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          padding: '8px 12px'
                        }}
                      />
                      <Legend />
                      <Bar 
                        dataKey="progress" 
                        fill="url(#progressGradient)" 
                        name="Progress %" 
                        radius={[8, 8, 0, 0]}
                        stroke="#1e40af"
                        strokeWidth={1}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Budget Tab */}
          <TabsContent value="budget" className="space-y-6 mt-6 flex-1 overflow-y-auto min-h-0">
            <Card className="border-2 shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">Project Budget Comparison</CardTitle>
                <CardDescription className="text-sm">Budget allocation across projects (in millions)</CardDescription>
              </CardHeader>
              <CardContent>
                {budgetData.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">No budget data available</div>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={budgetData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                      <defs>
                        <linearGradient id="budgetGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                          <stop offset="100%" stopColor="#059669" stopOpacity={1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                      <XAxis 
                        dataKey="name" 
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        interval={0}
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                      />
                      <YAxis 
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        label={{ value: 'Budget (₹M)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6b7280' } }}
                      />
                      <Tooltip 
                        formatter={(value: number) => `₹${value.toFixed(2)}M`}
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          padding: '8px 12px'
                        }}
                      />
                      <Legend />
                      <Bar 
                        dataKey="budget" 
                        fill="url(#budgetGradient)" 
                        name="Budget (₹M)" 
                        radius={[8, 8, 0, 0]}
                        stroke="#059669"
                        strokeWidth={1}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Timeline Tab - Gantt Chart */}
          <TabsContent value="timeline" className="space-y-6 mt-6 flex-1 overflow-y-auto min-h-0">
            {allTasks.length > 0 ? (
              <Card className="border-2 shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold">Project Timeline - Gantt Chart</CardTitle>
                  <CardDescription className="text-sm">Visual timeline of all tasks across projects</CardDescription>
                </CardHeader>
                <CardContent>
                  <GanttChart 
                    tasks={allTasks}
                    readonly={true}
                  />
                </CardContent>
              </Card>
            ) : (
              <Card className="border-2 shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold">Project Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    No tasks found. Add tasks to projects to see the timeline.
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Project Timeline Bar Chart */}
            <Card className="border-2 shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">Project Start Dates Timeline</CardTitle>
                <CardDescription className="text-sm">Projects ordered by start date</CardDescription>
              </CardHeader>
              <CardContent>
                {timelineData.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">No timeline data available</div>
                ) : (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart 
                      data={timelineData}
                      layout="vertical"
                      margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
                    >
                      <defs>
                        <linearGradient id="timelineGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#f97316" stopOpacity={1} />
                          <stop offset="100%" stopColor="#ea580c" stopOpacity={1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                      <XAxis 
                        type="number" 
                        dataKey="startDate" 
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                      />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={120}
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                      />
                      <Tooltip 
                        formatter={(value: number) => format(new Date(value), 'MMM dd, yyyy')}
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          padding: '8px 12px'
                        }}
                      />
                      <Legend />
                      <Bar 
                        dataKey="progress" 
                        fill="url(#timelineGradient)" 
                        name="Progress %" 
                        radius={[0, 8, 8, 0]}
                        stroke="#ea580c"
                        strokeWidth={1}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

