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
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { certificationsService, type Certification } from "@/lib/data-service"
import { toast } from "sonner"

interface AddCertificationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  certification?: Certification | null
  onCertificationAdded?: () => void
}

export function AddCertificationDialog({ open, onOpenChange, certification, onCertificationAdded }: AddCertificationDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = !!certification
  
  const [formData, setFormData] = useState({
    name: certification?.name || "",
    issuer: certification?.issuer || "",
    issue_date: certification?.issue_date || "",
    valid_until: certification?.valid_until || "",
    certificate_number: certification?.certificate_number || ""
  })

  const resetForm = () => {
    setFormData({
      name: "",
      issuer: "",
      issue_date: "",
      valid_until: "",
      certificate_number: ""
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.issuer) {
      toast.error("Name and issuer are required")
      return
    }

    setIsSubmitting(true)

    try {
      if (isEditing && certification?.id) {
        await certificationsService.updateCertification(certification.id, formData)
        toast.success("Certification updated successfully!")
      } else {
        await certificationsService.createCertification(formData)
        toast.success("Certification created successfully!")
      }
      
      resetForm()
      onOpenChange(false)
      onCertificationAdded?.()
    } catch (error: any) {
      console.error('Error saving certification:', error)
      toast.error(error.message || "Failed to save certification")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetForm()
      onOpenChange(open)
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Certification" : "Add Certification"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update certification information." : "Add a new certification to your company."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Certification Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Enter certification name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="issuer">Issuer *</Label>
              <Input
                id="issuer"
                value={formData.issuer}
                onChange={(e) => setFormData({...formData, issuer: e.target.value})}
                placeholder="Enter issuer name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="certificate_number">Certificate Number</Label>
              <Input
                id="certificate_number"
                value={formData.certificate_number}
                onChange={(e) => setFormData({...formData, certificate_number: e.target.value})}
                placeholder="Enter certificate number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="issue_date">Issue Date</Label>
              <Input
                id="issue_date"
                type="date"
                value={formData.issue_date}
                onChange={(e) => setFormData({...formData, issue_date: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valid_until">Valid Until</Label>
              <Input
                id="valid_until"
                type="date"
                value={formData.valid_until}
                onChange={(e) => setFormData({...formData, valid_until: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? "Updating..." : "Creating..."}
                </>
              ) : (
                isEditing ? "Update Certification" : "Add Certification"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

