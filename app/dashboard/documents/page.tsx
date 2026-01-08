"use client"

import { useState, useEffect, useRef } from "react"
import { FileText, Upload, Download, Trash2, ArrowLeft, FileDown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import Link from "next/link"
import { documentsService } from "@/lib/data-service"
import { GenerateReportDialog } from "@/components/documents/generate-report-dialog"
import { format } from "date-fns"

interface Document {
  id: string
  name: string
  type?: string
  size?: string
  file_url?: string
  uploaded_at?: string
  created_at?: string
  project_id?: string
}

export default function DocumentsPage() {
  const downloadLinkRef = useRef<HTMLAnchorElement>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)

  // Load documents from database
  useEffect(() => {
    const loadDocuments = async () => {
      try {
        setIsLoading(true)
        const docs = await documentsService.getDocuments()
        setDocuments(docs)
      } catch (error: any) {
        console.error('Error loading documents:', error)
        toast.error('Failed to load documents')
      } finally {
        setIsLoading(false)
      }
    }
    loadDocuments()
  }, [])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      // In a real implementation, you would upload the file to Supabase Storage first
      // For now, we'll create a document record
      const fileType = file.type.split("/")[1]?.toUpperCase() || file.name.split(".").pop()?.toUpperCase() || "UNKNOWN"
      const fileSize = `${(file.size / (1024 * 1024)).toFixed(1)} MB`

      await documentsService.createDocument({
        name: file.name,
        type: fileType,
        size: fileSize,
        file_url: undefined, // In production, this would be the Supabase Storage URL
      })

      toast.success("Document uploaded successfully")
      
      // Reload documents
      const docs = await documentsService.getDocuments()
      setDocuments(docs)
    } catch (error: any) {
      console.error('Error uploading document:', error)
      toast.error(error.message || 'Failed to upload document')
    }
  }

  const handleDownload = async (document: Document) => {
    try {
      if (document.file_url) {
        // If there's a file URL, open it directly
        window.open(document.file_url, '_blank')
        toast.success(`Downloaded ${document.name}`)
      } else {
        // For documents without file URLs, create a placeholder download
        const content = `Document: ${document.name}\nType: ${document.type || 'N/A'}\nSize: ${document.size || 'N/A'}\nUploaded: ${document.uploaded_at || document.created_at || 'N/A'}`
        const blob = new Blob([content], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        
        if (downloadLinkRef.current) {
          downloadLinkRef.current.href = url
          downloadLinkRef.current.download = document.name
          downloadLinkRef.current.click()
        }
        
        URL.revokeObjectURL(url)
        toast.success(`Downloaded ${document.name}`)
      }
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to download document')
    }
  }

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return
    }

    try {
      await documentsService.deleteDocument(documentId)
      setDocuments(documents.filter((doc) => doc.id !== documentId))
      toast.success("Document deleted successfully")
    } catch (error: any) {
      console.error('Error deleting document:', error)
      toast.error(error.message || 'Failed to delete document')
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    try {
      return format(new Date(dateString), 'MMM dd, yyyy')
    } catch {
      return dateString
    }
  }

  return (
    <div className="container mx-auto p-6">
      {/* Hidden download link */}
      <a ref={downloadLinkRef} style={{ display: 'none' }} />
      
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Documents</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your project documents and generate reports</p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="default"
            onClick={() => setIsGeneratingReport(true)}
            className="bg-gradient-to-r from-primary to-primary/90"
          >
            <FileDown className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
          <Input
            type="file"
            className="hidden"
            id="file-upload"
            onChange={handleFileUpload}
          />
          <Button
            variant="outline"
            onClick={() => document.getElementById("file-upload")?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Loading documents...</p>
          </CardContent>
        </Card>
      ) : documents.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No documents found</h3>
            <p className="text-muted-foreground mb-4">
              Upload documents or generate reports to get started
            </p>
            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                onClick={() => setIsGeneratingReport(true)}
              >
                <FileDown className="mr-2 h-4 w-4" />
                Generate Report
              </Button>
              <Button
                variant="outline"
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Document
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {documents.map((document) => (
            <Card key={document.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <FileText className="h-8 w-8 text-blue-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{document.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {document.type || 'Unknown'} • {document.size || 'N/A'} • Uploaded on {formatDate(document.uploaded_at || document.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDownload(document)}
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(document.id)}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <GenerateReportDialog
        open={isGeneratingReport}
        onOpenChange={setIsGeneratingReport}
        onReportGenerated={() => {
          // Reload documents after report generation
          const loadDocuments = async () => {
            try {
              const docs = await documentsService.getDocuments()
              setDocuments(docs)
            } catch (error) {
              console.error('Error reloading documents:', error)
            }
          }
          loadDocuments()
        }}
      />
    </div>
  )
}
