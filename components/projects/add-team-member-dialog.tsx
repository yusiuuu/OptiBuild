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
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { projectTeamMembersService, teamMembersService, type TeamMember } from "@/lib/data-service"
import { toast } from "sonner"

interface AddTeamMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  onTeamMemberAdded?: () => void
}

export function AddTeamMemberDialog({ open, onOpenChange, projectId, onTeamMemberAdded }: AddTeamMemberDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [teamMemberId, setTeamMemberId] = useState<string>("")
  const [roleInProject, setRoleInProject] = useState<string>("")
  
  // Available team members (not yet in project)
  const [availableTeamMembers, setAvailableTeamMembers] = useState<TeamMember[]>([])
  const [projectTeamMemberIds, setProjectTeamMemberIds] = useState<string[]>([])

  // Load available team members
  useEffect(() => {
    if (open) {
      const loadData = async () => {
        setIsLoading(true)
        try {
          // Get all team members
          const allTeamMembers = await teamMembersService.getTeamMembers()
          
          // Get project team members
          const projectTeam = await projectTeamMembersService.getProjectTeamMembers(projectId)
          const assignedIds = projectTeam.map(ptm => ptm.team_member_id)
          setProjectTeamMemberIds(assignedIds)
          
          // Filter out already assigned members
          const available = allTeamMembers.filter(tm => !assignedIds.includes(tm.id || ''))
          setAvailableTeamMembers(available)
        } catch (error: any) {
          console.warn('Error loading team members:', error)
          console.warn('Error details:', {
            message: error?.message,
            details: error?.details,
            hint: error?.hint,
            code: error?.code,
            error: error
          })
          // Better error handling - extract meaningful error message
          let errorMessage = 'Failed to load team members'
          if (error?.message) {
            errorMessage = error.message
          } else if (error?.details) {
            errorMessage = error.details
          } else if (error?.hint) {
            errorMessage = error.hint
          } else if (error?.code) {
            errorMessage = `Error code: ${error.code}`
          } else if (typeof error === 'string') {
            errorMessage = error
          } else if (error && Object.keys(error).length > 0) {
            errorMessage = `Error: ${JSON.stringify(error)}`
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
    setTeamMemberId("")
    setRoleInProject("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!teamMemberId) {
      toast.error("Please select a team member")
      return
    }

    setIsSubmitting(true)

    try {
      await projectTeamMembersService.addTeamMemberToProject(
        projectId,
        teamMemberId,
        roleInProject || undefined
      )

      toast.success("Team member added successfully!")
      resetForm()
      onOpenChange(false)
      onTeamMemberAdded?.()
    } catch (error: any) {
      console.error('Error adding team member:', error)
      // Better error handling - extract meaningful error message
      let errorMessage = "Failed to add team member"
      if (error?.message) {
        errorMessage = error.message
      } else if (error?.details) {
        errorMessage = error.details
      } else if (error?.hint) {
        errorMessage = error.hint
      } else if (typeof error === 'string') {
        errorMessage = error
      } else if (error && Object.keys(error).length > 0) {
        errorMessage = JSON.stringify(error)
      }
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Team Member to Project</DialogTitle>
          <DialogDescription>Select a team member to add to this project.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="team-member">Team Member *</Label>
              {isLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading team members...</span>
                </div>
              ) : availableTeamMembers.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No available team members. All team members are already assigned to this project.
                </div>
              ) : (
                <Select value={teamMemberId} onValueChange={setTeamMemberId} required>
                  <SelectTrigger id="team-member">
                    <SelectValue placeholder="Select team member" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTeamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id || ''}>
                        {member.name} {member.role && `(${member.role})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role in Project</Label>
              <Input
                id="role"
                value={roleInProject}
                onChange={(e) => setRoleInProject(e.target.value)}
                placeholder="e.g., Project Manager, Site Engineer, Architect"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isLoading || availableTeamMembers.length === 0}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Team Member"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

