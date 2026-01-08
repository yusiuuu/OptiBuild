"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { 
  FileText, 
  Download, 
  FileSpreadsheet, 
  Calendar,
  BarChart3,
  Users,
  DollarSign,
  Clock,
  Loader2,
  CheckCircle2,
  Sparkles
} from 'lucide-react'
import { Project, Task, Resource, Report } from '@/lib/data-service'
import { 
  reportsService,
  budgetCategoriesService,
  expensesService,
  projectResourcesService,
  tasksService
} from '@/lib/data-service'
import { format } from 'date-fns'

interface ReportGeneratorProps {
  projectId: string
  project: Project
  tasks: Task[]
  resources: Resource[]
  onReportGenerated?: (report: Report) => void
}

interface ReportTemplate {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  sections: string[]
  format: 'pdf' | 'excel' | 'both'
  reportType: 'project-status' | 'budget' | 'resource-utilization' | 'task-progress' | 'comprehensive' | 'financial-summary' | 'resource-allocation'
}

export function ReportGenerator({ 
  projectId, 
  project, 
  tasks, 
  resources, 
  onReportGenerated 
}: ReportGeneratorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'excel'>('pdf')
  const [reportName, setReportName] = useState('')
  const [reportDescription, setReportDescription] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [savedReports, setSavedReports] = useState<Report[]>([])
  const [projectData, setProjectData] = useState<any>(null)

  // Report templates
  const reportTemplates: ReportTemplate[] = [
    {
      id: 'executive_summary',
      name: 'Executive Summary',
      description: 'High-level project overview for management',
      icon: <BarChart3 className="h-5 w-5" />,
      sections: ['project_overview', 'budget_summary', 'schedule_summary', 'risk_assessment'],
      format: 'pdf',
      reportType: 'project-status'
    },
    {
      id: 'detailed_analysis',
      name: 'Detailed Analysis',
      description: 'Comprehensive project analysis with all details',
      icon: <FileText className="h-5 w-5" />,
      sections: ['project_overview', 'task_breakdown', 'resource_analysis', 'budget_breakdown', 'schedule_analysis', 'risk_assessment', 'recommendations'],
      format: 'both',
      reportType: 'comprehensive'
    },
    {
      id: 'financial_report',
      name: 'Financial Report',
      description: 'Detailed financial analysis and cost breakdown',
      icon: <DollarSign className="h-5 w-5" />,
      sections: ['budget_summary', 'cost_breakdown', 'variance_analysis', 'financial_forecast'],
      format: 'excel',
      reportType: 'budget'
    },
    {
      id: 'progress_report',
      name: 'Progress Report',
      description: 'Current project status and progress tracking',
      icon: <Clock className="h-5 w-5" />,
      sections: ['project_overview', 'task_breakdown', 'schedule_analysis', 'resource_utilization', 'milestones'],
      format: 'pdf',
      reportType: 'task-progress'
    },
    {
      id: 'resource_report',
      name: 'Resource Report',
      description: 'Resource allocation and utilization analysis',
      icon: <Users className="h-5 w-5" />,
      sections: ['resource_overview', 'resource_utilization', 'resource_forecast', 'recommendations'],
      format: 'excel',
      reportType: 'resource-utilization'
    }
  ]

  // Load saved reports and project data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load saved reports
        const reports = await reportsService.getReports(projectId)
        setSavedReports(reports)

        // Load additional project data for reports
        const [budgetCategories, expenses, projectResources, allTasks] = await Promise.all([
          budgetCategoriesService.getProjectBudgetCategories(projectId).catch(() => []),
          expensesService.getProjectExpenses(projectId).catch(() => []),
          projectResourcesService.getProjectResources(projectId).catch(() => []),
          tasksService.getTasks(projectId).catch(() => [])
        ])

        setProjectData({
          budgetCategories,
          expenses,
          projectResources,
          tasks: allTasks
        })
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }

    loadData()
  }, [projectId])

  // Update report name when template changes
  useEffect(() => {
    if (selectedTemplate) {
      const template = reportTemplates.find(t => t.id === selectedTemplate)
      if (template) {
        setReportName(`${template.name} - ${project.name}`)
        setReportDescription(template.description)
        // Set format based on template
        if (template.format === 'both') {
          setSelectedFormat('pdf')
        } else {
          setSelectedFormat(template.format)
        }
      }
    }
  }, [selectedTemplate, project.name])

  // Generate actual report with real data
  const generateReport = async () => {
    if (!selectedTemplate || !reportName.trim()) {
      toast.error('Please select a template and provide a report name')
      return
    }

    setIsGenerating(true)
    setGenerationProgress(0)

    try {
      const template = reportTemplates.find(t => t.id === selectedTemplate)
      if (!template) {
        throw new Error('Template not found')
      }

      // Import report generator
      let generateReportLib
      try {
        const reportModule = await import('@/lib/report-generator')
        generateReportLib = reportModule.generateReport
        if (!generateReportLib) {
          throw new Error('Report generator function not found')
        }
      } catch (importError: any) {
        throw new Error(`Failed to load report generator: ${importError?.message || 'Unknown error'}`)
      }

      // Simulate progress
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 15
        })
      }, 300)

      // Generate report using the library
      // Map excel to xlsx for the library
      const formatForLib = selectedFormat === 'excel' ? 'excel' : selectedFormat
      
      let reportResult
      try {
        reportResult = await generateReportLib({
          type: template.reportType,
          projectId: projectId,
          includeCharts: true,
          includeDetails: true,
          format: formatForLib as 'pdf' | 'excel' | 'csv'
        })
      } catch (genError: any) {
        console.error('Error in generateReportLib:', genError)
        // Re-throw with more context
        throw new Error(`Failed to generate report: ${genError?.message || genError?.toString() || 'Unknown error'}`)
      }
      
      if (!reportResult || !reportResult.blob) {
        throw new Error('Report generation returned empty result')
      }

      clearInterval(progressInterval)
      setGenerationProgress(100)

      // Create report record
      let savedReport
      try {
        const report: Omit<Report, 'id' | 'generated_at'> = {
          project_id: projectId,
          user_id: '', // Will be set by the service
          report_name: reportName,
          report_type: selectedFormat,
          report_data: {
            template: selectedTemplate,
            format: selectedFormat,
            generatedAt: new Date().toISOString(),
            projectId,
            projectName: project.name
          },
          file_url: reportResult.filename
        }

        savedReport = await reportsService.createReport(report)
        setSavedReports(prev => [savedReport, ...prev])
      } catch (saveError: any) {
        console.warn('Error saving report record (report will still be downloaded):', saveError)
        // Continue even if saving fails - the report is still generated
        savedReport = {
          id: `temp-${Date.now()}`,
          project_id: projectId,
          user_id: '',
          report_name: reportName,
          report_type: selectedFormat,
          report_data: {},
          file_url: reportResult.filename,
          generated_at: new Date().toISOString()
        } as Report
      }

      // Trigger download
      const url = URL.createObjectURL(reportResult.blob)
      const link = document.createElement('a')
      link.href = url
      link.download = reportResult.filename
      
      // If it's an HTML file (for PDF), open in new window for printing
      if (reportResult.filename.endsWith('.html')) {
        // Open in new window
        const newWindow = window.open(url, '_blank')
        if (newWindow) {
          // Wait for window to load, then trigger print
          setTimeout(() => {
            newWindow.print()
          }, 500)
        }
        // Also download the file
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        // Direct download for other formats
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
      
      URL.revokeObjectURL(url)

      if (selectedFormat === 'pdf') {
        toast.success('Report generated! The print dialog will open automatically. Select "Save as PDF" to save the file.')
      } else {
        toast.success('Report generated and downloaded successfully!')
      }
      
      if (onReportGenerated) {
        onReportGenerated(savedReport)
      }

      // Reset form
      setTimeout(() => {
        setSelectedTemplate('')
        setReportName('')
        setReportDescription('')
        setGenerationProgress(0)
      }, 1000)
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error)
      
      console.error('Report generation error:', {
        error,
        errorType: typeof error,
        errorConstructor: error?.constructor?.name,
        errorKeys: error ? Object.keys(error) : [],
        extractedMessage: errorMessage
      })
      
      toast.error(`Report generation failed: ${errorMessage}`)
    } finally {
      setIsGenerating(false)
      setTimeout(() => setGenerationProgress(0), 2000)
    }
  }

  // Utility function to extract error message
  const extractErrorMessage = (error: any): string => {
    if (!error) return 'Unknown error occurred'
    
    // Try different ways to extract the error message
    if (typeof error === 'string') return error
    if (error instanceof Error) return error.message || error.toString()
    if (error.message) return String(error.message)
    if (error.details) {
      if (typeof error.details === 'string') return error.details
      if (error.details.message) return String(error.details.message)
      return JSON.stringify(error.details)
    }
    if (error.hint) return String(error.hint)
    if (error.code) return `Error code: ${error.code}`
    
    // Try to get all enumerable properties
    try {
      const keys = Object.keys(error)
      if (keys.length > 0) {
        const props = keys.map(key => {
          try {
            const value = error[key]
            if (value != null && typeof value !== 'function') {
              return `${key}: ${typeof value === 'object' ? JSON.stringify(value) : String(value)}`
            }
          } catch {
            return null
          }
          return null
        }).filter(Boolean)
        
        if (props.length > 0) {
          return props.join(', ')
        }
      }
    } catch {
      // Ignore
    }
    
    // Last resort
    try {
      return JSON.stringify(error, null, 2)
    } catch {
      return 'An error occurred but could not be serialized'
    }
  }

  const selectedTemplateObj = reportTemplates.find(t => t.id === selectedTemplate)

  return (
    <div className="space-y-6">
      {/* Report Generation */}
      <Card className="border-2">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            Generate Report
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Create comprehensive reports based on real-time project data
          </p>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Template Selection */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Report Template</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reportTemplates.map((template) => (
                <Card 
                  key={template.id}
                  className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                    selectedTemplate === template.id 
                      ? 'ring-2 ring-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 border-blue-300' 
                      : 'hover:border-blue-200'
                  }`}
                  onClick={() => setSelectedTemplate(template.id)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                          selectedTemplate === template.id 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-muted'
                        }`}>
                          {template.icon}
                        </div>
                        <div>
                          <h4 className="font-semibold text-lg">{template.name}</h4>
                        </div>
                      </div>
                      {selectedTemplate === template.id && (
                        <CheckCircle2 className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        selectedTemplate === template.id 
                          ? 'border-blue-500 text-blue-600' 
                          : ''
                      }`}
                    >
                      {template.format === 'both' ? 'PDF & Excel' : template.format.toUpperCase()}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Report Configuration */}
          {selectedTemplate && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg border-2 border-dashed">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-lg">Report Configuration</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reportName" className="text-sm font-medium">Report Name</Label>
                  <Input
                    id="reportName"
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                    placeholder="Enter report name"
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reportFormat" className="text-sm font-medium">Format</Label>
                  <Select 
                    value={selectedFormat} 
                    onValueChange={(value: 'pdf' | 'excel') => {
                      const template = reportTemplates.find(t => t.id === selectedTemplate)
                      if (template?.format === 'both' || (template?.format === value)) {
                        setSelectedFormat(value)
                      } else {
                        toast.error(`This template only supports ${template?.format.toUpperCase()} format`)
                      }
                    }}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedTemplateObj?.format === 'both' && (
                        <>
                          <SelectItem value="pdf">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              PDF
                            </div>
                          </SelectItem>
                          <SelectItem value="excel">
                            <div className="flex items-center gap-2">
                              <FileSpreadsheet className="h-4 w-4" />
                              Excel
                            </div>
                          </SelectItem>
                        </>
                      )}
                      {selectedTemplateObj?.format === 'pdf' && (
                        <SelectItem value="pdf">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            PDF
                          </div>
                        </SelectItem>
                      )}
                      {selectedTemplateObj?.format === 'excel' && (
                        <SelectItem value="excel">
                          <div className="flex items-center gap-2">
                            <FileSpreadsheet className="h-4 w-4" />
                            Excel
                          </div>
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reportDescription" className="text-sm font-medium">Description</Label>
                <Textarea
                  id="reportDescription"
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Enter report description"
                  rows={3}
                  className="bg-background"
                />
              </div>

              {/* Report Preview Info */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      This report will include real-time data:
                    </p>
                    <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                      <li>Project overview and status</li>
                      <li>Task breakdown and progress ({tasks.length} tasks)</li>
                      <li>Budget analysis and expenses</li>
                      <li>Resource allocation and utilization</li>
                      <li>Schedule analysis and milestones</li>
                      {projectData && (
                        <>
                          {projectData.budgetCategories.length > 0 && (
                            <li>{projectData.budgetCategories.length} budget categories</li>
                          )}
                          {projectData.expenses.length > 0 && (
                            <li>{projectData.expenses.length} expense records</li>
                          )}
                          {projectData.projectResources.length > 0 && (
                            <li>{projectData.projectResources.length} allocated resources</li>
                          )}
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Generation Progress */}
          {isGenerating && (
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg border-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span className="text-sm font-medium">Generating Report...</span>
                </div>
                <span className="text-sm font-semibold text-blue-600">{generationProgress}%</span>
              </div>
              <Progress value={generationProgress} className="h-3" />
              <p className="text-xs text-muted-foreground">
                Fetching real-time data and compiling report...
              </p>
            </div>
          )}

          {/* Generate Button */}
          <Button 
            onClick={generateReport} 
            disabled={!selectedTemplate || !reportName.trim() || isGenerating}
            className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating Report...
              </>
            ) : (
              <>
                <Download className="mr-2 h-5 w-5" />
                Generate & Download Report
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Saved Reports */}
      <Card className="border-2">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 border-b">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Calendar className="h-5 w-5" />
            Saved Reports
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Previously generated reports for this project
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          {savedReports.length === 0 ? (
            <div className="text-center py-12">
              <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <FileText className="h-8 w-8 text-muted-foreground opacity-50" />
              </div>
              <p className="text-muted-foreground font-medium">No reports generated yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Generate your first report to see it here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {savedReports.map((report) => (
                <Card key={report.id} className="border-2 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                          report.report_type === 'pdf' 
                            ? 'bg-red-100 dark:bg-red-900/30' 
                            : 'bg-green-100 dark:bg-green-900/30'
                        }`}>
                          {report.report_type === 'pdf' ? (
                            <FileText className="h-6 w-6 text-red-600 dark:text-red-400" />
                          ) : (
                            <FileSpreadsheet className="h-6 w-6 text-green-600 dark:text-green-400" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-base">{report.report_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {report.report_type.toUpperCase()} • {format(new Date(report.generated_at || ''), 'MMM dd, yyyy HH:mm')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {report.report_type.toUpperCase()}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
