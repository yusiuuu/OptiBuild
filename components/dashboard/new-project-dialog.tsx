"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, Loader2, Plus, X } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { enhancedProjectsService, constraintsService, type ConstraintMaster, type Project } from "@/lib/data-service"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import { PostProjectCreationWorkflow } from "./post-project-creation-workflow"

// Props interface for the new project dialog component
// Controls dialog open/close state from parent component
interface NewProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// New project dialog component for creating construction projects
// Provides a comprehensive form for project initialization with validation
export function NewProjectDialog({ open, onOpenChange }: NewProjectDialogProps) {
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 4
  const [createdProject, setCreatedProject] = useState<Project | null>(null)
  const [showWorkflow, setShowWorkflow] = useState(false)
  
  // Basic Project Information
  const [projectName, setProjectName] = useState("")
  const [projectType, setProjectType] = useState("")
  const [location, setLocation] = useState("")
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [budget, setBudget] = useState("")
  const [description, setDescription] = useState("")
  
  // Project Structure & Area
  const [areaSqft, setAreaSqft] = useState("")
  const [structureType, setStructureType] = useState("")
  const [floors, setFloors] = useState("")
  const [buildingHeight, setBuildingHeight] = useState("")
  
  // Project Constraints (from database)
  const [constraintsMaster, setConstraintsMaster] = useState<ConstraintMaster[]>([])
  const [selectedConstraintIds, setSelectedConstraintIds] = useState<string[]>([])
  const [constraintDetails, setConstraintDetails] = useState<Record<string, string>>({})
  
  // Project Requirements
  const [requirements, setRequirements] = useState({
    parkingSpaces: "",
    elevators: "",
    fireSafety: false,
    securitySystem: false,
    hvacSystem: false,
    renewableEnergy: false
  })

  // Load constraints master list on mount
  useEffect(() => {
    const loadConstraints = async () => {
      try {
        const constraints = await constraintsService.getConstraintsMaster()
        setConstraintsMaster(constraints)
      } catch (error) {
        console.error('Error loading constraints:', error)
        toast.error('Failed to load constraints')
      }
    }
    if (open) {
      loadConstraints()
    }
  }, [open])

  // Handle form submission for new project creation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast.error("Please log in to create a project")
      return
    }

    setIsSubmitting(true)

    try {
      // Validate required fields
      if (!projectName || !projectType || !location || !startDate || !endDate || !budget) {
        toast.error("Please fill in all required fields")
        return
      }

      // Send full extended fields now that the schema is updated
      const projectDataDb = {
        user_id: user.id,
        name: projectName,
        type: projectType,
        location: location,
        start_date: startDate?.toISOString().split('T')[0],
        end_date: endDate?.toISOString().split('T')[0],
        budget: parseFloat(budget) || 0,
        description: description,
        area_sqft: parseFloat(areaSqft) || undefined,
        total_area: parseFloat(areaSqft) || undefined, // Also set total_area
        structure_type: structureType,
        floors: parseInt(floors) || undefined,
        building_height: buildingHeight ? parseFloat(buildingHeight) : undefined,
        project_requirements: requirements,
        status: 'Planning',
        progress: 0
      }

      // Create project with constraints using enhanced service
      const createdProject = await enhancedProjectsService.createProjectWithConstraints(
        projectDataDb,
        selectedConstraintIds.length > 0 ? selectedConstraintIds : undefined
      )

      // If constraints have details, update them
      if (selectedConstraintIds.length > 0) {
        // Note: Details will be handled separately if needed
        // For now, constraints are assigned without details
        // You can extend this to add details per constraint
      }

      toast.success("Project created successfully!")
      
      // Store created project and show workflow
      setCreatedProject(createdProject)
      
      // Reset form
      resetForm()
      onOpenChange(false)
      
      // Show post-creation workflow
      setShowWorkflow(true)
    } catch (error) {
      const message = error instanceof Error ? error.message : (() => {
        try { return JSON.stringify(error) } catch { return String(error) }
      })()
      console.error('Error creating project:', message)
      toast.error(`Failed to create project: ${message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setCurrentStep(1)
    setCreatedProject(null)
    setProjectName("")
    setProjectType("")
    setLocation("")
    setStartDate(undefined)
    setEndDate(undefined)
    setBudget("")
    setDescription("")
    setAreaSqft("")
    setStructureType("")
    setFloors("")
    setBuildingHeight("")
    setSelectedConstraintIds([])
    setConstraintDetails({})
    setRequirements({
      parkingSpaces: "",
      elevators: "",
      fireSafety: false,
      securitySystem: false,
      hvacSystem: false,
      renewableEnergy: false
    })
  }

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Step {currentStep} of {totalSteps}: {getStepTitle(currentStep)}
          </DialogDescription>
        </DialogHeader>
        
        {/* Progress indicator */}
        <div className="flex items-center space-x-2 mb-6">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded ${
                i + 1 <= currentStep ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Step 1: Basic Project Information */}
            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>Basic Project Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="project-name">Project Name *</Label>
                      <Input
                        id="project-name"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder="Enter project name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="project-type">Project Type *</Label>
                      <Select value={projectType} onValueChange={setProjectType} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select project type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="commercial">Commercial</SelectItem>
                          <SelectItem value="residential">Residential</SelectItem>
                          <SelectItem value="infrastructure">Infrastructure</SelectItem>
                          <SelectItem value="industrial">Industrial</SelectItem>
                          <SelectItem value="mixed-use">Mixed-Use</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="location">Location *</Label>
                    <Input
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Enter project location"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start-date">Start Date *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate ? format(startDate, "PPP") : "Select start date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <Label htmlFor="end-date">End Date *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endDate ? format(endDate, "PPP") : "Select end date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="budget">Budget (₹) *</Label>
                    <Input
                      id="budget"
                      type="number"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      placeholder="e.g. 10000000"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter project description"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Project Structure & Area */}
            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle>Project Structure & Area</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="area-sqft">Total Area (sq ft) *</Label>
                      <Input
                        id="area-sqft"
                        type="number"
                        value={areaSqft}
                        onChange={(e) => setAreaSqft(e.target.value)}
                        placeholder="e.g. 50000"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="structure-type">Structure Type *</Label>
                      <Select value={structureType} onValueChange={setStructureType} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select structure type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="steel-frame">Steel Frame</SelectItem>
                          <SelectItem value="concrete">Concrete</SelectItem>
                          <SelectItem value="masonry">Masonry</SelectItem>
                          <SelectItem value="wood-frame">Wood Frame</SelectItem>
                          <SelectItem value="precast">Precast Concrete</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="floors">Number of Floors *</Label>
                      <Input
                        id="floors"
                        type="number"
                        value={floors}
                        onChange={(e) => setFloors(e.target.value)}
                        placeholder="e.g. 10"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="building-height">Building Height (ft)</Label>
                      <Input
                        id="building-height"
                        type="number"
                        value={buildingHeight}
                        onChange={(e) => setBuildingHeight(e.target.value)}
                        placeholder="e.g. 120"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Project Constraints */}
            {currentStep === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle>Project Constraints</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <Label>Select applicable constraints:</Label>
                    {constraintsMaster.length === 0 ? (
                      <div className="text-sm text-muted-foreground">Loading constraints...</div>
                    ) : (
                      constraintsMaster.map((constraint) => (
                        <div key={constraint.id} className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={constraint.id}
                              checked={selectedConstraintIds.includes(constraint.id || '')}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedConstraintIds(prev => [...prev, constraint.id || ''])
                                } else {
                                  setSelectedConstraintIds(prev => prev.filter(id => id !== constraint.id))
                                  setConstraintDetails(prev => {
                                    const newDetails = { ...prev }
                                    delete newDetails[constraint.id || '']
                                    return newDetails
                                  })
                                }
                              }}
                            />
                            <Label htmlFor={constraint.id} className="text-sm font-normal cursor-pointer">
                              {constraint.name}
                            </Label>
                          </div>
                          {constraint.description && (
                            <p className="text-xs text-muted-foreground ml-6">{constraint.description}</p>
                          )}
                          {selectedConstraintIds.includes(constraint.id || '') && (
                            <div className="ml-6">
                              <Textarea
                                placeholder={`Additional details for ${constraint.name}...`}
                                value={constraintDetails[constraint.id || ''] || ''}
                                onChange={(e) => setConstraintDetails(prev => ({
                                  ...prev,
                                  [constraint.id || '']: e.target.value
                                }))}
                                rows={2}
                                className="text-sm"
                              />
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 4: Project Requirements */}
            {currentStep === 4 && (
              <Card>
                <CardHeader>
                  <CardTitle>Project Requirements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="parking-spaces">Parking Spaces</Label>
                      <Input
                        id="parking-spaces"
                        type="number"
                        value={requirements.parkingSpaces}
                        onChange={(e) => setRequirements(prev => ({ ...prev, parkingSpaces: e.target.value }))}
                        placeholder="e.g. 100"
                      />
                    </div>
                    <div>
                      <Label htmlFor="elevators">Number of Elevators</Label>
                      <Input
                        id="elevators"
                        type="number"
                        value={requirements.elevators}
                        onChange={(e) => setRequirements(prev => ({ ...prev, elevators: e.target.value }))}
                        placeholder="e.g. 4"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Label>System Requirements:</Label>
                    {Object.entries(requirements).filter(([key]) => typeof requirements[key as keyof typeof requirements] === 'boolean').map(([key, value]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <Checkbox
                          id={key}
                          checked={value as boolean}
                          onCheckedChange={(checked) =>
                            setRequirements(prev => ({ ...prev, [key]: checked }))
                          }
                        />
                        <Label htmlFor={key} className="text-sm font-normal">
                          {getRequirementLabel(key)}
                        </Label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          
          <DialogFooter className="mt-6">
            <div className="flex justify-between w-full">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              
              <div className="flex space-x-2">
                {currentStep > 1 && (
                  <Button type="button" variant="outline" onClick={prevStep}>
                    Previous
                  </Button>
                )}
                
                {currentStep < totalSteps ? (
                  <Button type="button" onClick={nextStep}>
                    Next
                  </Button>
                ) : (
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Project"
                    )}
                  </Button>
                )}
              </div>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
      
      {/* Post-creation workflow */}
      {createdProject && (
        <PostProjectCreationWorkflow
          open={showWorkflow}
          onOpenChange={setShowWorkflow}
          projectId={createdProject.id!}
          project={createdProject}
        />
      )}
    </Dialog>
  )
}

// Helper functions
function getStepTitle(step: number): string {
  switch (step) {
    case 1: return "Basic Information"
    case 2: return "Structure & Area"
    case 3: return "Constraints"
    case 4: return "Requirements"
    default: return ""
  }
}


function getRequirementLabel(key: string): string {
  const labels: Record<string, string> = {
    fireSafety: "Fire Safety System",
    securitySystem: "Security System",
    hvacSystem: "HVAC System",
    renewableEnergy: "Renewable Energy Integration"
  }
  return labels[key] || key
}

