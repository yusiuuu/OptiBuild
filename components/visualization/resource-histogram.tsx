"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts'
import { BarChart3, Users, Package, Wrench, TrendingUp, TrendingDown, Calendar, DollarSign, Activity } from 'lucide-react'
import { Resource, ProjectResource, resourcesCatalogService } from '@/lib/data-service'
import { format, addDays, differenceInDays, parseISO, eachDayOfInterval, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'

interface ResourceHistogramProps {
  resources: (Resource & { quantity?: number; availability_start?: string; availability_end?: string })[]
  projectResources?: ProjectResource[]
  projectId?: string
  startDate?: Date
  endDate?: Date
  onResourceUpdate?: (resourceId: string, updates: Partial<Resource>) => void
  readonly?: boolean
}

interface ResourceAllocation {
  date: string
  labor: number
  materials: number
  equipment: number
  total: number
  cost: number
}

interface ResourceUtilization {
  resourceId: string
  resourceName: string
  type: string
  totalAllocated: number
  totalAvailable: number
  utilizationPercent: number
  peakUtilization: number
  averageUtilization: number
  cost: number
  unit: string
}

export function ResourceHistogram({ 
  resources, 
  projectResources = [],
  projectId,
  startDate, 
  endDate, 
  onResourceUpdate, 
  readonly = false 
}: ResourceHistogramProps) {
  const [selectedResourceType, setSelectedResourceType] = useState<string>('all')
  const [selectedMetric, setSelectedMetric] = useState<'allocation' | 'utilization' | 'cost'>('allocation')
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month')
  const [chartData, setChartData] = useState<ResourceAllocation[]>([])
  const [utilizationData, setUtilizationData] = useState<ResourceUtilization[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [catalogResources, setCatalogResources] = useState<Resource[]>([])

  // Load catalog resources for utilization calculation
  useEffect(() => {
    const loadCatalogResources = async () => {
      try {
        if (projectId) {
          const catalog = await resourcesCatalogService.getResources()
          setCatalogResources(catalog)
        }
      } catch (error) {
        console.error('Error loading catalog resources:', error)
      }
    }
    loadCatalogResources()
  }, [projectId])

  // Calculate date range
  const chartStartDate = startDate || new Date()
  const chartEndDate = endDate || addDays(chartStartDate, 30)

  // Generate resource allocation data from actual resources and their availability windows
  useEffect(() => {
    const generateAllocationDataFromResources = () => {
      setIsLoading(true)
      try {
        const days = differenceInDays(chartEndDate, chartStartDate) + 1
        const data: ResourceAllocation[] = []

        for (let i = 0; i < days; i++) {
          const currentDate = addDays(chartStartDate, i)
          const dateStr = format(currentDate, 'yyyy-MM-dd')

          let labor = 0
          let materials = 0
          let equipment = 0
          let cost = 0

          resources.forEach(resource => {
            const availableStart = resource.availability_start ? parseISO(resource.availability_start) : null
            const availableEnd = resource.availability_end ? parseISO(resource.availability_end) : null
            const isAvailable = (!availableStart || currentDate >= availableStart) && (!availableEnd || currentDate <= availableEnd)

            if (!isAvailable) return

            const qty = resource.quantity || 0
            const baseCost = resource.base_cost || 0
            const resourceCost = qty * baseCost

            if (resource.type?.toLowerCase() === 'labor' || resource.type?.toLowerCase() === 'labour') {
              labor += qty
            } else if (resource.type?.toLowerCase() === 'material' || resource.type?.toLowerCase() === 'materials') {
              materials += qty
            } else if (resource.type?.toLowerCase() === 'equipment') {
              equipment += qty
            }
            
            cost += resourceCost
          })

          data.push({
            date: dateStr,
            labor,
            materials,
            equipment,
            total: labor + materials + equipment,
            cost
          })
        }

        setChartData(data)
      } catch (error) {
        console.error('Error generating allocation data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    generateAllocationDataFromResources()
  }, [chartStartDate, chartEndDate, resources])

  // Generate utilization data from real catalog vs allocated
  useEffect(() => {
    const generateUtilizationData = async () => {
      try {
        const utilization: ResourceUtilization[] = []

        // Group resources by resource_id to calculate totals
        const resourceMap = new Map<string, {
          resource: Resource
          totalAllocated: number
          allocations: ProjectResource[]
        }>()

        // Process project resources
        projectResources.forEach(pr => {
          const resourceId = pr.resource_id
          if (!resourceId) return

          if (!resourceMap.has(resourceId)) {
            const resource = resources.find(r => r.id === resourceId) || pr.resource as any
            resourceMap.set(resourceId, {
              resource: resource as Resource,
              totalAllocated: 0,
              allocations: []
            })
          }

          const entry = resourceMap.get(resourceId)!
          entry.totalAllocated += pr.quantity || 0
          entry.allocations.push(pr)
        })

        // Calculate utilization for each resource
        for (const [resourceId, { resource, totalAllocated, allocations }] of resourceMap.entries()) {
          // Find in catalog to get available quantity
          const catalogResource = catalogResources.find(r => r.id === resourceId)
          const totalAvailable = catalogResource?.quantity || resource.quantity || totalAllocated
          
          const utilizationPercent = totalAvailable > 0 
            ? Math.round((totalAllocated / totalAvailable) * 100) 
            : 0

          // Calculate peak utilization (max allocation in any single allocation)
          const peakAllocation = Math.max(...allocations.map(a => a.quantity || 0), totalAllocated)
          const peakUtilization = totalAvailable > 0 
            ? Math.round((peakAllocation / totalAvailable) * 100) 
            : 0

          // Calculate average utilization
          const averageUtilization = utilizationPercent

          // Calculate cost
          const baseCost = resource.base_cost || 0
          const cost = totalAllocated * baseCost

          utilization.push({
            resourceId: resourceId || resource.id || 'unknown',
            resourceName: resource.name || 'Unknown Resource',
            type: resource.type || 'unknown',
            totalAllocated,
            totalAvailable,
            utilizationPercent: Math.min(100, utilizationPercent),
            peakUtilization: Math.min(100, peakUtilization),
            averageUtilization: Math.min(100, averageUtilization),
            cost,
            unit: resource.unit || ''
          })
        }

        // If no project resources, use direct resources
        if (utilization.length === 0) {
          const uniqueResources = resources.filter((resource, index, self) => 
            index === self.findIndex((r) => r.id === resource.id)
          )

          uniqueResources.forEach((resource, index) => {
            const totalAllocated = resource.quantity || 0
            const catalogResource = catalogResources.find(r => r.id === resource.id)
            const totalAvailable = catalogResource?.quantity || resource.quantity || totalAllocated
            const utilizationPercent = totalAvailable > 0 
              ? Math.round((totalAllocated / totalAvailable) * 100) 
              : 0

            const baseCost = resource.base_cost || 0
            const cost = totalAllocated * baseCost

            utilization.push({
              resourceId: resource.id || `resource-${index}`,
              resourceName: resource.name,
              type: resource.type || 'unknown',
              totalAllocated,
              totalAvailable,
              utilizationPercent: Math.min(100, utilizationPercent),
              peakUtilization: Math.min(100, utilizationPercent),
              averageUtilization: Math.min(100, utilizationPercent),
              cost,
              unit: resource.unit || ''
            })
          })
        }

        setUtilizationData(utilization)
      } catch (error) {
        console.error('Error generating utilization data:', error)
      }
    }

    generateUtilizationData()
  }, [resources, projectResources, catalogResources])

  // Filter data based on selected resource type and time range
  const getFilteredData = () => {
    let filtered = chartData

    // Apply time range filter
    if (timeRange === 'week') {
      filtered = filtered.slice(-7)
    } else if (timeRange === 'month') {
      filtered = filtered.slice(-30)
    } else if (timeRange === 'quarter') {
      filtered = filtered.slice(-90)
    }

    // Apply resource type filter
    if (selectedResourceType !== 'all') {
      filtered = filtered.map(day => ({
        ...day,
        total: day[selectedResourceType as keyof ResourceAllocation] as number
      }))
    }

    return filtered
  }

  const filteredData = getFilteredData()

  // Calculate statistics from filtered data
  const totalAllocation = filteredData.reduce((sum, day) => sum + day.total, 0)
  const averageAllocation = filteredData.length > 0 ? Math.round(totalAllocation / filteredData.length) : 0
  const peakAllocation = filteredData.length > 0 ? Math.max(...filteredData.map(day => day.total)) : 0
  const peakDate = filteredData.find(day => day.total === peakAllocation)?.date
  const totalCost = filteredData.reduce((sum, day) => sum + day.cost, 0)

  // Format chart data for recharts
  const chartDataForRecharts = filteredData.map(day => ({
    date: format(parseISO(day.date), 'MMM dd'),
    fullDate: day.date,
    Labor: day.labor,
    Materials: day.materials,
    Equipment: day.equipment,
    Total: day.total,
    Cost: day.cost
  }))

  // Get resource type icon
  const getResourceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'labor':
      case 'labour':
        return <Users className="h-4 w-4" />
      case 'material':
      case 'materials':
        return <Package className="h-4 w-4" />
      case 'equipment':
        return <Wrench className="h-4 w-4" />
      default:
        return <BarChart3 className="h-4 w-4" />
    }
  }

  // Get utilization color
  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 90) return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
    if (utilization >= 75) return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
    if (utilization >= 50) return 'text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
    return 'text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800'
  }

  // Get progress bar color
  const getProgressColor = (utilization: number) => {
    if (utilization >= 90) return 'bg-red-500'
    if (utilization >= 75) return 'bg-yellow-500'
    if (utilization >= 50) return 'bg-green-500'
    return 'bg-gray-400'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading resource data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Resource Allocation Timeline */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-xl">
              <BarChart3 className="h-6 w-6" />
              Resource Allocation Timeline
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Select value={selectedResourceType} onValueChange={setSelectedResourceType}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Resources</SelectItem>
                  <SelectItem value="labor">Labor</SelectItem>
                  <SelectItem value="materials">Materials</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={timeRange} onValueChange={(value: 'week' | 'month' | 'quarter') => setTimeRange(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="quarter">Quarter</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Enhanced Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Allocation</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                      {totalAllocation.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">Average Daily</p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
                      {averageAllocation.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-200 dark:bg-green-800 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-800/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Peak Allocation</p>
                    <p className="text-2xl font-bold text-orange-900 dark:text-orange-100 mt-1">
                      {peakAllocation.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-orange-200 dark:bg-orange-800 flex items-center justify-center">
                    <Activity className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Peak Date</p>
                    <p className="text-lg font-bold text-purple-900 dark:text-purple-100 mt-1">
                      {peakDate ? format(parseISO(peakDate), 'MMM dd') : 'N/A'}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-purple-200 dark:bg-purple-800 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Professional Chart */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold">Daily Resource Allocation</h4>
              <div className="flex gap-4 text-sm">
                {selectedResourceType === 'all' && (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded"></div>
                      <span>Labor</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      <span>Materials</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-orange-500 rounded"></div>
                      <span>Equipment</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                {selectedResourceType === 'all' ? (
                  <BarChart data={chartDataForRecharts}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      className="text-xs"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis className="text-xs" />
                    <RechartsTooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: any) => [value.toLocaleString('en-IN'), '']}
                    />
                    <Legend />
                    <Bar dataKey="Labor" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Materials" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Equipment" fill="#f97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : (
                  <AreaChart data={chartDataForRecharts}>
                    <defs>
                      <linearGradient id={`colorTotal-${selectedResourceType}-${projectId || 'default'}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      className="text-xs"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis className="text-xs" />
                    <RechartsTooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: any) => [value.toLocaleString('en-IN'), '']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="Total" 
                      stroke="#3b82f6" 
                      fillOpacity={1}
                      fill={`url(#colorTotal-${selectedResourceType}-${projectId || 'default'})`}
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resource Utilization Analysis */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Users className="h-6 w-6" />
            Resource Utilization Analysis
          </CardTitle>
        </CardHeader>

        <CardContent>
          {utilizationData.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No resource utilization data available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {utilizationData.map((resource, index) => (
                <Card key={`${resource.resourceId}-${index}`} className="border-2 hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                          {getResourceIcon(resource.type)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-lg">{resource.resourceName}</h4>
                          <p className="text-sm text-muted-foreground capitalize">{resource.type}</p>
                        </div>
                      </div>
                      
                      <Badge className={getUtilizationColor(resource.utilizationPercent)}>
                        {resource.utilizationPercent}% Utilized
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <p className="text-2xl font-bold">{resource.totalAllocated.toLocaleString('en-IN')}</p>
                        <p className="text-sm text-muted-foreground mt-1">Allocated</p>
                        <p className="text-xs text-muted-foreground">{resource.unit}</p>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <p className="text-2xl font-bold">{resource.totalAvailable.toLocaleString('en-IN')}</p>
                        <p className="text-sm text-muted-foreground mt-1">Available</p>
                        <p className="text-xs text-muted-foreground">{resource.unit}</p>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <p className="text-2xl font-bold">{resource.peakUtilization}%</p>
                        <p className="text-sm text-muted-foreground mt-1">Peak Usage</p>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <p className="text-2xl font-bold">₹{resource.cost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                        <p className="text-sm text-muted-foreground mt-1">Total Cost</p>
                      </div>
                    </div>

                    {/* Enhanced Utilization Progress Bar */}
                    <div className="mt-4">
                      <div className="flex justify-between text-sm text-muted-foreground mb-2">
                        <span className="font-medium">Utilization</span>
                        <span className="font-semibold">{resource.utilizationPercent}%</span>
                      </div>
                      <Progress 
                        value={resource.utilizationPercent} 
                        className="h-3"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>{resource.totalAllocated.toLocaleString('en-IN')} {resource.unit} allocated</span>
                        <span>{resource.totalAvailable.toLocaleString('en-IN')} {resource.unit} available</span>
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
