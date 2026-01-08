"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Package,
  Wrench,
  Users,
  Building,
  MapPin,
  IndianRupee,
  Calendar,
  Loader2,
  Trash2,
  Edit,
  Save,
} from "lucide-react"

interface ResourceDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  resource: any
  resourceType: string
}

export function ResourceDetailsDialog({ open, onOpenChange, resource, resourceType }: ResourceDetailsDialogProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Helper function to safely get a value (convert null/undefined to empty string or 0)
  const safeString = (value: any): string => {
    if (value === null || value === undefined) return ''
    return String(value)
  }
  
  const safeNumber = (value: any): number => {
    if (value === null || value === undefined || isNaN(value)) return 0
    const num = Number(value)
    return isNaN(num) ? 0 : num
  }
  
  // Initialize formData with safe defaults
  const [formData, setFormData] = useState(() => ({
    category: safeString(resource?.category),
    quantity: safeNumber(resource?.quantity),
    location: safeString(resource?.location),
    supplier: safeString(resource?.supplier),
    cost: safeNumber(resource?.cost || resource?.base_cost),
    status: safeString(resource?.status),
    condition: safeString(resource?.condition),
    dailyRate: safeNumber(resource?.dailyRate || resource?.daily_rate),
    operator: safeString(resource?.operator),
    supervisor: safeString(resource?.supervisor),
    dailyWage: safeNumber(resource?.dailyWage || resource?.daily_wage),
    ...resource,
  }))

  // Update formData when resource changes
  useEffect(() => {
    if (resource) {
      setFormData({
        category: safeString(resource.category),
        quantity: safeNumber(resource.quantity),
        location: safeString(resource.location),
        supplier: safeString(resource.supplier),
        cost: safeNumber(resource.cost || resource.base_cost),
        status: safeString(resource.status),
        condition: safeString(resource.condition),
        dailyRate: safeNumber(resource.dailyRate || resource.daily_rate),
        operator: safeString(resource.operator),
        supervisor: safeString(resource.supervisor),
        dailyWage: safeNumber(resource.dailyWage || resource.daily_wage),
        ...resource,
      })
    }
  }, [resource])

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "adequate":
        return <Badge className="bg-green-500">Adequate</Badge>
      case "low":
        return <Badge className="bg-amber-500">Low Stock</Badge>
      case "critical":
        return <Badge className="bg-red-500">Critical</Badge>
      default:
        return <Badge>Unknown</Badge>
    }
  }

  const getConditionBadge = (condition: string) => {
    switch (condition) {
      case "excellent":
        return <Badge className="bg-green-500">Excellent</Badge>
      case "good":
        return <Badge className="bg-blue-500">Good</Badge>
      case "fair":
        return <Badge className="bg-amber-500">Fair</Badge>
      case "poor":
        return <Badge className="bg-red-500">Poor</Badge>
      default:
        return <Badge>Unknown</Badge>
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const handleSave = () => {
    setIsSaving(true)

    // Simulate API call
    setTimeout(() => {
      setIsSaving(false)
      setIsEditing(false)
      // In a real app, you would update the resource data here
    }, 1500)
  }

  const handleDelete = () => {
    setIsDeleting(true)

    // Simulate API call
    setTimeout(() => {
      setIsDeleting(false)
      onOpenChange(false)
      // In a real app, you would delete the resource here
    }, 1500)
  }

  const getResourceIcon = () => {
    switch (resourceType) {
      case "materials":
        return <Package className="h-5 w-5 text-blue-500" />
      case "equipment":
        return <Wrench className="h-5 w-5 text-blue-500" />
      case "labor":
        return <Users className="h-5 w-5 text-blue-500" />
      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
          <DialogTitle className="flex items-center">
            {getResourceIcon()}
            <span className="ml-2">{safeString(resource?.name)}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Common fields for all resource types */}
          <div className="grid grid-cols-[120px_1fr] items-center gap-4">
            <div className="font-medium text-right text-gray-500">Category:</div>
            {isEditing ? (
              <Input
                value={safeString(formData.category)}
                onChange={(e) => handleChange("category", e.target.value)}
                className="col-span-1"
              />
            ) : (
              <div>{safeString(resource?.category)}</div>
            )}
          </div>

          <div className="grid grid-cols-[120px_1fr] items-center gap-4">
            <div className="font-medium text-right text-gray-500">Quantity:</div>
            {isEditing ? (
              <Input
                type="number"
                value={safeNumber(formData.quantity)}
                onChange={(e) => {
                  const val = e.target.value === '' ? 0 : Number.parseInt(e.target.value) || 0
                  handleChange("quantity", val)
                }}
                className="col-span-1"
              />
            ) : (
              <div>
                {safeNumber(resource?.quantity)} {resourceType === "materials" ? (resource?.unit || 'units') : "Units"}
              </div>
            )}
          </div>

          <div className="grid grid-cols-[120px_1fr] items-center gap-4">
            <div className="font-medium text-right text-gray-500">Availability:</div>
            <div className="w-full">
              {resource?.quantity && resource?.quantity > 0 ? (
                <>
                  <Progress value={((resource?.available || 0) / resource.quantity) * 100} className="h-2" />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{safeNumber(resource?.available)} available</span>
                    <span>{safeNumber(resource?.allocated)} allocated</span>
                  </div>
                </>
              ) : (
                <div className="text-sm text-gray-500">No availability data</div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-[120px_1fr] items-center gap-4">
            <div className="font-medium text-right text-gray-500">Location:</div>
            {isEditing ? (
              <Input
                value={safeString(formData.location)}
                onChange={(e) => handleChange("location", e.target.value)}
                className="col-span-1"
              />
            ) : (
              <div className="flex items-center">
                <MapPin className="mr-2 h-4 w-4 text-gray-500" />
                {safeString(resource?.location)}
              </div>
            )}
          </div>

          {/* Material specific fields */}
          {resourceType === "materials" && (
            <>
              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <div className="font-medium text-right text-gray-500">Supplier:</div>
                {isEditing ? (
                  <Input
                    value={safeString(formData.supplier)}
                    onChange={(e) => handleChange("supplier", e.target.value)}
                    className="col-span-1"
                  />
                ) : (
                  <div className="flex items-center">
                    <Building className="mr-2 h-4 w-4 text-gray-500" />
                    {safeString(resource?.supplier)}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <div className="font-medium text-right text-gray-500">Unit Cost:</div>
                {isEditing ? (
                  <Input
                    type="number"
                    value={safeNumber(formData.cost)}
                    onChange={(e) => {
                      const val = e.target.value === '' ? 0 : Number.parseInt(e.target.value) || 0
                      handleChange("cost", val)
                    }}
                    className="col-span-1"
                  />
                ) : (
                  <div className="flex items-center">
                    <IndianRupee className="mr-2 h-4 w-4 text-gray-500" />
                    {formatCurrency(safeNumber(resource?.cost || resource?.base_cost))} per {resource?.unit || 'unit'}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <div className="font-medium text-right text-gray-500">Status:</div>
                {isEditing ? (
                  <Select value={safeString(formData.status) || undefined} onValueChange={(value) => handleChange("status", value)}>
                    <SelectTrigger className="col-span-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="adequate">Adequate</SelectItem>
                      <SelectItem value="low">Low Stock</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div>{getStatusBadge(resource?.status)}</div>
                )}
              </div>

              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <div className="font-medium text-right text-gray-500">Last Updated:</div>
                <div className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                  {safeString(resource?.lastUpdated || resource?.updated_at || 'N/A')}
                </div>
              </div>
            </>
          )}

          {/* Equipment specific fields */}
          {resourceType === "equipment" && (
            <>
              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <div className="font-medium text-right text-gray-500">Condition:</div>
                {isEditing ? (
                  <Select value={safeString(formData.condition) || undefined} onValueChange={(value) => handleChange("condition", value)}>
                    <SelectTrigger className="col-span-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div>{getConditionBadge(resource?.condition)}</div>
                )}
              </div>

              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <div className="font-medium text-right text-gray-500">Daily Rate:</div>
                {isEditing ? (
                  <Input
                    type="number"
                    value={safeNumber(formData.dailyRate)}
                    onChange={(e) => {
                      const val = e.target.value === '' ? 0 : Number.parseInt(e.target.value) || 0
                      handleChange("dailyRate", val)
                    }}
                    className="col-span-1"
                  />
                ) : (
                  <div className="flex items-center">
                    <IndianRupee className="mr-2 h-4 w-4 text-gray-500" />
                    {formatCurrency(safeNumber(resource?.dailyRate || resource?.daily_rate))} per day
                  </div>
                )}
              </div>

              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <div className="font-medium text-right text-gray-500">Operator:</div>
                {isEditing ? (
                  <Input
                    value={safeString(formData.operator)}
                    onChange={(e) => handleChange("operator", e.target.value)}
                    className="col-span-1"
                  />
                ) : (
                  <div>{safeString(resource?.operator)}</div>
                )}
              </div>

              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <div className="font-medium text-right text-gray-500">Maintenance:</div>
                <div className="text-sm">
                  <div>Last: {safeString(resource?.lastMaintenance || resource?.last_maintenance || 'N/A')}</div>
                  <div>Next: {safeString(resource?.nextMaintenance || resource?.next_maintenance || 'N/A')}</div>
                </div>
              </div>
            </>
          )}

          {/* Labor specific fields */}
          {resourceType === "labor" && (
            <>
              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <div className="font-medium text-right text-gray-500">Supervisor:</div>
                {isEditing ? (
                  <Input
                    value={safeString(formData.supervisor)}
                    onChange={(e) => handleChange("supervisor", e.target.value)}
                    className="col-span-1"
                  />
                ) : (
                  <div>{safeString(resource?.supervisor)}</div>
                )}
              </div>

              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <div className="font-medium text-right text-gray-500">Daily Wage:</div>
                {isEditing ? (
                  <Input
                    type="number"
                    value={safeNumber(formData.dailyWage)}
                    onChange={(e) => {
                      const val = e.target.value === '' ? 0 : Number.parseInt(e.target.value) || 0
                      handleChange("dailyWage", val)
                    }}
                    className="col-span-1"
                  />
                ) : (
                  <div className="flex items-center">
                    <IndianRupee className="mr-2 h-4 w-4 text-gray-500" />
                    {formatCurrency(safeNumber(resource?.dailyWage || resource?.daily_wage))} per worker
                  </div>
                )}
              </div>
            </>
          )}

          {isEditing && (
            <div className="grid grid-cols-[120px_1fr] items-start gap-4">
              <div className="font-medium text-right text-gray-500">Notes:</div>
              <Textarea placeholder="Add notes or comments about this resource..." rows={3} />
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            {!isEditing && (
              <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </>
                )}
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Resource
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

