"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, TrendingDown, TrendingUp, AlertTriangle } from "lucide-react"

// Mock data for materials resource optimization recommendations
// AI-generated suggestions for improving material usage and allocation
const materialsOptimization = [
  {
    id: 1,
    resource: "Concrete Usage",
    change: "-15%",
    impact: "high",
    description: "Optimized mix design can reduce concrete usage by 15%",
    type: "reduction",
    project: "Office Tower Phase 1",
  },
  {
    id: 2,
    resource: "Steel Allocation",
    change: "+8%",
    impact: "medium",
    description: "Reallocate steel from Project A to Project C",
    type: "efficiency",
    project: "Residential Complex",
  },
  {
    id: 3,
    resource: "Timber Sourcing",
    change: "-22%",
    impact: "high",
    description: "Switch to local sustainable timber sources",
    type: "reduction",
    project: "All Projects",
  },
  {
    id: 4,
    resource: "Insulation Materials",
    change: "-10%",
    impact: "medium",
    description: "Use higher R-value insulation to reduce quantity needed",
    type: "reduction",
    project: "Shopping Mall",
  },
]

// Mock data for labor resource optimization recommendations
// AI-generated suggestions for improving workforce efficiency and allocation
const laborOptimization = [
  {
    id: 1,
    resource: "Skilled Labor",
    change: "-8%",
    impact: "medium",
    description: "Redistribute skilled workers across projects based on critical path",
    type: "efficiency",
    project: "All Projects",
  },
  {
    id: 2,
    resource: "Overtime Hours",
    change: "-20%",
    impact: "high",
    description: "Optimize scheduling to reduce overtime requirements",
    type: "reduction",
    project: "Highway Extension",
  },
  {
    id: 3,
    resource: "Specialized Crews",
    change: "+15%",
    impact: "high",
    description: "Increase specialized crews for complex tasks to improve quality and speed",
    type: "efficiency",
    project: "Office Tower Phase 1",
  },
]

// Mock data for equipment resource optimization recommendations
// AI-generated suggestions for improving equipment utilization and efficiency
const equipmentOptimization = [
  {
    id: 1,
    resource: "Heavy Machinery",
    change: "-12%",
    impact: "high",
    description: "Share equipment between nearby project sites",
    type: "efficiency",
    project: "Highway Extension",
  },
  {
    id: 2,
    resource: "Tool Inventory",
    change: "-5%",
    impact: "low",
    description: "Implement tool tracking system to reduce losses",
    type: "reduction",
    project: "All Projects",
  },
  {
    id: 3,
    resource: "Equipment Idle Time",
    change: "-25%",
    impact: "high",
    description: "Optimize equipment scheduling to minimize idle time",
    type: "efficiency",
    project: "Residential Complex",
  },
]

// Resource optimization tabs component for construction project management
// Displays AI-powered recommendations for optimizing materials, labor, and equipment usage
export function ResourceOptimizationTabs() {
  // State to track which optimization category is currently active
  const [activeTab, setActiveTab] = useState("materials")

  // Generate impact badge with appropriate color coding
  // Visual indicators for the potential impact of optimization recommendations
  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case "high":
        return <Badge className="bg-green-500">High Impact</Badge>
      case "medium":
        return <Badge className="bg-blue-500">Medium Impact</Badge>
      case "low":
        return <Badge className="bg-gray-500">Low Impact</Badge>
      default:
        return <Badge>Unknown</Badge>
    }
  }

  // Generate change type icon based on optimization category
  // Visual indicators for whether the recommendation reduces usage or improves efficiency
  const getChangeIcon = (type: string) => {
    switch (type) {
      case "reduction":
        return <TrendingDown className="h-4 w-4 text-green-500" />
      case "efficiency":
        return <TrendingUp className="h-4 w-4 text-blue-500" />
      case "risk":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />
      default:
        return null
    }
  }

  // Get the appropriate data set based on the currently active tab
  // Returns the relevant optimization recommendations for the selected category
  const getActiveData = () => {
    switch (activeTab) {
      case "materials":
        return materialsOptimization
      case "labor":
        return laborOptimization
      case "equipment":
        return equipmentOptimization
      default:
        return []
    }
  }

  return (
    <Card>
      {/* Card header with title and description */}
      <CardHeader>
        <CardTitle>Resource Optimization</CardTitle>
        <CardDescription>AI-powered recommendations for resource optimization</CardDescription>
      </CardHeader>
      
      {/* Card content with tabbed interface */}
      <CardContent>
        <Tabs defaultValue="materials" value={activeTab} onValueChange={setActiveTab}>
          {/* Tab navigation for different resource categories */}
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="materials">Materials</TabsTrigger>
            <TabsTrigger value="labor">Labor</TabsTrigger>
            <TabsTrigger value="equipment">Equipment</TabsTrigger>
          </TabsList>
          
          {/* Tab content area with optimization recommendations */}
          <TabsContent value={activeTab} className="space-y-4 pt-4">
            {/* Grid layout for optimization recommendation cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Map through active tab data and display optimization cards */}
              {getActiveData().map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  {/* Card header with resource name and change type icon */}
                  <CardHeader className="pb-2 flex flex-row justify-between items-start">
                    <CardTitle className="text-sm">{item.resource}</CardTitle>
                    {getChangeIcon(item.type)}
                  </CardHeader>
                  
                  {/* Card content with optimization details */}
                  <CardContent>
                    {/* Change percentage and impact badge row */}
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-lg font-bold">{item.change}</div>
                      {getImpactBadge(item.impact)}
                    </div>
                    
                    {/* Optimization description */}
                    <p className="text-xs text-gray-500 mb-2">{item.description}</p>
                    
                    {/* Affected project information */}
                    <div className="text-xs text-gray-400">Project: {item.project}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* View all recommendations button */}
            <div className="flex justify-end">
              <Button variant="outline" size="sm">
                View All Recommendations
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

