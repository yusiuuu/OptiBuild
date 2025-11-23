"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  BarChart3,
  Download,
  Plus,
  Search,
  Package,
  Users,
  HardHat,
  Wrench,
  ArrowUpDown,
  MoreHorizontal,
  FileDown,
  Pencil,
  Trash2,
  Phone,
  Mail,
  Building2,
  MapPin,
  ArrowLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { AddResourceDialog } from "@/components/resources/add-resource-dialog"
import { ResourceDetailsDialog } from "@/components/resources/resource-details-dialog"
import { format } from "date-fns"
import Link from "next/link"
import { resourcesCatalogService } from "@/lib/data-service"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"

export default function ResourcesPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("materials")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortColumn, setSortColumn] = useState("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [isAddResourceDialogOpen, setIsAddResourceDialogOpen] = useState(false)
  const [selectedResource, setSelectedResource] = useState<any>(null)
  const [isResourceDetailsOpen, setIsResourceDetailsOpen] = useState(false)
  const [resources, setResources] = useState<{
    materials: any[]
    equipment: any[]
    labor: any[]
  }>({
    materials: [],
    equipment: [],
    labor: []
  })
  const [isLoading, setIsLoading] = useState(true)

  // Load resources from Supabase
  useEffect(() => {
    const loadResources = async () => {
      if (!user) return
      
      try {
        setIsLoading(true)
        const allResources = await resourcesCatalogService.getResources()
        
        // Categorize resources by type
        const categorized = {
          materials: allResources.filter((r: any) => r.type === 'material' || r.type === 'materials'),
          equipment: allResources.filter((r: any) => r.type === 'equipment'),
          labor: allResources.filter((r: any) => r.type === 'labor' || r.type === 'labour')
        }
        
        setResources(categorized)
      } catch (error) {
        console.error('Error loading resources:', error)
        setResources({ materials: [], equipment: [], labor: [] })
      } finally {
        setIsLoading(false)
      }
    }

    loadResources()
  }, [user])

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  const sortData = (data: any[]) => {
    return [...data].sort((a, b) => {
      const aValue = a[sortColumn]
      const bValue = b[sortColumn]

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      }

      return sortDirection === "asc" ? (aValue > bValue ? 1 : -1) : aValue < bValue ? 1 : -1
    })
  }

  const filterData = (data: any[]) => {
    if (!searchQuery) return sortData(data)

    return sortData(
      data.filter(
        (item) =>
          (item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (item.type && item.type.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())),
      ),
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "adequate":
        return <Badge className="bg-green-500">Adequate</Badge>
      case "low":
        return <Badge className="bg-amber-500">Low Stock</Badge>
      case "critical":
        return <Badge className="bg-red-500">Critical</Badge>
      case "In Stock":
        return <Badge className="bg-green-500">In Stock</Badge>
      case "Out of Stock":
        return <Badge className="bg-red-500">Out of Stock</Badge>
      case "Available":
        return <Badge className="bg-green-500">Available</Badge>
      case "Partially Available":
        return <Badge className="bg-amber-500">Partially Available</Badge>
      case "All Allocated":
        return <Badge className="bg-blue-500">All Allocated</Badge>
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

  const handleResourceClick = (resource: any) => {
    setSelectedResource(resource)
    setIsResourceDetailsOpen(true)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const handleExportResources = (resourceType?: string) => {
    // Determine which resources to export
    let dataToExport: any[] = [];
    const type = resourceType || activeTab;
    
    switch (type) {
      case "materials":
        dataToExport = resources.materials || [];
        break;
      case "equipment":
        dataToExport = resources.equipment || [];
        break;
      case "labor":
        dataToExport = resources.labor || [];
        break;
      default:
        dataToExport = resources.materials || [];
    }

    // Convert to CSV format
    const headers = ['Name', 'Type', 'Unit', 'Base Cost', 'Description'];
    const rows = dataToExport.map((item: any) => {
      const row = [
        item.name || '',
        item.type || '',
        item.unit || '',
        item.base_cost || 0,
        (item.description || '').replace(/,/g, ';')
      ];
      return row.join(',');
    });
    const csvContent = [headers.join(','), ...rows].join('\n');

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    a.download = `${type}-resources-${dateStr}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading resources...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Resources</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-full max-w-sm items-center md:flex">
              <Search className="absolute left-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search resources..."
                className="w-full rounded-md border border-gray-200 bg-white pl-8 shadow-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Button variant="outline" onClick={() => handleExportResources()}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>

            <Button onClick={() => setIsAddResourceDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Resource
            </Button>
          </div>
        </div>

        {/* Resource Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Total Materials</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{resources.materials.length} Types</div>
                <p className="text-xs text-muted-foreground">
                  {resources.materials.length} Resources
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Equipment</CardTitle>
                <Wrench className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{resources.equipment.length} Types</div>
                <p className="text-xs text-muted-foreground">
                  {resources.equipment.length} Resources
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Labor</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{resources.labor.length} Teams</div>
                <p className="text-xs text-muted-foreground">
                  {resources.labor.length} Resources
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Total Value</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {formatCurrency(
                    (resources.materials || []).reduce((sum: number, item: any) => sum + (item.base_cost || 0), 0) +
                      (resources.equipment || []).reduce((sum: number, item: any) => sum + (item.base_cost || 0), 0) +
                      (resources.labor || []).reduce((sum: number, item: any) => sum + (item.base_cost || 0), 0),
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Estimated inventory value</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Resource Tables */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-foreground">Resource Management</h2>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="materials" value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="materials" className="flex items-center">
                  <Package className="mr-2 h-4 w-4" />
                  Materials
                </TabsTrigger>
                <TabsTrigger value="equipment" className="flex items-center">
                  <Wrench className="mr-2 h-4 w-4" />
                  Equipment
                </TabsTrigger>
                <TabsTrigger value="labor" className="flex items-center">
                  <HardHat className="mr-2 h-4 w-4" />
                  Labor
                </TabsTrigger>
              </TabsList>

              <TabsContent value="materials" className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer text-foreground" onClick={() => handleSort("name")}>
                        <div className="flex items-center">Name</div>
                      </TableHead>
                      <TableHead className="text-foreground">Type</TableHead>
                      <TableHead className="text-foreground">Unit</TableHead>
                      <TableHead className="text-foreground">Cost</TableHead>
                      <TableHead className="text-foreground">Status</TableHead>
                      <TableHead className="text-foreground">Supplier</TableHead>
                      <TableHead className="text-foreground">Contact</TableHead>
                      <TableHead className="text-right text-foreground">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">Loading resources...</TableCell>
                      </TableRow>
                    ) : filterData(resources.materials || []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">No materials found. Add resources to get started.</TableCell>
                      </TableRow>
                    ) : (
                      filterData(resources.materials || []).map((material) => (
                      <TableRow key={material.id}>
                        <TableCell className="font-medium text-foreground">{material.name}</TableCell>
                        <TableCell className="text-foreground">{material.type || 'Material'}</TableCell>
                        <TableCell className="text-foreground">
                          {material.unit || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Progress value={100} className="h-2" />
                            <div className="text-xs text-muted-foreground">
                              Base Cost: ₹{material.base_cost?.toLocaleString() || '0'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge('adequate')}</TableCell>
                        <TableCell className="text-foreground">N/A</TableCell>
                        <TableCell>
                          <span className="text-gray-500">N/A</span>
                        </TableCell>
                        <TableCell className="text-right text-foreground">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleResourceClick(material)
                                }}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleExportResources("materials")}>
                                <FileDown className="mr-2 h-4 w-4" />
                                Export
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="equipment" className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Condition</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">Loading resources...</TableCell>
                      </TableRow>
                    ) : filterData(resources.equipment || []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-gray-500">No equipment found. Add resources to get started.</TableCell>
                      </TableRow>
                    ) : (
                      filterData(resources.equipment || []).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.type || 'Equipment'}</TableCell>
                        <TableCell>{item.unit || 'N/A'}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Progress value={100} className="h-2" />
                            <div className="text-xs text-gray-500">
                              Base Cost: ₹{item.base_cost?.toLocaleString() || '0'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getConditionBadge('good')}</TableCell>
                        <TableCell>N/A</TableCell>
                        <TableCell>
                          <span className="text-gray-500">N/A</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleResourceClick(item)
                                }}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleExportResources("equipment")}>
                                <FileDown className="mr-2 h-4 w-4" />
                                Export
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                    )}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="labor" className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Supervisor</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Daily Wage</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">Loading resources...</TableCell>
                      </TableRow>
                    ) : filterData(resources.labor || []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">No labor teams found. Add resources to get started.</TableCell>
                      </TableRow>
                    ) : (
                      filterData(resources.labor || []).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.type || 'Labor'}</TableCell>
                        <TableCell>{item.unit || 'N/A'}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Progress value={100} className="h-2" />
                            <div className="text-xs text-gray-500">
                              Base Cost: ₹{item.base_cost?.toLocaleString() || '0'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>N/A</TableCell>
                        <TableCell>
                          <span className="text-gray-500">N/A</span>
                        </TableCell>
                        <TableCell>{formatCurrency(item.base_cost || 0)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleResourceClick(item)
                                }}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleExportResources("labor")}>
                                <FileDown className="mr-2 h-4 w-4" />
                                Export
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Dialogs */}
        <AddResourceDialog
          open={isAddResourceDialogOpen}
          onOpenChange={(open) => {
            setIsAddResourceDialogOpen(open)
            if (!open) {
              // Reload resources when dialog closes (resource might have been added)
              const loadResources = async () => {
                if (!user) return
                
                try {
                  setIsLoading(true)
                  const allResources = await resourcesCatalogService.getResources()
                  
                  // Categorize resources by type
                  const categorized = {
                    materials: allResources.filter((r: any) => r.type === 'material'),
                    equipment: allResources.filter((r: any) => r.type === 'equipment'),
                    labor: allResources.filter((r: any) => r.type === 'labour'),
                  }
                  
                  setResources(categorized)
                } catch (error) {
                  console.error('Error loading resources:', error)
                  toast.error('Failed to load resources')
                } finally {
                  setIsLoading(false)
                }
              }
              loadResources()
            }
          }}
          resourceType={activeTab}
          onResourceAdded={() => {
            // Reload resources after adding
            const loadResources = async () => {
              if (!user) return
              
              try {
                setIsLoading(true)
                const allResources = await resourcesCatalogService.getResources()
                
                // Categorize resources by type
                const categorized = {
                  materials: allResources.filter((r: any) => r.type === 'material'),
                  equipment: allResources.filter((r: any) => r.type === 'equipment'),
                  labor: allResources.filter((r: any) => r.type === 'labour'),
                }
                
                setResources(categorized)
              } catch (error) {
                console.error('Error loading resources:', error)
                toast.error('Failed to load resources')
              } finally {
                setIsLoading(false)
              }
            }
            loadResources()
          }}
        />

        {selectedResource && (
          <ResourceDetailsDialog
            open={isResourceDetailsOpen}
            onOpenChange={setIsResourceDetailsOpen}
            resource={selectedResource}
            resourceType={activeTab}
          />
        )}
      </div>
    </div>
  )
}

