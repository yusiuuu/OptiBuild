"use client"

import { useState, useMemo } from "react"
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface Task {
  id: string
  title: string
  status: string
  priority: string
  phase?: string
  phase_order?: number
  [key: string]: any
}

interface TaskFolderTreeProps {
  tasks: Task[]
  onTaskClick?: (task: Task) => void
  renderTask?: (task: Task) => React.ReactNode
}

interface FolderNode {
  name: string
  fullPath: string
  tasks: Task[]
  children: Map<string, FolderNode>
  level: number
}

export function TaskFolderTree({ tasks, onTaskClick, renderTask }: TaskFolderTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

  // Build folder tree structure from tasks
  const folderTree = useMemo(() => {
    const root: FolderNode = {
      name: "Root",
      fullPath: "",
      tasks: [],
      children: new Map(),
      level: 0
    }

    tasks.forEach(task => {
      if (!task.phase) {
        // Task without phase goes to root
        root.tasks.push(task)
        return
      }

      // Parse phase path (e.g., "PHASE 1: PRE-CONSTRUCTION > 1.1 Project Initiation")
      const parts = task.phase.split(" > ").map(p => p.trim()).filter(Boolean)
      
      let current = root
      let currentPath = ""

      parts.forEach((part, index) => {
        currentPath = currentPath ? `${currentPath} > ${part}` : part
        
        if (!current.children.has(part)) {
          current.children.set(part, {
            name: part,
            fullPath: currentPath,
            tasks: [],
            children: new Map(),
            level: index + 1
          })
        }
        
        current = current.children.get(part)!
      })

      // Add task to the deepest folder
      current.tasks.push(task)
    })

    // Sort tasks within each folder by phase_order
    const sortFolder = (node: FolderNode) => {
      node.tasks.sort((a, b) => (a.phase_order || 0) - (b.phase_order || 0))
      node.children.forEach(child => sortFolder(child))
    }
    sortFolder(root)

    return root
  }, [tasks])

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }

  const renderFolder = (node: FolderNode): React.ReactNode => {
    const isExpanded = expandedFolders.has(node.fullPath)
    const hasContent = node.tasks.length > 0 || node.children.size > 0
    const totalTasks = node.tasks.length + Array.from(node.children.values()).reduce((sum, child) => {
      const countTasks = (n: FolderNode): number => {
        return n.tasks.length + Array.from(n.children.values()).reduce((s, c) => s + countTasks(c), 0)
      }
      return sum + countTasks(child)
    }, 0)

    if (node.level === 0 && !hasContent) {
      return null
    }

    return (
      <div key={node.fullPath || "root"} className={cn("mb-2", node.level > 0 && "ml-4")}>
        {node.level > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 h-auto py-2 px-3 hover:bg-muted/50"
            onClick={() => toggleFolder(node.fullPath)}
          >
            {hasContent ? (
              isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )
            ) : (
              <div className="w-4" />
            )}
            {isExpanded ? (
              <FolderOpen className="h-4 w-4 text-blue-500" />
            ) : (
              <Folder className="h-4 w-4 text-blue-500" />
            )}
            <span className="flex-1 text-left font-medium">{node.name}</span>
            <Badge variant="secondary" className="ml-auto">
              {totalTasks} {totalTasks === 1 ? 'task' : 'tasks'}
            </Badge>
          </Button>
        )}

        {(isExpanded || node.level === 0) && (
          <div className={cn(node.level > 0 && "ml-6 mt-1")}>
            {/* Render child folders */}
            {Array.from(node.children.entries())
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([_, child]) => renderFolder(child))}

            {/* Render tasks in this folder */}
            {node.tasks.map(task => (
              <div
                key={task.id}
                className={cn(
                  "ml-6 mb-1 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors",
                  "flex items-center gap-2"
                )}
                onClick={() => onTaskClick?.(task)}
              >
                <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  {renderTask ? renderTask(task) : (
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{task.title}</span>
                      <Badge
                        variant={
                          task.status === 'done' ? 'default' :
                          task.status === 'ongoing' ? 'secondary' :
                          task.status === 'blocked' ? 'destructive' :
                          'outline'
                        }
                        className="text-xs"
                      >
                        {task.status}
                      </Badge>
                      <Badge
                        variant={
                          task.priority === 'high' ? 'destructive' :
                          task.priority === 'medium' ? 'default' :
                          'secondary'
                        }
                        className="text-xs"
                      >
                        {task.priority}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="space-y-1">
          {renderFolder(folderTree)}
        </div>
      </CardContent>
    </Card>
  )
}
