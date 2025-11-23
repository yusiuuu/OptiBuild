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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, Loader2 } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { expensesService, budgetCategoriesService, resourcesCatalogService, type BudgetCategory, type Resource } from "@/lib/data-service"
import { toast } from "sonner"

interface AddExpenseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  onExpenseAdded?: () => void
}

export function AddExpenseDialog({ open, onOpenChange, projectId, onExpenseAdded }: AddExpenseDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [categoryId, setCategoryId] = useState<string>("")
  const [description, setDescription] = useState<string>("")
  const [amount, setAmount] = useState<string>("")
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [resourceId, setResourceId] = useState<string>("")
  
  // Available data
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([])
  const [resources, setResources] = useState<Resource[]>([])

  // Load budget categories and resources
  useEffect(() => {
    if (open) {
      const loadData = async () => {
        setIsLoading(true)
        try {
          const [categories, resourcesData] = await Promise.all([
            budgetCategoriesService.getProjectBudgetCategories(projectId),
            resourcesCatalogService.getResources()
          ])
          setBudgetCategories(categories)
          setResources(resourcesData)
        } catch (error) {
          console.error('Error loading data:', error)
          toast.error('Failed to load data')
        } finally {
          setIsLoading(false)
        }
      }
      loadData()
    }
  }, [open, projectId])

  const resetForm = () => {
    setCategoryId("")
    setDescription("")
    setAmount("")
    setDate(new Date())
    setResourceId("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!categoryId) {
      toast.error("Please select a budget category")
      return
    }

    if (!description.trim()) {
      toast.error("Description is required")
      return
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    if (!date) {
      toast.error("Please select a date")
      return
    }

    setIsSubmitting(true)

    try {
      await expensesService.createExpense({
        project_id: projectId,
        category_id: categoryId,
        description: description.trim(),
        amount: parseFloat(amount),
        date: date.toISOString().split('T')[0],
        resource_id: resourceId || undefined
      })

      toast.success("Expense added successfully!")
      resetForm()
      onOpenChange(false)
      onExpenseAdded?.()
    } catch (error: any) {
      console.error('Error adding expense:', error)
      toast.error(error.message || "Failed to add expense")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
          <DialogDescription>Record an expense for this project.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category">Budget Category *</Label>
              {isLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading categories...</span>
                </div>
              ) : budgetCategories.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No budget categories found. Create a budget category first.
                </div>
              ) : (
                <Select value={categoryId} onValueChange={setCategoryId} required>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select budget category" />
                  </SelectTrigger>
                  <SelectContent>
                    {budgetCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id || ''}>
                        {category.name} (Planned: ₹{category.planned_amount.toLocaleString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter expense description"
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal" id="date">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar 
                      mode="single" 
                      selected={date} 
                      onSelect={setDate} 
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {resources.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="resource">Related Resource (Optional)</Label>
                <Select value={resourceId} onValueChange={setResourceId}>
                  <SelectTrigger id="resource">
                    <SelectValue placeholder="Select resource (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {resources.map((resource) => (
                      <SelectItem key={resource.id} value={resource.id || ''}>
                        {resource.name} ({resource.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isLoading || budgetCategories.length === 0}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Expense"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

