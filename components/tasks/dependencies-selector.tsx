"use client"

import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Check, X, Link2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Task {
  id: string
  title: string
}

interface DependenciesSelectorProps {
  dependencies: string[]
  onChange: (dependencies: string[]) => void
  availableTasks: Task[]
  disabled?: boolean
}

export function DependenciesSelector({ 
  dependencies, 
  onChange, 
  availableTasks,
  disabled = false 
}: DependenciesSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleDependency = (taskId: string) => {
    if (dependencies.includes(taskId)) {
      onChange(dependencies.filter(id => id !== taskId))
    } else {
      onChange([...dependencies, taskId])
    }
  }

  const removeDependency = (taskId: string) => {
    onChange(dependencies.filter(id => id !== taskId))
  }

  const selectedTasks = availableTasks.filter(task => dependencies.includes(task.id))

  return (
    <div className="space-y-2">
      <Label>Dependencies</Label>
      {availableTasks.length === 0 ? (
        <div className="text-sm text-muted-foreground p-3 border rounded-md bg-muted/50">
          No existing tasks in this project. Dependencies can be added after creating more tasks.
        </div>
      ) : (
        <>
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start"
                disabled={disabled}
              >
                <Link2 className="mr-2 h-4 w-4" />
                {dependencies.length === 0 
                  ? "Select dependencies (optional)"
                  : `${dependencies.length} ${dependencies.length === 1 ? 'dependency' : 'dependencies'} selected`}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
              <div className="p-4 border-b">
                <h4 className="font-medium text-sm">Select Task Dependencies</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  This task will depend on the selected tasks
                </p>
              </div>
              <ScrollArea className="h-[300px]">
                <div className="p-2 space-y-2">
                  {availableTasks.map((task) => {
                    const isSelected = dependencies.includes(task.id)
                    return (
                      <div
                        key={task.id}
                        className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                        onClick={() => toggleDependency(task.id)}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleDependency(task.id)}
                          id={`dep-${task.id}`}
                        />
                        <Label
                          htmlFor={`dep-${task.id}`}
                          className="flex-1 cursor-pointer text-sm font-normal"
                        >
                          {task.title}
                        </Label>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>

          {selectedTasks.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedTasks.map((task) => (
                <Badge
                  key={task.id}
                  variant="secondary"
                  className="flex items-center gap-1 pr-1"
                >
                  <Link2 className="h-3 w-3" />
                  <span className="max-w-[200px] truncate">{task.title}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => removeDependency(task.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}

          {dependencies.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No dependencies selected. This task can start independently.
            </p>
          )}
        </>
      )}
    </div>
  )
}
