"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Calendar,
  Clock,
  Users,
  Building,
  CheckCircle2,
  AlertTriangle,
  Clock4,
  Loader2,
  Trash2,
  Edit,
  Save,
} from "lucide-react"
import { format, parseISO, isValid } from "date-fns"
import { tasksService } from "@/lib/data-service"
import { triggerTaskRefresh } from "@/lib/task-refresh"
import { toast } from "sonner"

interface TaskDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: any
}

export function TaskDetailsDialog({ open, onOpenChange, task }: TaskDetailsDialogProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [status, setStatus] = useState(task?.status || "not-started")
  const [completion, setCompletion] = useState(task?.completion || task?.progress || 0)
  const [notes, setNotes] = useState("")

  // Helper function to safely format dates
  const formatDate = (date: Date | string | undefined | null): string => {
    if (!date) return "Not set"
    
    let dateObj: Date
    if (typeof date === "string") {
      dateObj = parseISO(date)
    } else {
      dateObj = date
    }
    
    if (!isValid(dateObj)) return "Invalid date"
    
    return format(dateObj, "dd MMM yyyy")
  }

  // Get task properties safely
  const taskTitle = task?.title || task?.name || "Untitled Task"
  const taskProject = task?.projectName || task?.project?.name || task?.project || "Unknown Project"
  const taskAssignedTo = task?.assignedTo || task?.assigned_team_member?.name || "Unassigned"
  const taskDescription = task?.description || "No description available"
  const taskPriority = task?.priority || "medium"
  
  // Get dates safely
  const startDate = task?.startDate || (task?.start_date ? parseISO(task.start_date) : null)
  const endDate = task?.endDate || (task?.end_date ? parseISO(task.end_date) : null)

  // Update state when task changes
  useEffect(() => {
    if (task) {
      setStatus(task.status || "not-started")
      setCompletion(task.completion || task.progress || 0)
    }
  }, [task])

  const getStatusBadge = (status: string) => {
    const normalizedStatus = status?.toLowerCase().replace(/_/g, "-") || "not-started"
    switch (normalizedStatus) {
      case "completed":
        return (
          <Badge className="bg-green-500">
            <CheckCircle2 className="mr-1 h-3 w-3" /> Completed
          </Badge>
        )
      case "in-progress":
      case "in_progress":
        return (
          <Badge className="bg-blue-500">
            <Clock className="mr-1 h-3 w-3" /> In Progress
          </Badge>
        )
      case "not-started":
      case "not_started":
      case "pending":
        return (
          <Badge className="bg-gray-500">
            <Clock4 className="mr-1 h-3 w-3" /> Not Started
          </Badge>
        )
      case "delayed":
        return (
          <Badge className="bg-red-500">
            <AlertTriangle className="mr-1 h-3 w-3" /> Delayed
          </Badge>
        )
      default:
        return <Badge>{status || "Unknown"}</Badge>
    }
  }

  const handleSave = async () => {
    if (!task?.id) {
      toast.error('Task ID is missing')
      return
    }

    setIsSaving(true)

    try {
      await tasksService.updateTask(task.id, {
        status: status as any,
        progress: completion,
      })

      toast.success('Task updated successfully')
      
      // Trigger global refresh
      triggerTaskRefresh()
      
      setIsEditing(false)
    } catch (error: any) {
      console.error('Error updating task:', error)
      toast.error(error.message || 'Failed to update task')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!task?.id) {
      toast.error('Task ID is missing')
      return
    }

    if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return
    }

    setIsDeleting(true)

    try {
      await tasksService.deleteTask(task.id)
      
      toast.success('Task deleted successfully')
      
      // Trigger global refresh
      triggerTaskRefresh()
      
      onOpenChange(false)
    } catch (error: any) {
      console.error('Error deleting task:', error)
      toast.error(error.message || 'Failed to delete task')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{taskTitle}</span>
            {getStatusBadge(status)}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-[120px_1fr] items-start gap-4">
            <div className="font-medium text-right text-gray-500">Project:</div>
            <div className="flex items-center">
              <Building className="mr-2 h-4 w-4 text-gray-500" />
              {taskProject}
            </div>
          </div>

          <div className="grid grid-cols-[120px_1fr] items-start gap-4">
            <div className="font-medium text-right text-gray-500">Assigned To:</div>
            <div className="flex items-center">
              <Users className="mr-2 h-4 w-4 text-gray-500" />
              {taskAssignedTo}
            </div>
          </div>

          <div className="grid grid-cols-[120px_1fr] items-start gap-4">
            <div className="font-medium text-right text-gray-500">Timeline:</div>
            <div className="flex items-center">
              <Calendar className="mr-2 h-4 w-4 text-gray-500" />
              {formatDate(startDate)} - {formatDate(endDate)}
            </div>
          </div>

          <div className="grid grid-cols-[120px_1fr] items-start gap-4">
            <div className="font-medium text-right text-gray-500">Priority:</div>
            <div>
              <Badge
                variant="outline"
                className={
                  taskPriority === "high"
                    ? "border-red-500 text-red-700"
                    : taskPriority === "medium"
                      ? "border-amber-500 text-amber-700"
                      : "border-blue-500 text-blue-700"
                }
              >
                {taskPriority.charAt(0).toUpperCase() + taskPriority.slice(1)}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-[120px_1fr] items-start gap-4">
            <div className="font-medium text-right text-gray-500">Description:</div>
            <div className="text-sm">{taskDescription}</div>
          </div>

          <div className="grid grid-cols-[120px_1fr] items-start gap-4">
            <div className="font-medium text-right text-gray-500">Status:</div>
            {isEditing ? (
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not-started">Not Started</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="delayed">Delayed</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div>{getStatusBadge(status)}</div>
            )}
          </div>

          <div className="grid grid-cols-[120px_1fr] items-start gap-4">
            <div className="font-medium text-right text-gray-500">Completion:</div>
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={completion}
                  onChange={(e) => setCompletion(Number.parseInt(e.target.value))}
                  className="flex-1"
                />
                <span>{completion}%</span>
              </div>
            ) : (
              <div className="w-full">
                <Progress value={completion} className="h-2" />
                <div className="text-right text-xs text-gray-500 mt-1">{completion}% complete</div>
              </div>
            )}
          </div>

          {isEditing && (
            <div className="grid grid-cols-[120px_1fr] items-start gap-4">
              <div className="font-medium text-right text-gray-500">Notes:</div>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes or comments about this task..."
                rows={3}
              />
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            {!isEditing && (
              <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </>
                )}
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Task
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


