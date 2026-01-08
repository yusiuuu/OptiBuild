"use client"

import { useState, useEffect } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Search,
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock4,
  ArrowLeft,
  Loader2,
  Filter,
  Calendar as CalendarIcon,
  TrendingUp,
  CalendarDays,
  FolderTree,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO, isAfter, isBefore } from "date-fns"
import { NewTaskDialog } from "@/components/schedule/new-task-dialog"
import { TaskDetailsDialog } from "@/components/schedule/task-details-dialog"
import { TaskFolderTree } from "@/components/tasks/task-folder-tree"
import Link from "next/link"
import { motion } from "framer-motion"
import { projectsService, tasksService } from "@/lib/data-service"

interface Task {
  id: string
  title: string
  name?: string
  project_id: string
  project?: {
    id: string
    name: string
  }
  projectName?: string
  assigned_to?: string
  assigned_team_member?: {
    id: string
    name: string
  }
  assignedTo?: string
  start_date?: string
  end_date?: string
  startDate?: Date
  endDate?: Date
  status: string
  priority: string
  progress?: number
  completion?: number
  description?: string
}

export default function SchedulePage() {
  const [date, setDate] = useState<Date>(new Date())
  const [view, setView] = useState<"day" | "week" | "month" | "list" | "folders">("list")
  const [filter, setFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isNewTaskDialogOpen, setIsNewTaskDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [isTaskDetailsOpen, setIsTaskDetailsOpen] = useState(false)
  
  // Data states
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  // Fetch all tasks from database
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        
        // Fetch all projects
        const allProjects = await projectsService.getProjects()
        setProjects(allProjects)
        
        // Fetch tasks for all projects
        const tasksPromises = allProjects.map(async (project: any) => {
          try {
            const projectTasks = await tasksService.getTasks(project.id)
            // Map tasks to include project information
            return projectTasks.map((task: any) => ({
              ...task,
              projectName: project.name,
              project: { id: project.id, name: project.name },
              title: task.title || task.name || "Untitled Task",
              startDate: task.start_date ? parseISO(task.start_date) : undefined,
              endDate: task.end_date ? parseISO(task.end_date) : undefined,
              assignedTo: task.assigned_team_member?.name || "Unassigned",
              completion: task.progress || 0,
              status: task.status || "not-started",
              priority: task.priority || "medium",
            }))
          } catch (error) {
            console.error(`Error loading tasks for project ${project.id}:`, error)
            return []
          }
        })
        
        const tasksArrays = await Promise.all(tasksPromises)
        const allTasks = tasksArrays.flat()
        setTasks(allTasks)
      } catch (error) {
        console.error("Error loading schedule data:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadData()
  }, [refreshKey])

  // Handle task creation/update refresh
  const handleTaskChange = () => {
    setRefreshKey(prev => prev + 1)
  }

  // Filter tasks based on current filter and search query
  const filteredTasks = tasks.filter((task) => {
    const taskStartDate = task.startDate || (task.start_date ? parseISO(task.start_date) : null)
    const taskEndDate = task.endDate || (task.end_date ? parseISO(task.end_date) : null)
    const today = new Date()
    
    const matchesFilter =
      filter === "all" ||
      filter === task.status ||
      (filter === "today" && taskStartDate && isSameDay(taskStartDate, today)) ||
      (filter === "upcoming" && taskStartDate && isAfter(taskStartDate, today)) ||
      (filter === "delayed" && taskEndDate && isBefore(taskEndDate, today) && task.status !== "completed")

    const matchesSearch =
      !searchQuery ||
      task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.projectName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.assignedTo?.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesFilter && matchesSearch
  })

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return (
          <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
            <CheckCircle2 className="mr-1 h-3 w-3" /> Completed
          </Badge>
        )
      case "in-progress":
      case "in_progress":
        return (
          <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
            <Clock className="mr-1 h-3 w-3" /> In Progress
          </Badge>
        )
      case "not-started":
      case "not_started":
      case "pending":
        return (
          <Badge className="bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0">
            <Clock4 className="mr-1 h-3 w-3" /> Not Started
          </Badge>
        )
      case "delayed":
        return (
          <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0">
            <AlertTriangle className="mr-1 h-3 w-3" /> Delayed
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gradient-to-r from-gray-400 to-gray-500 text-white border-0">
            {status || "Unknown"}
          </Badge>
        )
    }
  }

  const getPriorityBadge = (priority: string) => {
    const priorityLower = priority?.toLowerCase() || "medium"
    return (
      <Badge
        variant="outline"
        className={
          priorityLower === "high"
            ? "border-red-500 text-red-700 bg-red-50"
            : priorityLower === "medium"
              ? "border-amber-500 text-amber-700 bg-amber-50"
              : "border-blue-500 text-blue-700 bg-blue-50"
        }
      >
        {priority?.charAt(0).toUpperCase() + priority?.slice(1) || "Medium"}
      </Badge>
    )
  }

  const handleTaskClick = (task: any) => {
    setSelectedTask(task)
    setIsTaskDetailsOpen(true)
  }

  // Generate week view data
  const weekStart = startOfWeek(date)
  const weekEnd = endOfWeek(date)
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

  // Statistics
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.status === "completed").length
  const inProgressTasks = tasks.filter(t => t.status === "in-progress" || t.status === "in_progress").length
  const delayedTasks = tasks.filter(t => {
    const endDate = t.endDate || (t.end_date ? parseISO(t.end_date) : null)
    return endDate && isBefore(endDate, new Date()) && t.status !== "completed"
  }).length

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Schedule
              </h2>
              <p className="text-sm text-muted-foreground mt-1">Manage and track all project tasks</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setIsNewTaskDialogOpen(true)}
              className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </div>
        </motion.div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-2 shadow-lg bg-gradient-to-br from-background to-muted/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalTasks}</div>
                <p className="text-xs text-muted-foreground mt-1">All scheduled tasks</p>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-2 shadow-lg bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{completedTasks}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}% completion rate
                </p>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-2 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  In Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{inProgressTasks}</div>
                <p className="text-xs text-muted-foreground mt-1">Currently active tasks</p>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-2 shadow-lg bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/20 dark:to-red-900/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  Delayed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{delayedTasks}</div>
                <p className="text-xs text-muted-foreground mt-1">Requires attention</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        >
          <div className="flex items-center space-x-2 flex-wrap">
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                if (view === "day") {
                  setDate(addDays(date, -1))
                } else if (view === "week") {
                  setDate(addDays(date, -7))
                } else if (view === "month") {
                  setDate(new Date(date.getFullYear(), date.getMonth() - 1, 1))
                }
              }}
              className="hover:bg-muted"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => setDate(new Date())}
              className="hover:bg-muted"
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                if (view === "day") {
                  setDate(addDays(date, 1))
                } else if (view === "week") {
                  setDate(addDays(date, 7))
                } else if (view === "month") {
                  setDate(new Date(date.getFullYear(), date.getMonth() + 1, 1))
                }
              }}
              className="hover:bg-muted"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-semibold ml-2">
              {view === "day" && format(date, "d MMMM yyyy")}
              {view === "week" && `${format(weekStart, "d MMM")} - ${format(weekEnd, "d MMM yyyy")}`}
              {view === "month" && format(date, "MMMM yyyy")}
              {view === "list" && "All Tasks"}
              {view === "folders" && "Tasks by Phase/Folder"}
            </h2>
          </div>

          <div className="flex items-center space-x-2 flex-wrap gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-full md:w-[200px]"
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tasks</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="delayed">Delayed</SelectItem>
                <SelectItem value="not-started">Not Started</SelectItem>
              </SelectContent>
            </Select>
            <Tabs value={view} onValueChange={(v) => setView(v as any)}>
              <TabsList className="bg-muted/50">
                <TabsTrigger value="day" className="data-[state=active]:bg-background">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  Day
                </TabsTrigger>
                <TabsTrigger value="week" className="data-[state=active]:bg-background">
                  <CalendarDays className="h-4 w-4 mr-1" />
                  Week
                </TabsTrigger>
                <TabsTrigger value="month" className="data-[state=active]:bg-background">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  Month
                </TabsTrigger>
                <TabsTrigger value="list" className="data-[state=active]:bg-background">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  List
                </TabsTrigger>
                <TabsTrigger value="folders" className="data-[state=active]:bg-background">
                  <FolderTree className="h-4 w-4 mr-1" />
                  Folders
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </motion.div>

        {/* Calendar/Schedule View */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="border-2 shadow-lg bg-gradient-to-br from-background to-muted/20">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="h-[400px] flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Loading schedule data...</p>
                  </div>
                </div>
              ) : view === "day" ? (
                <div className="p-6">
                  <h3 className="font-semibold mb-4 text-lg">Tasks for {format(date, "EEEE, MMMM d, yyyy")}</h3>
                  <div className="space-y-3">
                    {filteredTasks
                      .filter((task) => {
                        const taskStartDate = task.startDate || (task.start_date ? parseISO(task.start_date) : null)
                        const taskEndDate = task.endDate || (task.end_date ? parseISO(task.end_date) : null)
                        if (!taskStartDate || !taskEndDate) return false
                        return (
                          isSameDay(taskStartDate, date) ||
                          isSameDay(taskEndDate, date) ||
                          (taskStartDate <= date && taskEndDate >= date)
                        )
                      })
                      .map((task) => (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="p-4 border-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-all hover:shadow-md"
                          onClick={() => handleTaskClick(task)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-semibold text-base">{task.title}</h4>
                              <p className="text-sm text-muted-foreground mt-1">{task.projectName}</p>
                            </div>
                            {getStatusBadge(task.status)}
                          </div>
                          <div className="mt-3 flex items-center justify-between">
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Users className="mr-1 h-4 w-4" />
                              {task.assignedTo}
                            </div>
                            {task.startDate && task.endDate && (
                              <div className="text-sm text-muted-foreground">
                                <Clock className="inline mr-1 h-4 w-4" />
                                {format(task.startDate, "MMM d")} - {format(task.endDate, "MMM d")}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    {filteredTasks.filter((task) => {
                      const taskStartDate = task.startDate || (task.start_date ? parseISO(task.start_date) : null)
                      const taskEndDate = task.endDate || (task.end_date ? parseISO(task.end_date) : null)
                      if (!taskStartDate || !taskEndDate) return false
                      return (
                        isSameDay(taskStartDate, date) ||
                        isSameDay(taskEndDate, date) ||
                        (taskStartDate <= date && taskEndDate >= date)
                      )
                    }).length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No tasks scheduled for this day</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : view === "week" ? (
                <div className="p-6">
                  <div className="grid grid-cols-7 gap-2">
                    {weekDays.map((day, index) => (
                      <div key={index} className="border-2 rounded-lg overflow-hidden">
                        <div
                          className={`p-3 text-center font-semibold ${
                            isSameDay(day, new Date())
                              ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground"
                              : "bg-muted/50"
                          }`}
                        >
                          <div className="text-xs uppercase">{format(day, "EEE")}</div>
                          <div className="text-lg">{format(day, "d")}</div>
                        </div>
                        <div className="p-2 h-[300px] overflow-y-auto space-y-2">
                          {filteredTasks
                            .filter((task) => {
                              const taskStartDate = task.startDate || (task.start_date ? parseISO(task.start_date) : null)
                              const taskEndDate = task.endDate || (task.end_date ? parseISO(task.end_date) : null)
                              if (!taskStartDate || !taskEndDate) return false
                              return (
                                isSameDay(taskStartDate, day) ||
                                isSameDay(taskEndDate, day) ||
                                (taskStartDate <= day && taskEndDate >= day)
                              )
                            })
                            .map((task) => (
                              <div
                                key={task.id}
                                className={`p-2 rounded-md text-xs cursor-pointer transition-all hover:shadow-md ${
                                  task.status === "completed"
                                    ? "bg-gradient-to-r from-green-100 to-green-50 border-l-4 border-green-500 dark:from-green-950/30 dark:to-green-900/20"
                                    : task.status === "in-progress" || task.status === "in_progress"
                                      ? "bg-gradient-to-r from-blue-100 to-blue-50 border-l-4 border-blue-500 dark:from-blue-950/30 dark:to-blue-900/20"
                                      : task.status === "delayed"
                                        ? "bg-gradient-to-r from-red-100 to-red-50 border-l-4 border-red-500 dark:from-red-950/30 dark:to-red-900/20"
                                        : "bg-gradient-to-r from-gray-100 to-gray-50 border-l-4 border-gray-500 dark:from-gray-950/30 dark:to-gray-900/20"
                                }`}
                                onClick={() => handleTaskClick(task)}
                              >
                                <div className="font-semibold truncate">{task.title}</div>
                                <div className="text-xs text-muted-foreground truncate mt-1">{task.projectName}</div>
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : view === "month" ? (
                <div className="p-6">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(date) => date && setDate(date)}
                    className="rounded-md border-0"
                    classNames={{
                      day_today: "bg-primary text-primary-foreground font-bold",
                    }}
                  />
                </div>
              ) : view === "folders" ? (
                <div className="p-6">
                  <TaskFolderTree
                    tasks={filteredTasks}
                    onTaskClick={handleTaskClick}
                    renderTask={(task) => (
                      <div className="flex items-center gap-2 w-full">
                        <span className="font-medium truncate flex-1">{task.title}</span>
                        <Badge
                          variant={
                            task.status === 'done' ? 'default' :
                            task.status === 'ongoing' ? 'secondary' :
                            task.status === 'blocked' ? 'destructive' :
                            'outline'
                          }
                          className="text-xs"
                        >
                          {task.status}
                        </Badge>
                        <Badge
                          variant={
                            task.priority === 'high' ? 'destructive' :
                            task.priority === 'medium' ? 'default' :
                            'secondary'
                          }
                          className="text-xs"
                        >
                          {task.priority}
                        </Badge>
                        {task.projectName && (
                          <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                            {task.projectName}
                          </span>
                        )}
                      </div>
                    )}
                  />
                </div>
              ) : (
                <div className="p-6">
                  <div className="rounded-lg border-2 overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead className="font-semibold">Task</TableHead>
                          <TableHead className="font-semibold">Project</TableHead>
                          <TableHead className="font-semibold">Assigned To</TableHead>
                          <TableHead className="font-semibold">Timeline</TableHead>
                          <TableHead className="font-semibold">Status</TableHead>
                          <TableHead className="font-semibold">Priority</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTasks.map((task) => (
                          <TableRow
                            key={task.id}
                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => handleTaskClick(task)}
                          >
                            <TableCell className="font-medium">{task.title}</TableCell>
                            <TableCell>{task.projectName || "Unknown Project"}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                {task.assignedTo}
                              </div>
                            </TableCell>
                            <TableCell>
                              {task.startDate && task.endDate ? (
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  {format(task.startDate, "dd MMM")} - {format(task.endDate, "dd MMM")}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">No dates</span>
                              )}
                            </TableCell>
                            <TableCell>{getStatusBadge(task.status)}</TableCell>
                            <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                          </TableRow>
                        ))}
                        {filteredTasks.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-12">
                              <div className="flex flex-col items-center gap-4">
                                <CalendarIcon className="h-12 w-12 text-muted-foreground opacity-50" />
                                <div>
                                  <p className="text-muted-foreground font-medium">No tasks found</p>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {searchQuery || filter !== "all"
                                      ? "Try adjusting your search or filter criteria"
                                      : "Create a new task to get started"}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Dialogs */}
        <NewTaskDialog
          open={isNewTaskDialogOpen}
          onOpenChange={(open) => {
            setIsNewTaskDialogOpen(open)
            if (!open) handleTaskChange()
          }}
        />

        {selectedTask && (
          <TaskDetailsDialog
            open={isTaskDetailsOpen}
            onOpenChange={(open) => {
              setIsTaskDetailsOpen(open)
              if (!open) {
                setSelectedTask(null)
                handleTaskChange()
              }
            }}
            task={selectedTask}
          />
        )}
      </div>
    </div>
  )
}
