/**
 * Next.js API Route for What-If Scenario Analysis
 * This route can either call the FastAPI backend or implement the logic directly
 */

import { NextRequest, NextResponse } from 'next/server'
import { Task } from '@/lib/data-service'

// Configuration: Set to true to use FastAPI backend, false to use local implementation
const USE_FASTAPI_BACKEND = process.env.USE_FASTAPI_BACKEND === 'true'
const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000'

interface ScenarioRequest {
  scenario_type: 'project_delay' | 'resource_reduction' | 'material_shortage'
  parameters: Record<string, any>
  project_id: string
  tasks: Task[]
  base_end_date?: string
  daily_project_cost?: number
}

// Local CPM calculation (same logic as FastAPI)
function calculateCPM(tasks: Task[]) {
  const taskDict = new Map(tasks.map(t => [t.id, t]))
  const earlyStart = new Map<string, number>()
  const earlyFinish = new Map<string, number>()
  const visited = new Set<string>()

  function getDuration(task: Task): number {
    if (task.duration_days) return task.duration_days
    if (task.start_date && task.end_date) {
      const start = new Date(task.start_date)
      const end = new Date(task.end_date)
      return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    }
    return 1
  }

  function calculateEarlyTimes(taskId: string): number {
    if (visited.has(taskId)) {
      return earlyStart.get(taskId) || 0
    }

    visited.add(taskId)
    const task = taskDict.get(taskId)
    if (!task) return 0

    let maxEF = 0
    const deps = (task as any).dependencies || []
    for (const depId of deps) {
      if (taskDict.has(depId)) {
        calculateEarlyTimes(depId)
        maxEF = Math.max(maxEF, earlyFinish.get(depId) || 0)
      }
    }

    earlyStart.set(taskId, maxEF)
    const duration = getDuration(task)
    earlyFinish.set(taskId, maxEF + duration)

    return maxEF
  }

  // Calculate early times
  for (const task of tasks) {
    if (!visited.has(task.id)) {
      calculateEarlyTimes(task.id)
    }
  }

  const projectDuration = Math.max(...Array.from(earlyFinish.values()), 0)

  // Calculate late times
  const lateStart = new Map<string, number>()
  const lateFinish = new Map<string, number>()

  // Build reverse dependencies
  const reverseDeps = new Map<string, string[]>()
  for (const task of tasks) {
    reverseDeps.set(task.id, [])
  }
  for (const task of tasks) {
    const deps = (task as any).dependencies || []
    for (const depId of deps) {
      if (reverseDeps.has(depId)) {
        reverseDeps.get(depId)!.push(task.id)
      }
    }
  }

  function calculateLateTimes(taskId: string) {
    const task = taskDict.get(taskId)
    if (!task) return

    const duration = getDuration(task)
    const dependents = reverseDeps.get(taskId) || []

    if (dependents.length > 0) {
      const minLS = Math.min(...dependents.map(id => lateStart.get(id) || projectDuration))
      lateFinish.set(taskId, minLS)
    } else {
      lateFinish.set(taskId, projectDuration)
    }

    lateStart.set(taskId, (lateFinish.get(taskId) || projectDuration) - duration)
  }

  // Calculate late times in reverse order
  const sortedTasks = [...tasks].sort((a, b) => (earlyFinish.get(b.id) || 0) - (earlyFinish.get(a.id) || 0))
  for (const task of sortedTasks) {
    calculateLateTimes(task.id)
  }

  // Calculate slack
  const slack = new Map<string, number>()
  for (const task of tasks) {
    const es = earlyStart.get(task.id) || 0
    const ls = lateStart.get(task.id) || 0
    slack.set(task.id, ls - es)
  }

  // Critical path: tasks with zero slack
  const criticalPath = Array.from(slack.entries())
    .filter(([_, s]) => Math.abs(s) < 0.01)
    .map(([id]) => id)

  // Convert slack Map to object for easier access
  const slackObj: Record<string, number> = {}
  slack.forEach((value, key) => {
    slackObj[key] = value
  })

  return {
    critical_path: criticalPath,
    project_duration: projectDuration,
    early_start: Object.fromEntries(earlyStart),
    late_start: Object.fromEntries(lateStart),
    slack: slackObj
  }
}

// Process scenarios locally
function processScenarioLocally(request: ScenarioRequest) {
  const { scenario_type, parameters, tasks, base_end_date, daily_project_cost = 0 } = request

  let delayDays = 0
  let updatedTasks: any[] = []
  let materialCostChange = 0

  if (scenario_type === 'project_delay') {
    const delayDaysParam = parameters.delayDays || 0
    const affectedTasks = parameters.affectedTasks || 'all'
    const baseCPM = calculateCPM(tasks)
    const criticalPath = new Set(baseCPM.critical_path)
    const slack = baseCPM.slack
    const plannedDuration = baseCPM.project_duration

    // A) If Affected Tasks = ALL tasks
    if (affectedTasks === 'all') {
      // Everything shifts by delay_days
      updatedTasks = tasks.map(task => {
        const newTask = { ...task }
        if (task.start_date) {
          const start = new Date(task.start_date)
          start.setDate(start.getDate() + delayDaysParam)
          newTask.start_date = start.toISOString()
        }
        if (task.end_date) {
          const end = new Date(task.end_date)
          end.setDate(end.getDate() + delayDaysParam)
          newTask.end_date = end.toISOString()
        }
        return newTask
      })
      delayDays = delayDaysParam
    }
    // B) If Affected Tasks = Critical Path Only
    else if (affectedTasks === 'critical') {
      const taskMap = new Map(tasks.map(t => [t.id, { ...t }]))
      
      // Build successors map
      const successors = new Map<string, string[]>()
      tasks.forEach(task => {
        successors.set(task.id, [])
      })
      tasks.forEach(task => {
        const deps = (task as any).dependencies || []
        deps.forEach((depId: string) => {
          if (successors.has(depId)) {
            successors.get(depId)!.push(task.id)
          }
        })
      })

      // Delay critical path tasks
      const delayedTasks = new Set<string>()
      criticalPath.forEach(taskId => {
        const task = taskMap.get(taskId)
        if (task && task.end_date) {
          const end = new Date(task.end_date)
          end.setDate(end.getDate() + delayDaysParam)
          task.end_date = end.toISOString()
          delayedTasks.add(taskId)
        }
      })

      // Propagate delay to all successors
      function propagateDelay(taskId: string, delay: number) {
        const taskSuccessors = successors.get(taskId) || []
        taskSuccessors.forEach(successorId => {
          if (!delayedTasks.has(successorId)) {
            const successor = taskMap.get(successorId)
            if (successor && successor.end_date) {
              const end = new Date(successor.end_date)
              end.setDate(end.getDate() + delay)
              successor.end_date = end.toISOString()
              delayedTasks.add(successorId)
              propagateDelay(successorId, delay)
            }
          }
        })
      }

      criticalPath.forEach(taskId => {
        propagateDelay(taskId, delayDaysParam)
      })

      updatedTasks = Array.from(taskMap.values())
      delayDays = delayDaysParam
    }
    // C) If Affected Tasks = Specific Task
    else if (affectedTasks === 'specific') {
      const specificTaskIds = parameters.specificTaskIds || [tasks[0]?.id].filter(Boolean)
      const taskMap = new Map(tasks.map(t => [t.id, { ...t }]))
      
      // Build successors map
      const successors = new Map<string, string[]>()
      tasks.forEach(task => {
        successors.set(task.id, [])
      })
      tasks.forEach(task => {
        const deps = (task as any).dependencies || []
        deps.forEach((depId: string) => {
          if (successors.has(depId)) {
            successors.get(depId)!.push(task.id)
          }
        })
      })

      specificTaskIds.forEach(taskId => {
        const task = taskMap.get(taskId)
        if (!task) return

        const taskFloat = slack[taskId] || 0

        // Case 1: Task is on critical path
        if (criticalPath.has(taskId)) {
          if (task.end_date) {
            const end = new Date(task.end_date)
            end.setDate(end.getDate() + delayDaysParam)
            task.end_date = end.toISOString()
          }

          // Propagate to successors
          const taskSuccessors = successors.get(taskId) || []
          taskSuccessors.forEach(successorId => {
            const successor = taskMap.get(successorId)
            if (successor && successor.end_date) {
              const end = new Date(successor.end_date)
              end.setDate(end.getDate() + delayDaysParam)
              successor.end_date = end.toISOString()
            }
          })

          delayDays = Math.max(delayDays, delayDaysParam)
        }
        // Case 2: Task is NOT on critical path (float exists)
        else {
          if (delayDaysParam <= taskFloat) {
            // Delay absorbed by float
            if (task.end_date) {
              const end = new Date(task.end_date)
              end.setDate(end.getDate() + delayDaysParam)
              task.end_date = end.toISOString()
            }
            delayDays = Math.max(delayDays, 0) // No project delay
          } else {
            // Float exceeded, project delayed
            if (task.end_date) {
              const end = new Date(task.end_date)
              end.setDate(end.getDate() + delayDaysParam)
              task.end_date = end.toISOString()
            }

            // Propagate excess delay
            const excessDelay = delayDaysParam - taskFloat
            const taskSuccessors = successors.get(taskId) || []
            taskSuccessors.forEach(successorId => {
              const successor = taskMap.get(successorId)
              if (successor && successor.end_date) {
                const end = new Date(successor.end_date)
                end.setDate(end.getDate() + excessDelay)
                successor.end_date = end.toISOString()
              }
            })

            delayDays = Math.max(delayDays, excessDelay)
          }
        }
      })

      updatedTasks = Array.from(taskMap.values())
    }
  } else if (scenario_type === 'resource_reduction') {
    const reductionPercent = (parameters.reductionPercent || 0) / 100
    const resourceType = parameters.resourceType || 'all'
    const extraDelayDays = parameters.delayDays || 0 // Optional extra buffer

    // Resource type weights
    const resourceWeights: Record<string, number> = {
      labor: 1.0,
      equipment: 1.3,
      material: 1.0,
      all: 1.5
    }
    const resourceWeight = resourceWeights[resourceType.toLowerCase()] || 1.0

    // Formula: New_Duration = Old_Duration × (1 / (1 - reduction_percentage))
    const cappedReduction = Math.min(reductionPercent, 0.99)
    const durationMultiplier = 1.0 / (1.0 - cappedReduction)

    const baseCPM = calculateCPM(tasks)
    const baseDuration = baseCPM.project_duration

    updatedTasks = tasks.map(task => {
      const newTask = { ...task }
      if (task.duration_days) {
        // Apply exact formula
        newTask.duration_days = Math.ceil(task.duration_days * durationMultiplier)
        if (task.start_date) {
          const start = new Date(task.start_date)
          const end = new Date(start)
          end.setDate(end.getDate() + newTask.duration_days)
          newTask.end_date = end.toISOString()
        }
      }
      return newTask
    })

    const newCPM = calculateCPM(updatedTasks as Task[])
    const cpmDelay = newCPM.project_duration - baseDuration

    // Final_Delay = CPM_Delay + delay_days
    delayDays = cpmDelay + extraDelayDays
  } else if (scenario_type === 'material_shortage') {
    const shortagePercent = (parameters.shortagePercent || 0) / 100
    const priceIncrease = (parameters.priceIncrease || 0) / 100

    // Formula: Effective_Material = (1 - shortage_percentage)
    const effectiveMaterial = Math.max(0.01, 1.0 - shortagePercent)
    
    // Formula: New_Task_Duration = Old_Duration × (1 / Effective_Material)
    const durationMultiplier = 1.0 / effectiveMaterial

    const baseCPM = calculateCPM(tasks)
    const baseDuration = baseCPM.project_duration
    let baseMaterialCost = 0
    let newMaterialCost = 0

    updatedTasks = tasks.map(task => {
      const newTask = { ...task }
      if (task.duration_days) {
        // Apply exact formula
        newTask.duration_days = Math.ceil(task.duration_days * durationMultiplier)
        if (task.start_date) {
          const start = new Date(task.start_date)
          const end = new Date(start)
          end.setDate(end.getDate() + newTask.duration_days)
          newTask.end_date = end.toISOString()
        }
      }
      if (task.estimated_cost) {
        // Formula: New_Material_Cost = Base_Material_Cost × (1 + PI)
        const baseCost = task.estimated_cost
        baseMaterialCost += baseCost
        const newCost = baseCost * (1 + priceIncrease)
        newMaterialCost += newCost
        newTask.estimated_cost = newCost
      }
      return newTask
    })

    const newCPM = calculateCPM(updatedTasks as Task[])
    
    // Schedule_Delay = New_End_Date - Planned_End_Date
    delayDays = newCPM.project_duration - baseDuration
    
    // Cost_Impact = New_Material_Cost - Base_Material_Cost
    materialCostChange = newMaterialCost - baseMaterialCost
  }

  // Calculate new end date
  const newCPM = calculateCPM(updatedTasks as Task[])
  let newEndDate = base_end_date
  if (base_end_date) {
    const baseEnd = new Date(base_end_date)
    baseEnd.setDate(baseEnd.getDate() + delayDays)
    newEndDate = baseEnd.toISOString()
  } else {
    const projectDuration = newCPM.project_duration
    const newEnd = new Date()
    newEnd.setDate(newEnd.getDate() + projectDuration)
    newEndDate = newEnd.toISOString()
  }

  // Calculate base CPM for planned duration
  const baseCPM = calculateCPM(tasks)
  const plannedDuration = baseCPM.project_duration

  // Calculate cost impact with exact formulas
  let costImpact = 0
  let scenarioRisk = 0

  if (scenario_type === 'project_delay') {
    // Cost Impact Formula: CI = Project_Delay × CD
    costImpact = delayDays * daily_project_cost
  } else if (scenario_type === 'resource_reduction') {
    // Cost Impact Formula: CI = Final_Delay × CR
    costImpact = delayDays * daily_project_cost
    
    // Resource_Risk = reduction_percentage × weight(resource_type)
    const reductionPercent = (parameters.reductionPercent || 0) / 100
    const resourceType = parameters.resourceType || 'all'
    const resourceWeights: Record<string, number> = {
      labor: 1.0,
      equipment: 1.3,
      material: 1.0,
      all: 1.5
    }
    const resourceWeight = resourceWeights[resourceType.toLowerCase()] || 1.0
    scenarioRisk = (reductionPercent * 100) * resourceWeight / 100.0
    scenarioRisk = Math.min(1.0, scenarioRisk)
  } else if (scenario_type === 'material_shortage') {
    // Cost Impact = Delay_Impact + Material Cost Variance
    const delayCost = delayDays * daily_project_cost
    costImpact = delayCost + materialCostChange
    
    // Material_Risk = shortage_percentage + (PI × 0.5)
    const shortagePercent = (parameters.shortagePercent || 0) / 100
    const priceIncrease = (parameters.priceIncrease || 0) / 100
    scenarioRisk = shortagePercent + (priceIncrease * 0.5)
    scenarioRisk = Math.min(1.0, scenarioRisk)
  }

  // Calculate risk assessment with exact formulas
  // Schedule_Risk = Project_Delay / Planned_Duration
  const scheduleRisk = plannedDuration > 0 
    ? Math.abs(delayDays) / plannedDuration 
    : Math.min(1.0, Math.abs(delayDays) / 100.0)
  
  // Cost Risk (normalized)
  const costRisk = daily_project_cost > 0 && plannedDuration > 0
    ? Math.min(1.0, Math.abs(costImpact) / (daily_project_cost * plannedDuration))
    : Math.min(1.0, Math.abs(costImpact) / 1000000)

  // Combined risk score: Schedule risk (40%) + Cost risk (30%) + Scenario-specific risk (30%)
  const combinedRisk = (scheduleRisk * 0.4 + costRisk * 0.3 + scenarioRisk * 0.3)
  const riskScore = Math.round(combinedRisk * 100)
  const severity = riskScore >= 70 ? 'high' : riskScore >= 40 ? 'medium' : 'low'

  return {
    schedule_impact: {
      project_delay_days: delayDays,
      new_end_date: newEndDate,
      critical_path: newCPM.critical_path
    },
    cost_impact: {
      material_cost_change: materialCostChange,
      resource_cost_change: costImpact - materialCostChange,
      total_cost_impact: costImpact
    },
    risk_assessment: {
      risk_score: riskScore,
      severity
    },
    updated_tasks: updatedTasks
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ScenarioRequest = await request.json()

    // Validate request
    if (!body.scenario_type || !body.parameters || !body.project_id || !body.tasks) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    let result

    if (USE_FASTAPI_BACKEND) {
      // Call FastAPI backend
      try {
        const response = await fetch(`${FASTAPI_URL}/scenario/run`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        })

        if (!response.ok) {
          throw new Error(`FastAPI error: ${response.statusText}`)
        }

        result = await response.json()
      } catch (error) {
        console.error('FastAPI backend error, falling back to local implementation:', error)
        // Fallback to local implementation
        result = processScenarioLocally(body)
      }
    } else {
      // Use local implementation
      result = processScenarioLocally(body)
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Scenario analysis error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

