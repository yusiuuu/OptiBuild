"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { BarChart3, Users, Package, Wrench, TrendingUp, TrendingDown } from 'lucide-react'
import { Resource } from '@/lib/data-service'
import { format, addDays, differenceInDays } from 'date-fns'

interface ResourceHistogramProps {
  resources: Resource[]
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
}

export function ResourceHistogram({ 
  resources, 
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

  // Calculate date range
  const chartStartDate = startDate || new Date()
  const chartEndDate = endDate || addDays(chartStartDate, 30)

  // Generate resource allocation data from actual resources and their availability windows
  useEffect(() => {
    const generateAllocationDataFromResources = () => {
      const days = differenceInDays(chartEndDate, chartStartDate) + 1
      const data: ResourceAllocation[] = []

      for (let i = 0; i < days; i++) {
        const currentDate = addDays(chartStartDate, i)
        const dateStr = format(currentDate, 'yyyy-MM-dd')

        let labor = 0
        let materials = 0
        let equipment = 0

        resources.forEach(resource => {
          const availableStart = resource.availability_start ? new Date(resource.availability_start) : null
          const availableEnd = resource.availability_end ? new Date(resource.availability_end) : null
          const isAvailable = (!availableStart || currentDate >= availableStart) && (!availableEnd || currentDate <= availableEnd)

          if (!isAvailable) return

          const qty = resource.quantity || 0
          if (resource.type?.toLowerCase() === 'labor') labor += qty
          else if (resource.type?.toLowerCase() === 'material' || resource.type?.toLowerCase() === 'materials') materials += qty
          else if (resource.type?.toLowerCase() === 'equipment') equipment += qty
        })

        data.push({
          date: dateStr,
          labor,
          materials,
          equipment,
          total: labor + materials + equipment
        })
      }

      setChartData(data)
    }

    generateAllocationDataFromResources()
  }, [chartStartDate, chartEndDate, resources])

  // Generate utilization data
  useEffect(() => {
    const generateUtilizationData = () => {
      const utilization: ResourceUtilization[] = resources.map(resource => {
        const totalAllocated = resource.quantity || 0
        const totalAvailable = totalAllocated // Without simulation; show as equal if not provided
        const utilizationPercent = totalAvailable > 0 ? Math.round((totalAllocated / totalAvailable) * 100) : 0
        const peakUtilization = utilizationPercent
        const averageUtilization = utilizationPercent

        return {
          resourceId: resource.id || '',
          resourceName: resource.name,
          type: resource.type,
          totalAllocated,
          totalAvailable,
          utilizationPercent,
          peakUtilization,
          averageUtilization
        }
      })

      setUtilizationData(utilization)
    }

    generateUtilizationData()
  }, [resources])

  // Filter data based on selected resource type
  const filteredData = selectedResourceType === 'all' 
    ? chartData 
    : chartData.map(day => ({
        ...day,
        [selectedResourceType]: day[selectedResourceType as keyof ResourceAllocation] as number,
        total: day[selectedResourceType as keyof ResourceAllocation] as number
      }))

  // Calculate statistics
  const totalAllocation = chartData.reduce((sum, day) => sum + day.total, 0)
  const averageAllocation = Math.round(totalAllocation / chartData.length)
  const peakAllocation = Math.max(...chartData.map(day => day.total))
  const peakDate = chartData.find(day => day.total === peakAllocation)?.date

  // Get resource type icon
  const getResourceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'labor':
        return <Users className="h-4 w-4" />
      case 'material':
        return <Package className="h-4 w-4" />
      case 'equipment':
        return <Wrench className="h-4 w-4" />
      default:
        return <BarChart3 className="h-4 w-4" />
    }
  }

  // Get utilization color
  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 90) return 'text-red-600 bg-red-50'
    if (utilization >= 75) return 'text-yellow-600 bg-yellow-50'
    if (utilization >= 50) return 'text-green-600 bg-green-50'
    return 'text-gray-600 bg-gray-50'
  }

  // Get trend indicator
  const getTrendIndicator = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="h-3 w-3 text-green-500" />
    if (current < previous) return <TrendingDown className="h-3 w-3 text-red-500" />
    return null
  }

  return (
    <div className="space-y-6">
      {/* Resource Allocation Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
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
              
              <Select value={timeRange} onValueChange={setTimeRange}>
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
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Allocation</p>
                  <p className="text-2xl font-bold text-blue-900">{totalAllocation.toLocaleString()}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Average Daily</p>
                  <p className="text-2xl font-bold text-green-900">{averageAllocation.toLocaleString()}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </div>
            
            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 font-medium">Peak Allocation</p>
                  <p className="text-2xl font-bold text-orange-900">{peakAllocation.toLocaleString()}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-600" />
              </div>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">Peak Date</p>
                  <p className="text-lg font-bold text-purple-900">
                    {peakDate ? format(new Date(peakDate), 'MMM dd') : 'N/A'}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Histogram Chart */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold">Daily Resource Allocation</h4>
              <div className="flex gap-2 text-sm">
                {selectedResourceType === 'all' && (
                  <>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-blue-500 rounded"></div>
                      <span>Labor</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      <span>Materials</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-orange-500 rounded"></div>
                      <span>Equipment</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-full">
                <div className="flex items-end gap-1 h-64 border-b border-l border-gray-200">
                  {filteredData.map((day, index) => {
                    const maxValue = Math.max(...filteredData.map(d => d.total))
                    const height = (day.total / maxValue) * 200

                    return (
                      <TooltipProvider key={day.date}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex flex-col items-center group cursor-pointer">
                              {selectedResourceType === 'all' ? (
                                <div className="flex flex-col items-end">
                                  <div
                                    className="w-4 bg-orange-500 hover:bg-orange-600 transition-colors"
                                    style={{ height: `${(day.equipment / maxValue) * 200}px` }}
                                  />
                                  <div
                                    className="w-4 bg-green-500 hover:bg-green-600 transition-colors"
                                    style={{ height: `${(day.materials / maxValue) * 200}px` }}
                                  />
                                  <div
                                    className="w-4 bg-blue-500 hover:bg-blue-600 transition-colors"
                                    style={{ height: `${(day.labor / maxValue) * 200}px` }}
                                  />
                                </div>
                              ) : (
                                <div
                                  className="w-4 bg-blue-500 hover:bg-blue-600 transition-colors"
                                  style={{ height: `${height}px` }}
                                />
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-sm">
                              <p className="font-medium">{format(new Date(day.date), 'MMM dd, yyyy')}</p>
                              {selectedResourceType === 'all' ? (
                                <div className="mt-1 space-y-1">
                                  <p>Labor: {day.labor}</p>
                                  <p>Materials: {day.materials}</p>
                                  <p>Equipment: {day.equipment}</p>
                                  <p className="font-medium">Total: {day.total}</p>
                                </div>
                              ) : (
                                <p className="mt-1">{selectedResourceType}: {day.total}</p>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )
                  })}
                </div>
                
                {/* X-axis labels */}
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  {(() => {
                    const first = filteredData[0]?.date ? new Date(filteredData[0].date) : null
                    const middle = filteredData.length > 0 ? (filteredData[Math.floor(filteredData.length / 2)]?.date ? new Date(filteredData[Math.floor(filteredData.length / 2)].date) : null) : null
                    const last = filteredData[filteredData.length - 1]?.date ? new Date(filteredData[filteredData.length - 1].date) : null
                    const safeFormat = (d: Date | null) => (d && !isNaN(d.getTime()) ? format(d, 'MMM dd') : '-')
                    return (
                      <>
                        <span>{safeFormat(first)}</span>
                        <span>{safeFormat(middle)}</span>
                        <span>{safeFormat(last)}</span>
                      </>
                    )
                  })()}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resource Utilization Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Resource Utilization Analysis
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {utilizationData.map((resource) => (
              <div key={resource.resourceId} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getResourceIcon(resource.type)}
                    <div>
                      <h4 className="font-medium text-gray-900">{resource.resourceName}</h4>
                      <p className="text-sm text-gray-500 capitalize">{resource.type}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={getUtilizationColor(resource.utilizationPercent)}>
                      {resource.utilizationPercent}% Utilized
                    </Badge>
                    {getTrendIndicator(resource.utilizationPercent, resource.averageUtilization)}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{resource.totalAllocated}</p>
                    <p className="text-sm text-gray-500">Allocated</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{resource.totalAvailable}</p>
                    <p className="text-sm text-gray-500">Available</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{resource.peakUtilization}%</p>
                    <p className="text-sm text-gray-500">Peak Usage</p>
                  </div>
                </div>

                {/* Utilization Progress Bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Utilization</span>
                    <span>{resource.utilizationPercent}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        resource.utilizationPercent >= 90 ? 'bg-red-500' :
                        resource.utilizationPercent >= 75 ? 'bg-yellow-500' :
                        resource.utilizationPercent >= 50 ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                      style={{ width: `${Math.min(resource.utilizationPercent, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
