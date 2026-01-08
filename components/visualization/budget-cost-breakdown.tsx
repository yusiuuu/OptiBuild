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
  Target,
  Save,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { BudgetCategory, Expense, ProjectResource } from '@/lib/data-service'
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, parseISO, isWithinInterval } from 'date-fns'

interface BudgetCostBreakdownProps {
  projectId: string
  budgetCategories: BudgetCategory[]
  expenses: Expense[]
  projectResources: ProjectResource[]
  totalBudget: number
  projectStartDate?: string
  projectEndDate?: string
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
  costSaved: number
  costSavedPercent: number
  status: 'on_track' | 'over_budget' | 'under_budget' | 'at_risk'
  expenseCount: number
}

interface CostTrend {
  date: string
  month: string
  monthNumber: number
  budgeted: number
  actual: number
  committed: number
  variance: number
  variancePercent: number
}

export function BudgetCostBreakdown({ 
  projectId,
  budgetCategories,
  expenses,
  projectResources,
  totalBudget,
  projectStartDate,
  projectEndDate,
  onBudgetUpdate,
  readonly = false 
}: BudgetCostBreakdownProps) {
  const [selectedView, setSelectedView] = useState<'overview' | 'detailed' | 'trends'>('overview')
  const [costCategories, setCostCategories] = useState<CostCategory[]>([])
  const [costTrends, setCostTrends] = useState<CostTrend[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Calculate cost categories from actual database data
  useEffect(() => {
    const calculateCostCategories = async () => {
      setIsLoading(true)
      try {
        const categories: CostCategory[] = []

        // Process each budget category
        for (const category of budgetCategories) {
          // Get actual costs from expenses for this category
          const categoryExpenses = expenses.filter(e => e.category_id === category.id)
          const actual = categoryExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0)
          
          // Get committed costs from project_resources
          // Committed = sum of total_cost from project_resources that match this category
          // This represents resources allocated but expenses may not be recorded yet
          const projectResourcesForCategory = projectResources.filter(pr => {
            // Try to match resources by category name or type
            const resource = (pr as any).resource
            if (!resource) return false
            
            // Match by resource type to category name
            const resourceType = resource.type?.toLowerCase() || ''
            const categoryName = category.name.toLowerCase()
            
            if (categoryName.includes('labor') || categoryName.includes('labour')) {
              return resourceType === 'labour' || resourceType === 'labor'
            } else if (categoryName.includes('material')) {
              return resourceType === 'material'
            } else if (categoryName.includes('equipment')) {
              return resourceType === 'equipment'
            }
            return false
          })
          
          const resourcesCommitted = projectResourcesForCategory.reduce((sum, pr) => {
            return sum + (Number(pr.total_cost) || 0)
          }, 0)
          
          // Committed = resources allocated (may include future commitments)
          // If no resources match, use actual_amount from category (which is sum of expenses)
          const committed = resourcesCommitted > 0 ? resourcesCommitted : actual
          
          // Budgeted amount from the category
          const budgeted = Number(category.planned_amount) || 0
          
          // Calculate remaining (budgeted - committed)
          const remaining = budgeted - committed
          
          // Calculate variance (actual - budgeted)
          const variance = actual - budgeted
          const variancePercent = budgeted > 0 ? (variance / budgeted) * 100 : 0
          
          // Calculate cost saved (positive variance means over budget, negative means saved)
          const costSaved = budgeted - actual
          const costSavedPercent = budgeted > 0 ? (costSaved / budgeted) * 100 : 0

          // Determine status
          let status: 'on_track' | 'over_budget' | 'under_budget' | 'at_risk' = 'on_track'
          if (variancePercent > 10) {
            status = 'over_budget'
          } else if (variancePercent < -10) {
            status = 'under_budget'
          } else if (remaining < budgeted * 0.1 && remaining > 0) {
            status = 'at_risk'
          } else if (remaining < 0) {
            status = 'over_budget'
          }

          categories.push({
            id: category.id || '',
            name: category.name,
            budgeted,
            actual,
            committed,
            remaining,
            variance,
            variancePercent,
            costSaved,
            costSavedPercent,
            status,
            expenseCount: categoryExpenses.length
          })
        }

        // If no budget categories exist, create default ones based on total budget
        if (categories.length === 0 && totalBudget > 0) {
          const defaultCategories = [
            { id: 'labor', name: 'Labor', ratio: 0.4 },
            { id: 'materials', name: 'Materials', ratio: 0.35 },
            { id: 'equipment', name: 'Equipment', ratio: 0.15 },
            { id: 'overhead', name: 'Overhead & Contingency', ratio: 0.1 }
          ]

          defaultCategories.forEach(({ id, name, ratio }) => {
            const budgeted = totalBudget * ratio
            const actual = 0
            const committed = 0
            const remaining = budgeted
            const variance = -budgeted
            const variancePercent = -100
            const costSaved = budgeted
            const costSavedPercent = 100

            categories.push({
              id,
              name,
              budgeted,
              actual,
              committed,
              remaining,
              variance,
              variancePercent,
              costSaved,
              costSavedPercent,
              status: 'under_budget',
              expenseCount: 0
            })
          })
        }

        setCostCategories(categories)
      } catch (error) {
        console.error('Error calculating cost categories:', error)
      } finally {
        setIsLoading(false)
      }
    }

    calculateCostCategories()
  }, [budgetCategories, expenses, projectResources, totalBudget])

  // Generate cost trends from actual expense data
  useEffect(() => {
    const generateCostTrends = () => {
      try {
        const trends: CostTrend[] = []
        
        if (!projectStartDate || !projectEndDate) {
          // If no dates, use last 6 months from today
          const endDate = new Date()
          const startDate = new Date()
          startDate.setMonth(startDate.getMonth() - 6)
          
          const months = eachMonthOfInterval({ start: startDate, end: endDate })
          
          months.forEach((month, index) => {
            const monthStart = startOfMonth(month)
            const monthEnd = endOfMonth(month)
            
            // Calculate budgeted (distributed evenly across months)
            const totalMonths = months.length
            const monthProgress = (index + 1) / totalMonths
            const budgeted = totalBudget * monthProgress
            
            // Get actual expenses for this month
            const monthExpenses = expenses.filter(exp => {
              if (!exp.date) return false
              const expDate = parseISO(exp.date)
              return isWithinInterval(expDate, { start: monthStart, end: monthEnd })
            })
            const actual = monthExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0)
            
            // Committed = actual for now (can be enhanced with project_resources)
            const committed = actual
            
            const variance = actual - budgeted
            const variancePercent = budgeted > 0 ? (variance / budgeted) * 100 : 0

            trends.push({
              date: month.toISOString(),
              month: format(month, 'MMMM yyyy'),
              monthNumber: index + 1,
              budgeted,
              actual,
              committed,
              variance,
              variancePercent
            })
          })
        } else {
          // Use project dates
          const startDate = parseISO(projectStartDate)
          const endDate = parseISO(projectEndDate)
          const months = eachMonthOfInterval({ start: startDate, end: endDate })
          
          months.forEach((month, index) => {
            const monthStart = startOfMonth(month)
            const monthEnd = endOfMonth(month)
            
            // Calculate budgeted (distributed evenly across project duration)
            const totalMonths = months.length
            const monthProgress = (index + 1) / totalMonths
            const budgeted = totalBudget * monthProgress
            
            // Get actual expenses for this month
            const monthExpenses = expenses.filter(exp => {
              if (!exp.date) return false
              const expDate = parseISO(exp.date)
              return isWithinInterval(expDate, { start: monthStart, end: monthEnd })
            })
            const actual = monthExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0)
            
            // Committed = actual for now
            const committed = actual
            
            const variance = actual - budgeted
            const variancePercent = budgeted > 0 ? (variance / budgeted) * 100 : 0

            trends.push({
              date: month.toISOString(),
              month: format(month, 'MMMM yyyy'),
              monthNumber: index + 1,
              budgeted,
              actual,
              committed,
              variance,
              variancePercent
            })
          })
        }

        setCostTrends(trends)
      } catch (error) {
        console.error('Error generating cost trends:', error)
        setCostTrends([])
      }
    }

    generateCostTrends()
  }, [expenses, totalBudget, projectStartDate, projectEndDate])

  // Calculate totals
  const totalActual = costCategories.reduce((sum, cat) => sum + cat.actual, 0)
  const totalCommitted = costCategories.reduce((sum, cat) => sum + cat.committed, 0)
  const totalCostSaved = costCategories.reduce((sum, cat) => sum + cat.costSaved, 0)
  const totalVariance = totalActual - totalBudget
  const totalVariancePercent = totalBudget > 0 ? (totalVariance / totalBudget) * 100 : 0
  const totalCostSavedPercent = totalBudget > 0 ? (totalCostSaved / totalBudget) * 100 : 0

  // Get status color and icon
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'over_budget':
        return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
      case 'under_budget':
        return 'text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
      case 'at_risk':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading budget data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-2 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Budget</p>
                <p className="text-2xl font-bold mt-1">
                  ₹{totalBudget.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Target className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Actual Cost</p>
                <p className="text-2xl font-bold mt-1">
                  ₹{totalActual.toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {totalBudget > 0 ? ((totalActual / totalBudget) * 100).toFixed(1) : 0}% of budget
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Committed</p>
                <p className="text-2xl font-bold mt-1">
                  ₹{totalCommitted.toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {totalBudget > 0 ? ((totalCommitted / totalBudget) * 100).toFixed(1) : 0}% of budget
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-2 hover:shadow-lg transition-shadow ${totalVariance >= 0 ? 'border-red-200 dark:border-red-800' : 'border-green-200 dark:border-green-800'}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {totalVariance >= 0 ? 'Over Budget' : 'Cost Saved'}
                </p>
                <p className={`text-2xl font-bold mt-1 ${totalVariance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {totalVariance >= 0 ? '+' : ''}₹{Math.abs(totalVariance).toLocaleString('en-IN')}
                </p>
                <p className={`text-xs mt-1 ${totalVariance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {totalVariance >= 0 ? '+' : ''}{Math.abs(totalVariancePercent).toFixed(1)}%
                </p>
              </div>
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${totalVariance >= 0 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
                {totalVariance >= 0 ? (
                  <ArrowUpRight className="h-6 w-6 text-red-600 dark:text-red-400" />
                ) : (
                  <Save className="h-6 w-6 text-green-600 dark:text-green-400" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Overall Status */}
      <Card className="border-2">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {getStatusIcon(getOverallStatus())}
              <div>
                <h3 className="text-lg font-semibold">Overall Budget Status</h3>
                <p className="text-sm text-muted-foreground">
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
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Budget Utilization</span>
              <span className="font-semibold">{totalBudget > 0 ? ((totalActual / totalBudget) * 100).toFixed(1) : 0}%</span>
            </div>
            <Progress 
              value={totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0} 
              className="h-3"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>₹{totalActual.toLocaleString('en-IN')} spent</span>
              <span>₹{(totalBudget - totalActual).toLocaleString('en-IN')} remaining</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Toggle */}
      <div className="flex justify-center">
        <div className="flex border rounded-lg bg-muted/50">
          <Button
            variant={selectedView === 'overview' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedView('overview')}
            className="rounded-r-none"
          >
            <PieChart className="h-4 w-4 mr-2" />
            Overview
          </Button>
          <Button
            variant={selectedView === 'detailed' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedView('detailed')}
            className="rounded-none"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Detailed
          </Button>
          <Button
            variant={selectedView === 'trends' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedView('trends')}
            className="rounded-l-none"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Trends
          </Button>
        </div>
      </div>

      {/* Cost Categories - Overview */}
      {selectedView === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {costCategories.map((category) => (
            <Card key={category.id} className="hover:shadow-lg transition-shadow border-2">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">{category.name}</h3>
                  <Badge className={getStatusColor(category.status)}>
                    {getStatusIcon(category.status)}
                    <span className="ml-1 capitalize">{category.status.replace('_', ' ')}</span>
                  </Badge>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Budgeted</span>
                    <span className="font-semibold">₹{category.budgeted.toLocaleString('en-IN')}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Actual</span>
                    <span className="font-semibold text-blue-600">₹{category.actual.toLocaleString('en-IN')}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Committed</span>
                    <span className="font-semibold text-orange-600">₹{category.committed.toLocaleString('en-IN')}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Remaining</span>
                    <span className={`font-semibold ${category.remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ₹{category.remaining.toLocaleString('en-IN')}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm font-medium">
                      {category.variance >= 0 ? 'Over Budget' : 'Cost Saved'}
                    </span>
                    <span className={`font-bold ${category.variance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {category.variance >= 0 ? '+' : ''}₹{Math.abs(category.variance).toLocaleString('en-IN')}
                      <span className="text-xs ml-1">
                        ({category.variance >= 0 ? '+' : ''}{category.variancePercent.toFixed(1)}%)
                      </span>
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-sm text-muted-foreground mb-2">
                    <span>Utilization</span>
                    <span className="font-semibold">
                      {category.budgeted > 0 ? ((category.actual / category.budgeted) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <Progress 
                    value={category.budgeted > 0 ? (category.actual / category.budgeted) * 100 : 0} 
                    className="h-2"
                  />
                  {category.expenseCount > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {category.expenseCount} expense{category.expenseCount !== 1 ? 's' : ''} recorded
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detailed View */}
      {selectedView === 'detailed' && (
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Detailed Cost Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {costCategories.map((category) => (
                <div key={category.id} className="p-6 border-2 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold">{category.name}</h4>
                    <Badge className={getStatusColor(category.status)}>
                      {category.variancePercent.toFixed(1)}% {category.variance >= 0 ? 'over' : 'under'} budget
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-2xl font-bold">₹{category.budgeted.toLocaleString('en-IN')}</p>
                      <p className="text-sm text-muted-foreground mt-1">Budgeted</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">₹{category.actual.toLocaleString('en-IN')}</p>
                      <p className="text-sm text-muted-foreground mt-1">Actual</p>
                    </div>
                    <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <p className="text-2xl font-bold text-orange-600">₹{category.committed.toLocaleString('en-IN')}</p>
                      <p className="text-sm text-muted-foreground mt-1">Committed</p>
                    </div>
                    <div className={`text-center p-3 rounded-lg ${category.remaining < 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20'}`}>
                      <p className={`text-2xl font-bold ${category.remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ₹{category.remaining.toLocaleString('en-IN')}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">Remaining</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-sm text-muted-foreground">Variance</p>
                      <p className={`text-lg font-semibold ${category.variance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {category.variance >= 0 ? '+' : ''}₹{Math.abs(category.variance).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Utilization</p>
                      <p className="text-lg font-semibold">
                        {category.budgeted > 0 ? ((category.actual / category.budgeted) * 100).toFixed(1) : 0}%
                      </p>
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
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Cost Trends Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {costTrends.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No expense data available for trend analysis</p>
                </div>
              ) : (
                costTrends.map((trend) => (
                  <div key={trend.date} className="p-6 border-2 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold">{trend.month}</h4>
                      <Badge variant="outline" className="text-sm">
                        Month {trend.monthNumber}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <p className="text-xl font-bold">₹{trend.budgeted.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                        <p className="text-sm text-muted-foreground mt-1">Budgeted</p>
                      </div>
                      <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-xl font-bold text-blue-600">₹{trend.actual.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                        <p className="text-sm text-muted-foreground mt-1">Actual</p>
                      </div>
                      <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                        <p className="text-xl font-bold text-orange-600">₹{trend.committed.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                        <p className="text-sm text-muted-foreground mt-1">Committed</p>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <div className="flex justify-between text-sm text-muted-foreground mb-2">
                        <span>Budget vs Actual</span>
                        <span className={`font-semibold ${trend.variance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {trend.variancePercent.toFixed(1)}% {trend.variance >= 0 ? 'over' : 'under'}
                        </span>
                      </div>
                      <Progress 
                        value={trend.budgeted > 0 ? Math.min((trend.actual / trend.budgeted) * 100, 100) : 0} 
                        className="h-3"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
