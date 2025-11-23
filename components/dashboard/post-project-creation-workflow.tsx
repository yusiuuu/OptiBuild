"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Plus, Users, FileText, Check, ArrowRight, X } from "lucide-react"
import { NewTaskDialog } from "@/components/projects/new-task-dialog"
import { AddTeamMemberDialog } from "@/components/projects/add-team-member-dialog"
import { ReportGenerator } from "@/components/reports/report-generator"
import { projectsService, type Project } from "@/lib/data-service"
import { toast } from "sonner"

interface PostProjectCreationWorkflowProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  project: Project | null
}

// Post-project creation workflow component
// Guides users through setting up tasks, team members, and generating initial documents
export function PostProjectCreationWorkflow({
  open,
  onOpenChange,
  projectId,
  project
}: PostProjectCreationWorkflowProps) {
  const router = useRouter()
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [teamMemberDialogOpen, setTeamMemberDialogOpen] = useState(false)
  const [showReportGenerator, setShowReportGenerator] = useState(false)
  const [tasksCreated, setTasksCreated] = useState(0)
  const [teamMembersAdded, setTeamMembersAdded] = useState(0)

  const steps = [
    {
      id: "tasks",
      title: "Create Tasks",
      description: "Add tasks to organize your project workflow",
      icon: Plus,
      action: () => setTaskDialogOpen(true),
      completed: completedSteps.has("tasks")
    },
    {
      id: "team",
      title: "Add Team Members",
      description: "Assign team members to your project",
      icon: Users,
      action: () => setTeamMemberDialogOpen(true),
      completed: completedSteps.has("team")
    },
    {
      id: "documents",
      title: "Generate Documents",
      description: "Create initial project documentation",
      icon: FileText,
      action: () => setShowReportGenerator(true),
      completed: completedSteps.has("documents")
    }
  ]

  const handleTaskCreated = () => {
    setTasksCreated(prev => prev + 1)
    if (tasksCreated === 0) {
      setCompletedSteps(prev => new Set(prev).add("tasks"))
      toast.success("First task created! You can add more tasks later.")
    }
  }

  const handleTeamMemberAdded = () => {
    setTeamMembersAdded(prev => prev + 1)
    if (teamMembersAdded === 0) {
      setCompletedSteps(prev => new Set(prev).add("team"))
      toast.success("Team member added! You can add more members later.")
    }
  }

  const handleSkip = () => {
    onOpenChange(false)
    router.push(`/dashboard/projects/${projectId}`)
  }

  const handleComplete = () => {
    onOpenChange(false)
    router.push(`/dashboard/projects/${projectId}`)
    toast.success("Project setup complete! You can continue adding tasks, team members, and documents from the project page.")
  }

  const allStepsCompleted = completedSteps.size === steps.length

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Complete Your Project Setup</DialogTitle>
            <DialogDescription>
              Set up your project by adding tasks, team members, and generating initial documents.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isCompleted = step.completed
              
              return (
                <Card 
                  key={step.id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    isCompleted ? "border-green-500 bg-green-50 dark:bg-green-950" : ""
                  }`}
                  onClick={step.action}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          isCompleted 
                            ? "bg-green-500 text-white" 
                            : "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300"
                        }`}>
                          {isCompleted ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            <Icon className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-base">{step.title}</CardTitle>
                          <CardDescription>{step.description}</CardDescription>
                        </div>
                      </div>
                      {isCompleted && (
                        <Check className="h-6 w-6 text-green-500" />
                      )}
                    </div>
                  </CardHeader>
                  {!isCompleted && (
                    <CardContent>
                      <Button onClick={(e) => { e.stopPropagation(); step.action(); }} className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        {step.title}
                      </Button>
                    </CardContent>
                  )}
                </Card>
              )
            })}
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <Button variant="outline" onClick={handleSkip}>
              Skip for Now
            </Button>
            <Button onClick={handleComplete} className="bg-blue-600 hover:bg-blue-700">
              {allStepsCompleted ? "Go to Project" : "Continue Later"}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Task Creation Dialog */}
      <NewTaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        projectId={projectId}
        onTaskCreated={handleTaskCreated}
      />

      {/* Team Member Dialog */}
      <AddTeamMemberDialog
        open={teamMemberDialogOpen}
        onOpenChange={setTeamMemberDialogOpen}
        projectId={projectId}
        onTeamMemberAdded={handleTeamMemberAdded}
      />

      {/* Report Generator - Show in a modal */}
      {showReportGenerator && project && (
        <Dialog open={showReportGenerator} onOpenChange={setShowReportGenerator}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Generate Project Documents</DialogTitle>
              <DialogDescription>Create initial documentation for your project</DialogDescription>
            </DialogHeader>
            <ReportGenerator
              projectId={projectId}
              project={project}
              tasks={[]}
              resources={[]}
              onReportGenerated={(report) => {
                setCompletedSteps(prev => new Set(prev).add("documents"))
                toast.success("Document generated successfully!")
                setShowReportGenerator(false)
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

