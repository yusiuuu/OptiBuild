// Report Generator
// Generates various types of reports from database data

import {
  projectsService,
  tasksService,
  expensesService,
  resourcesCatalogService,
  projectResourcesService,
} from './data-service'

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
  // Fetch data based on report type
  const reportData = await fetchReportData(options)
  
  // Generate content based on format
  let blob: Blob
  let filename: string

  switch (options.format) {
    case 'pdf':
      blob = await generatePDF(reportData, options)
      filename = `${reportData.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
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
      throw new Error('Unsupported format')
  }

  return { blob, filename }
}

async function fetchReportData(options: ReportOptions): Promise<ReportData> {
  const sections: ReportSection[] = []
  let title = ''
  let projectName: string | undefined

  // Fetch projects
  const allProjects = await projectsService.getProjects()
  const projects = options.projectId
    ? allProjects.filter(p => p.id === options.projectId)
    : allProjects

  if (options.projectId && projects.length > 0) {
    projectName = projects[0].name
  }

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
  }

  return {
    title,
    generatedAt: new Date().toISOString(),
    projectName,
    sections,
  }
}

async function generateProjectStatusSections(projects: any[], options: ReportOptions): Promise<ReportSection[]> {
  const sections: ReportSection[] = []

  // Project Overview
  let overviewContent = `Total Projects: ${projects.length}\n\n`
  projects.forEach(project => {
    overviewContent += `Project: ${project.name}\n`
    overviewContent += `Status: ${project.status || 'N/A'}\n`
    overviewContent += `Progress: ${project.progress || 0}%\n`
    overviewContent += `Budget: ${project.budget ? `$${project.budget.toLocaleString()}` : 'N/A'}\n`
    if (project.start_date) overviewContent += `Start Date: ${new Date(project.start_date).toLocaleDateString()}\n`
    if (project.end_date) overviewContent += `End Date: ${new Date(project.end_date).toLocaleDateString()}\n`
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
        const tasks = await tasksService.getTasks(project.id)
        taskContent += `\n${project.name}:\n`
        taskContent += `Total Tasks: ${tasks.length}\n`
        
        const statusCounts = tasks.reduce((acc: any, task: any) => {
          const status = task.status || 'unknown'
          acc[status] = (acc[status] || 0) + 1
          return acc
        }, {})
        
        Object.entries(statusCounts).forEach(([status, count]) => {
          taskContent += `  ${status}: ${count}\n`
        })
      } catch (error) {
        console.error(`Error loading tasks for ${project.id}:`, error)
      }
    }

    sections.push({
      title: 'Task Summary',
      content: taskContent || 'No tasks found',
    })
  }

  return sections
}

async function generateBudgetSections(projects: any[], options: ReportOptions): Promise<ReportSection[]> {
  const sections: ReportSection[] = []

  let budgetContent = ''
  let totalBudget = 0
  let totalExpenses = 0

  for (const project of projects) {
    try {
      const { budgetCategoriesService } = await import('./data-service')
      const budgetCategories = await budgetCategoriesService.getProjectBudgetCategories(project.id)
      const expenses = await expensesService.getExpenses(project.id)

      const projectBudget = project.budget || 0
      const projectExpenses = expenses.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0)
      const plannedAmount = budgetCategories.reduce((sum: number, cat: any) => sum + (cat.planned_amount || 0), 0)
      const actualAmount = budgetCategories.reduce((sum: number, cat: any) => sum + (cat.actual_amount || 0), 0)

      budgetContent += `\n${project.name}:\n`
      budgetContent += `Budget: $${projectBudget.toLocaleString()}\n`
      budgetContent += `Total Expenses: $${projectExpenses.toLocaleString()}\n`
      budgetContent += `Planned (Categories): $${plannedAmount.toLocaleString()}\n`
      budgetContent += `Actual (Categories): $${actualAmount.toLocaleString()}\n`
      budgetContent += `Remaining: $${(projectBudget - projectExpenses).toLocaleString()}\n`
      budgetContent += `Utilization: ${projectBudget > 0 ? ((projectExpenses / projectBudget) * 100).toFixed(2) : 0}%\n\n`

      totalBudget += projectBudget
      totalExpenses += projectExpenses
    } catch (error) {
      console.error(`Error loading budget for ${project.id}:`, error)
    }
  }

  budgetContent = `Summary:\nTotal Budget: $${totalBudget.toLocaleString()}\nTotal Expenses: $${totalExpenses.toLocaleString()}\nOverall Utilization: ${totalBudget > 0 ? ((totalExpenses / totalBudget) * 100).toFixed(2) : 0}%\n\n${budgetContent}`

  sections.push({
    title: 'Budget & Expenses',
    content: budgetContent,
  })

  return sections
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
      const expenses = await expensesService.getExpenses(project.id)
      const projectBudget = project.budget || 0
      const projectExpenses = expenses.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0)

      totalBudget += projectBudget
      totalExpenses += projectExpenses

      financialContent += `${project.name}:\n`
      financialContent += `  Budget: $${projectBudget.toLocaleString()}\n`
      financialContent += `  Expenses: $${projectExpenses.toLocaleString()}\n`
      financialContent += `  Remaining: $${(projectBudget - projectExpenses).toLocaleString()}\n`
      financialContent += `  Variance: ${projectBudget > 0 ? (((projectExpenses - projectBudget) / projectBudget) * 100).toFixed(2) : 0}%\n\n`
    } catch (error) {
      console.error(`Error loading financial data for ${project.id}:`, error)
    }
  }

  financialContent = `Overall Summary:\nTotal Budget: $${totalBudget.toLocaleString()}\nTotal Expenses: $${totalExpenses.toLocaleString()}\nTotal Remaining: $${(totalBudget - totalExpenses).toLocaleString()}\nOverall Variance: ${totalBudget > 0 ? (((totalExpenses - totalBudget) / totalBudget) * 100).toFixed(2) : 0}%\n\n${financialContent}`

  sections.push({
    title: 'Financial Summary',
    content: financialContent,
  })

  return sections
}

async function generateResourceAllocationSections(projects: any[], options: ReportOptions): Promise<ReportSection[]> {
  return await generateResourceUtilizationSections(projects, options)
}

// Generate PDF (simplified - creates a text-based PDF)
async function generatePDF(data: ReportData, options: ReportOptions): Promise<Blob> {
  let content = `${data.title}\n`
  content += `Generated: ${new Date(data.generatedAt).toLocaleString()}\n`
  if (data.projectName) content += `Project: ${data.projectName}\n`
  content += `\n${'='.repeat(50)}\n\n`

  data.sections.forEach(section => {
    content += `${section.title}\n`
    content += `${'-'.repeat(50)}\n`
    content += `${section.content}\n\n`
  })

  // Create a simple text file as PDF (in production, use a proper PDF library like jsPDF)
  return new Blob([content], { type: 'text/plain' })
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

