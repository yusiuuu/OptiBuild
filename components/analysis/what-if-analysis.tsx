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
  BarChart3
} from 'lucide-react'
import { Task, Resource, WhatIfScenario } from '@/lib/data-service'
import { optimizationEngine } from '@/lib/optimization-engine'
import { scenariosService } from '@/lib/data-service'

interface WhatIfAnalysisProps {
  projectId: string
  tasks: Task[]
  resources: Resource[]
  baseScenario?: OptimizationResult
  onScenarioSave?: (scenario: WhatIfScenario) => void
}

interface ScenarioResult {
  scenarioType: string
  parameters: Record<string, any>
  impactAnalysis: {
    makespanImpact: number
    costImpact: number
    makespanImpactPercent: number
    costImpactPercent: number
    riskLevel: 'low' | 'medium' | 'high'
  }
  newSchedule?: any
  newCosts?: any
}

export function WhatIfAnalysis({ 
  projectId, 
  tasks, 
  resources, 
  baseScenario, 
  onScenarioSave 
}: WhatIfAnalysisProps) {
  const [selectedScenarioType, setSelectedScenarioType] = useState<'delay' | 'resource_reduction' | 'material_shortage'>('delay')
  const [scenarioParameters, setScenarioParameters] = useState<Record<string, any>>({})
  const [scenarioResults, setScenarioResults] = useState<ScenarioResult | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [savedScenarios, setSavedScenarios] = useState<WhatIfScenario[]>([])
  const [scenarioName, setScenarioName] = useState('')

  // Load saved scenarios
  useEffect(() => {
    const loadScenarios = async () => {
      try {
        const scenarios = await scenariosService.getScenarios(projectId)
        setSavedScenarios(scenarios)
      } catch (error) {
        console.error('Error loading scenarios:', error)
      }
    }

    loadScenarios()
  }, [projectId])

  // Initialize scenario parameters based on type
  useEffect(() => {
    const initializeParameters = () => {
      switch (selectedScenarioType) {
        case 'delay':
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

  // Run scenario analysis
  const runScenarioAnalysis = async () => {
    if (!baseScenario) {
      alert('No base scenario available. Please run optimization first.')
      return
    }

    // Check if we have tasks and resources available
    if (!tasks || tasks.length === 0) {
      alert('No tasks available. Please add tasks to the project first.')
      return
    }

    if (!resources || resources.length === 0) {
      alert('No resources available. Please add resources to the project first.')
      return
    }

    setIsRunning(true)
    try {
      // Ensure baseScenario has input_parameters
      // If missing, reconstruct from props (tasks and resources)
      let scenarioToUse = baseScenario
      if (!baseScenario.input_parameters || !baseScenario.input_parameters.tasks) {
        console.warn('Base scenario missing input_parameters, reconstructing from props')
        scenarioToUse = {
          ...baseScenario,
          input_parameters: {
            tasks: tasks || [],
            resources: resources || [],
            constraints: baseScenario.input_parameters?.constraints || {},
            config: baseScenario.input_parameters?.config || {}
          }
        }
      }

      const result = await optimizationEngine.runWhatIfAnalysis(
        scenarioToUse,
        selectedScenarioType,
        scenarioParameters
      )

      setScenarioResults({
        scenarioType: selectedScenarioType,
        parameters: scenarioParameters,
        impactAnalysis: result.results.impactAnalysis,
        newSchedule: result.results.optimalSchedule,
        newCosts: result.results.totalCost
      })
    } catch (error) {
      console.error('Error running scenario analysis:', error)
      alert('Error running scenario analysis. Please try again.')
    } finally {
      setIsRunning(false)
    }
  }

  // Save scenario
  const saveScenario = async () => {
    if (!scenarioResults || !scenarioName.trim()) {
      alert('Please provide a scenario name and run analysis first.')
      return
    }

    try {
      const scenario: Omit<WhatIfScenario, 'id' | 'created_at'> = {
        project_id: projectId,
        user_id: '', // Will be set by the service
        scenario_name: scenarioName,
        scenario_type: selectedScenarioType,
        parameters: scenarioParameters,
        results: scenarioResults,
        impact_analysis: scenarioResults.impactAnalysis
      }

      const savedScenario = await scenariosService.createScenario(scenario)
      setSavedScenarios(prev => [savedScenario, ...prev])
      setScenarioName('')
      
      if (onScenarioSave) {
        onScenarioSave(savedScenario)
      }
      
      alert('Scenario saved successfully!')
    } catch (error) {
      console.error('Error saving scenario:', error)
      alert('Error saving scenario. Please try again.')
    }
  }

  // Get impact color
  const getImpactColor = (impact: number) => {
    if (impact > 0) return 'text-red-600'
    if (impact < 0) return 'text-green-600'
    return 'text-gray-600'
  }

  // Get risk level color
  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
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
            What-If Analysis
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
                <Select value={selectedScenarioType} onValueChange={(value: any) => setSelectedScenarioType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="delay">
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
                
                {selectedScenarioType === 'delay' && (
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
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Analysis Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Impact Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-blue-600 font-medium">Schedule Impact</p>
                            <p className={`text-2xl font-bold ${getImpactColor(scenarioResults.impactAnalysis.makespanImpact)}`}>
                              {scenarioResults.impactAnalysis.makespanImpact >= 0 ? '+' : ''}{scenarioResults.impactAnalysis.makespanImpact} days
                            </p>
                            <p className="text-sm text-gray-600">
                              {scenarioResults.impactAnalysis.makespanImpactPercent.toFixed(1)}% change
                            </p>
                          </div>
                          <Clock className="h-8 w-8 text-blue-600" />
                        </div>
                      </div>

                      <div className="p-4 bg-green-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-green-600 font-medium">Cost Impact</p>
                            <p className={`text-2xl font-bold ${getImpactColor(scenarioResults.impactAnalysis.costImpact)}`}>
                              {scenarioResults.impactAnalysis.costImpact >= 0 ? '+' : ''}₹{Math.abs(scenarioResults.impactAnalysis.costImpact).toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-600">
                              {scenarioResults.impactAnalysis.costImpactPercent.toFixed(1)}% change
                            </p>
                          </div>
                          <DollarSign className="h-8 w-8 text-green-600" />
                        </div>
                      </div>
                    </div>

                    {/* Risk Assessment */}
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold">Risk Assessment</h4>
                        <Badge className={getRiskColor(scenarioResults.impactAnalysis.riskLevel)}>
                          {scenarioResults.impactAnalysis.riskLevel.toUpperCase()} RISK
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Schedule Risk</span>
                          <span className={`text-sm font-medium ${
                            Math.abs(scenarioResults.impactAnalysis.makespanImpactPercent) > 20 ? 'text-red-600' :
                            Math.abs(scenarioResults.impactAnalysis.makespanImpactPercent) > 10 ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {Math.abs(scenarioResults.impactAnalysis.makespanImpactPercent) > 20 ? 'High' :
                             Math.abs(scenarioResults.impactAnalysis.makespanImpactPercent) > 10 ? 'Medium' : 'Low'}
                          </span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Cost Risk</span>
                          <span className={`text-sm font-medium ${
                            Math.abs(scenarioResults.impactAnalysis.costImpactPercent) > 15 ? 'text-red-600' :
                            Math.abs(scenarioResults.impactAnalysis.costImpactPercent) > 8 ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {Math.abs(scenarioResults.impactAnalysis.costImpactPercent) > 15 ? 'High' :
                             Math.abs(scenarioResults.impactAnalysis.costImpactPercent) > 8 ? 'Medium' : 'Low'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Save Scenario */}
                    <div className="flex items-center gap-4">
                      <Input
                        placeholder="Enter scenario name"
                        value={scenarioName}
                        onChange={(e) => setScenarioName(e.target.value)}
                        className="flex-1"
                      />
                      <Button onClick={saveScenario} className="flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        Save Scenario
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="saved" className="space-y-4">
              {savedScenarios.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No saved scenarios yet.</p>
                  <p className="text-sm">Create and save scenarios to compare different project outcomes.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {savedScenarios.map((scenario) => (
                    <Card key={scenario.id}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-semibold">{scenario.scenario_name}</h4>
                            <p className="text-sm text-gray-600 capitalize">
                              {scenario.scenario_type.replace('_', ' ')} Scenario
                            </p>
                          </div>
                          <Badge className={getRiskColor(scenario.impact_analysis?.riskLevel || 'low')}>
                            {scenario.impact_analysis?.riskLevel?.toUpperCase() || 'LOW'} RISK
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <p className="text-lg font-bold text-gray-900">
                              {scenario.impact_analysis?.makespanImpact >= 0 ? '+' : ''}{scenario.impact_analysis?.makespanImpact || 0}
                            </p>
                            <p className="text-sm text-gray-500">Days Impact</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-gray-900">
                              {scenario.impact_analysis?.costImpact >= 0 ? '+' : ''}₹{Math.abs(scenario.impact_analysis?.costImpact || 0).toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-500">Cost Impact</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-gray-900">
                              {scenario.impact_analysis?.makespanImpactPercent?.toFixed(1) || 0}%
                            </p>
                            <p className="text-sm text-gray-500">Schedule %</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-gray-900">
                              {scenario.impact_analysis?.costImpactPercent?.toFixed(1) || 0}%
                            </p>
                            <p className="text-sm text-gray-500">Cost %</p>
                          </div>
                        </div>

                        <div className="mt-4 text-xs text-gray-500">
                          Created: {new Date(scenario.created_at || '').toLocaleDateString()}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
