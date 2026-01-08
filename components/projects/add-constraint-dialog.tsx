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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { constraintsService, type ConstraintMaster } from "@/lib/data-service"
import { toast } from "sonner"

interface AddConstraintDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  onConstraintAdded?: () => void
}

export function AddConstraintDialog({ open, onOpenChange, projectId, onConstraintAdded }: AddConstraintDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [constraintId, setConstraintId] = useState<string>("")
  const [details, setDetails] = useState<string>("")
  
  // Available constraints (not yet assigned)
  const [availableConstraints, setAvailableConstraints] = useState<ConstraintMaster[]>([])
  const [assignedConstraintIds, setAssignedConstraintIds] = useState<string[]>([])
  const [hasTableError, setHasTableError] = useState(false)

  // Load available constraints
  useEffect(() => {
    if (open) {
      const loadData = async () => {
        setIsLoading(true)
        try {
          // Get all constraints master
          const allConstraints = await constraintsService.getConstraintsMaster()
          
          // Check if we got default constraints (table doesn't exist)
          const hasDefaultConstraints = allConstraints.some(c => c.id?.startsWith('default-'))
          if (hasDefaultConstraints) {
            setHasTableError(true)
            // Don't show default constraints - they can't be used
            setAvailableConstraints([])
          } else {
            setHasTableError(false)
            // Get project constraints
            const projectConstraints = await constraintsService.getProjectConstraints(projectId)
            const assignedIds = projectConstraints.map((pc: any) => pc.constraint_id || pc.id).filter(Boolean)
            setAssignedConstraintIds(assignedIds)
            
            // Filter out already assigned constraints
            const available = allConstraints.filter(c => !assignedIds.includes(c.id || ''))
            setAvailableConstraints(available)
          }
        } catch (error: any) {
          console.warn('Error loading constraints:', error)
          // If constraints_master table doesn't exist, show helpful message
          if (error?.message?.includes('constraints_master') || error?.message?.includes('schema cache')) {
            setHasTableError(true)
            // Still try to load project constraints without the master list
            try {
              const projectConstraints = await constraintsService.getProjectConstraints(projectId)
              setAssignedConstraintIds(projectConstraints.map((pc: any) => pc.constraint_id || pc.id).filter(Boolean))
            } catch (e) {
              // Ignore secondary error
            }
            // Don't show error toast for missing table - default constraints will be used
          } else {
            setHasTableError(false)
            // Show error for other issues
            let errorMessage = 'Failed to load constraints'
            if (error?.message) {
              errorMessage = error.message
            } else if (error?.details) {
              errorMessage = typeof error.details === 'string' ? error.details : JSON.stringify(error.details)
            } else if (error?.hint) {
              errorMessage = error.hint
            } else if (error?.code) {
              errorMessage = `Database error (code: ${error.code}). Please check your connection.`
            } else if (typeof error === 'string') {
              errorMessage = error
            } else if (error instanceof Error) {
              errorMessage = error.message || error.toString()
            }
            toast.error(errorMessage)
          }
        } finally {
          setIsLoading(false)
        }
      }
      loadData()
    }
  }, [open, projectId])

  const resetForm = () => {
    setConstraintId("")
    setDetails("")
    setHasTableError(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!constraintId) {
      toast.error("Please select a constraint")
      return
    }

    // Check if this is a default constraint (won't work with foreign key)
    if (constraintId.startsWith('default-')) {
      toast.error('Please run the database migration to create the constraints_master table. Default constraints cannot be assigned without the table.')
      return
    }

    setIsSubmitting(true)

    try {
      await constraintsService.assignConstraintToProject(
        projectId,
        constraintId,
        details.trim() || undefined
      )

      toast.success("Constraint added successfully!")
      resetForm()
      onOpenChange(false)
      onConstraintAdded?.()
    } catch (error: any) {
      console.warn('Error adding constraint:', error)
      // Better error handling - extract meaningful error message
      let errorMessage = "Failed to add constraint"
      if (error?.message) {
        errorMessage = error.message
      } else if (error?.details) {
        errorMessage = typeof error.details === 'string' ? error.details : JSON.stringify(error.details)
      } else if (error?.hint) {
        errorMessage = error.hint
      } else if (error?.code) {
        errorMessage = `Database error (code: ${error.code}). Please check your connection.`
      } else if (typeof error === 'string') {
        errorMessage = error
      } else if (error instanceof Error) {
        errorMessage = error.message || error.toString()
      }
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedConstraint = availableConstraints.find(c => c.id === constraintId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Constraint to Project</DialogTitle>
          <DialogDescription>Select a constraint that applies to this project.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="constraint">Constraint *</Label>
              {isLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading constraints...</span>
                </div>
              ) : hasTableError ? (
                <div className="p-4 text-center text-sm">
                  <div className="space-y-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <p className="font-medium text-amber-700 dark:text-amber-400">
                      ⚠️ Constraints table not found
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-500">
                      The constraints_master table doesn't exist in your database. Please run the migration script 
                      (supabase-migration-extended-schema.sql) to create the required tables.
                    </p>
                  </div>
                </div>
              ) : availableConstraints.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No available constraints. All constraints are already assigned to this project.
                </div>
              ) : (
                <Select value={constraintId} onValueChange={setConstraintId} required>
                  <SelectTrigger id="constraint">
                    <SelectValue placeholder="Select constraint" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableConstraints.map((constraint) => (
                      <SelectItem key={constraint.id} value={constraint.id || ''}>
                        {constraint.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {selectedConstraint && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">{selectedConstraint.name}</p>
                {selectedConstraint.description && (
                  <p className="text-xs text-muted-foreground mt-1">{selectedConstraint.description}</p>
                )}
                {selectedConstraint.category && (
                  <p className="text-xs text-muted-foreground mt-1">Category: {selectedConstraint.category}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="details">Additional Details (Optional)</Label>
              <Textarea
                id="details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Add any specific details or notes about this constraint..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isLoading || availableConstraints.length === 0}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Constraint"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

