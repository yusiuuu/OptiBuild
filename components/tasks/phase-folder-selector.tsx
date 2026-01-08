"use client"

import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Folder, ChevronRight, Plus, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// Predefined construction phases based on CONSTRUCTION_PROJECT_TASKS.md
const CONSTRUCTION_PHASES = [
  {
    phase: "PHASE 1: PRE-CONSTRUCTION & PLANNING",
    subPhases: [
      "1.1 Project Initiation",
      "1.2 Design & Documentation",
      "1.3 Procurement Planning"
    ]
  },
  {
    phase: "PHASE 2: SITE PREPARATION",
    subPhases: [
      "2.1 Site Setup",
      "2.2 Site Clearing"
    ]
  },
  {
    phase: "PHASE 3: FOUNDATION WORK",
    subPhases: [
      "3.1 Excavation",
      "3.2 Foundation Construction"
    ]
  },
  {
    phase: "PHASE 4: STRUCTURAL WORK",
    subPhases: [
      "4.1 Ground Floor",
      "4.2 Column & Beam Work",
      "4.3 Upper Floors",
      "4.4 Roof Work"
    ]
  },
  {
    phase: "PHASE 5: MEP (MECHANICAL, ELECTRICAL, PLUMBING)",
    subPhases: [
      "5.1 Electrical Work",
      "5.2 Plumbing Work",
      "5.3 HVAC"
    ]
  },
  {
    phase: "PHASE 6: MASONRY & BRICKWORK",
    subPhases: [
      "6.1 Wall Construction"
    ]
  },
  {
    phase: "PHASE 7: FINISHING WORK",
    subPhases: [
      "7.1 Flooring",
      "7.2 Painting",
      "7.3 Doors & Windows",
      "7.4 Ceiling Work",
      "7.5 Kitchen & Bathroom"
    ]
  },
  {
    phase: "PHASE 8: EXTERNAL WORK",
    subPhases: [
      "8.1 Landscaping",
      "8.2 External Utilities"
    ]
  },
  {
    phase: "PHASE 9: TESTING & COMMISSIONING",
    subPhases: [
      "9.1 System Testing",
      "9.2 Quality Inspection"
    ]
  },
  {
    phase: "PHASE 10: FINAL INSPECTIONS & HANDOVER",
    subPhases: [
      "10.1 Regulatory Inspections",
      "10.2 Documentation & Handover",
      "10.3 Post-Handover"
    ]
  }
]

interface PhaseFolderSelectorProps {
  value?: string
  onChange: (phase: string) => void
  onPhaseOrderChange?: (order: number) => void
  phaseOrder?: number
}

export function PhaseFolderSelector({ value, onChange, onPhaseOrderChange, phaseOrder }: PhaseFolderSelectorProps) {
  const [isCustomDialogOpen, setIsCustomDialogOpen] = useState(false)
  const [customPhase, setCustomPhase] = useState("")
  const [selectedPhase, setSelectedPhase] = useState<string>(value || "")
  const [selectedSubPhase, setSelectedSubPhase] = useState<string>("")

  // Parse current value to extract phase and sub-phase
  const parsePhase = (phaseValue: string) => {
    if (!phaseValue) return { phase: "", subPhase: "" }
    const parts = phaseValue.split(" > ")
    if (parts.length === 2) {
      return { phase: parts[0], subPhase: parts[1] }
    }
    return { phase: phaseValue, subPhase: "" }
  }

  const { phase: currentPhase, subPhase: currentSubPhase } = parsePhase(value || "")

  const handlePhaseSelect = (phase: string) => {
    if (phase === "none") {
      setSelectedPhase("")
      setSelectedSubPhase("")
      onChange("")
      return
    }
    if (phase === "custom") {
      setIsCustomDialogOpen(true)
      return
    }
    setSelectedPhase(phase)
    setSelectedSubPhase("")
    // If no sub-phase selected, just use the phase
    onChange(phase)
  }

  const handleSubPhaseSelect = (subPhase: string) => {
    if (subPhase === "none") {
      setSelectedSubPhase("")
      // Just use the phase without sub-phase
      onChange(selectedPhase || currentPhase || "")
      return
    }
    setSelectedSubPhase(subPhase)
    const fullPath = `${selectedPhase || currentPhase} > ${subPhase}`
    onChange(fullPath)
  }

  const handleCustomPhase = () => {
    if (customPhase.trim()) {
      onChange(customPhase.trim())
      setIsCustomDialogOpen(false)
      setCustomPhase("")
    }
  }

  const selectedPhaseData = CONSTRUCTION_PHASES.find(p => p.phase === selectedPhase || p.phase === currentPhase)
  
  // Get the display value for phase select
  const phaseSelectValue = selectedPhase || currentPhase || undefined

  return (
    <div className="space-y-2">
      <Label htmlFor="phase">Phase/Folder</Label>
      <div className="flex gap-2">
        <Select
          value={phaseSelectValue || "none"}
          onValueChange={handlePhaseSelect}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select phase">
              {phaseSelectValue || "Select phase"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {CONSTRUCTION_PHASES.map((phaseData) => (
              <SelectItem key={phaseData.phase} value={phaseData.phase}>
                <div className="flex items-center gap-2">
                  <Folder className="h-4 w-4" />
                  {phaseData.phase}
                </div>
              </SelectItem>
            ))}
            <SelectItem value="custom">
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Custom Phase/Folder
              </div>
            </SelectItem>
            <SelectItem value="none">
              <div className="flex items-center gap-2">
                <X className="h-4 w-4" />
                No Phase (Root Level)
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        {selectedPhaseData && selectedPhaseData.subPhases.length > 0 && (
          <Select
            value={(selectedSubPhase || currentSubPhase) || "none"}
            onValueChange={handleSubPhaseSelect}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select sub-phase">
                {(selectedSubPhase || currentSubPhase) || "Select sub-phase"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {selectedPhaseData.subPhases.map((subPhase) => (
                <SelectItem key={subPhase} value={subPhase}>
                  <div className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4" />
                    {subPhase}
                  </div>
                </SelectItem>
              ))}
              <SelectItem value="none">
                <div className="flex items-center gap-2">
                  <X className="h-4 w-4" />
                  No Sub-Phase
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        )}

        <Dialog open={isCustomDialogOpen} onOpenChange={setIsCustomDialogOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => {
                if (selectedPhase === "custom" || (!selectedPhase && !currentPhase)) {
                  setIsCustomDialogOpen(true)
                }
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Custom Phase/Folder</DialogTitle>
              <DialogDescription>
                Enter a custom phase or folder path (e.g., "PHASE X: CUSTOM > Sub-Phase")
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="custom-phase">Phase/Folder Path</Label>
                <Input
                  id="custom-phase"
                  value={customPhase}
                  onChange={(e) => setCustomPhase(e.target.value)}
                  placeholder="e.g., PHASE X: CUSTOM > Sub-Phase"
                />
              </div>
              <Button onClick={handleCustomPhase} className="w-full">
                Add Custom Phase
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {value && (
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <Folder className="h-3 w-3" />
          <span className="truncate">{value}</span>
        </div>
      )}

      {onPhaseOrderChange && (
        <div className="space-y-2">
          <Label htmlFor="phase-order">Order in Phase</Label>
          <Input
            id="phase-order"
            type="number"
            min="0"
            value={phaseOrder || 0}
            onChange={(e) => onPhaseOrderChange(parseInt(e.target.value) || 0)}
            placeholder="0"
            className="w-24"
          />
          <p className="text-xs text-muted-foreground">
            Lower numbers appear first within the same phase
          </p>
        </div>
      )}
    </div>
  )
}
