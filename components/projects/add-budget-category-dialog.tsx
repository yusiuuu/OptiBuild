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
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { budgetCategoriesService } from "@/lib/data-service"
import { toast } from "sonner"

interface AddBudgetCategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  onCategoryAdded?: () => void
}

const DEFAULT_CATEGORIES = [
  { name: "Materials", value: "materials" },
  { name: "Labor", value: "labor" },
  { name: "Equipment", value: "equipment" },
  { name: "Subcontractors", value: "subcontractors" },
  { name: "Permits & Fees", value: "permits_fees" },
  { name: "Utilities", value: "utilities" },
  { name: "Miscellaneous", value: "misc" },
]

export function AddBudgetCategoryDialog({ open, onOpenChange, projectId, onCategoryAdded }: AddBudgetCategoryDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [name, setName] = useState<string>("")
  const [plannedAmount, setPlannedAmount] = useState<string>("")
  const [useDefault, setUseDefault] = useState<boolean>(true)
  const [selectedDefault, setSelectedDefault] = useState<string>("")

  const resetForm = () => {
    setName("")
    setPlannedAmount("")
    setUseDefault(true)
    setSelectedDefault("")
  }

  const handleDefaultChange = (value: string) => {
    setSelectedDefault(value)
    const category = DEFAULT_CATEGORIES.find(c => c.value === value)
    if (category) {
      setName(category.name)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error("Category name is required")
      return
    }

    if (!plannedAmount || parseFloat(plannedAmount) <= 0) {
      toast.error("Please enter a valid planned amount")
      return
    }

    setIsSubmitting(true)

    try {
      await budgetCategoriesService.createBudgetCategory({
        project_id: projectId,
        name: name.trim(),
        planned_amount: parseFloat(plannedAmount)
      })

      toast.success("Budget category created successfully!")
      resetForm()
      onOpenChange(false)
      onCategoryAdded?.()
    } catch (error: any) {
      console.error('Error creating budget category:', error)
      toast.error(error.message || "Failed to create budget category")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Budget Category</DialogTitle>
          <DialogDescription>Create a new budget category for this project.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Category Type</Label>
              <Select value={useDefault ? "default" : "custom"} onValueChange={(value) => setUseDefault(value === "default")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Use Default Category</SelectItem>
                  <SelectItem value="custom">Custom Category</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {useDefault ? (
              <div className="space-y-2">
                <Label htmlFor="default-category">Select Category *</Label>
                <Select value={selectedDefault} onValueChange={handleDefaultChange} required>
                  <SelectTrigger id="default-category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEFAULT_CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="category-name">Category Name *</Label>
                <Input
                  id="category-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter category name"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="planned-amount">Planned Amount (₹) *</Label>
              <Input
                id="planned-amount"
                type="number"
                step="0.01"
                min="0.01"
                value={plannedAmount}
                onChange={(e) => setPlannedAmount(e.target.value)}
                placeholder="Enter planned budget amount"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !name.trim() || !plannedAmount}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Category"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

