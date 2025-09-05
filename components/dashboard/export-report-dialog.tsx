"use client"

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { CalendarIcon, FileDown, Loader2 } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"

// Props interface for the export report dialog component
// Controls dialog open/close state from parent component
interface ExportReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Export report dialog component for generating downloadable project reports
// Supports multiple report types, file formats, and project selection
export function ExportReportDialog({ open, onOpenChange }: ExportReportDialogProps) {
  // Loading state for export process
  const [isExporting, setIsExporting] = useState(false)
  // Selected report type for export
  const [reportType, setReportType] = useState("resource-allocation")
  // Selected file format for export
  const [fileFormat, setFileFormat] = useState("pdf")
  // Date range for report data filtering
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: undefined,
    to: undefined,
  })
  // Array of selected project IDs for report generation
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])

  // Available projects for selection in report export
  const projects = [
    { id: "office-tower", name: "Office Tower Phase 1" },
    { id: "residential", name: "Residential Complex" },
    { id: "highway", name: "Highway Extension" },
    { id: "shopping-mall", name: "Shopping Mall" },
  ]

  // Toggle project selection for report generation
  // Adds or removes project ID from selected projects array
  const handleProjectToggle = (projectId: string) => {
    setSelectedProjects((prev) =>
      prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId],
    )
  }

  // Handle report export process
  // Generates file content based on selected format and downloads the report
  const handleExport = async () => {
    setIsExporting(true)

    try {
      // Prepare the data for export with metadata
      const exportData = {
        reportType,
        projects: selectedProjects,
        dateRange,
        generatedAt: new Date().toISOString(),
      }

      // Generate file content based on selected format
      let content = '';
      let mimeType = '';
      let fileExtension = '';
      
      switch (fileFormat) {
        case 'json':
          // JSON format: structured data export
          content = JSON.stringify(exportData, null, 2);
          mimeType = 'application/json';
          fileExtension = 'json';
          break;
        case 'csv':
          // CSV format: tabular data export
          content = `Report Type,Date Range,Projects\n${reportType},"${dateRange.from ? format(dateRange.from, 'LLL dd, y') : ''} - ${dateRange.to ? format(dateRange.to, 'LLL dd, y') : ''}","${selectedProjects.join(', ')}"`;
          mimeType = 'text/csv';
          fileExtension = 'csv';
          break;
        case 'pdf':
          // PDF format: formatted document export (placeholder implementation)
          // In a real application, you would use a PDF generation library like jsPDF
          content = `Report Type: ${reportType}\nDate Range: ${dateRange.from ? format(dateRange.from, 'LLL dd, y') : ''} - ${dateRange.to ? format(dateRange.to, 'LLL dd, y') : ''}\nProjects: ${selectedProjects.join(', ')}`;
          mimeType = 'text/plain';
          fileExtension = 'txt';
          break;
        case 'xlsx':
          // Excel format: spreadsheet export (placeholder implementation)
          // In a real application, you would use an Excel generation library like xlsx
          content = `Report Type: ${reportType}\nDate Range: ${dateRange.from ? format(dateRange.from, 'LLL dd, y') : ''} - ${dateRange.to ? format(dateRange.to, 'LLL dd, y') : ''}\nProjects: ${selectedProjects.join(', ')}`;
          mimeType = 'text/plain';
          fileExtension = 'txt';
          break;
      }

      // Create blob and trigger file download
      const blob = new Blob([content], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${reportType}-${format(new Date(), 'yyyy-MM-dd')}.${fileExtension}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setIsExporting(false);
      onOpenChange(false);
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Failed to export report. Please try again.');
      setIsExporting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        {/* Dialog header with title and description */}
        <DialogHeader>
          <DialogTitle>Export Report</DialogTitle>
          <DialogDescription>Generate and download reports for your projects.</DialogDescription>
        </DialogHeader>
        
        {/* Export configuration form */}
        <div className="grid gap-4 py-4">
          {/* Report type selection dropdown */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="report-type" className="text-right">
              Report Type
            </Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger id="report-type" className="col-span-3">
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="resource-allocation">Resource Allocation</SelectItem>
                <SelectItem value="project-status">Project Status</SelectItem>
                <SelectItem value="budget-analysis">Budget Analysis</SelectItem>
                <SelectItem value="carbon-footprint">Carbon Footprint</SelectItem>
                <SelectItem value="schedule-performance">Schedule Performance</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* File format selection dropdown */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="file-format" className="text-right">
              File Format
            </Label>
            <Select value={fileFormat} onValueChange={setFileFormat}>
              <SelectTrigger id="file-format" className="col-span-3">
                <SelectValue placeholder="Select file format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF Document</SelectItem>
                <SelectItem value="xlsx">Excel Spreadsheet</SelectItem>
                <SelectItem value="csv">CSV File</SelectItem>
                <SelectItem value="json">JSON Data</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Date range selection with calendar popup */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Date Range</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="col-span-3 justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {/* Display selected date range or placeholder text */}
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    "Select date range"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="range" selected={dateRange} onSelect={setDateRange as any} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Project selection checkboxes */}
          <div className="grid grid-cols-4 gap-4">
            <Label className="text-right pt-2">Projects</Label>
            <div className="col-span-3 space-y-2">
              {/* Map through available projects and create checkboxes */}
              {projects.map((project) => (
                <div key={project.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`project-${project.id}`}
                    checked={selectedProjects.includes(project.id)}
                    onCheckedChange={() => handleProjectToggle(project.id)}
                  />
                  <label
                    htmlFor={`project-${project.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {project.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Dialog footer with action buttons */}
        <DialogFooter>
          {/* Cancel button to close dialog without exporting */}
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          
          {/* Export button with loading state */}
          <Button type="button" onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <FileDown className="mr-2 h-4 w-4" />
                Export Report
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

