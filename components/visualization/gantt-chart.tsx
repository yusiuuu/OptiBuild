"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Calendar, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react'
import { Task } from '@/lib/data-service'
import { format, addDays, differenceInDays, startOfWeek, endOfWeek } from 'date-fns'

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
  const [zoomLevel, setZoomLevel] = useState(1)
  const [selectedTask, setSelectedTask] = useState<string | null>(null)
  const [chartStartDate, setChartStartDate] = useState<Date>(startDate || new Date())
  const [chartEndDate, setChartEndDate] = useState<Date>(endDate || addDays(new Date(), 30))

  // Process tasks for Gantt chart display
  const processedTasks: GanttTask[] = tasks.map(task => {
    const taskStartDate = task.start_date ? new Date(task.start_date) : chartStartDate
    const taskEndDate = task.end_date ? new Date(task.end_date) : addDays(taskStartDate, task.duration_days || 1)
    const duration = differenceInDays(taskEndDate, taskStartDate) + 1

    return {
      ...task,
      startDate: taskStartDate,
      endDate: taskEndDate,
      duration,
      progress: task.progress || 0,
      dependencies: task.dependencies || []
    }
  })

  // Calculate chart dimensions
  const totalDays = differenceInDays(chartEndDate, chartStartDate) + 1
  const dayWidth = Math.max(30, 50 * zoomLevel)
  const chartWidth = totalDays * dayWidth

  // Generate date headers
  const generateDateHeaders = () => {
    const headers = []
    let currentDate = new Date(chartStartDate)

    while (currentDate <= chartEndDate) {
      const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6
      const isToday = format(currentDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
      
      headers.push(
        <div
          key={currentDate.toISOString()}
          className={`flex flex-col items-center p-2 border-r border-gray-200 min-w-[${dayWidth}px] ${
            isWeekend ? 'bg-gray-50' : 'bg-white'
          } ${isToday ? 'bg-blue-50 border-blue-200' : ''}`}
          style={{ minWidth: `${dayWidth}px` }}
        >
          <div className={`text-xs font-medium ${isToday ? 'text-blue-600' : 'text-gray-600'}`}>
            {format(currentDate, 'MMM')}
          </div>
          <div className={`text-lg font-bold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
            {format(currentDate, 'd')}
          </div>
          <div className="text-xs text-gray-500">
            {format(currentDate, 'EEE')}
          </div>
        </div>
      )
      
      currentDate = addDays(currentDate, 1)
    }

    return headers
  }

  // Calculate task position and width
  const getTaskPosition = (task: GanttTask) => {
    const daysFromStart = differenceInDays(task.startDate, chartStartDate)
    const left = daysFromStart * dayWidth
    const width = task.duration * dayWidth - 2 // -2 for border
    
    return { left, width }
  }

  // Get task status color
  const getTaskStatusColor = (status: string, progress: number) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-500'
      case 'in_progress':
        return 'bg-blue-500'
      case 'pending':
        return 'bg-gray-400'
      case 'delayed':
        return 'bg-red-500'
      case 'on_hold':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-400'
    }
  }

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'border-red-500'
      case 'medium':
        return 'border-yellow-500'
      case 'low':
        return 'border-green-500'
      default:
        return 'border-gray-300'
    }
  }

  // Handle task click
  const handleTaskClick = (task: GanttTask) => {
    if (!readonly) {
      setSelectedTask(selectedTask === task.id ? null : task.id || null)
    }
  }

  // Handle task drag (simplified)
  const handleTaskDrag = (task: GanttTask, newStartDay: number) => {
    if (readonly || !onTaskUpdate) return

    const newStartDate = addDays(chartStartDate, newStartDay)
    const newEndDate = addDays(newStartDate, task.duration - 1)

    onTaskUpdate(task.id || '', {
      start_date: newStartDate.toISOString().split('T')[0],
      end_date: newEndDate.toISOString().split('T')[0]
    })
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

  const zoomChart = (direction: 'in' | 'out') => {
    const newZoom = direction === 'in' ? 
      Math.min(zoomLevel + 0.2, 2) : 
      Math.max(zoomLevel - 0.2, 0.5)
    setZoomLevel(newZoom)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Project Timeline
          </CardTitle>
          
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

            {/* Zoom Controls */}
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={() => zoomChart('out')}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => zoomChart('in')}>
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-full">
            {/* Date Headers */}
            <div className="flex border-b border-gray-200 mb-4">
              <div className="w-64 p-4 border-r border-gray-200 bg-gray-50 font-medium">
                Task Name
              </div>
              <div className="flex" style={{ width: `${chartWidth}px` }}>
                {generateDateHeaders()}
              </div>
            </div>

            {/* Task Rows */}
            <div className="space-y-2">
              {processedTasks.map((task, index) => {
                const { left, width } = getTaskPosition(task)
                const isSelected = selectedTask === task.id

                return (
                  <div key={task.id} className="flex items-center h-16 border-b border-gray-100">
                    {/* Task Info */}
                    <div className="w-64 p-4 border-r border-gray-200 bg-white">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {task.name}
                                </p>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="max-w-xs">
                                  <p className="font-medium">{task.name}</p>
                                  <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                                  <div className="flex gap-2 mt-2">
                                    <Badge variant="outline" className={getPriorityColor(task.priority)}>
                                      {task.priority}
                                    </Badge>
                                    <Badge variant="secondary">
                                      {task.status}
                                    </Badge>
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <p className="text-xs text-gray-500 mt-1">
                            {task.assigned_to || 'Unassigned'}
                          </p>
                        </div>
                        <div className="ml-2">
                          <Badge variant="outline" className="text-xs">
                            {task.progress}%
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Task Bar */}
                    <div className="relative flex-1 h-full" style={{ width: `${chartWidth}px` }}>
                      <div
                        className={`absolute top-2 h-8 rounded border-2 cursor-pointer transition-all ${
                          getTaskStatusColor(task.status, task.progress)
                        } ${isSelected ? 'ring-2 ring-blue-500' : ''} ${
                          readonly ? 'cursor-default' : 'hover:opacity-80'
                        }`}
                        style={{
                          left: `${left}px`,
                          width: `${width}px`
                        }}
                        onClick={() => handleTaskClick(task)}
                      >
                        {/* Progress Bar */}
                        <div
                          className="h-full bg-white bg-opacity-30 rounded-l"
                          style={{ width: `${task.progress}%` }}
                        />
                        
                        {/* Task Label */}
                        <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-medium">
                          {task.duration > 3 && task.name}
                        </div>
                      </div>

                      {/* Dependencies */}
                      {task.dependencies.map((depId, depIndex) => {
                        const depTask = processedTasks.find(t => t.id === depId)
                        if (!depTask) return null

                        const depEndDate = depTask.endDate
                        const taskStartDate = task.startDate
                        const depEndPosition = differenceInDays(depEndDate, chartStartDate) * dayWidth
                        const taskStartPosition = differenceInDays(taskStartDate, chartStartDate) * dayWidth

                        return (
                          <svg
                            key={depIndex}
                            className="absolute top-0 left-0 pointer-events-none"
                            style={{ width: `${chartWidth}px`, height: '100%' }}
                          >
                            <defs>
                              <marker
                                id={`arrowhead-${task.id}-${depIndex}`}
                                markerWidth="10"
                                markerHeight="7"
                                refX="9"
                                refY="3.5"
                                orient="auto"
                              >
                                <polygon
                                  points="0 0, 10 3.5, 0 7"
                                  fill="#6b7280"
                                />
                              </marker>
                            </defs>
                            <line
                              x1={depEndPosition + dayWidth - 2}
                              y1={index * 64 + 32}
                              x2={taskStartPosition}
                              y2={index * 64 + 32}
                              stroke="#6b7280"
                              strokeWidth="2"
                              markerEnd={`url(#arrowhead-${task.id}-${depIndex})`}
                            />
                          </svg>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Legend */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Legend</h4>
              <div className="flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span>Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span>In Progress</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-400 rounded"></div>
                  <span>Pending</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span>Delayed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                  <span>On Hold</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
