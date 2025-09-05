"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useTheme } from "next-themes"
import {
  BarChart3,
  Calendar,
  Clock,
  Download,
  HardHat,
  Home,
  Layers,
  LineChart,
  Menu,
  Plus,
  Settings,
  User,
  X,
  Bell,
  Search,
  Moon,
  Sun,
  FileText,
  Upload,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { ResourceAllocationChart } from "@/components/dashboard/resource-allocation-chart"
import { ProjectStatusList } from "@/components/dashboard/project-status-list"
import { ResourceOptimizationTabs } from "@/components/dashboard/resource-optimization-tabs"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { NewProjectDialog } from "@/components/dashboard/new-project-dialog"
import { ExportReportDialog } from "@/components/dashboard/export-report-dialog"
import { NotificationsDialog } from "@/components/dashboard/notifications-dialog"
import { useRouter } from 'next/navigation'
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import { format } from "date-fns"
import { AIChatbot } from "@/components/dashboard/ai-chatbot"

// Main dashboard page component for OptiBuild application
// Provides comprehensive overview of construction projects, resources, and analytics
export default function DashboardPage() {
  // Theme management for light/dark mode switching
  const { theme, setTheme } = useTheme()
  // Router hook for navigation
  const router = useRouter()
  // Authentication context function for user logout
  const { signOut } = useAuth()
  
  // Project list (fetched from Supabase only)
  const [projects, setProjects] = useState<any[]>([]);

  // Load projects from Supabase on component mount (no local storage fallback)
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const { projectsService } = await import('@/lib/data-service');
        const userProjects = await projectsService.getProjects();
        
        // Convert to the format expected by the sidebar
        const formattedProjects = userProjects.map(project => ({
          id: project.id || '',
          title: project.name
        }));
        
        setProjects(formattedProjects);
      } catch (error) {
        console.error('Error loading projects:', error);
      }
    };

    loadProjects();
  }, []);

  // UI state management for various dialogs and mobile menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  
  // Dashboard filtering and date range state
  const [activeFilter, setActiveFilter] = useState("all")
  const [dateRange, setDateRange] = useState("Apr 2025")

  // Handle user logout with authentication cleanup and navigation
  const handleLogout = async () => {
    try {
      await signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
      toast.error('Failed to sign out. Please try again.')
    }
  }

  // Refresh projects list
  const refreshProjects = async () => {
    try {
      const { projectsService } = await import('@/lib/data-service');
      const userProjects = await projectsService.getProjects();
      
      const formattedProjects = userProjects.map(project => ({
        id: project.id || '',
        title: project.name
      }));
      
      setProjects(formattedProjects);
    } catch (error) {
      console.error('Error refreshing projects:', error);
    }
  }

  // Export dashboard data as JSON file for reporting and analysis
  const handleDashboardExport = () => {
    // Prepare dashboard data for export
    const dashboardData = {
      projects: projects.map(project => ({
        id: project.id,
        title: project.title,
        // Add any other project data you want to export
      })),
      exportedAt: new Date().toISOString(),
      filter: activeFilter,
      dateRange
    };

    // Convert to JSON
    const jsonContent = JSON.stringify(dashboardData, null, 2);

    // Create and download the file
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-export-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
        {/* Left Sidebar: Navigation and project management */}
        <Sidebar className="border-r border-gray-200">
          {/* Sidebar header with OptiBuild branding */}
          <SidebarHeader className="border-b border-gray-200 p-4">
            <div className="flex items-center space-x-2">
              <HardHat className="h-6 w-6 text-blue-600" />
              <span className="text-lg font-bold">OptiBuild</span>
            </div>
          </SidebarHeader>
          
          {/* Sidebar content with navigation groups */}
          <SidebarContent>
            {/* Main navigation group */}
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {/* Dashboard navigation item (active) */}
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive>
                      <Link href="/dashboard">
                        <Home className="h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  {/* Analytics navigation item */}
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href="/dashboard/analytics">
                        <BarChart3 className="h-4 w-4" />
                        <span>Analytics</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  {/* Schedule navigation item */}
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href="/dashboard/schedule">
                        <Calendar className="h-4 w-4" />
                        <span>Schedule</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  {/* Resources navigation item */}
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href="/dashboard/resources">
                        <Layers className="h-4 w-4" />
                        <span>Resources</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  {/* Documents navigation item */}
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href="/dashboard/documents">
                        <FileText className="h-4 w-4" />
                        <span>Documents</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            
            {/* Projects management group */}
            <SidebarGroup>
              <SidebarGroupLabel>Projects</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {/* Dynamic project list from state */}
                  {projects.map((project) => (
                    <SidebarMenuItem key={project.id}>
                      <SidebarMenuButton asChild>
                        <Link href={`/dashboard/projects/${project.id}`}>
                          <span>{project.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                  {/* Add new project button */}
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => setIsNewProjectDialogOpen(true)}>
                      <Plus className="h-4 w-4" />
                      <span>Add New Project</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          
          {/* Sidebar footer with user settings and profile */}
          <SidebarFooter className="border-t border-gray-200 p-4">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/dashboard/settings">
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/dashboard/profile">
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto">
          {/* Top Header: Search, notifications, and user actions */}
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 px-4 md:px-6">
            {/* Sidebar trigger for mobile */}
            <SidebarTrigger />
            
            {/* Mobile menu toggle and branding */}
            <div className="flex items-center gap-2 md:hidden">
              <Button variant="outline" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                <span className="sr-only">Toggle menu</span>
              </Button>
              <div className="flex items-center gap-2">
                <HardHat className="h-5 w-5 text-blue-600" />
                <span className="text-lg font-bold">OptiBuild</span>
              </div>
            </div>

            {/* Search input field (hidden on mobile) */}
            <div className="relative hidden md:flex w-full max-w-sm items-center">
              <Search className="absolute left-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search projects, resources..."
                className="w-full rounded-md border border-gray-200 bg-white pl-8 shadow-none"
              />
            </div>

            {/* Right side header actions */}
            <div className="ml-auto flex items-center gap-4">
              {/* Theme toggle button (hidden on mobile) */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="hidden md:flex"
              >
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>

              {/* Export button (hidden on mobile) */}
              <Button
                variant="outline"
                size="sm"
                className="hidden md:flex"
                onClick={() => setIsExportDialogOpen(true)}
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>

              {/* Notifications button with badge */}
              <Button variant="outline" size="icon" className="relative" onClick={() => setIsNotificationsOpen(true)}>
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                  3
                </span>
              </Button>

              {/* New project button (hidden on mobile) */}
              <Button
                size="sm"
                className="hidden md:flex bg-blue-600 hover:bg-blue-700"
                onClick={() => setIsNewProjectDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>

              {/* User profile dropdown menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-10 w-10">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-sm">
                      <span className="font-semibold text-lg">CB</span>
                    </div>
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-green-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {/* User info section */}
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-gradient-to-r from-blue-600 to-blue-800 text-white">
                      <span className="font-semibold text-lg">CB</span>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">OptiBuild</p>
                      <p className="text-xs leading-none text-muted-foreground">admin@optibuild.com</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  {/* Profile link */}
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/profile" className="cursor-pointer">
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  {/* Settings link */}
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings" className="cursor-pointer">
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {/* Logout button */}
                  <DropdownMenuItem>
                    <button onClick={handleLogout} className="w-full text-left cursor-pointer text-red-600 hover:text-red-700">
                      Logout
                    </button>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Main Dashboard Content */}
          <main className="grid gap-4 p-4 md:gap-8 md:p-6">
            {/* Dashboard header with filters and date range */}
            <DashboardHeader
              activeFilter={activeFilter}
              setActiveFilter={setActiveFilter}
              dateRange={dateRange}
              setDateRange={setDateRange}
            />

            {/* Overview Cards: Key metrics and KPIs */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Active Projects card with animation */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                    <LineChart className="h-4 w-4 text-gray-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{projects.length}</div>
                    <p className="text-xs text-gray-500">&nbsp;</p>
                  </CardContent>
                </Card>
              </motion.div>
              
              {/* Resource Utilization card with progress bar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Resource Utilization</CardTitle>
                    <BarChart3 className="h-4 w-4 text-gray-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">—</div>
                    <Progress value={0} className="mt-2" />
                    <p className="mt-1 text-xs text-gray-500">&nbsp;</p>
                  </CardContent>
                </Card>
              </motion.div>
              
              {/* Delay Reduction card with progress bar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Delay Reduction</CardTitle>
                    <Clock className="h-4 w-4 text-gray-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">—</div>
                    <Progress value={0} className="mt-2" />
                    <p className="mt-1 text-xs text-gray-500">&nbsp;</p>
                  </CardContent>
                </Card>
              </motion.div>
              
              {/* Carbon Footprint card showing environmental impact */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Carbon Footprint</CardTitle>
                    <Layers className="h-4 w-4 text-gray-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">—</div>
                    <p className="text-xs text-gray-500 font-medium">&nbsp;</p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Main Dashboard Content Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              {/* Resource Allocation Chart: Visual representation of resource distribution */}
              <motion.div
                className="col-span-full lg:col-span-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <ResourceAllocationChart />
              </motion.div>

              {/* Project Status: List of projects with their current status */}
              <motion.div
                className="col-span-full lg:col-span-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <ProjectStatusList />
              </motion.div>

              {/* Resource Optimization: Tabs for different optimization strategies */}
              <motion.div
                className="col-span-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <ResourceOptimizationTabs />
              </motion.div>
            </div>

            {/* AI Chatbot: Interactive AI assistant for construction queries */}
            <AIChatbot />
          </main>
        </div>
      </div>

      {/* Modal Dialogs */}
      {/* Export report dialog for downloading dashboard data */}
      <ExportReportDialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen} />

      {/* New project dialog for creating new construction projects */}
      <NewProjectDialog 
        open={isNewProjectDialogOpen} 
        onOpenChange={(open) => {
          setIsNewProjectDialogOpen(open)
          if (!open) {
            // Refresh projects when dialog closes (project might have been created)
            refreshProjects()
          }
        }} 
      />

      {/* Notifications dialog for viewing system alerts and updates */}
      <NotificationsDialog open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen} />
    </SidebarProvider>
  )
}

