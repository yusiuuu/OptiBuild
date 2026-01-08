"use client"

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, FileText, Download } from "lucide-react"
import { projectsService } from "@/lib/data-service"
import { toast } from "sonner"

interface GenerateReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onReportGenerated: () => void
}

export function GenerateReportDialog({ open, onOpenChange, onReportGenerated }: GenerateReportDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [reportType, setReportType] = useState("")
  const [selectedProject, setSelectedProject] = useState("all")
  const [includeCharts, setIncludeCharts] = useState(true)
  const [includeDetails, setIncludeDetails] = useState(true)
  const [format, setFormat] = useState("pdf")
  
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    if (open) {
      const loadProjects = async () => {
        try {
          const allProjects = await projectsService.getProjects()
          setProjects(allProjects.map(p => ({ id: p.id || '', name: p.name })))
        } catch (error) {
          console.error('Error loading projects:', error)
        }
      }
      loadProjects()
    }
  }, [open])

  const handleGenerate = async () => {
    if (!reportType) {
      toast.error('Please select a report type')
      return
    }

    setIsGenerating(true)

    try {
      // Import report generator
      const { generateReport } = await import('@/lib/report-generator')
      
      // Generate the report
      const reportBlob = await generateReport({
        type: reportType as any,
        projectId: selectedProject === "all" ? undefined : selectedProject,
        includeCharts,
        includeDetails,
        format: format as 'pdf' | 'excel' | 'csv',
      })

      // Create download link
      const url = URL.createObjectURL(reportBlob.blob)
      const link = document.createElement('a')
      link.href = url
      link.download = reportBlob.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success('Report generated successfully')
      onReportGenerated()
      onOpenChange(false)
    } catch (error: any) {
      console.error('Error generating report:', error)
      toast.error(error.message || 'Failed to generate report')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Generate Report</DialogTitle>
          <DialogDescription>
            Generate a comprehensive report based on your database data
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="report-type">Report Type</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger id="report-type">
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="project-status">Project Status Report</SelectItem>
                <SelectItem value="budget">Budget & Expense Report</SelectItem>
                <SelectItem value="resource-utilization">Resource Utilization Report</SelectItem>
                <SelectItem value="task-progress">Task Progress Report</SelectItem>
                <SelectItem value="comprehensive">Comprehensive Project Report</SelectItem>
                <SelectItem value="financial-summary">Financial Summary</SelectItem>
                <SelectItem value="resource-allocation">Resource Allocation Report</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="project">Project</Label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger id="project">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="format">Format</Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger id="format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="excel">Excel (XLSX)</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-charts"
                checked={includeCharts}
                onCheckedChange={(checked) => setIncludeCharts(checked === true)}
              />
              <Label htmlFor="include-charts" className="text-sm font-normal cursor-pointer">
                Include Charts & Visualizations
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-details"
                checked={includeDetails}
                onCheckedChange={(checked) => setIncludeDetails(checked === true)}
              />
              <Label htmlFor="include-details" className="text-sm font-normal cursor-pointer">
                Include Detailed Data
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isGenerating}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={isGenerating || !reportType}>
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Generate Report
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

