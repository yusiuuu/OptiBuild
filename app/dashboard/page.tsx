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
import { ProjectVisualizations } from "@/components/dashboard/project-visualizations"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { NewProjectDialog } from "@/components/dashboard/new-project-dialog"
import { ExportReportDialog } from "@/components/dashboard/export-report-dialog"
import { NotificationsDialog } from "@/components/dashboard/notifications-dialog"
import { useRouter } from 'next/navigation'
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import { format } from "date-fns"
import { AIChatbot } from "@/components/dashboard/ai-chatbot"
import { getAvatarInitials } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Main dashboard page component for OptiBuild application
// Provides comprehensive overview of construction projects, resources, and analytics
export default function DashboardPage() {
  // Theme management for light/dark mode switching
  const { theme, setTheme } = useTheme()
  // Router hook for navigation
  const router = useRouter()
  // Authentication context function for user logout and profile
  const { signOut, userProfile, user } = useAuth()
  
  const avatarInitials = getAvatarInitials(
    userProfile?.company_name,
    userProfile?.full_name,
    user?.email
  )
  const avatarUrl = userProfile?.avatar_url
  
  // Project list (fetched from Supabase only)
  const [projects, setProjects] = useState<any[]>([]);
  const [projectsRefreshKey, setProjectsRefreshKey] = useState(0);
  
  // Dashboard metrics state
  const [resourceUtilization, setResourceUtilization] = useState(0);
  const [delayReduction, setDelayReduction] = useState(0);

  // Load projects from Supabase on component mount (no local storage fallback)
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
      // Trigger refresh of visualizations
      setProjectsRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  // Load dashboard metrics (Resource Utilization and Delay Reduction)
  const loadDashboardMetrics = async () => {
    try {
      const { 
        resourcesCatalogService, 
        projectsService, 
        tasksService,
        projectResourcesService 
      } = await import('@/lib/data-service');

      // Calculate Resource Utilization
      // Utilization = (Total Allocated Resources / Total Available Resources) * 100
      const allResources = await resourcesCatalogService.getResources();
      const allProjects = await projectsService.getProjects();
      
      let totalAllocated = 0;
      let totalAvailable = 0;
      
      // Sum up all available resources
      totalAvailable = allResources.reduce((sum, r) => sum + (r.quantity || 0), 0);
      
      // Sum up all allocated resources across all projects
      for (const project of allProjects) {
        try {
          const projectResources = await projectResourcesService.getProjectResources(project.id);
          projectResources.forEach((pr: any) => {
            if (pr.resource && pr.quantity) {
              totalAllocated += pr.quantity;
            }
          });
        } catch (err) {
          // Skip projects with errors
          console.warn(`Error loading resources for project ${project.id}:`, err);
        }
      }
      
      // Calculate utilization percentage
      const utilization = totalAvailable > 0 
        ? Math.round((totalAllocated / totalAvailable) * 100) 
        : 0;
      setResourceUtilization(Math.min(100, Math.max(0, utilization)));

      // Calculate Delay Reduction
      // Delay Reduction = (Tasks On Time / Total Tasks) * 100
      // Or: Reduction = 100 - (Delayed Tasks / Total Tasks) * 100
      let totalTasks = 0;
      let onTimeTasks = 0;
      
      for (const project of allProjects) {
        try {
          const tasks = await tasksService.getTasks(project.id);
          tasks.forEach((task: any) => {
            totalTasks++;
            if (task.end_date && task.start_date) {
              const endDate = new Date(task.end_date);
              const startDate = new Date(task.start_date);
              const today = new Date();
              
              // Task is on time if it's completed before or on the end date
              // Or if it's in progress and not past the end date
              if (endDate >= today || task.status === 'completed') {
                onTimeTasks++;
              }
            } else {
              // Tasks without dates are considered on time
              onTimeTasks++;
            }
          });
        } catch (err) {
          // Skip projects with errors
          console.warn(`Error loading tasks for project ${project.id}:`, err);
        }
      }
      
      // Calculate delay reduction percentage
      const reduction = totalTasks > 0 
        ? Math.round((onTimeTasks / totalTasks) * 100) 
        : 0;
      setDelayReduction(Math.min(100, Math.max(0, reduction)));
      
    } catch (error) {
      console.error('Error loading dashboard metrics:', error);
      setResourceUtilization(0);
      setDelayReduction(0);
    }
  };

  // Load notification count
  const loadNotificationCount = async () => {
    try {
      const { notificationsService } = await import('@/lib/data-service')
      const notifications = await notificationsService.getNotifications()
      const unread = notifications.filter(n => !notificationsService.isRead(n.id))
      setUnreadNotificationCount(unread.length)
    } catch (error) {
      console.error('Error loading notification count:', error)
    }
  }

  useEffect(() => {
    loadProjects();
    loadDashboardMetrics();
    loadNotificationCount();
    
    // Refresh notification count every 30 seconds
    const interval = setInterval(loadNotificationCount, 30000)
    
    // Listen for task refresh events
    const handleTaskRefresh = () => {
      loadDashboardMetrics()
      loadNotificationCount()
    }
    
    window.addEventListener('task-refresh', handleTaskRefresh)
    
    // Also listen to storage events for cross-tab communication
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'task-refresh-timestamp') {
        handleTaskRefresh()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('task-refresh', handleTaskRefresh)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, []);

  // UI state management for various dialogs and mobile menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  
  // Dashboard filtering and date range state
  const [activeFilter, setActiveFilter] = useState("all")
  // Initialize with current month as default
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date()
    return format(now, "MMM yyyy") // e.g., "Dec 2024"
  })
  
  // Notification badge count
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0)

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
    await loadProjects();
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
      <div className="flex min-h-screen w-full bg-gray-100 dark:bg-gray-900">
        {/* Left Sidebar: Navigation and project management */}
        <Sidebar className="border-r border-gray-200 flex-shrink-0">
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
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Header: Search, notifications, and user actions */}
          <header className="sticky top-0 z-10 flex h-16 flex-shrink-0 items-center gap-2 sm:gap-4 border-b border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 px-2 sm:px-4 md:px-6">
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
                className="w-full rounded-md border border-gray-200 bg-white pl-8 shadow-none text-sm"
              />
            </div>

            {/* Right side header actions */}
            <div className="ml-auto flex items-center gap-1 sm:gap-2 md:gap-4">
              {/* Theme toggle button (hidden on mobile) */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="hidden md:flex h-9 w-9"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>

              {/* Export button (hidden on mobile) */}
              <Button
                variant="outline"
                size="sm"
                className="hidden md:flex text-xs sm:text-sm"
                onClick={() => setIsExportDialogOpen(true)}
              >
                <Download className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden lg:inline">Export</span>
              </Button>

              {/* Notifications button with badge */}
              <Button variant="outline" size="icon" className="relative h-9 w-9" onClick={() => {
                setIsNotificationsOpen(true)
                loadNotificationCount() // Refresh count when opening
              }}>
                <Bell className="h-4 w-4" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                    {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                  </span>
                )}
              </Button>

              {/* New project button (hidden on mobile) */}
              <Button
                size="sm"
                className="hidden md:flex bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm h-9"
                onClick={() => setIsNewProjectDialogOpen(true)}
              >
                <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden lg:inline">New Project</span>
                <span className="lg:hidden">New</span>
              </Button>

              {/* User profile dropdown menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-10 w-10">
                    <Avatar className="h-10 w-10 border-2 border-background shadow-md">
                      <AvatarImage 
                        src={avatarUrl || undefined} 
                        alt={userProfile?.company_name || userProfile?.full_name || 'User'} 
                      />
                      <AvatarFallback className="bg-gradient-to-r from-blue-600 to-blue-800 text-white font-semibold text-sm">
                        {avatarInitials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-green-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {/* User info section */}
                  <div className="flex items-center justify-start gap-2 p-2">
                    <Avatar className="h-10 w-10 border-2 border-background">
                      <AvatarImage 
                        src={avatarUrl || undefined} 
                        alt={userProfile?.company_name || userProfile?.full_name || 'User'} 
                      />
                      <AvatarFallback className="bg-gradient-to-r from-blue-600 to-blue-800 text-white font-semibold text-xs">
                        {avatarInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{userProfile?.company_name || userProfile?.full_name || 'OptiBuild'}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email || 'admin@optibuild.com'}</p>
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
          <main className="flex-1 overflow-y-auto overflow-x-hidden w-full min-h-0 bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
            <div className="grid gap-4 sm:gap-5 md:gap-6 p-4 sm:p-5 md:p-6 lg:p-8 max-w-full pb-12">
              {/* Dashboard header with filters and date range */}
              <DashboardHeader
                activeFilter={activeFilter}
                setActiveFilter={setActiveFilter}
                dateRange={dateRange}
                setDateRange={setDateRange}
              />

              {/* Overview Cards: Key metrics and KPIs */}
              <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {/* Active Projects card with animation */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.4, ease: "easeOut" }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
                <Card className="h-full flex flex-col border-2 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 sm:px-5 pt-4 sm:pt-5 flex-shrink-0">
                    <CardTitle className="text-sm sm:text-base font-semibold truncate pr-2 text-blue-900 dark:text-blue-100">Active Projects</CardTitle>
                    <div className="h-10 w-10 rounded-lg bg-blue-500/20 dark:bg-blue-500/30 flex items-center justify-center flex-shrink-0">
                      <LineChart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 sm:px-5 pb-4 sm:pb-5 flex-1 flex items-end">
                    <div className="text-3xl sm:text-4xl font-bold text-blue-900 dark:text-blue-100">{projects.length}</div>
                  </CardContent>
                </Card>
              </motion.div>
              
              {/* Resource Utilization card with progress bar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
                <Card className="h-full flex flex-col border-2 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 border-green-200 dark:border-green-800">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 sm:px-5 pt-4 sm:pt-5 flex-shrink-0">
                    <CardTitle className="text-sm sm:text-base font-semibold truncate pr-2 text-green-900 dark:text-green-100">Resource Utilization</CardTitle>
                    <div className="h-10 w-10 rounded-lg bg-green-500/20 dark:bg-green-500/30 flex items-center justify-center flex-shrink-0">
                      <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 sm:px-5 pb-4 sm:pb-5 flex-1 flex flex-col justify-end space-y-3">
                    <div className="text-3xl sm:text-4xl font-bold text-green-900 dark:text-green-100">{resourceUtilization}%</div>
                    <Progress value={resourceUtilization} className="h-2.5 bg-green-100 dark:bg-green-900/50" />
                  </CardContent>
                </Card>
              </motion.div>
              
              {/* Delay Reduction card with progress bar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
                <Card className="h-full flex flex-col border-2 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 border-amber-200 dark:border-amber-800">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 sm:px-5 pt-4 sm:pt-5 flex-shrink-0">
                    <CardTitle className="text-sm sm:text-base font-semibold truncate pr-2 text-amber-900 dark:text-amber-100">Delay Reduction</CardTitle>
                    <div className="h-10 w-10 rounded-lg bg-amber-500/20 dark:bg-amber-500/30 flex items-center justify-center flex-shrink-0">
                      <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 sm:px-5 pb-4 sm:pb-5 flex-1 flex flex-col justify-end space-y-3">
                    <div className="text-3xl sm:text-4xl font-bold text-amber-900 dark:text-amber-100">{delayReduction}%</div>
                    <Progress value={delayReduction} className="h-2.5 bg-amber-100 dark:bg-amber-900/50" />
                  </CardContent>
                </Card>
              </motion.div>
            </div>

              {/* Main Dashboard Content Grid */}
              <div className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 lg:grid-cols-7">
                {/* Resource Allocation Chart: Visual representation of resource distribution */}
                <motion.div
                  className="col-span-full lg:col-span-4 min-h-[400px] sm:min-h-[450px] lg:min-h-[500px]"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
                >
                  <ResourceAllocationChart />
                </motion.div>

                {/* Project Status: List of projects with their current status */}
                <motion.div
                  className="col-span-full lg:col-span-3 min-h-[400px] sm:min-h-[450px] lg:min-h-[500px]"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
                >
                  <ProjectStatusList />
                </motion.div>

                {/* Project Visualizations: Charts and graphs for projects */}
                <motion.div
                  className="col-span-full"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
                >
                  <ProjectVisualizations key={projectsRefreshKey} />
                </motion.div>

                {/* Resource Optimization: Tabs for different optimization strategies */}
                <motion.div
                  className="col-span-full"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6, ease: "easeOut" }}
                >
                  <ResourceOptimizationTabs />
                </motion.div>
              </div>
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
      <NotificationsDialog 
        open={isNotificationsOpen} 
        onOpenChange={(open) => {
          setIsNotificationsOpen(open)
          if (!open) {
            // Refresh count when dialog closes
            loadNotificationCount()
          }
        }}
        onNotificationRead={loadNotificationCount}
      />
    </SidebarProvider>
  )
}

