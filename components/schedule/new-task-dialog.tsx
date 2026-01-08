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
import { projectsService, tasksService, projectTeamMembersService } from "@/lib/data-service"
import { triggerTaskRefresh } from "@/lib/task-refresh"
import { toast } from "sonner"

interface NewTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NewTaskDialog({ open, onOpenChange }: NewTaskDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [taskName, setTaskName] = useState("")
  const [project, setProject] = useState("")
  const [assignee, setAssignee] = useState("")
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [priority, setPriority] = useState("medium")
  const [description, setDescription] = useState("")

  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([])
  const [teamMembers, setTeamMembers] = useState<Array<{ id: string; name: string }>>([])

  // Load projects and team members when dialog opens
  useEffect(() => {
    if (open) {
      const loadData = async () => {
        setIsLoading(true)
        try {
          // Load all projects
          const allProjects = await projectsService.getProjects()
          setProjects(allProjects.map(p => ({ id: p.id || '', name: p.name })))
        } catch (error: any) {
          console.error('Error loading projects:', error)
          toast.error('Failed to load projects')
        } finally {
          setIsLoading(false)
        }
      }
      loadData()
    } else {
      // Reset form when dialog closes
      setTaskName("")
      setProject("")
      setAssignee("")
      setStartDate(undefined)
      setEndDate(undefined)
      setPriority("medium")
      setDescription("")
      setTeamMembers([])
    }
  }, [open])

  // Load team members when project is selected
  useEffect(() => {
    if (project) {
      const loadTeamMembers = async () => {
        try {
          const projectTeam = await projectTeamMembersService.getProjectTeamMembers(project)
          setTeamMembers(
            projectTeam
              .filter(ptm => ptm.team_member !== null && ptm.team_member !== undefined)
              .map(ptm => ({
                id: ptm.id || '',
                name: ptm.team_member?.name || 'Unknown',
              }))
          )
          // Reset assignee when project changes
          setAssignee("")
        } catch (error: any) {
          console.warn('Could not load team members:', error)
          setTeamMembers([])
        }
      }
      loadTeamMembers()
    } else {
      setTeamMembers([])
      setAssignee("")
    }
  }, [project])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!project) {
      toast.error('Please select a project')
      return
    }

    setIsSubmitting(true)

    try {
      // Format dates for database
      const startDateStr = startDate ? format(startDate, 'yyyy-MM-dd') : undefined
      const endDateStr = endDate ? format(endDate, 'yyyy-MM-dd') : undefined

      // Calculate duration if both dates are provided
      let durationDays: number | undefined = undefined
      if (startDate && endDate) {
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
        durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      }

      // Create task
      await tasksService.createTask({
        project_id: project,
        title: taskName,
        description: description || undefined,
        start_date: startDateStr,
        end_date: endDateStr,
        duration_days: durationDays,
        priority: priority as 'high' | 'medium' | 'low',
        status: 'not-started',
        progress: 0,
        assigned_to: assignee || undefined,
      })

      toast.success('Task created successfully')
      
      // Trigger global refresh
      triggerTaskRefresh()
      
      // Close dialog
      onOpenChange(false)

      // Reset form
      setTaskName("")
      setProject("")
      setAssignee("")
      setStartDate(undefined)
      setEndDate(undefined)
      setPriority("medium")
      setDescription("")
    } catch (error: any) {
      console.error('Error creating task:', error)
      toast.error(error.message || 'Failed to create task')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>Add a new task to your project schedule.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="task-name" className="text-right">
                Task Name
              </Label>
              <Input
                id="task-name"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                className="col-span-3"
                required
                disabled={isLoading}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="project" className="text-right">
                Project
              </Label>
              <Select value={project} onValueChange={setProject} required disabled={isLoading}>
                <SelectTrigger id="project" className="col-span-3">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="assignee" className="text-right">
                Assign To
              </Label>
              <Select value={assignee} onValueChange={setAssignee} disabled={!project || isLoading}>
                <SelectTrigger id="assignee" className="col-span-3">
                  <SelectValue placeholder={project ? "Select team member" : "Select project first"} />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.length > 0 ? (
                    teamMembers.map((tm) => (
                      <SelectItem key={tm.id} value={tm.id}>
                        {tm.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="" disabled>
                      {project ? "No team members available" : "Select project first"}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="start-date" className="text-right">
                Start Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="col-span-3 justify-start text-left font-normal" id="start-date" disabled={isLoading}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Select start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="end-date" className="text-right">
                End Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="col-span-3 justify-start text-left font-normal" id="end-date" disabled={isLoading}>
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
                    disabled={(date) => (startDate ? date < startDate : false)}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="priority" className="text-right">
                Priority
              </Label>
              <Select value={priority} onValueChange={setPriority} required disabled={isLoading}>
                <SelectTrigger id="priority" className="col-span-3">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3"
                rows={3}
                disabled={isLoading}
              />
            </div>
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
