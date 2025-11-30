"use client"

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Filter } from 'lucide-react'
import { Task } from '@/lib/data-service'
import { format, addDays, differenceInDays, startOfWeek, endOfWeek, parseISO } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, LabelList } from 'recharts'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'

interface GanttChartProps {
  tasks: Task[]
  startDate?: Date
  endDate?: Date
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void
  readonly?: boolean
}

interface GanttTask extends Task {
  startDate: Date
  endDate: Date
  duration: number
  progress: number
  dependencies: string[]
}

export function GanttChart({ tasks, startDate, endDate, onTaskUpdate, readonly = false }: GanttChartProps) {
  const [currentView, setCurrentView] = useState<'day' | 'week' | 'month'>('week')
  const [selectedTask, setSelectedTask] = useState<string | null>(null)
  const [chartStartDate, setChartStartDate] = useState<Date>(startDate || new Date())
  const [chartEndDate, setChartEndDate] = useState<Date>(endDate || addDays(new Date(), 30))

  // Process tasks for Gantt chart display
  const processedTasks: GanttTask[] = useMemo(() => {
    return tasks.map(task => {
      const taskStartDate = task.start_date ? new Date(task.start_date) : chartStartDate
      const taskEndDate = task.end_date ? new Date(task.end_date) : addDays(taskStartDate, task.duration_days || 1)
      const duration = differenceInDays(taskEndDate, taskStartDate) + 1

      return {
        ...task,
        startDate: taskStartDate,
        endDate: taskEndDate,
        duration,
        progress: task.progress || 0,
        dependencies: (task as any).dependencies || []
      }
    })
  }, [tasks, chartStartDate])

  // Prepare chart data for professional bar chart
  const chartData = useMemo(() => {
    const sortedTasks = [...processedTasks].sort((a, b) => {
      // Sort by start date, then by name
      const dateDiff = a.startDate.getTime() - b.startDate.getTime()
      if (dateDiff !== 0) return dateDiff
      return (a.title || a.name || '').localeCompare(b.title || b.name || '')
    })

    return sortedTasks.map((task, index) => {
      const daysFromStart = Math.max(0, differenceInDays(task.startDate, chartStartDate))
      const duration = Math.max(1, task.duration)
      const progressDays = Math.floor((duration * task.progress) / 100)
      const remainingDays = Math.max(0, duration - progressDays)
      
      return {
        taskName: (task.title || task.name || `Task ${index + 1}`).substring(0, 35),
        fullTaskName: task.title || task.name || `Task ${index + 1}`,
        startDay: daysFromStart,
        duration: duration,
        progressDays: progressDays,
        remainingDays: remainingDays,
        progress: task.progress,
        status: task.status,
        priority: task.priority,
        taskId: task.id,
        description: task.description,
        assignedTo: task.assigned_to,
        endDay: daysFromStart + duration
      }
    })
  }, [processedTasks, chartStartDate])

  // Chart configuration
  const chartConfig = {
    duration: {
      label: "Duration",
      color: "hsl(var(--chart-1))",
    },
    progress: {
      label: "Progress",
      color: "hsl(var(--chart-2))",
    },
    remaining: {
      label: "Remaining",
      color: "hsl(var(--chart-3))",
    },
  } satisfies ChartConfig

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'done':
      case 'completed':
        return 'hsl(142, 76%, 36%)' // green
      case 'ongoing':
      case 'in_progress':
        return 'hsl(217, 91%, 60%)' // blue
      case 'todo':
      case 'pending':
        return 'hsl(215, 16%, 47%)' // gray
      case 'blocked':
      case 'delayed':
        return 'hsl(0, 84%, 60%)' // red
      default:
        return 'hsl(215, 16%, 47%)' // gray
    }
  }

  // Navigation functions
  const navigateChart = (direction: 'prev' | 'next') => {
    const daysToMove = currentView === 'day' ? 1 : currentView === 'week' ? 7 : 30
    
    if (direction === 'prev') {
      setChartStartDate(addDays(chartStartDate, -daysToMove))
      setChartEndDate(addDays(chartEndDate, -daysToMove))
    } else {
      setChartStartDate(addDays(chartStartDate, daysToMove))
      setChartEndDate(addDays(chartEndDate, daysToMove))
    }
  }

  // Convert data based on view type (Day/Week/Month)
  const viewAdjustedData = useMemo(() => {
    return chartData.map(data => {
      let adjustedStart: number
      let adjustedDuration: number
      let adjustedProgress: number
      let adjustedRemaining: number

      if (currentView === 'day') {
        // Day view: show actual days
        adjustedStart = data.startDay
        adjustedDuration = data.duration
        adjustedProgress = data.progressDays
        adjustedRemaining = data.remainingDays
      } else if (currentView === 'week') {
        // Week view: convert to weeks
        adjustedStart = Math.floor(data.startDay / 7)
        adjustedDuration = Math.ceil(data.duration / 7)
        adjustedProgress = Math.ceil(data.progressDays / 7)
        adjustedRemaining = Math.ceil(data.remainingDays / 7)
      } else {
        // Month view: convert to months (approximate)
        adjustedStart = Math.floor(data.startDay / 30)
        adjustedDuration = Math.ceil(data.duration / 30)
        adjustedProgress = Math.ceil(data.progressDays / 30)
        adjustedRemaining = Math.ceil(data.remainingDays / 30)
      }

      return {
        ...data,
        adjustedStart,
        adjustedDuration: Math.max(1, adjustedDuration),
        adjustedProgress: Math.max(0, adjustedProgress),
        adjustedRemaining: Math.max(0, adjustedRemaining)
      }
    })
  }, [chartData, currentView])

  // Calculate max duration for X-axis based on view type
  const maxDuration = useMemo(() => {
    if (viewAdjustedData.length === 0) {
      // Default based on view
      return currentView === 'day' ? 30 : currentView === 'week' ? 12 : 12
    }
    const maxEnd = Math.max(...viewAdjustedData.map(d => d.adjustedStart + d.adjustedDuration))
    // Round up to next interval based on view
    return Math.ceil(maxEnd) + 1
  }, [viewAdjustedData, currentView])

  // X-axis label formatter based on view
  const xAxisFormatter = (value: number) => {
    if (currentView === 'day') {
      return value === 0 ? 'Start' : value % 5 === 0 || value === maxDuration ? `Day ${value}` : ''
    } else if (currentView === 'week') {
      return value === 0 ? 'Start' : `Week ${value}`
    } else {
      return value === 0 ? 'Start' : `Month ${value}`
    }
  }

  // X-axis label text
  const xAxisLabel = currentView === 'day' 
    ? 'Timeline (Days from Project Start)'
    : currentView === 'week'
    ? 'Timeline (Weeks from Project Start)'
    : 'Timeline (Months from Project Start)'

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Project Timeline
            </CardTitle>
            <CardDescription className="mt-1">
              {format(chartStartDate, 'MMM d, yyyy')} - {format(chartEndDate, 'MMM d, yyyy')}
            </CardDescription>
          </div>
          
          {/* Chart Controls */}
          <div className="flex items-center gap-2">
            {/* View Type Selector */}
            <div className="flex border rounded-md">
              <Button
                variant={currentView === 'day' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentView('day')}
              >
                Day
              </Button>
              <Button
                variant={currentView === 'week' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentView('week')}
              >
                Week
              </Button>
              <Button
                variant={currentView === 'month' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentView('month')}
              >
                Month
              </Button>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={() => navigateChart('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigateChart('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No tasks available to display</p>
            </div>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[600px] w-full">
            <BarChart
              data={viewAdjustedData}
              layout="vertical"
              margin={{ top: 20, right: 120, left: 200, bottom: 60 }}
              barCategoryGap="20%"
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                horizontal={true} 
                vertical={true} 
                stroke="hsl(var(--border))" 
                opacity={0.2} 
              />
              <XAxis 
                type="number" 
                domain={[0, maxDuration]}
                tickFormatter={xAxisFormatter}
                label={{ 
                  value: xAxisLabel, 
                  position: 'insideBottom', 
                  offset: -15,
                  style: { textAnchor: 'middle', fontSize: 12, fontWeight: 500 }
                }}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                type="category" 
                dataKey="taskName"
                width={190}
                tickLine={false}
                axisLine={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
                tick={{ fontSize: 12, fill: 'hsl(var(--foreground))', fontWeight: 500 }}
                interval={0}
              />
              <ChartTooltip
                cursor={{ fill: 'hsl(var(--muted))', opacity: 0.15 }}
                content={({ active, payload }) => {
                  if (!active || !payload || !payload[0]) return null
                  const data = payload[0].payload
                  const durationLabel = currentView === 'day' 
                    ? `${data.duration} days`
                    : currentView === 'week'
                    ? `${data.duration} weeks (${data.duration * 7} days)`
                    : `${data.duration} months (${data.duration * 30} days)`
                  
                  const startLabel = currentView === 'day'
                    ? `Day ${data.startDay}`
                    : currentView === 'week'
                    ? `Week ${data.adjustedStart} (Day ${data.startDay})`
                    : `Month ${data.adjustedStart} (Day ${data.startDay})`
                  
                  const endLabel = currentView === 'day'
                    ? `Day ${data.endDay}`
                    : currentView === 'week'
                    ? `Week ${data.adjustedStart + data.adjustedDuration} (Day ${data.endDay})`
                    : `Month ${data.adjustedStart + data.adjustedDuration} (Day ${data.endDay})`

                  return (
                    <div className="rounded-lg border bg-background/95 backdrop-blur-sm p-4 shadow-xl">
                      <div className="grid gap-3">
                        <div className="font-semibold text-base border-b pb-2">{data.fullTaskName}</div>
                        {data.description && (
                          <p className="text-sm text-muted-foreground leading-relaxed">{data.description}</p>
                        )}
                        <div className="grid gap-2.5 text-sm">
                          <div className="flex justify-between items-center gap-6">
                            <span className="text-muted-foreground">Status:</span>
                            <Badge variant="outline" className="capitalize font-medium">{data.status}</Badge>
                          </div>
                          <div className="flex justify-between items-center gap-6">
                            <span className="text-muted-foreground">Progress:</span>
                            <span className="font-semibold">{data.progress}%</span>
                          </div>
                          <div className="flex justify-between items-center gap-6">
                            <span className="text-muted-foreground">Duration:</span>
                            <span className="font-semibold">{durationLabel}</span>
                          </div>
                          <div className="flex justify-between items-center gap-6">
                            <span className="text-muted-foreground">Start:</span>
                            <span className="font-medium">{startLabel}</span>
                          </div>
                          <div className="flex justify-between items-center gap-6">
                            <span className="text-muted-foreground">End:</span>
                            <span className="font-medium">{endLabel}</span>
                          </div>
                          {data.assignedTo && (
                            <div className="flex justify-between items-center gap-6">
                              <span className="text-muted-foreground">Assigned:</span>
                              <span className="font-medium">{data.assignedTo}</span>
                            </div>
                          )}
                          {data.priority && (
                            <div className="flex justify-between items-center gap-6">
                              <span className="text-muted-foreground">Priority:</span>
                              <Badge variant="outline" className="capitalize">{data.priority}</Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                }}
              />
              
              {/* Background positioning bar (invisible, positions the task bar at adjustedStart) */}
              <Bar
                dataKey="adjustedStart"
                stackId="gantt"
                fill="transparent"
                isAnimationActive={false}
              />
              
              {/* Progress Bar (Completed portion) - positioned after adjustedStart */}
              <Bar
                dataKey="adjustedProgress"
                stackId="gantt"
                fill="var(--color-progress)"
                radius={[0, 6, 6, 0]}
                onClick={(data) => {
                  if (!readonly && data?.taskId) {
                    setSelectedTask(selectedTask === data.taskId ? null : data.taskId)
                  }
                }}
              >
                {viewAdjustedData.map((entry, index) => (
                  <Cell 
                    key={`progress-${index}`} 
                    fill={getStatusColor(entry.status)}
                    style={{ 
                      cursor: readonly ? 'default' : 'pointer',
                      transition: 'opacity 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (!readonly) {
                        e.currentTarget.style.opacity = '0.8'
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '1'
                    }}
                  />
                ))}
              </Bar>
              
              {/* Remaining Bar (lighter portion) */}
              <Bar
                dataKey="adjustedRemaining"
                stackId="gantt"
                fill="var(--color-remaining)"
                radius={[0, 0, 0, 0]}
                onClick={(data) => {
                  if (!readonly && data?.taskId) {
                    setSelectedTask(selectedTask === data.taskId ? null : data.taskId)
                  }
                }}
              >
                {viewAdjustedData.map((entry, index) => (
                  <Cell 
                    key={`remaining-${index}`} 
                    fill={getStatusColor(entry.status)}
                    style={{ 
                      cursor: readonly ? 'default' : 'pointer', 
                      opacity: 0.3,
                      transition: 'opacity 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (!readonly) {
                        e.currentTarget.style.opacity = '0.5'
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '0.3'
                    }}
                  />
                ))}
              </Bar>
              
              {/* Duration Label on the right */}
              <Bar
                dataKey="adjustedDuration"
                stackId="gantt"
                fill="transparent"
                isAnimationActive={false}
              >
                <LabelList
                  dataKey="adjustedDuration"
                  position="right"
                  offset={25}
                  className="fill-foreground"
                  fontSize={11}
                  fontWeight={600}
                  formatter={(value: number) => {
                    if (currentView === 'day') {
                      return `${value}d`
                    } else if (currentView === 'week') {
                      return `${value}w`
                    } else {
                      return `${value}m`
                    }
                  }}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        )}

        {/* Legend */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-medium">Status Legend</h4>
          </div>
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(142, 76%, 36%)' }}></div>
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(217, 91%, 60%)' }}></div>
              <span>In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(215, 16%, 47%)' }}></div>
              <span>Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(0, 84%, 60%)' }}></div>
              <span>Blocked/Delayed</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
            <p>• Darker portion shows completed progress, lighter portion shows remaining work</p>
            <p>• Click on bars to select tasks (if editing is enabled)</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
