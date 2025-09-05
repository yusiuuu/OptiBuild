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
import { 
  FileText, 
  Download, 
  FileSpreadsheet, 
  Calendar,
  BarChart3,
  Users,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  Loader2
} from 'lucide-react'
import { Project, Task, Resource, Report } from '@/lib/data-service'
import { reportsService } from '@/lib/data-service'
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
}

interface ReportSection {
  id: string
  name: string
  description: string
  required: boolean
  included: boolean
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
  const [selectedSections, setSelectedSections] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [savedReports, setSavedReports] = useState<Report[]>([])

  // Report templates
  const reportTemplates: ReportTemplate[] = [
    {
      id: 'executive_summary',
      name: 'Executive Summary',
      description: 'High-level project overview for management',
      icon: <BarChart3 className="h-5 w-5" />,
      sections: ['project_overview', 'budget_summary', 'schedule_summary', 'risk_assessment'],
      format: 'pdf'
    },
    {
      id: 'detailed_analysis',
      name: 'Detailed Analysis',
      description: 'Comprehensive project analysis with all details',
      icon: <FileText className="h-5 w-5" />,
      sections: ['project_overview', 'task_breakdown', 'resource_analysis', 'budget_breakdown', 'schedule_analysis', 'risk_assessment', 'recommendations'],
      format: 'both'
    },
    {
      id: 'financial_report',
      name: 'Financial Report',
      description: 'Detailed financial analysis and cost breakdown',
      icon: <DollarSign className="h-5 w-5" />,
      sections: ['budget_summary', 'cost_breakdown', 'variance_analysis', 'financial_forecast'],
      format: 'excel'
    },
    {
      id: 'progress_report',
      name: 'Progress Report',
      description: 'Current project status and progress tracking',
      icon: <Clock className="h-5 w-5" />,
      sections: ['project_overview', 'task_breakdown', 'schedule_analysis', 'resource_utilization', 'milestones'],
      format: 'pdf'
    },
    {
      id: 'resource_report',
      name: 'Resource Report',
      description: 'Resource allocation and utilization analysis',
      icon: <Users className="h-5 w-5" />,
      sections: ['resource_overview', 'resource_utilization', 'resource_forecast', 'recommendations'],
      format: 'excel'
    }
  ]

  // Report sections
  const reportSections: ReportSection[] = [
    {
      id: 'project_overview',
      name: 'Project Overview',
      description: 'Basic project information and status',
      required: true,
      included: true
    },
    {
      id: 'task_breakdown',
      name: 'Task Breakdown',
      description: 'Detailed task list with status and progress',
      required: false,
      included: false
    },
    {
      id: 'resource_analysis',
      name: 'Resource Analysis',
      description: 'Resource allocation and utilization data',
      required: false,
      included: false
    },
    {
      id: 'budget_summary',
      name: 'Budget Summary',
      description: 'High-level budget overview and totals',
      required: true,
      included: true
    },
    {
      id: 'budget_breakdown',
      name: 'Budget Breakdown',
      description: 'Detailed cost breakdown by category',
      required: false,
      included: false
    },
    {
      id: 'schedule_analysis',
      name: 'Schedule Analysis',
      description: 'Timeline analysis and critical path',
      required: false,
      included: false
    },
    {
      id: 'variance_analysis',
      name: 'Variance Analysis',
      description: 'Budget and schedule variance analysis',
      required: false,
      included: false
    },
    {
      id: 'risk_assessment',
      name: 'Risk Assessment',
      description: 'Identified risks and mitigation strategies',
      required: false,
      included: false
    },
    {
      id: 'resource_utilization',
      name: 'Resource Utilization',
      description: 'Resource usage statistics and trends',
      required: false,
      included: false
    },
    {
      id: 'financial_forecast',
      name: 'Financial Forecast',
      description: 'Projected costs and budget requirements',
      required: false,
      included: false
    },
    {
      id: 'milestones',
      name: 'Milestones',
      description: 'Key project milestones and achievements',
      required: false,
      included: false
    },
    {
      id: 'recommendations',
      name: 'Recommendations',
      description: 'Action items and improvement suggestions',
      required: false,
      included: false
    }
  ]

  // Load saved reports
  useEffect(() => {
    const loadReports = async () => {
      try {
        const reports = await reportsService.getReports(projectId)
        setSavedReports(reports)
      } catch (error) {
        console.error('Error loading reports:', error)
      }
    }

    loadReports()
  }, [projectId])

  // Update selected sections when template changes
  useEffect(() => {
    if (selectedTemplate) {
      const template = reportTemplates.find(t => t.id === selectedTemplate)
      if (template) {
        setSelectedSections(template.sections)
        setReportName(`${template.name} - ${project.name}`)
        setReportDescription(template.description)
      }
    }
  }, [selectedTemplate, project.name])

  // Generate report
  const generateReport = async () => {
    if (!selectedTemplate || !reportName.trim()) {
      alert('Please select a template and provide a report name.')
      return
    }

    setIsGenerating(true)
    setGenerationProgress(0)

    try {
      // Simulate report generation progress
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      // Prepare report data
      const reportData = {
        project: project,
        tasks: tasks,
        resources: resources,
        template: selectedTemplate,
        sections: selectedSections,
        format: selectedFormat,
        generatedAt: new Date().toISOString()
      }

      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Create report record
      const report: Omit<Report, 'id' | 'generated_at'> = {
        project_id: projectId,
        user_id: '', // Will be set by the service
        report_name: reportName,
        report_type: selectedFormat,
        report_data: reportData,
        file_url: `reports/${projectId}/${reportName.replace(/\s+/g, '_')}_${Date.now()}.${selectedFormat}`
      }

      const savedReport = await reportsService.createReport(report)
      setSavedReports(prev => [savedReport, ...prev])

      setGenerationProgress(100)
      
      if (onReportGenerated) {
        onReportGenerated(savedReport)
      }

      // Simulate file download
      setTimeout(() => {
        const blob = new Blob(['Report content'], { type: 'application/octet-stream' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${reportName.replace(/\s+/g, '_')}.${selectedFormat}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }, 500)

      alert('Report generated and downloaded successfully!')
    } catch (error) {
      console.error('Error generating report:', error)
      alert('Error generating report. Please try again.')
    } finally {
      setIsGenerating(false)
      setGenerationProgress(0)
    }
  }

  // Toggle section selection
  const toggleSection = (sectionId: string) => {
    const section = reportSections.find(s => s.id === sectionId)
    if (section?.required) return

    setSelectedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  return (
    <div className="space-y-6">
      {/* Report Generation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate Report
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Template Selection */}
          <div className="space-y-4">
            <Label>Report Template</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reportTemplates.map((template) => (
                <Card 
                  key={template.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedTemplate === template.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedTemplate(template.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      {template.icon}
                      <h4 className="font-semibold">{template.name}</h4>
                    </div>
                    <p className="text-sm text-gray-600">{template.description}</p>
                    <div className="mt-2">
                      <Badge variant="outline" className="text-xs">
                        {template.format === 'both' ? 'PDF & Excel' : template.format.toUpperCase()}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Report Details */}
          {selectedTemplate && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reportName">Report Name</Label>
                  <Input
                    id="reportName"
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                    placeholder="Enter report name"
                  />
                </div>
                <div>
                  <Label htmlFor="reportFormat">Format</Label>
                  <Select value={selectedFormat} onValueChange={(value: any) => setSelectedFormat(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
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
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="reportDescription">Description</Label>
                <Textarea
                  id="reportDescription"
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Enter report description"
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Section Selection */}
          {selectedTemplate && (
            <div className="space-y-4">
              <Label>Report Sections</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reportSections.map((section) => (
                  <div key={section.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      id={section.id}
                      checked={selectedSections.includes(section.id)}
                      onCheckedChange={() => toggleSection(section.id)}
                      disabled={section.required}
                    />
                    <div className="flex-1">
                      <Label 
                        htmlFor={section.id} 
                        className={`text-sm font-medium ${section.required ? 'text-gray-500' : 'cursor-pointer'}`}
                      >
                        {section.name}
                        {section.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      <p className="text-xs text-gray-600 mt-1">{section.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Generation Progress */}
          {isGenerating && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Generating Report...</span>
                <span className="text-sm text-gray-600">{generationProgress}%</span>
              </div>
              <Progress value={generationProgress} className="h-2" />
            </div>
          )}

          {/* Generate Button */}
          <Button 
            onClick={generateReport} 
            disabled={!selectedTemplate || !reportName.trim() || isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Generate & Download Report
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Saved Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Saved Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          {savedReports.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No reports generated yet.</p>
              <p className="text-sm">Generate your first report to see it here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {savedReports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {report.report_type === 'pdf' ? (
                      <FileText className="h-8 w-8 text-red-600" />
                    ) : (
                      <FileSpreadsheet className="h-8 w-8 text-green-600" />
                    )}
                    <div>
                      <h4 className="font-semibold">{report.report_name}</h4>
                      <p className="text-sm text-gray-600">
                        {report.report_type.toUpperCase()} • {format(new Date(report.generated_at || ''), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {report.report_type.toUpperCase()}
                    </Badge>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
