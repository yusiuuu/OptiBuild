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
import { CalendarIcon, Loader2 } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { projectResourcesService, resourcesCatalogService, type Resource } from "@/lib/data-service"
import { toast } from "sonner"

interface AssignResourceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  onResourceAssigned?: () => void
}

export function AssignResourceDialog({ open, onOpenChange, projectId, onResourceAssigned }: AssignResourceDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [resourceId, setResourceId] = useState<string>("")
  const [quantity, setQuantity] = useState<string>("")
  const [allocatedFrom, setAllocatedFrom] = useState<Date | undefined>(undefined)
  const [allocatedTo, setAllocatedTo] = useState<Date | undefined>(undefined)
  
  // Available resources
  const [availableResources, setAvailableResources] = useState<Resource[]>([])
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null)
  const [estimatedCost, setEstimatedCost] = useState<number>(0)

  // Load available resources
  useEffect(() => {
    if (open) {
      const loadResources = async () => {
        setIsLoading(true)
        try {
          const resources = await resourcesCatalogService.getResources()
          setAvailableResources(resources)
        } catch (error) {
          console.error('Error loading resources:', error)
          toast.error('Failed to load resources')
        } finally {
          setIsLoading(false)
        }
      }
      loadResources()
    }
  }, [open])

  // Update selected resource and calculate cost
  useEffect(() => {
    if (resourceId) {
      const resource = availableResources.find(r => r.id === resourceId)
      setSelectedResource(resource || null)
    } else {
      setSelectedResource(null)
    }
  }, [resourceId, availableResources])

  // Calculate estimated cost
  useEffect(() => {
    if (selectedResource && quantity && allocatedFrom && allocatedTo) {
      const qty = parseFloat(quantity)
      if (!isNaN(qty) && qty > 0) {
        const cost = qty * (selectedResource.base_cost || 0)
        setEstimatedCost(cost)
      } else {
        setEstimatedCost(0)
      }
    } else {
      setEstimatedCost(0)
    }
  }, [selectedResource, quantity, allocatedFrom, allocatedTo])

  const resetForm = () => {
    setResourceId("")
    setQuantity("")
    setAllocatedFrom(undefined)
    setAllocatedTo(undefined)
    setSelectedResource(null)
    setEstimatedCost(0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!resourceId) {
      toast.error("Please select a resource")
      return
    }

    if (!quantity || parseFloat(quantity) <= 0) {
      toast.error("Please enter a valid quantity")
      return
    }

    if (!allocatedFrom || !allocatedTo) {
      toast.error("Please select allocation dates")
      return
    }

    if (allocatedTo < allocatedFrom) {
      toast.error("End date must be after start date")
      return
    }

    setIsSubmitting(true)

    try {
      await projectResourcesService.assignResourceToProject({
        project_id: projectId,
        resource_id: resourceId,
        quantity: parseFloat(quantity),
        allocated_from: allocatedFrom.toISOString().split('T')[0],
        allocated_to: allocatedTo.toISOString().split('T')[0]
      })

      toast.success("Resource assigned successfully!")
      resetForm()
      onOpenChange(false)
      onResourceAssigned?.()
    } catch (error: any) {
      console.warn('Error assigning resource:', error)
      // Better error handling - extract meaningful error message
      let errorMessage = "Failed to assign resource"
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Assign Resource to Project</DialogTitle>
          <DialogDescription>Select a resource and specify quantity and allocation period.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="resource">Resource *</Label>
              {isLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading resources...</span>
                </div>
              ) : availableResources.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No resources available. Create resources in the Resource Catalog first.
                </div>
              ) : (
                <Select value={resourceId} onValueChange={setResourceId} required>
                  <SelectTrigger id="resource">
                    <SelectValue placeholder="Select resource" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableResources.map((resource) => (
                      <SelectItem key={resource.id} value={resource.id || ''}>
                        {resource.name} ({resource.type}) - ₹{resource.base_cost}/{resource.unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {selectedResource && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">{selectedResource.name}</p>
                <p className="text-xs text-muted-foreground">
                  Type: {selectedResource.type} • Unit: {selectedResource.unit} • Base Cost: ₹{selectedResource.base_cost}
                </p>
                {selectedResource.description && (
                  <p className="text-xs text-muted-foreground mt-1">{selectedResource.description}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                min="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Enter quantity"
                required
              />
              {selectedResource && (
                <p className="text-xs text-muted-foreground">Unit: {selectedResource.unit}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="allocated-from">Allocated From *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal" id="allocated-from">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {allocatedFrom ? format(allocatedFrom, "PPP") : "Select start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar 
                      mode="single" 
                      selected={allocatedFrom} 
                      onSelect={setAllocatedFrom} 
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="allocated-to">Allocated To *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal" id="allocated-to">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {allocatedTo ? format(allocatedTo, "PPP") : "Select end date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={allocatedTo}
                      onSelect={setAllocatedTo}
                      initialFocus
                      disabled={(date) => allocatedFrom ? date < allocatedFrom : false}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {estimatedCost > 0 && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <p className="text-sm font-medium">Estimated Total Cost</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">₹{estimatedCost.toLocaleString()}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isLoading || availableResources.length === 0}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                "Assign Resource"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

