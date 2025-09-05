"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { resourcesService } from "@/lib/data-service"
import { format } from "date-fns"

// No hardcoded data; will derive from Supabase resources

// Color palette for chart visualization
// Each resource type gets a distinct color for easy identification
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"]

// Resource allocation chart component for construction project management
// Displays resource distribution across projects with bar and pie chart views
export function ResourceAllocationChart() {
  // State to control which chart view is currently displayed
  const [chartView, setChartView] = useState("bar")
  const [barData, setBarData] = useState<any[]>([])
  const [pieData, setPieData] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        // Without a specific project scope in this widget, aggregate by type
        const url = new URL(window.location.href)
        const projectId = url.pathname.includes("/dashboard/projects/") ? url.pathname.split("/").pop() : undefined
        const resources = projectId ? await resourcesService.getResources(projectId) : []

        // Aggregate by type for pie chart
        const typeTotals: Record<string, number> = {}
        resources.forEach(r => {
          const key = (r.type || '').toLowerCase()
          const qty = r.quantity || 0
          typeTotals[key] = (typeTotals[key] || 0) + qty
        })
        const pie = Object.entries(typeTotals).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))

        // For bar chart, group by resource name
        const bar = resources.map(r => ({
          name: r.name,
          quantity: r.quantity || 0,
        }))

        setPieData(pie)
        setBarData(bar)
      } catch (e) {
        setPieData([])
        setBarData([])
      }
    }
    load()
  }, [])

  return (
    <Card className="h-full">
      {/* Chart header with title, description, and view toggle tabs */}
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Resource Allocation</CardTitle>
          <CardDescription>Current allocation from your resources</CardDescription>
        </div>
        {/* Chart view toggle: switch between bar chart and pie chart */}
        <Tabs defaultValue="bar" value={chartView} onValueChange={setChartView} className="w-[200px]">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bar">Bar</TabsTrigger>
            <TabsTrigger value="pie">Pie</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      
      {/* Chart content area with responsive container */}
      <CardContent>
        <div className="h-[300px] w-full">
          {/* Conditional rendering based on selected chart view */}
          {chartView === "bar" ? (
            /* Bar chart view: shows resource allocation across different projects */
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                {/* Grid lines for better readability */}
                <CartesianGrid strokeDasharray="3 3" />
                {/* X-axis: project names */}
                <XAxis dataKey="name" />
                {/* Y-axis: resource quantities */}
                <YAxis />
                {/* Interactive tooltip on hover */}
                <Tooltip />
                {/* Legend showing resource types */}
                <Legend />
                {/* Single bar showing quantity per resource */}
                <Bar dataKey="quantity" fill="#0088FE" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            /* Pie chart view: shows overall resource distribution across all projects */
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  /* Display resource name and percentage on each slice */
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {/* Apply colors to each pie slice */}
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                {/* Interactive tooltip on hover */}
                <Tooltip />
                {/* Legend showing resource types and colors */}
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

