"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, TrendingDown, TrendingUp, AlertTriangle } from "lucide-react"

// No mock data - optimization recommendations will be generated from real project data

// Resource optimization tabs component for construction project management
// Displays AI-powered recommendations for optimizing materials, labor, and equipment usage
export function ResourceOptimizationTabs() {
  // State to track which optimization category is currently active
  const [activeTab, setActiveTab] = useState("materials")
  const [optimizations, setOptimizations] = useState<{
    materials: any[]
    labor: any[]
    equipment: any[]
  }>({
    materials: [],
    labor: [],
    equipment: []
  })

  // Load optimization data from real projects (placeholder for now)
  useEffect(() => {
    // TODO: Implement real optimization logic based on project data
    setOptimizations({
      materials: [],
      labor: [],
      equipment: []
    })
  }, [])

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
        return optimizations.materials
      case "labor":
        return optimizations.labor
      case "equipment":
        return optimizations.equipment
      default:
        return []
    }
  }

  return (
    <Card>
      {/* Card header with title and description */}
      <CardHeader className="px-4 pt-4 pb-3">
        <CardTitle className="text-base">Resource Optimization</CardTitle>
        <CardDescription className="text-xs">AI-powered recommendations for resource optimization</CardDescription>
      </CardHeader>
      
      {/* Card content with tabbed interface */}
      <CardContent className="px-4 pb-4">
        <Tabs defaultValue="materials" value={activeTab} onValueChange={setActiveTab}>
          {/* Tab navigation for different resource categories */}
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="materials">Materials</TabsTrigger>
            <TabsTrigger value="labor">Labor</TabsTrigger>
            <TabsTrigger value="equipment">Equipment</TabsTrigger>
          </TabsList>
          
          {/* Tab content area with optimization recommendations */}
          <TabsContent value={activeTab} className="space-y-4 pt-4">
            {getActiveData().length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No optimization recommendations available yet. Run optimization on your projects to see recommendations.
              </div>
            ) : (
              <>
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
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

