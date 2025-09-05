"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  PieChart,
  BarChart3,
  Calendar,
  Target
} from 'lucide-react'
import { Task, Resource } from '@/lib/data-service'

interface BudgetCostBreakdownProps {
  tasks: Task[]
  resources: Resource[]
  totalBudget: number
  onBudgetUpdate?: (updates: { category: string; amount: number }) => void
  readonly?: boolean
}

interface CostCategory {
  id: string
  name: string
  budgeted: number
  actual: number
  committed: number
  remaining: number
  variance: number
  variancePercent: number
  status: 'on_track' | 'over_budget' | 'under_budget' | 'at_risk'
}

interface CostTrend {
  date: string
  budgeted: number
  actual: number
  committed: number
}

export function BudgetCostBreakdown({ 
  tasks, 
  resources, 
  totalBudget, 
  onBudgetUpdate, 
  readonly = false 
}: BudgetCostBreakdownProps) {
  const [selectedView, setSelectedView] = useState<'overview' | 'detailed' | 'trends'>('overview')
  const [costCategories, setCostCategories] = useState<CostCategory[]>([])
  const [costTrends, setCostTrends] = useState<CostTrend[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Calculate cost categories from tasks and resources
  useEffect(() => {
    const calculateCostCategories = () => {
      const categories: CostCategory[] = [
        {
          id: 'labor',
          name: 'Labor',
          budgeted: totalBudget * 0.4,
          actual: tasks.reduce((sum, task) => sum + (task.actual_cost || 0) * 0.6, 0),
          committed: tasks.reduce((sum, task) => sum + (task.estimated_cost || 0) * 0.6, 0),
          remaining: 0,
          variance: 0,
          variancePercent: 0,
          status: 'on_track'
        },
        {
          id: 'materials',
          name: 'Materials',
          budgeted: totalBudget * 0.35,
          actual: resources
            .filter(r => r.type === 'material')
            .reduce((sum, resource) => sum + (resource.total_cost || 0), 0),
          committed: resources
            .filter(r => r.type === 'material')
            .reduce((sum, resource) => sum + (resource.cost_per_unit || 0) * (resource.quantity || 0), 0),
          remaining: 0,
          variance: 0,
          variancePercent: 0,
          status: 'on_track'
        },
        {
          id: 'equipment',
          name: 'Equipment',
          budgeted: totalBudget * 0.15,
          actual: resources
            .filter(r => r.type === 'equipment')
            .reduce((sum, resource) => sum + (resource.total_cost || 0), 0),
          committed: resources
            .filter(r => r.type === 'equipment')
            .reduce((sum, resource) => sum + (resource.cost_per_unit || 0) * (resource.quantity || 0), 0),
          remaining: 0,
          variance: 0,
          variancePercent: 0,
          status: 'on_track'
        },
        {
          id: 'overhead',
          name: 'Overhead & Contingency',
          budgeted: totalBudget * 0.1,
          actual: totalBudget * 0.05, // Simulated
          committed: totalBudget * 0.08,
          remaining: 0,
          variance: 0,
          variancePercent: 0,
          status: 'on_track'
        }
      ]

      // Calculate remaining, variance, and status
      categories.forEach(category => {
        category.remaining = category.budgeted - category.committed
        category.variance = category.actual - category.budgeted
        category.variancePercent = (category.variance / category.budgeted) * 100

        if (category.variancePercent > 10) {
          category.status = 'over_budget'
        } else if (category.variancePercent < -10) {
          category.status = 'under_budget'
        } else if (category.remaining < category.budgeted * 0.1) {
          category.status = 'at_risk'
        } else {
          category.status = 'on_track'
        }
      })

      setCostCategories(categories)
    }

    calculateCostCategories()
  }, [tasks, resources, totalBudget])

  // Generate cost trends data
  useEffect(() => {
    const generateCostTrends = () => {
      const trends: CostTrend[] = []
      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() - 6) // 6 months of data

      for (let i = 0; i < 6; i++) {
        const date = new Date(startDate)
        date.setMonth(date.getMonth() + i)
        
        const monthProgress = (i + 1) / 6
        const budgeted = totalBudget * monthProgress
        const actual = budgeted * (0.8 + Math.random() * 0.4) // 80-120% of budgeted
        const committed = budgeted * (0.9 + Math.random() * 0.2) // 90-110% of budgeted

        trends.push({
          date: date.toISOString().split('T')[0],
          budgeted,
          actual,
          committed
        })
      }

      setCostTrends(trends)
    }

    generateCostTrends()
  }, [totalBudget])

  // Calculate totals
  const totalActual = costCategories.reduce((sum, cat) => sum + cat.actual, 0)
  const totalCommitted = costCategories.reduce((sum, cat) => sum + cat.committed, 0)
  const totalVariance = totalActual - totalBudget
  const totalVariancePercent = (totalVariance / totalBudget) * 100

  // Get status color and icon
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'over_budget':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'under_budget':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'at_risk':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'over_budget':
        return <TrendingUp className="h-4 w-4" />
      case 'under_budget':
        return <TrendingDown className="h-4 w-4" />
      case 'at_risk':
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <CheckCircle className="h-4 w-4" />
    }
  }

  const getOverallStatus = () => {
    if (totalVariancePercent > 5) return 'over_budget'
    if (totalVariancePercent < -5) return 'under_budget'
    if (totalVariancePercent > 2) return 'at_risk'
    return 'on_track'
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Budget</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{totalBudget.toLocaleString()}
                </p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Actual Cost</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{totalActual.toLocaleString()}
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
                <p className="text-sm font-medium text-gray-600">Committed</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{totalCommitted.toLocaleString()}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Variance</p>
                <p className={`text-2xl font-bold ${totalVariance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {totalVariance >= 0 ? '+' : ''}₹{Math.abs(totalVariance).toLocaleString()}
                </p>
                <p className={`text-sm ${totalVariance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {totalVariance >= 0 ? '+' : ''}{totalVariancePercent.toFixed(1)}%
                </p>
              </div>
              {totalVariance >= 0 ? (
                <TrendingUp className="h-8 w-8 text-red-600" />
              ) : (
                <TrendingDown className="h-8 w-8 text-green-600" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overall Status */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(getOverallStatus())}
              <div>
                <h3 className="text-lg font-semibold">Overall Budget Status</h3>
                <p className="text-sm text-gray-600">
                  {getOverallStatus() === 'on_track' && 'Project is on track with budget'}
                  {getOverallStatus() === 'over_budget' && 'Project is over budget'}
                  {getOverallStatus() === 'under_budget' && 'Project is under budget'}
                  {getOverallStatus() === 'at_risk' && 'Project budget is at risk'}
                </p>
              </div>
            </div>
            <Badge className={getStatusColor(getOverallStatus())}>
              {getOverallStatus().replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Budget Utilization</span>
              <span>{((totalActual / totalBudget) * 100).toFixed(1)}%</span>
            </div>
            <Progress 
              value={(totalActual / totalBudget) * 100} 
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* View Toggle */}
      <div className="flex justify-center">
        <div className="flex border rounded-lg">
          <Button
            variant={selectedView === 'overview' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedView('overview')}
          >
            <PieChart className="h-4 w-4 mr-2" />
            Overview
          </Button>
          <Button
            variant={selectedView === 'detailed' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedView('detailed')}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Detailed
          </Button>
          <Button
            variant={selectedView === 'trends' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedView('trends')}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Trends
          </Button>
        </div>
      </div>

      {/* Cost Categories */}
      {selectedView === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {costCategories.map((category) => (
            <Card key={category.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold capitalize">{category.name}</h3>
                  <Badge className={getStatusColor(category.status)}>
                    {getStatusIcon(category.status)}
                    <span className="ml-1">{category.status.replace('_', ' ')}</span>
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Budgeted</span>
                    <span className="font-medium">₹{category.budgeted.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Actual</span>
                    <span className="font-medium">₹{category.actual.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Committed</span>
                    <span className="font-medium">₹{category.committed.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Remaining</span>
                    <span className={`font-medium ${category.remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ₹{category.remaining.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Variance</span>
                    <span className={`font-medium ${category.variance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {category.variance >= 0 ? '+' : ''}₹{Math.abs(category.variance).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Utilization</span>
                    <span>{((category.actual / category.budgeted) * 100).toFixed(1)}%</span>
                  </div>
                  <Progress 
                    value={(category.actual / category.budgeted) * 100} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detailed View */}
      {selectedView === 'detailed' && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Cost Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {costCategories.map((category) => (
                <div key={category.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold capitalize">{category.name}</h4>
                    <Badge className={getStatusColor(category.status)}>
                      {category.variancePercent.toFixed(1)}% {category.variance >= 0 ? 'over' : 'under'}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">₹{category.budgeted.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">Budgeted</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">₹{category.actual.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">Actual</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">₹{category.committed.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">Committed</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-2xl font-bold ${category.remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ₹{category.remaining.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">Remaining</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trends View */}
      {selectedView === 'trends' && (
        <Card>
          <CardHeader>
            <CardTitle>Cost Trends Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {costTrends.map((trend, index) => (
                <div key={trend.date} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">
                      {new Date(trend.date).toLocaleDateString('en-US', { 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </h4>
                    <Badge variant="outline">
                      Month {index + 1}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-xl font-bold text-gray-900">₹{trend.budgeted.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">Budgeted</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-blue-600">₹{trend.actual.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">Actual</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-orange-600">₹{trend.committed.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">Committed</p>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Budget vs Actual</span>
                      <span>{((trend.actual / trend.budgeted) * 100).toFixed(1)}%</span>
                    </div>
                    <Progress 
                      value={(trend.actual / trend.budgeted) * 100} 
                      className="h-2"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
