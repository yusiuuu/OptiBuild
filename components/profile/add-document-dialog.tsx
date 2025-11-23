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
import { Upload, Loader2 } from "lucide-react"
import { documentsService, type Document } from "@/lib/data-service"
import { toast } from "sonner"

interface AddDocumentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  document?: Document | null
  projectId?: string
  onDocumentAdded?: () => void
}

export function AddDocumentDialog({ open, onOpenChange, document, projectId, onDocumentAdded }: AddDocumentDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const isEditing = !!document
  
  const [formData, setFormData] = useState({
    name: document?.name || "",
    type: document?.type || "",
    file_url: document?.file_url || ""
  })

  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const resetForm = () => {
    setFormData({
      name: "",
      type: "",
      file_url: ""
    })
    setSelectedFile(null)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setFormData({...formData, name: file.name})
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name) {
      toast.error("Document name is required")
      return
    }

    setIsSubmitting(true)

    try {
      // In a real app, you would upload the file to storage first
      // For now, we'll just save the document metadata
      const documentData = {
        name: formData.name,
        type: formData.type || "document",
        file_url: formData.file_url || (selectedFile ? URL.createObjectURL(selectedFile) : ""),
        project_id: projectId || undefined
      }

      if (isEditing && document?.id) {
        await documentsService.updateDocument(document.id, documentData)
        toast.success("Document updated successfully!")
      } else {
        await documentsService.createDocument(documentData)
        toast.success("Document created successfully!")
      }
      
      resetForm()
      onOpenChange(false)
      onDocumentAdded?.()
    } catch (error: any) {
      console.error('Error saving document:', error)
      toast.error(error.message || "Failed to save document")
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
          <DialogTitle>{isEditing ? "Edit Document" : "Upload Document"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update document information." : "Upload a new document to your company."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Document Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Enter document name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Document Type</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Contract">Contract</SelectItem>
                  <SelectItem value="Permit">Permit</SelectItem>
                  <SelectItem value="License">License</SelectItem>
                  <SelectItem value="Invoice">Invoice</SelectItem>
                  <SelectItem value="Report">Report</SelectItem>
                  <SelectItem value="Blueprint">Blueprint</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!isEditing && (
              <div className="space-y-2">
                <Label htmlFor="file">Upload File</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="file"
                    type="file"
                    onChange={handleFileChange}
                    className="flex-1"
                  />
                  <Upload className="h-4 w-4 text-muted-foreground" />
                </div>
                {selectedFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                  </p>
                )}
              </div>
            )}

            {isEditing && (
              <div className="space-y-2">
                <Label htmlFor="file_url">File URL</Label>
                <Input
                  id="file_url"
                  value={formData.file_url}
                  onChange={(e) => setFormData({...formData, file_url: e.target.value})}
                  placeholder="Enter file URL"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || uploading}>
              {isSubmitting || uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? "Updating..." : "Uploading..."}
                </>
              ) : (
                isEditing ? "Update Document" : "Upload Document"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

