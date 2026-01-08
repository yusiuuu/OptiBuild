"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, Loader2 } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { tasksService, projectsService, projectTeamMembersService, type Project, type TeamMember } from "@/lib/data-service"
import { toast } from "sonner"
import { PhaseFolderSelector } from "@/components/tasks/phase-folder-selector"
import { DependenciesSelector } from "@/components/tasks/dependencies-selector"

interface NewTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  onTaskCreated?: () => void
}

export function NewTaskDialog({ open, onOpenChange, projectId, onTaskCreated }: NewTaskDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium")
  const [status, setStatus] = useState<"todo" | "ongoing" | "done" | "blocked">("todo")
  const [assignedTo, setAssignedTo] = useState<string>("")
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState<string>("")
  const [phaseOrder, setPhaseOrder] = useState<number>(0)
  const [durationDays, setDurationDays] = useState<number | undefined>(undefined)
  const [dependencies, setDependencies] = useState<string[]>([])

  // Project and team data
  const [project, setProject] = useState<Project | null>(null)
  const [teamMembers, setTeamMembers] = useState<Array<{ id: string; name: string }>>([])
  const [existingTasks, setExistingTasks] = useState<Array<{ id: string; title: string }>>([])

  // Load project and team members
  useEffect(() => {
    if (open && projectId) {
      const loadData = async () => {
        setIsLoading(true)
        try {
          // Load project to get dates
          const projects = await projectsService.getProjects()
          const currentProject = projects.find(p => p.id === projectId)
          setProject(currentProject || null)

          // Load project team members (handle case where there are no team members)
          try {
            const projectTeam = await projectTeamMembersService.getProjectTeamMembers(projectId)
            // Use project_team_members.id for assignment (not team_member.id)
            setTeamMembers(
              projectTeam
                .filter(ptm => ptm.team_member !== null && ptm.team_member !== undefined && ptm.id)
                .map(ptm => ({ 
                  id: ptm.id || 'unassigned', // Use project_team_members.id, fallback to 'unassigned' if empty
                  name: ptm.team_member?.name || 'Unknown',
                  team_member_id: ptm.team_member_id // Keep for reference
                }))
                .filter(member => member.id && member.id !== 'unassigned') // Filter out any invalid IDs
            )
          } catch (teamError: any) {
            // If team members can't be loaded, just set empty array
            console.warn('Could not load team members:', teamError)
            setTeamMembers([])
          }

          // Load existing tasks for dependencies
          try {
            const projectTasks = await tasksService.getTasks(projectId)
            setExistingTasks(
              projectTasks.map(task => ({
                id: task.id || '',
                title: task.title || 'Untitled Task'
              })).filter(task => task.id) // Filter out tasks without IDs
            )
          } catch (tasksError: any) {
            console.warn('Could not load existing tasks:', tasksError)
            setExistingTasks([])
          }
        } catch (error: any) {
          // Extract all possible error properties (including non-enumerable)
          const errorProps: Record<string, any> = {}
          if (error) {
            try {
              // Get all property names (including non-enumerable)
              const propNames = Object.getOwnPropertyNames(error)
              propNames.forEach(prop => {
                try {
                  errorProps[prop] = error[prop]
                } catch (e) {
                  // Skip properties that can't be accessed
                }
              })
            } catch (e) {
              // If we can't get properties, try basic access
              errorProps.message = error?.message
              errorProps.details = error?.details
              errorProps.hint = error?.hint
              errorProps.code = error?.code
            }
          }
          
          console.warn('Error loading project data:', error)
          console.warn('Error type:', typeof error, error?.constructor?.name)
          console.warn('Error properties:', errorProps)
          
          // Better error handling - extract meaningful error message
          let errorMessage = 'Failed to load project data'
          
          // Try to extract error message from various sources
          if (errorProps.message) {
            errorMessage = String(errorProps.message)
          } else if (errorProps.details) {
            errorMessage = typeof errorProps.details === 'string' 
              ? errorProps.details 
              : `Details: ${JSON.stringify(errorProps.details)}`
          } else if (errorProps.hint) {
            errorMessage = String(errorProps.hint)
          } else if (errorProps.code) {
            errorMessage = `Database error (code: ${errorProps.code}). Please check your connection and permissions.`
          } else if (typeof error === 'string') {
            errorMessage = error
          } else if (error instanceof Error) {
            errorMessage = error.message || error.toString()
          } else if (Object.keys(errorProps).length > 0) {
            // Try to create a meaningful message from available properties
            const propsStr = Object.entries(errorProps)
              .filter(([_, v]) => v != null)
              .map(([k, v]) => `${k}: ${v}`)
              .join(', ')
            if (propsStr) {
              errorMessage = `Error: ${propsStr}`
            }
          }
          
          if (errorMessage === 'Failed to load project data' && Object.keys(errorProps).length === 0) {
            errorMessage = 'Unable to load project data. Please check your database connection and try again.'
          }
          
          toast.error(errorMessage)
        } finally {
          setIsLoading(false)
        }
      }
      loadData()
    }
  }, [open, projectId])

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setPriority("medium")
    setStatus("todo")
    setAssignedTo("")
    setStartDate(undefined)
    setEndDate(undefined)
    setProgress(0)
    setPhase("")
    setPhaseOrder(0)
    setDurationDays(undefined)
    setDependencies([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!title.trim()) {
      toast.error("Task title is required")
      return
    }

    if (startDate && endDate && startDate > endDate) {
      toast.error("End date must be after start date")
      return
    }

    // Validate dates are within project dates
    if (project) {
      if (startDate && project.start_date) {
        const projectStart = new Date(project.start_date)
        if (startDate < projectStart) {
          toast.error("Task start date cannot be before project start date")
          return
        }
      }
      if (endDate && project.end_date) {
        const projectEnd = new Date(project.end_date)
        if (endDate > projectEnd) {
          toast.error("Task end date cannot be after project end date")
          return
        }
      }
    }

    // Validation: assignedTo should be a project_team_members.id (already validated by teamMembers list)
    // No additional validation needed as teamMembers only contains project team members

    setIsSubmitting(true)

    try {
      // Calculate end_date from start_date + duration if duration is provided and end_date is not set
      let finalEndDate = endDate
      if (startDate && durationDays && durationDays > 0 && !endDate) {
        finalEndDate = new Date(startDate)
        finalEndDate.setDate(finalEndDate.getDate() + durationDays)
      }

      await tasksService.createTask({
        project_id: projectId,
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        status,
        assigned_to: (assignedTo && assignedTo !== "unassigned") ? assignedTo : undefined,
        start_date: startDate?.toISOString().split('T')[0],
        end_date: finalEndDate?.toISOString().split('T')[0],
        duration_days: durationDays || undefined,
        progress,
        phase: phase || undefined,
        phase_order: phaseOrder || 0,
        dependencies: dependencies.length > 0 ? dependencies : undefined
      } as any)

      toast.success("Task created successfully!")
      resetForm()
      onOpenChange(false)
      onTaskCreated?.()
    } catch (error: any) {
      // Try multiple methods to extract error information
      let errorMessage = "Failed to create task"
      let errorDetails: any = null
      
      try {
        // Method 1: Try direct property access
        if (error?.message) {
          errorMessage = String(error.message)
          errorDetails = { source: 'error.message', value: error.message }
        } else if (error?.details) {
          errorMessage = typeof error.details === 'string' ? error.details : JSON.stringify(error.details)
          errorDetails = { source: 'error.details', value: error.details }
        } else if (error?.hint) {
          errorMessage = String(error.hint)
          errorDetails = { source: 'error.hint', value: error.hint }
        } else if (error?.code) {
          errorMessage = `Database error (code: ${error.code}). Please check your connection and permissions.`
          errorDetails = { source: 'error.code', value: error.code }
        }
        
        // Method 2: Try toString()
        if (errorMessage === "Failed to create task" && error?.toString) {
          const errorStr = error.toString()
          if (errorStr && errorStr !== '[object Object]') {
            errorMessage = errorStr
            errorDetails = { source: 'error.toString()', value: errorStr }
          }
        }
        
        // Method 3: Try String() conversion
        if (errorMessage === "Failed to create task") {
          const errorStr = String(error)
          if (errorStr && errorStr !== '[object Object]') {
            errorMessage = errorStr
            errorDetails = { source: 'String(error)', value: errorStr }
          }
        }
        
        // Method 4: Check if it's an Error instance
        if (errorMessage === "Failed to create task" && error instanceof Error) {
          errorMessage = error.message || error.name || 'An error occurred'
          errorDetails = { 
            source: 'Error instance', 
            message: error.message,
            name: error.name,
            stack: error.stack?.split('\n')[0]
          }
        }
        
        // Method 5: Try to access properties via bracket notation
        if (errorMessage === "Failed to create task") {
          const possibleProps = ['message', 'details', 'hint', 'code', 'name', 'error', 'reason']
          for (const prop of possibleProps) {
            try {
              const value = error[prop]
              if (value != null && value !== '') {
                errorMessage = typeof value === 'string' ? value : `${prop}: ${JSON.stringify(value)}`
                errorDetails = { source: `error[${prop}]`, value }
                break
              }
            } catch (e) {
              // Continue to next property
            }
          }
        }
        
      } catch (extractError) {
        console.warn('Error extracting error details:', extractError)
      }
      
      // Log everything for debugging (using console.warn to avoid triggering error overlay)
      console.warn('=== TASK CREATION ERROR ===')
      console.warn('Raw error:', error)
      console.warn('Error type:', typeof error)
      console.warn('Error constructor:', error?.constructor?.name)
      console.warn('Error instanceof Error:', error instanceof Error)
      console.warn('Error toString():', error?.toString?.())
      console.warn('String(error):', String(error))
      console.warn('Error details extracted:', errorDetails)
      console.warn('Final error message:', errorMessage)
      
      // Try to get error properties using different methods
      if (error) {
        try {
          const errorKeys = Object.keys(error)
          const errorOwnProps = Object.getOwnPropertyNames(error)
          console.warn('Error keys:', errorKeys)
          console.warn('Error own properties:', errorOwnProps)
          errorOwnProps.forEach(prop => {
            try {
              console.warn(`Error.${prop}:`, (error as any)[prop])
            } catch (e) {
              // Skip
            }
          })
        } catch (e) {
          console.warn('Could not enumerate error properties')
        }
      }
      console.warn('==========================')
      
      if (errorMessage === "Failed to create task") {
        errorMessage = 'Unable to create task. This might be due to:\n- Database connection issue\n- Missing required fields\n- Permission restrictions\n\nPlease check the console for more details.'
      }
      
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>Add a new task to this project.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Task Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter task title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter task description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority *</Label>
                <Select value={priority} onValueChange={(value: "low" | "medium" | "high") => setPriority(value)} required>
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select value={status} onValueChange={(value: "todo" | "ongoing" | "done" | "blocked") => setStatus(value)} required>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="ongoing">Ongoing</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assigned-to">Assign To</Label>
              {isLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading team members...</span>
                </div>
              ) : teamMembers.length > 0 ? (
                <Select 
                  value={assignedTo || undefined} 
                  onValueChange={(value) => setAssignedTo(value === "unassigned" ? "" : value)}
                >
                  <SelectTrigger id="assigned-to">
                    <SelectValue placeholder="Select team member (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">None (Unassigned)</SelectItem>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-sm text-muted-foreground p-2 border rounded-md">
                  No team members added to this project yet. Please add team members to the project first.
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal" id="start-date">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Select start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar 
                      mode="single" 
                      selected={startDate} 
                      onSelect={setStartDate} 
                      initialFocus
                      disabled={(date) => {
                        if (project?.start_date) {
                          return date < new Date(project.start_date)
                        }
                        return false
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal" id="end-date">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Select end date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      disabled={(date) => {
                        if (startDate && date < startDate) return true
                        if (project?.end_date && date > new Date(project.end_date)) return true
                        return false
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <PhaseFolderSelector
              value={phase}
              onChange={setPhase}
              phaseOrder={phaseOrder}
              onPhaseOrderChange={setPhaseOrder}
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (Days)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={durationDays || ""}
                  onChange={(e) => {
                    const val = e.target.value === "" ? undefined : parseInt(e.target.value)
                    setDurationDays(val)
                    // Auto-calculate end date if start date is set
                    if (val && val > 0 && startDate) {
                      const calculatedEnd = new Date(startDate)
                      calculatedEnd.setDate(calculatedEnd.getDate() + val)
                      setEndDate(calculatedEnd)
                    }
                  }}
                  placeholder="e.g., 5"
                />
                <p className="text-xs text-muted-foreground">
                  Duration in days (will auto-calculate end date if start date is set)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="progress">Progress: {progress}%</Label>
                <Input
                  id="progress"
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={(e) => setProgress(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            <DependenciesSelector
              dependencies={dependencies}
              onChange={setDependencies}
              availableTasks={existingTasks}
              disabled={isLoading}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isLoading}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Task"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

