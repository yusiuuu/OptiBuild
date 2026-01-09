"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LabelList } from "recharts"
import { resourcesCatalogService, projectsService, projectResourcesService } from "@/lib/data-service"
import { TrendingUp, Package, Users, Wrench } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

// Enhanced color palette with gradients
// Modern, vibrant colors for better visual appeal
const COLORS = [
  "url(#colorGradient1)",
  "url(#colorGradient2)",
  "url(#colorGradient3)",
  "url(#colorGradient4)",
  "url(#colorGradient5)",
]

const SOLID_COLORS = [
  "#3b82f6", // Blue
  "#10b981", // Green
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#f97316", // Orange
]

// Gradient definitions for bars
const GradientDefs = () => (
  <defs>
    <linearGradient id="colorGradient1" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
      <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.8} />
    </linearGradient>
    <linearGradient id="colorGradient2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
      <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
    </linearGradient>
    <linearGradient id="colorGradient3" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#f59e0b" stopOpacity={1} />
      <stop offset="100%" stopColor="#d97706" stopOpacity={0.8} />
    </linearGradient>
    <linearGradient id="colorGradient4" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#ef4444" stopOpacity={1} />
      <stop offset="100%" stopColor="#dc2626" stopOpacity={0.8} />
    </linearGradient>
    <linearGradient id="colorGradient5" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
      <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.8} />
    </linearGradient>
  </defs>
)

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3 backdrop-blur-sm">
        <p className="font-semibold text-foreground mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            <span className="font-medium">{entry.name}:</span>{" "}
            <span className="font-bold">{entry.value.toLocaleString()}</span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

// Custom pie label
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  if (percent < 0.05) return null // Don't show labels for very small slices

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      className="text-xs font-semibold"
      style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

// Resource allocation chart component for construction project management
// Displays resource distribution across projects with bar and pie chart views
export function ResourceAllocationChart() {
  // State to control which chart view is currently displayed
  const [chartView, setChartView] = useState("bar")
  const [barData, setBarData] = useState<any[]>([])
  const [pieData, setPieData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasData, setHasData] = useState(false)
  const [stats, setStats] = useState({
    totalResources: 0,
    totalQuantity: 0,
    materialsCount: 0,
    equipmentCount: 0,
    laborCount: 0,
  })

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true)
        // Get all resources from the catalog
        const resources = await resourcesCatalogService.getResources()
        
        // Get all projects to aggregate quantities
        const projects = await projectsService.getProjects()
        
        // Aggregate quantities from project_resources for each resource
        const resourceQuantities: Record<string, number> = {}
        
        // Get quantities from all project_resources
        for (const project of projects) {
          try {
            const projectResources = await projectResourcesService.getProjectResources(project.id)
            projectResources.forEach((pr: any) => {
              if (pr.resource_id && pr.quantity) {
                const resourceId = pr.resource_id
                const quantity = Number(pr.quantity) || 0
                resourceQuantities[resourceId] = (resourceQuantities[resourceId] || 0) + quantity
              }
            })
          } catch (err) {
            // Skip projects with errors
            console.error(`Error loading resources for project ${project.id}:`, err)
          }
        }
        
        // Listen for resource updates
        const handleResourceUpdate = () => {
          load()
        }
        
        window.addEventListener('resource-updated', handleResourceUpdate)
        
        return () => {
          window.removeEventListener('resource-updated', handleResourceUpdate)
        }

        if (resources && resources.length > 0) {
          // Use all resources, including those with quantity 0
          const allResources = resources.filter(r => r.name) // Filter out resources without names
          
          if (allResources.length > 0) {
            setHasData(true)
            
            // Calculate statistics
            const materialsCount = allResources.filter(r => {
              const type = (r.type || '').toLowerCase()
              return type.includes('material') || type === 'materials'
            }).length
            const equipmentCount = allResources.filter(r => {
              const type = (r.type || '').toLowerCase()
              return type.includes('equipment')
            }).length
            const laborCount = allResources.filter(r => {
              const type = (r.type || '').toLowerCase()
              return type.includes('labor') || type.includes('labour')
            }).length
            
            // Calculate total quantity (sum of all allocated quantities)
            const totalQuantity = Object.values(resourceQuantities).reduce((sum, qty) => sum + qty, 0)

            setStats({
              totalResources: allResources.length,
              totalQuantity: totalQuantity, // Use actual aggregated quantities
              materialsCount,
              equipmentCount,
              laborCount,
            })

            // Aggregate by type for pie chart - use aggregated quantities per type
            const typeTotals: Record<string, number> = {}
            allResources.forEach(r => {
              const key = (r.type || 'other').toLowerCase()
              // Normalize type names
              let normalizedKey = key
              if (key.includes('material')) normalizedKey = 'material'
              else if (key.includes('equipment')) normalizedKey = 'equipment'
              else if (key.includes('labor') || key.includes('labour')) normalizedKey = 'labor'
              
              // Use aggregated quantity for this resource
              const resourceQty = resourceQuantities[r.id || ''] || 0
              typeTotals[normalizedKey] = (typeTotals[normalizedKey] || 0) + resourceQty
            })
            const pie = Object.entries(typeTotals)
              .filter(([_, value]) => value > 0)
              .map(([name, value]) => ({ 
                name: name.charAt(0).toUpperCase() + name.slice(1), 
                value 
              }))
              .sort((a, b) => b.value - a.value)

            // For bar chart, show resources with their aggregated quantities
            const bar = allResources
              .map((r, index) => {
                const resourceQty = resourceQuantities[r.id || ''] || 0
                return {
                  name: r.name || 'Unnamed Resource',
                  quantity: resourceQty, // Use actual aggregated quantity
                  fill: SOLID_COLORS[index % SOLID_COLORS.length],
                }
              })
              .filter(item => item.quantity > 0) // Only show resources with quantities
              .sort((a, b) => {
                // Sort by quantity first, then alphabetically
                if (b.quantity !== a.quantity) {
                  return b.quantity - a.quantity
                }
                return a.name.localeCompare(b.name)
              })
              .slice(0, 10) // Show top 10 resources

            setPieData(pie.length > 0 ? pie : [])
            setBarData(bar)
          } else {
            // No resources found
            setHasData(false)
            setStats({
              totalResources: 0,
              totalQuantity: 0,
              materialsCount: 0,
              equipmentCount: 0,
              laborCount: 0,
            })
            setPieData([])
            setBarData([])
          }
        } else {
          // No resources found
          setHasData(false)
          setStats({
            totalResources: 0,
            totalQuantity: 0,
            materialsCount: 0,
            equipmentCount: 0,
            laborCount: 0,
          })
          setPieData([])
          setBarData([])
        }
      } catch (e) {
        console.error('Error loading resources:', e)
        // No data on error
        setHasData(false)
        setStats({
          totalResources: 0,
          totalQuantity: 0,
          materialsCount: 0,
          equipmentCount: 0,
          laborCount: 0,
        })
        setPieData([])
        setBarData([])
      } finally {
        setIsLoading(false)
      }
    }
    load()
    
    // Also listen for storage events (cross-tab updates)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'resource-updated-timestamp') {
        load()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  return (
    <Card className="h-full border-2 shadow-lg bg-gradient-to-br from-background to-muted/20">
      {/* Chart header with title, description, and view toggle tabs */}
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b bg-gradient-to-r from-muted/30 to-transparent">
        <div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Resource Allocation
          </CardTitle>
          <CardDescription className="mt-1 text-sm">Current allocation from your resources</CardDescription>
        </div>
        {/* Chart view toggle: switch between bar chart and pie chart */}
        <Tabs defaultValue="bar" value={chartView} onValueChange={setChartView} className="w-[200px]">
          <TabsList className="grid w-full grid-cols-2 bg-muted/50">
            <TabsTrigger value="bar" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Bar
            </TabsTrigger>
            <TabsTrigger value="pie" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Pie
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      
      {/* Statistics Cards */}
      {!isLoading && hasData && (
        <div className="px-6 pt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-lg p-3 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-1">
                <Package className="h-4 w-4 text-blue-500" />
                <span className="text-xs text-muted-foreground font-medium">Total Resources</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{stats.totalResources}</p>
            </div>
            <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-lg p-3 border border-green-500/20">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-xs text-muted-foreground font-medium">Total Quantity</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{stats.totalQuantity.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 rounded-lg p-3 border border-amber-500/20">
              <div className="flex items-center gap-2 mb-1">
                <Wrench className="h-4 w-4 text-amber-500" />
                <span className="text-xs text-muted-foreground font-medium">Equipment</span>
              </div>
              <p className="text-2xl font-bold text-amber-600">{stats.equipmentCount}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-lg p-3 border border-purple-500/20">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-purple-500" />
                <span className="text-xs text-muted-foreground font-medium">Labor</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">{stats.laborCount}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Chart content area with responsive container */}
      <CardContent className="pt-4">
        {isLoading ? (
          <div className="h-[350px] w-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <div className="text-muted-foreground">Loading chart data...</div>
            </div>
          </div>
        ) : !hasData ? (
          <div className="h-[350px] w-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 text-center p-6 max-w-md">
              <Package className="h-16 w-16 text-muted-foreground/50" />
              <div>
                <p className="text-lg font-semibold text-foreground mb-2">No Resource Data Available</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Add resources to your catalog to see allocation charts
                </p>
                <div className="flex flex-col gap-3 text-xs text-left bg-muted/50 p-4 rounded-lg border">
                  <p className="font-semibold mb-1">To display resource allocation data:</p>
                  <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground mb-3">
                    <li>Add resources to your catalog in the <span className="font-medium text-foreground">Resources</span> page</li>
                    <li>Assign resources to projects with quantities</li>
                    <li>Go to any project and assign resources from your catalog</li>
                    <li>The chart will automatically show aggregated quantities from all projects</li>
                  </ol>
                  <div className="flex gap-2">
                    <Link href="/dashboard/resources">
                      <Button size="sm" variant="outline" className="flex-1">
                        Manage Resources
                      </Button>
                    </Link>
                    <Link href="/dashboard/projects">
                      <Button size="sm" className="flex-1">
                        View Projects
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-[350px] w-full">
            {/* Conditional rendering based on selected chart view */}
            {chartView === "bar" ? (
              /* Enhanced Bar chart view: shows resource allocation across different resources */
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 80,
                  }}
                  barCategoryGap="15%"
                >
                  <GradientDefs />
                  {/* Subtle grid lines */}
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                  {/* X-axis: resource names with better styling */}
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    tickLine={{ stroke: '#d1d5db' }}
                  />
                  {/* Y-axis: resource quantities */}
                  <YAxis 
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    tickLine={{ stroke: '#d1d5db' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toString()}
                  />
                  {/* Enhanced custom tooltip */}
                  <Tooltip 
                    content={<CustomTooltip />} 
                    cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                    formatter={(value: number) => value.toLocaleString('en-IN')}
                  />
                  {/* Legend with better styling */}
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="circle"
                  />
                  {/* Enhanced bars with gradients and rounded corners */}
                  <Bar 
                    dataKey="quantity" 
                    name="Quantity"
                    radius={[8, 8, 0, 0]}
                    animationDuration={800}
                  >
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill || SOLID_COLORS[index % SOLID_COLORS.length]} />
                    ))}
                    <LabelList 
                      dataKey="quantity" 
                      position="top" 
                      fill="#374151"
                      fontSize={11}
                      fontWeight={600}
                      formatter={(value: number) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toString()}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : pieData.length > 0 ? (
              /* Enhanced Pie chart view: shows overall resource distribution by type */
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <GradientDefs />
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomLabel}
                    outerRadius={120}
                    innerRadius={40}
                    paddingAngle={3}
                    dataKey="value"
                    animationDuration={800}
                  >
                    {/* Apply vibrant colors to each pie slice */}
                    {pieData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={SOLID_COLORS[index % SOLID_COLORS.length]}
                        stroke="#ffffff"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  {/* Enhanced tooltip */}
                  <Tooltip 
                    content={<CustomTooltip />}
                    formatter={(value: number, name: string) => {
                      const total = pieData.reduce((sum, item) => sum + item.value, 0)
                      const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0'
                      return [
                        `${value.toLocaleString()} (${percentage}%)`,
                        name
                      ]
                    }}
                  />
                  {/* Enhanced legend with better positioning */}
                  <Legend 
                    verticalAlign="bottom"
                    height={60}
                    iconType="circle"
                    wrapperStyle={{ paddingTop: '20px' }}
                    formatter={(value) => <span className="text-sm font-medium">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              /* Show message when pie chart has no data */
              <div className="h-full w-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-center">
                  <Package className="h-12 w-12 text-muted-foreground/50" />
                  <div>
                    <p className="text-lg font-semibold text-foreground">No Resource Type Data Available</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Resources exist but could not be categorized by type.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

