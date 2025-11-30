"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Users, 
  Package,
  DollarSign,
  Play,
  RotateCcw,
  Save,
  BarChart3,
  Calendar,
  Activity,
  Target
} from 'lucide-react'
import { Task, Resource, WhatIfScenario, Project } from '@/lib/data-service'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import { GanttChart } from '@/components/visualization/gantt-chart'
import { toast } from 'sonner'

interface WhatIfAnalysisEnhancedProps {
  projectId: string
  tasks: Task[]
  resources: Resource[]
  project?: Project
  baseScenario?: any
  onScenarioSave?: (scenario: WhatIfScenario) => void
}

interface ScenarioResponse {
  schedule_impact: {
    project_delay_days: number
    new_end_date: string
    critical_path: string[]
  }
  cost_impact: {
    material_cost_change: number
    resource_cost_change: number
    total_cost_impact: number
  }
  risk_assessment: {
    risk_score: number
    severity: 'low' | 'medium' | 'high'
  }
  updated_tasks: Task[]
}

export function WhatIfAnalysisEnhanced({ 
  projectId, 
  tasks, 
  resources, 
  project,
  baseScenario, 
  onScenarioSave 
}: WhatIfAnalysisEnhancedProps) {
  const [selectedScenarioType, setSelectedScenarioType] = useState<'project_delay' | 'resource_reduction' | 'material_shortage'>('project_delay')
  const [scenarioParameters, setScenarioParameters] = useState<Record<string, any>>({})
  const [scenarioResults, setScenarioResults] = useState<ScenarioResponse | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [savedScenarios, setSavedScenarios] = useState<WhatIfScenario[]>([])
  const [scenarioName, setScenarioName] = useState('')
  const [dailyProjectCost, setDailyProjectCost] = useState(0)

  // Calculate daily project cost from project budget
  useEffect(() => {
    if (project && project.budget && project.start_date && project.end_date) {
      const start = new Date(project.start_date)
      const end = new Date(project.end_date)
      const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
      setDailyProjectCost(project.budget / days)
    } else if (project && project.budget) {
      // Estimate 365 days if no end date
      setDailyProjectCost(project.budget / 365)
    }
  }, [project])

  // Initialize scenario parameters based on type
  useEffect(() => {
    const initializeParameters = () => {
      switch (selectedScenarioType) {
        case 'project_delay':
          setScenarioParameters({
            delayDays: 7,
            affectedTasks: 'all',
            delayReason: 'weather'
          })
          break
        case 'resource_reduction':
          setScenarioParameters({
            reductionPercent: 20,
            resourceType: 'labor',
            duration: 30
          })
          break
        case 'material_shortage':
          setScenarioParameters({
            materials: ['cement', 'steel'],
            shortagePercent: 50,
            priceIncrease: 25
          })
          break
      }
    }

    initializeParameters()
  }, [selectedScenarioType])

  // Run scenario analysis using API
  const runScenarioAnalysis = async () => {
    if (!tasks || tasks.length === 0) {
      toast.error('No tasks available. Please add tasks to the project first.')
      return
    }

    setIsRunning(true)
    try {
      // Prepare request payload
      const requestPayload = {
        scenario_type: selectedScenarioType,
        parameters: scenarioParameters,
        project_id: projectId,
        tasks: tasks.map(task => ({
          id: task.id || '',
          title: task.title || task.name || '',
          start_date: task.start_date,
          end_date: task.end_date,
          duration_days: task.duration_days,
          dependencies: (task as any).dependencies || [],
          priority: task.priority || 'medium',
          estimated_cost: task.estimated_cost || 0,
          assigned_to: task.assigned_to
        })),
        base_end_date: project?.end_date,
        daily_project_cost: dailyProjectCost
      }

      const response = await fetch('/api/scenario/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to run scenario analysis')
      }

      const result: ScenarioResponse = await response.json()
      setScenarioResults(result)
      toast.success('Scenario analysis completed successfully!')
    } catch (error: any) {
      console.error('Error running scenario analysis:', error)
      toast.error(error.message || 'Error running scenario analysis. Please try again.')
    } finally {
      setIsRunning(false)
    }
  }

  // Prepare chart data
  const prepareChartData = () => {
    if (!scenarioResults) return []

    return [
      {
        name: 'Schedule Impact',
        value: scenarioResults.schedule_impact.project_delay_days,
        type: 'days'
      },
      {
        name: 'Cost Impact',
        value: scenarioResults.cost_impact.total_cost_impact,
        type: 'rupees'
      },
      {
        name: 'Risk Score',
        value: scenarioResults.risk_assessment.risk_score,
        type: 'score'
      }
    ]
  }

  // Prepare cost breakdown data
  const prepareCostBreakdown = () => {
    if (!scenarioResults) return []

    return [
      {
        name: 'Material Cost',
        change: scenarioResults.cost_impact.material_cost_change,
        color: '#8884d8'
      },
      {
        name: 'Resource Cost',
        change: scenarioResults.cost_impact.resource_cost_change,
        color: '#82ca9d'
      },
      {
        name: 'Total Impact',
        change: scenarioResults.cost_impact.total_cost_impact,
        color: scenarioResults.cost_impact.total_cost_impact > 0 ? '#ff6b6b' : '#51cf66'
      }
    ]
  }

  // Get risk color
  const getRiskColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            What-If Scenario Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="create" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create">Create Scenario</TabsTrigger>
              <TabsTrigger value="saved">Saved Scenarios</TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="space-y-6">
              {/* Scenario Type Selection */}
              <div className="space-y-4">
                <Label>Scenario Type</Label>
                <Select 
                  value={selectedScenarioType} 
                  onValueChange={(value: any) => setSelectedScenarioType(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="project_delay">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Project Delay
                      </div>
                    </SelectItem>
                    <SelectItem value="resource_reduction">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Resource Reduction
                      </div>
                    </SelectItem>
                    <SelectItem value="material_shortage">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Material Shortage
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Scenario Parameters */}
              <div className="space-y-4">
                <Label>Scenario Parameters</Label>
                
                {selectedScenarioType === 'project_delay' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="delayDays">Delay Days</Label>
                      <Input
                        id="delayDays"
                        type="number"
                        value={scenarioParameters.delayDays || ''}
                        onChange={(e) => setScenarioParameters(prev => ({
                          ...prev,
                          delayDays: parseInt(e.target.value) || 0
                        }))}
                        placeholder="7"
                      />
                    </div>
                    <div>
                      <Label htmlFor="affectedTasks">Affected Tasks</Label>
                      <Select 
                        value={scenarioParameters.affectedTasks || 'all'} 
                        onValueChange={(value) => setScenarioParameters(prev => ({
                          ...prev,
                          affectedTasks: value
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Tasks</SelectItem>
                          <SelectItem value="critical">Critical Path Only</SelectItem>
                          <SelectItem value="specific">Specific Tasks</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="delayReason">Delay Reason</Label>
                      <Select 
                        value={scenarioParameters.delayReason || 'weather'} 
                        onValueChange={(value) => setScenarioParameters(prev => ({
                          ...prev,
                          delayReason: value
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weather">Weather</SelectItem>
                          <SelectItem value="permit">Permit Issues</SelectItem>
                          <SelectItem value="supply">Supply Chain</SelectItem>
                          <SelectItem value="labor">Labor Shortage</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {selectedScenarioType === 'resource_reduction' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="reductionPercent">Reduction Percentage</Label>
                      <Input
                        id="reductionPercent"
                        type="number"
                        value={scenarioParameters.reductionPercent || ''}
                        onChange={(e) => setScenarioParameters(prev => ({
                          ...prev,
                          reductionPercent: parseInt(e.target.value) || 0
                        }))}
                        placeholder="20"
                      />
                    </div>
                    <div>
                      <Label htmlFor="resourceType">Resource Type</Label>
                      <Select 
                        value={scenarioParameters.resourceType || 'labor'} 
                        onValueChange={(value) => setScenarioParameters(prev => ({
                          ...prev,
                          resourceType: value
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="labor">Labor</SelectItem>
                          <SelectItem value="equipment">Equipment</SelectItem>
                          <SelectItem value="material">Material</SelectItem>
                          <SelectItem value="all">All Resources</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="duration">Duration (days)</Label>
                      <Input
                        id="duration"
                        type="number"
                        value={scenarioParameters.duration || ''}
                        onChange={(e) => setScenarioParameters(prev => ({
                          ...prev,
                          duration: parseInt(e.target.value) || 0
                        }))}
                        placeholder="30"
                      />
                    </div>
                  </div>
                )}

                {selectedScenarioType === 'material_shortage' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="shortagePercent">Shortage Percentage</Label>
                      <Input
                        id="shortagePercent"
                        type="number"
                        value={scenarioParameters.shortagePercent || ''}
                        onChange={(e) => setScenarioParameters(prev => ({
                          ...prev,
                          shortagePercent: parseInt(e.target.value) || 0
                        }))}
                        placeholder="50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="priceIncrease">Price Increase (%)</Label>
                      <Input
                        id="priceIncrease"
                        type="number"
                        value={scenarioParameters.priceIncrease || ''}
                        onChange={(e) => setScenarioParameters(prev => ({
                          ...prev,
                          priceIncrease: parseInt(e.target.value) || 0
                        }))}
                        placeholder="25"
                      />
                    </div>
                    <div>
                      <Label htmlFor="materials">Affected Materials</Label>
                      <Input
                        id="materials"
                        value={scenarioParameters.materials?.join(', ') || ''}
                        onChange={(e) => setScenarioParameters(prev => ({
                          ...prev,
                          materials: e.target.value.split(',').map(m => m.trim())
                        }))}
                        placeholder="cement, steel"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Run Analysis */}
              <div className="flex items-center gap-4">
                <Button 
                  onClick={runScenarioAnalysis} 
                  disabled={isRunning}
                  className="flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  {isRunning ? 'Running Analysis...' : 'Run Analysis'}
                </Button>
                
                {scenarioResults && (
                  <Button 
                    variant="outline" 
                    onClick={() => setScenarioResults(null)}
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset
                  </Button>
                )}
              </div>

              {/* Scenario Results */}
              {scenarioResults && (
                <div className="space-y-6">
                  {/* Impact Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600 font-medium">Schedule Impact</p>
                            <p className={`text-2xl font-bold ${
                              scenarioResults.schedule_impact.project_delay_days >= 0 ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {scenarioResults.schedule_impact.project_delay_days >= 0 ? '+' : ''}
                              {scenarioResults.schedule_impact.project_delay_days.toFixed(1)} days
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              New End: {new Date(scenarioResults.schedule_impact.new_end_date).toLocaleDateString()}
                            </p>
                          </div>
                          <Clock className="h-8 w-8 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600 font-medium">Cost Impact</p>
                            <p className={`text-2xl font-bold ${
                              scenarioResults.cost_impact.total_cost_impact >= 0 ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {scenarioResults.cost_impact.total_cost_impact >= 0 ? '+' : ''}
                              ₹{Math.abs(scenarioResults.cost_impact.total_cost_impact).toLocaleString('en-IN')}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Total project cost change
                            </p>
                          </div>
                          <DollarSign className="h-8 w-8 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600 font-medium">Risk Assessment</p>
                            <p className="text-2xl font-bold text-gray-900">
                              {scenarioResults.risk_assessment.risk_score}/100
                            </p>
                            <Badge className={getRiskColor(scenarioResults.risk_assessment.severity)}>
                              {scenarioResults.risk_assessment.severity.toUpperCase()}
                            </Badge>
                          </div>
                          <AlertTriangle className="h-8 w-8 text-yellow-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Charts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Cost Breakdown Chart */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Cost Impact Breakdown</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={prepareCostBreakdown()}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip 
                              formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}
                            />
                            <Legend />
                            <Bar dataKey="change" fill="#8884d8">
                              {prepareCostBreakdown().map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Risk Score Meter */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Risk Score</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="text-center">
                            <div className="text-4xl font-bold mb-2">
                              {scenarioResults.risk_assessment.risk_score}
                            </div>
                            <Progress 
                              value={scenarioResults.risk_assessment.risk_score} 
                              className="h-4"
                            />
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-center text-sm">
                            <div>
                              <div className="text-green-600 font-medium">0-39</div>
                              <div className="text-gray-500">Low</div>
                            </div>
                            <div>
                              <div className="text-yellow-600 font-medium">40-69</div>
                              <div className="text-gray-500">Medium</div>
                            </div>
                            <div>
                              <div className="text-red-600 font-medium">70-100</div>
                              <div className="text-gray-500">High</div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Gantt Chart */}
                  {scenarioResults.updated_tasks && scenarioResults.updated_tasks.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Updated Schedule (Gantt Chart)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <GanttChart 
                          tasks={scenarioResults.updated_tasks as Task[]}
                          readonly={true}
                        />
                      </CardContent>
                    </Card>
                  )}

                  {/* Critical Path */}
                  {scenarioResults.schedule_impact.critical_path.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Target className="h-5 w-5" />
                          Critical Path
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {scenarioResults.schedule_impact.critical_path.map((taskId) => {
                            const task = tasks.find(t => t.id === taskId)
                            return (
                              <Badge key={taskId} variant="outline" className="px-3 py-1">
                                {task?.title || task?.name || taskId}
                              </Badge>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="saved" className="space-y-4">
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Saved scenarios feature coming soon.</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

