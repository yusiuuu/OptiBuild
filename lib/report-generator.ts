// Report Generator
// Generates various types of reports from database data

import {
  projectsService,
  tasksService,
  expensesService,
  resourcesCatalogService,
  projectResourcesService,
  budgetCategoriesService,
} from './data-service'
import { format } from 'date-fns'

interface ReportOptions {
  type: 'project-status' | 'budget' | 'resource-utilization' | 'task-progress' | 'comprehensive' | 'financial-summary' | 'resource-allocation'
  projectId?: string
  includeCharts?: boolean
  includeDetails?: boolean
  format: 'pdf' | 'excel' | 'csv'
}

interface ReportData {
  title: string
  generatedAt: string
  projectName?: string
  sections: ReportSection[]
}

interface ReportSection {
  title: string
  content: string
  data?: any[]
}

export async function generateReport(options: ReportOptions): Promise<{ blob: Blob; filename: string }> {
  try {
    // Fetch data based on report type
    const reportData = await fetchReportData(options)
    
    if (!reportData || !reportData.sections || reportData.sections.length === 0) {
      throw new Error('No data available to generate report. Please ensure the project has data.')
    }
    
    // Generate content based on format
    let blob: Blob
    let filename: string

    try {
      switch (options.format) {
        case 'pdf':
          blob = await generatePDF(reportData, options)
          // Use .html extension so it opens in browser, user can print to PDF
          // Or use data URI approach for true PDF
          filename = `${reportData.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.html`
          break
        case 'excel':
          blob = await generateExcel(reportData, options)
          filename = `${reportData.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`
          break
        case 'csv':
          blob = await generateCSV(reportData, options)
          filename = `${reportData.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`
          break
        default:
          throw new Error(`Unsupported format: ${options.format}`)
      }
    } catch (formatError: any) {
      throw new Error(`Error generating ${options.format} file: ${formatError.message || formatError}`)
    }

    if (!blob) {
      throw new Error('Failed to generate report file')
    }

    return { blob, filename }
  } catch (error: any) {
    console.error('Error in generateReport:', error)
    
    // Extract error message more comprehensively
    let errorMessage = 'Unknown error occurred'
    
    if (error) {
      if (error.message) {
        errorMessage = String(error.message)
      } else if (error.details) {
        errorMessage = typeof error.details === 'string' ? error.details : JSON.stringify(error.details)
      } else if (error.hint) {
        errorMessage = String(error.hint)
      } else if (error.code) {
        errorMessage = `Database error (code: ${error.code})`
      } else if (typeof error === 'string') {
        errorMessage = error
      } else if (error instanceof Error) {
        errorMessage = error.message || error.toString()
      } else {
        // Try to extract all properties
        try {
          const props: string[] = []
          for (const key in error) {
            try {
              const value = error[key]
              if (value != null && typeof value !== 'function') {
                props.push(`${key}: ${typeof value === 'object' ? JSON.stringify(value) : String(value)}`)
              }
            } catch (e) {
              // Skip this property
            }
          }
          if (props.length > 0) {
            errorMessage = props.join(', ')
          } else {
            errorMessage = 'An error occurred during report generation'
          }
        } catch (e) {
          errorMessage = 'An error occurred during report generation'
        }
      }
    }
    
    throw new Error(`Report generation failed: ${errorMessage}`)
  }
}

async function fetchReportData(options: ReportOptions): Promise<ReportData> {
  try {
    const sections: ReportSection[] = []
    let title = ''
    let projectName: string | undefined

    // Fetch projects
    const allProjects = await projectsService.getProjects()
    const projects = options.projectId
      ? allProjects.filter(p => p.id === options.projectId)
      : allProjects

    if (options.projectId && projects.length === 0) {
      throw new Error(`Project with ID ${options.projectId} not found`)
    }

    if (options.projectId && projects.length > 0) {
      projectName = projects[0].name
    }

    // Generate sections based on report type
    try {
      switch (options.type) {
        case 'project-status':
          title = projectName ? `${projectName} - Status Report` : 'All Projects Status Report'
          sections.push(...await generateProjectStatusSections(projects, options))
          break

        case 'budget':
          title = projectName ? `${projectName} - Budget Report` : 'All Projects Budget Report'
          sections.push(...await generateBudgetSections(projects, options))
          break

        case 'resource-utilization':
          title = 'Resource Utilization Report'
          sections.push(...await generateResourceUtilizationSections(projects, options))
          break

        case 'task-progress':
          title = projectName ? `${projectName} - Task Progress Report` : 'All Projects Task Progress Report'
          sections.push(...await generateTaskProgressSections(projects, options))
          break

        case 'comprehensive':
          title = projectName ? `${projectName} - Comprehensive Report` : 'All Projects Comprehensive Report'
          sections.push(...await generateComprehensiveSections(projects, options))
          break

        case 'financial-summary':
          title = 'Financial Summary Report'
          sections.push(...await generateFinancialSummarySections(projects, options))
          break

        case 'resource-allocation':
          title = 'Resource Allocation Report'
          sections.push(...await generateResourceAllocationSections(projects, options))
          break

        default:
          throw new Error(`Unknown report type: ${options.type}`)
      }
    } catch (sectionError: any) {
      console.error('Error generating report sections:', sectionError)
      throw new Error(`Failed to generate report sections: ${sectionError.message || sectionError}`)
    }

    // Ensure we have at least one section
    if (sections.length === 0) {
      sections.push({
        title: 'Report Information',
        content: 'No data available for this report. Please ensure the project has relevant data.',
      })
    }

    return {
      title: title || 'Project Report',
      generatedAt: new Date().toISOString(),
      projectName,
      sections,
    }
  } catch (error: any) {
    console.error('Error in fetchReportData:', error)
    
    // Extract error message comprehensively
    let errorMessage = 'Unknown error occurred'
    if (error) {
      if (error.message) {
        errorMessage = String(error.message)
      } else if (error.details) {
        errorMessage = typeof error.details === 'string' ? error.details : JSON.stringify(error.details)
      } else if (error.hint) {
        errorMessage = String(error.hint)
      } else if (error.code) {
        errorMessage = `Database error (code: ${error.code})`
      } else if (typeof error === 'string') {
        errorMessage = error
      } else if (error instanceof Error) {
        errorMessage = error.message || error.toString()
      } else {
        // Try to extract properties
        try {
          const props: string[] = []
          for (const key in error) {
            try {
              const value = error[key]
              if (value != null && typeof value !== 'function') {
                props.push(`${key}: ${typeof value === 'object' ? JSON.stringify(value) : String(value)}`)
              }
            } catch (e) {
              // Skip
            }
          }
          if (props.length > 0) {
            errorMessage = props.join(', ')
          }
        } catch (e) {
          errorMessage = 'An error occurred while fetching report data'
        }
      }
    }
    
    throw new Error(`Failed to fetch report data: ${errorMessage}`)
  }
}

async function generateProjectStatusSections(projects: any[], options: ReportOptions): Promise<ReportSection[]> {
  try {
    const sections: ReportSection[] = []

    // Project Overview
    let overviewContent = `Total Projects: ${projects.length}\n\n`
    projects.forEach(project => {
      overviewContent += `Project: ${project.name || 'Unnamed Project'}\n`
      overviewContent += `Status: ${project.status || 'N/A'}\n`
      overviewContent += `Progress: ${project.progress || 0}%\n`
      overviewContent += `Budget: ${project.budget ? `₹${Number(project.budget).toLocaleString('en-IN')}` : 'N/A'}\n`
      if (project.start_date) {
        try {
          overviewContent += `Start Date: ${new Date(project.start_date).toLocaleDateString()}\n`
        } catch {
          overviewContent += `Start Date: ${project.start_date}\n`
        }
      }
      if (project.end_date) {
        try {
          overviewContent += `End Date: ${new Date(project.end_date).toLocaleDateString()}\n`
        } catch {
          overviewContent += `End Date: ${project.end_date}\n`
        }
      }
      overviewContent += `\n`
    })

    sections.push({
      title: 'Project Overview',
      content: overviewContent,
    })

    // Task Summary
    if (options.includeDetails) {
      let taskContent = ''
      for (const project of projects) {
        try {
          if (!project.id) continue
          const tasks = await tasksService.getTasks(project.id)
          taskContent += `\n${project.name || 'Unnamed Project'}:\n`
          taskContent += `Total Tasks: ${tasks.length}\n`
          
          const statusCounts = tasks.reduce((acc: any, task: any) => {
            const status = task.status || 'unknown'
            acc[status] = (acc[status] || 0) + 1
            return acc
          }, {})
          
          Object.entries(statusCounts).forEach(([status, count]) => {
            taskContent += `  ${status}: ${count}\n`
          })
        } catch (error: any) {
          console.error(`Error loading tasks for ${project.id}:`, error)
          taskContent += `\n${project.name || 'Unnamed Project'}:\n`
          taskContent += `  Error loading tasks: ${error?.message || 'Unknown error'}\n`
        }
      }

      sections.push({
        title: 'Task Summary',
        content: taskContent || 'No tasks found',
      })
    }

    return sections
  } catch (error: any) {
    console.error('Error in generateProjectStatusSections:', error)
    return [{
      title: 'Error',
      content: `Failed to generate project status sections: ${error?.message || error?.toString() || 'Unknown error'}`
    }]
  }
}

async function generateBudgetSections(projects: any[], options: ReportOptions): Promise<ReportSection[]> {
  try {
    const sections: ReportSection[] = []

    let budgetContent = ''
    let totalBudget = 0
    let totalExpenses = 0

    for (const project of projects) {
      try {
        if (!project.id) continue
        const budgetCategories = await budgetCategoriesService.getProjectBudgetCategories(project.id)
        const expenses = await expensesService.getProjectExpenses(project.id)

        const projectBudget = Number(project.budget) || 0
        const projectExpenses = expenses.reduce((sum: number, exp: any) => sum + (Number(exp.amount) || 0), 0)
        const plannedAmount = budgetCategories.reduce((sum: number, cat: any) => sum + (Number(cat.planned_amount) || 0), 0)
        const actualAmount = budgetCategories.reduce((sum: number, cat: any) => sum + (Number(cat.actual_amount) || 0), 0)

        budgetContent += `\n${project.name || 'Unnamed Project'}:\n`
        budgetContent += `Budget: ₹${projectBudget.toLocaleString('en-IN')}\n`
        budgetContent += `Total Expenses: ₹${projectExpenses.toLocaleString('en-IN')}\n`
        budgetContent += `Planned (Categories): ₹${plannedAmount.toLocaleString('en-IN')}\n`
        budgetContent += `Actual (Categories): ₹${actualAmount.toLocaleString('en-IN')}\n`
        budgetContent += `Remaining: ₹${(projectBudget - projectExpenses).toLocaleString('en-IN')}\n`
        budgetContent += `Utilization: ${projectBudget > 0 ? ((projectExpenses / projectBudget) * 100).toFixed(2) : 0}%\n\n`

        totalBudget += projectBudget
        totalExpenses += projectExpenses
      } catch (error: any) {
        console.error(`Error loading budget for ${project.id}:`, error)
        budgetContent += `\n${project.name || 'Unnamed Project'}:\n`
        budgetContent += `  Error loading budget data: ${error?.message || 'Unknown error'}\n\n`
      }
    }

    budgetContent = `Summary:\nTotal Budget: ₹${totalBudget.toLocaleString('en-IN')}\nTotal Expenses: ₹${totalExpenses.toLocaleString('en-IN')}\nOverall Utilization: ${totalBudget > 0 ? ((totalExpenses / totalBudget) * 100).toFixed(2) : 0}%\n\n${budgetContent}`

    sections.push({
      title: 'Budget & Expenses',
      content: budgetContent || 'No budget data available',
    })

    return sections
  } catch (error: any) {
    console.error('Error in generateBudgetSections:', error)
    return [{
      title: 'Budget & Expenses',
      content: `Failed to generate budget sections: ${error?.message || error?.toString() || 'Unknown error'}`
    }]
  }
}

async function generateResourceUtilizationSections(projects: any[], options: ReportOptions): Promise<ReportSection[]> {
  const sections: ReportSection[] = []

  try {
    const allResources = await resourcesCatalogService.getResources()
    
    let resourceContent = 'Resource Catalog:\n\n'
    resourceContent += `Total Resources: ${allResources.length}\n\n`

    const byType = allResources.reduce((acc: any, res: any) => {
      const type = res.type || 'unknown'
      if (!acc[type]) acc[type] = []
      acc[type].push(res)
      return acc
    }, {})

    Object.entries(byType).forEach(([type, resources]: [string, any]) => {
      resourceContent += `${type.toUpperCase()}:\n`
      resources.forEach((res: any) => {
        resourceContent += `  ${res.name}: ${res.quantity || 0} ${res.unit || ''}\n`
      })
      resourceContent += `\n`
    })

    // Project allocations
    if (options.includeDetails) {
      resourceContent += '\nProject Allocations:\n\n'
      for (const project of projects) {
        try {
          const projectResources = await projectResourcesService.getProjectResources(project.id)
          if (projectResources.length > 0) {
            resourceContent += `${project.name}:\n`
            projectResources.forEach((pr: any) => {
              resourceContent += `  ${pr.resource?.name || 'Unknown'}: ${pr.quantity || 0} ${pr.resource?.unit || ''}\n`
            })
            resourceContent += `\n`
          }
        } catch (error) {
          console.error(`Error loading resources for ${project.id}:`, error)
        }
      }
    }

    sections.push({
      title: 'Resource Utilization',
      content: resourceContent,
    })
  } catch (error) {
    console.error('Error generating resource utilization:', error)
  }

  return sections
}

async function generateTaskProgressSections(projects: any[], options: ReportOptions): Promise<ReportSection[]> {
  const sections: ReportSection[] = []

  let taskContent = ''
  let totalTasks = 0
  let completedTasks = 0
  let inProgressTasks = 0

  for (const project of projects) {
    try {
      const tasks = await tasksService.getTasks(project.id)
      totalTasks += tasks.length
      
      const completed = tasks.filter((t: any) => t.status === 'completed').length
      const inProgress = tasks.filter((t: any) => t.status === 'in-progress' || t.status === 'in_progress').length
      
      completedTasks += completed
      inProgressTasks += inProgress

      taskContent += `\n${project.name}:\n`
      taskContent += `Total Tasks: ${tasks.length}\n`
      taskContent += `Completed: ${completed}\n`
      taskContent += `In Progress: ${inProgress}\n`
      taskContent += `Not Started: ${tasks.length - completed - inProgress}\n`

      if (options.includeDetails) {
        taskContent += `\nTask Details:\n`
        tasks.forEach((task: any) => {
          taskContent += `  - ${task.title || task.name || 'Untitled'}: ${task.status || 'unknown'} (${task.progress || 0}%)\n`
        })
      }
      taskContent += `\n`
    } catch (error) {
      console.error(`Error loading tasks for ${project.id}:`, error)
    }
  }

  taskContent = `Summary:\nTotal Tasks: ${totalTasks}\nCompleted: ${completedTasks}\nIn Progress: ${inProgressTasks}\nCompletion Rate: ${totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(2) : 0}%\n\n${taskContent}`

  sections.push({
    title: 'Task Progress',
    content: taskContent,
  })

  return sections
}

async function generateComprehensiveSections(projects: any[], options: ReportOptions): Promise<ReportSection[]> {
  const sections: ReportSection[] = []

  // Combine all report types
  sections.push(...await generateProjectStatusSections(projects, options))
  sections.push(...await generateBudgetSections(projects, options))
  sections.push(...await generateTaskProgressSections(projects, options))
  sections.push(...await generateResourceUtilizationSections(projects, options))

  return sections
}

async function generateFinancialSummarySections(projects: any[], options: ReportOptions): Promise<ReportSection[]> {
  const sections: ReportSection[] = []

  let financialContent = 'Financial Summary\n\n'
  let totalBudget = 0
  let totalExpenses = 0

  for (const project of projects) {
    try {
      const expenses = await expensesService.getProjectExpenses(project.id)
      const projectBudget = project.budget || 0
      const projectExpenses = expenses.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0)

      totalBudget += projectBudget
      totalExpenses += projectExpenses

      financialContent += `${project.name || 'Unnamed Project'}:\n`
      financialContent += `  Budget: ₹${Number(projectBudget).toLocaleString('en-IN')}\n`
      financialContent += `  Expenses: ₹${Number(projectExpenses).toLocaleString('en-IN')}\n`
      financialContent += `  Remaining: ₹${Number(projectBudget - projectExpenses).toLocaleString('en-IN')}\n`
      financialContent += `  Variance: ${projectBudget > 0 ? (((projectExpenses - projectBudget) / projectBudget) * 100).toFixed(2) : 0}%\n\n`
    } catch (error) {
      console.error(`Error loading financial data for ${project.id}:`, error)
    }
  }

  financialContent = `Overall Summary:\nTotal Budget: ₹${Number(totalBudget).toLocaleString('en-IN')}\nTotal Expenses: ₹${Number(totalExpenses).toLocaleString('en-IN')}\nTotal Remaining: ₹${Number(totalBudget - totalExpenses).toLocaleString('en-IN')}\nOverall Variance: ${totalBudget > 0 ? (((totalExpenses - totalBudget) / totalBudget) * 100).toFixed(2) : 0}%\n\n${financialContent}`

  sections.push({
    title: 'Financial Summary',
    content: financialContent,
  })

  return sections
}

async function generateResourceAllocationSections(projects: any[], options: ReportOptions): Promise<ReportSection[]> {
  return await generateResourceUtilizationSections(projects, options)
}

// Generate PDF (HTML-based that can be printed to PDF)
async function generatePDF(data: ReportData, options: ReportOptions): Promise<Blob> {
  // Create comprehensive HTML document with styling
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title}</title>
  <style>
    @media print {
      @page {
        margin: 2cm;
        size: A4;
      }
      body {
        margin: 0;
        padding: 0;
      }
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #fff;
      padding: 40px;
      max-width: 210mm;
      margin: 0 auto;
    }
    .header {
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #1e40af;
      font-size: 28px;
      margin-bottom: 10px;
    }
    .header .meta {
      color: #64748b;
      font-size: 14px;
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
    }
    .section {
      margin-bottom: 40px;
      page-break-inside: avoid;
    }
    .section-title {
      color: #1e40af;
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e2e8f0;
    }
    .section-content {
      font-size: 14px;
      line-height: 1.8;
      white-space: pre-wrap;
      color: #475569;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      font-size: 13px;
    }
    .data-table th {
      background: #f1f5f9;
      color: #1e293b;
      padding: 10px;
      text-align: left;
      font-weight: 600;
      border: 1px solid #e2e8f0;
    }
    .data-table td {
      padding: 10px;
      border: 1px solid #e2e8f0;
    }
    .data-table tr:nth-child(even) {
      background: #f8fafc;
    }
    .metric-box {
      display: inline-block;
      background: #f1f5f9;
      padding: 12px 20px;
      margin: 8px 8px 8px 0;
      border-radius: 6px;
      border-left: 4px solid #2563eb;
    }
    .metric-label {
      font-size: 12px;
      color: #64748b;
      margin-bottom: 4px;
    }
    .metric-value {
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e2e8f0;
      text-align: center;
      color: #94a3b8;
      font-size: 12px;
    }
    .highlight {
      background: #fef3c7;
      padding: 2px 6px;
      border-radius: 3px;
      font-weight: 500;
    }
    .success {
      color: #059669;
      font-weight: 600;
    }
    .warning {
      color: #d97706;
      font-weight: 600;
    }
    .error {
      color: #dc2626;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${escapeHtml(data.title)}</h1>
    <div class="meta">
      <span><strong>Generated:</strong> ${format(new Date(data.generatedAt), 'MMMM dd, yyyy HH:mm')}</span>
      ${data.projectName ? `<span><strong>Project:</strong> ${escapeHtml(data.projectName)}</span>` : ''}
      <span><strong>Format:</strong> PDF Report</span>
    </div>
  </div>

  ${data.sections.map(section => `
    <div class="section">
      <h2 class="section-title">${escapeHtml(section.title)}</h2>
      <div class="section-content">${formatSectionContent(section.content, section.data)}</div>
    </div>
  `).join('')}

  <div class="footer">
    <p>Generated by OptiBuild - Smart Construction Resource Optimization System</p>
    <p>This report contains real-time data from your project database</p>
    <p style="margin-top: 10px; font-size: 11px; color: #94a3b8;">
      <strong>Note:</strong> To save as PDF, use your browser's Print function (Ctrl+P / Cmd+P) and select "Save as PDF" as the destination.
    </p>
  </div>
  <script>
    // Auto-trigger print dialog when page loads
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>`

  // Create blob with HTML content
  // Note: This creates an HTML file. For true PDF, you'd need a library like jsPDF
  // But this HTML can be opened and printed to PDF using browser's print function
  return new Blob([htmlContent], { type: 'text/html' })
}

// Helper function to escape HTML (server-safe)
function escapeHtml(text: string): string {
  if (!text) return ''
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// Helper function to format section content with tables and metrics
function formatSectionContent(content: string, data?: any[]): string {
  if (!content) return 'No data available'
  
  // Convert content to HTML, preserving line breaks and formatting
  let html = escapeHtml(content)
  
  // Replace line breaks with <br>
  html = html.replace(/\n/g, '<br>')
  
  // Format numbers and currency
  html = html.replace(/₹(\d+(?:,\d{3})*(?:\.\d{2})?)/g, '<span class="highlight">₹$1</span>')
  
  // Format percentages
  html = html.replace(/(\d+\.?\d*)%/g, '<span class="highlight">$1%</span>')
  
  // Format status indicators
  html = html.replace(/(under budget|on track|completed)/gi, '<span class="success">$1</span>')
  html = html.replace(/(over budget|at risk|delayed)/gi, '<span class="error">$1</span>')
  html = html.replace(/(warning|pending)/gi, '<span class="warning">$1</span>')
  
  // If data array is provided, create a table
  if (data && Array.isArray(data) && data.length > 0) {
    const tableHtml = generateDataTable(data)
    html += '<br><br>' + tableHtml
  }
  
  return html
}

// Helper function to generate HTML table from data array
function generateDataTable(data: any[]): string {
  if (!data || data.length === 0) return ''
  
  // Get all unique keys from the data
  const keys = new Set<string>()
  data.forEach(item => {
    if (typeof item === 'object' && item !== null) {
      Object.keys(item).forEach(key => keys.add(key))
    }
  })
  
  const headers = Array.from(keys).filter(key => 
    key !== 'id' && 
    typeof data[0][key] !== 'object' && 
    typeof data[0][key] !== 'function'
  )
  
  if (headers.length === 0) return ''
  
  let table = '<table class="data-table"><thead><tr>'
  headers.forEach(header => {
    table += `<th>${escapeHtml(header.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))}</th>`
  })
  table += '</tr></thead><tbody>'
  
  data.forEach((row, index) => {
    if (index < 50) { // Limit to 50 rows for PDF
      table += '<tr>'
      headers.forEach(header => {
        let value = row[header]
        if (value === null || value === undefined) value = 'N/A'
        if (typeof value === 'number') {
          value = value.toLocaleString('en-IN')
        } else if (typeof value === 'string' && value.includes('T') && value.match(/^\d{4}-\d{2}-\d{2}/)) {
          // Format dates
          try {
            value = format(new Date(value), 'MMM dd, yyyy')
          } catch {
            // Keep original value
          }
        }
        table += `<td>${escapeHtml(String(value))}</td>`
      })
      table += '</tr>'
    }
  })
  
  table += '</tbody></table>'
  if (data.length > 50) {
    table += `<p style="color: #64748b; font-size: 12px; margin-top: 10px;">Showing first 50 of ${data.length} records</p>`
  }
  
  return table
}

// Generate Excel (simplified - creates CSV format)
async function generateExcel(data: ReportData, options: ReportOptions): Promise<Blob> {
  let csv = `${data.title}\n`
  csv += `Generated,${new Date(data.generatedAt).toLocaleString()}\n`
  if (data.projectName) csv += `Project,${data.projectName}\n`
  csv += `\n`

  data.sections.forEach(section => {
    csv += `\n${section.title}\n`
    csv += `${section.content.replace(/\n/g, '\n')}\n`
  })

  // In production, use a proper Excel library like ExcelJS
  return new Blob([csv], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

// Generate CSV
async function generateCSV(data: ReportData, options: ReportOptions): Promise<Blob> {
  let csv = `${data.title}\n`
  csv += `Generated,${new Date(data.generatedAt).toLocaleString()}\n`
  if (data.projectName) csv += `Project,${data.projectName}\n`
  csv += `\n`

  data.sections.forEach(section => {
    csv += `\n${section.title}\n`
    // Convert content to CSV format
    const lines = section.content.split('\n').filter(l => l.trim())
    lines.forEach(line => {
      csv += `${line.replace(/,/g, ';')}\n`
    })
  })

  return new Blob([csv], { type: 'text/csv' })
}

