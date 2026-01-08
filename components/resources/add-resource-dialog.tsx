"use client"

import type React from "react"

import { useState } from "react"
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
import { Loader2 } from "lucide-react"
import { resourcesCatalogService } from "@/lib/data-service"
import { toast } from "sonner"

interface AddResourceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  resourceType: string
  onResourceAdded?: () => void
}

export function AddResourceDialog({ open, onOpenChange, resourceType, onResourceAdded }: AddResourceDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    quantity: "",
    unit: "",
    supplier: "",
    location: "",
    cost: "",
    condition: "",
    supervisor: "",
    dailyRate: "",
    dailyWage: "",
  })

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.name.trim()) {
      toast.error("Resource name is required")
      return
    }

    if (!formData.category) {
      toast.error("Category is required")
      return
    }

    // Map resource type to database format
    let resourceTypeDb: 'material' | 'labour' | 'equipment' = 'material'
    if (resourceType === 'equipment') {
      resourceTypeDb = 'equipment'
    } else if (resourceType === 'labor') {
      resourceTypeDb = 'labour' // Note: database uses 'labour' not 'labor'
    }

    // Determine unit and base_cost based on resource type
    let unit = formData.unit || 'unit'
    let baseCost = 0

    if (resourceType === 'materials') {
      unit = formData.unit || 'unit'
      baseCost = parseFloat(formData.cost) || 0
      if (!formData.unit) {
        toast.error("Unit is required for materials")
        return
      }
      if (baseCost <= 0) {
        toast.error("Unit cost must be greater than 0")
        return
      }
    } else if (resourceType === 'equipment') {
      unit = 'day' // Equipment is typically rented by day
      baseCost = parseFloat(formData.dailyRate) || 0
      if (baseCost <= 0) {
        toast.error("Daily rate must be greater than 0")
        return
      }
    } else if (resourceType === 'labor') {
      unit = 'day' // Labor is typically paid by day
      baseCost = parseFloat(formData.dailyWage) || 0
      if (baseCost <= 0) {
        toast.error("Daily wage must be greater than 0")
        return
      }
    }

    setIsSubmitting(true)

    try {
      // Build description from available fields and user notes
      const descriptionParts: string[] = []
      if (formData.description) descriptionParts.push(formData.description.trim())
      if (formData.category) descriptionParts.push(`Category: ${formData.category}`)
      if (formData.supplier) descriptionParts.push(`Supplier: ${formData.supplier}`)
      if (formData.location) descriptionParts.push(`Location: ${formData.location}`)
      if (formData.condition) descriptionParts.push(`Condition: ${formData.condition}`)
      if (formData.supervisor) descriptionParts.push(`Supervisor: ${formData.supervisor}`)
      if (formData.quantity) descriptionParts.push(`Quantity: ${formData.quantity}`)

      const description = descriptionParts.length > 0 ? descriptionParts.join(' | ') : undefined

      // Parse quantity (default to 0 if not provided)
      const quantity = formData.quantity ? parseFloat(formData.quantity) : 0

      // Create resource in database
      await resourcesCatalogService.createResource({
        name: formData.name.trim(),
        type: resourceTypeDb,
        unit: unit,
        base_cost: baseCost,
        description: description,
        quantity: quantity || 0, // Include quantity in resource creation (default to 0)
      } as any) // Type assertion needed as quantity is optional in interface

      toast.success(`${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)} resource added successfully!`)

      // Dispatch event to refresh charts
      window.dispatchEvent(new Event('resource-updated'))
      localStorage.setItem('resource-updated-timestamp', Date.now().toString())

      // Reset form
      setFormData({
        name: "",
        category: "",
        quantity: "",
        unit: "",
        supplier: "",
        location: "",
        cost: "",
        condition: "",
        supervisor: "",
        dailyRate: "",
        dailyWage: "",
        description: "",
      })

      // Close dialog
      onOpenChange(false)

      // Refresh resources list
      onResourceAdded?.()
    } catch (error: any) {
      console.warn('Error creating resource:', error)
      let errorMessage = "Failed to create resource"
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

  // Define categories based on resource type
  const getCategories = () => {
    switch (resourceType) {
      case "materials":
        return [
          "Construction Materials",
          "Electrical",
          "Plumbing",
          "Finishing Materials",
          "Insulation",
          "Roofing",
          "Other",
        ]
      case "equipment":
        return ["Heavy Machinery", "Construction Equipment", "Power Equipment", "Tools", "Vehicles", "Other"]
      case "labor":
        return ["Skilled Labor", "Unskilled Labor", "Supervisory", "Technical", "Administrative", "Other"]
      default:
        return []
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>
            Add New {resourceType.charAt(0).toUpperCase() + resourceType.slice(1, -1)}
            {resourceType === "equipment" ? "" : "s"}
          </DialogTitle>
          <DialogDescription>Add a new {resourceType.slice(0, -1)} resource to your inventory.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="col-span-3"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <Select value={formData.category} onValueChange={(value) => handleChange("category", value)} required>
                <SelectTrigger id="category" className="col-span-3">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {getCategories().map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">
                Quantity
              </Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => handleChange("quantity", e.target.value)}
                className="col-span-3"
                required
              />
            </div>

            {resourceType === "materials" && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="unit" className="text-right">
                  Unit
                </Label>
                <Select value={formData.unit} onValueChange={(value) => handleChange("unit", value)} required>
                  <SelectTrigger id="unit" className="col-span-3">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bags">Bags</SelectItem>
                    <SelectItem value="Kg">Kg</SelectItem>
                    <SelectItem value="Pieces">Pieces</SelectItem>
                    <SelectItem value="Cubic Meters">Cubic Meters</SelectItem>
                    <SelectItem value="Meters">Meters</SelectItem>
                    <SelectItem value="Liters">Liters</SelectItem>
                    <SelectItem value="Tons">Tons</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {resourceType === "materials" && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="supplier" className="text-right">
                  Supplier
                </Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => handleChange("supplier", e.target.value)}
                  className="col-span-3"
                />
              </div>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="location" className="text-right">
                Location
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleChange("location", e.target.value)}
                className="col-span-3"
              />
            </div>

            {resourceType === "materials" && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="cost" className="text-right">
                  Unit Cost (₹)
                </Label>
                <Input
                  id="cost"
                  type="number"
                  value={formData.cost}
                  onChange={(e) => handleChange("cost", e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>
            )}

            {resourceType === "equipment" && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="condition" className="text-right">
                    Condition
                  </Label>
                  <Select
                    value={formData.condition}
                    onValueChange={(value) => handleChange("condition", value)}
                    required
                  >
                    <SelectTrigger id="condition" className="col-span-3">
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="dailyRate" className="text-right">
                    Daily Rate (₹)
                  </Label>
                  <Input
                    id="dailyRate"
                    type="number"
                    value={formData.dailyRate}
                    onChange={(e) => handleChange("dailyRate", e.target.value)}
                    className="col-span-3"
                    required
                  />
                </div>
              </>
            )}

            {resourceType === "labor" && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="supervisor" className="text-right">
                    Supervisor
                  </Label>
                  <Input
                    id="supervisor"
                    value={formData.supervisor}
                    onChange={(e) => handleChange("supervisor", e.target.value)}
                    className="col-span-3"
                    required
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="dailyWage" className="text-right">
                    Daily Wage (₹)
                  </Label>
                  <Input
                    id="dailyWage"
                    type="number"
                    value={formData.dailyWage}
                    onChange={(e) => handleChange("dailyWage", e.target.value)}
                    className="col-span-3"
                    required
                  />
                </div>
              </>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Description
              </Label>
              <Textarea
                id="notes"
                className="col-span-3"
                rows={3}
                placeholder="Additional information about this resource..."
                value={formData.description || ""}
                onChange={(e) => handleChange("description", e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Resource"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

