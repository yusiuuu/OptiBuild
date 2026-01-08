"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, CheckCircle, Clock, Info, Loader2 } from "lucide-react"
import { notificationsService, Notification } from "@/lib/data-service"
import { formatDistanceToNow } from "date-fns"

// Props interface for the notifications dialog component
// Controls dialog open/close state from parent component
interface NotificationsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onNotificationRead?: () => void // Callback to refresh badge count
}

// Notifications dialog component for managing project alerts and updates
// Provides filtered views and read/unread status management for notifications
export function NotificationsDialog({ open, onOpenChange, onNotificationRead }: NotificationsDialogProps) {
  // Currently active tab for filtering notifications
  const [activeTab, setActiveTab] = useState("all")
  // Local state for notifications with read/unread status
  const [notificationsList, setNotificationsList] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load notifications when dialog opens
  useEffect(() => {
    if (open) {
      loadNotifications()
      // Refresh notifications every 30 seconds when dialog is open
      const interval = setInterval(loadNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [open])

  const loadNotifications = async () => {
    try {
      setIsLoading(true)
      const notifications = await notificationsService.getNotifications()
      
      // Mark notifications as read based on localStorage
      const notificationsWithReadStatus = notifications.map(notification => ({
        ...notification,
        read: notificationsService.isRead(notification.id)
      }))
      
      setNotificationsList(notificationsWithReadStatus)
    } catch (error) {
      console.error('Error loading notifications:', error)
      setNotificationsList([])
    } finally {
      setIsLoading(false)
    }
  }

  // Filter notifications based on active tab selection
  // Returns filtered list for display based on current filter
  const getFilteredNotifications = () => {
    switch (activeTab) {
      case "unread":
        return notificationsList.filter((n) => !n.read)
      case "alerts":
        return notificationsList.filter((n) => n.type === "alert")
      case "updates":
        return notificationsList.filter((n) => n.type === "update")
      default:
        return notificationsList
    }
  }

  // Mark all notifications as read
  // Updates the read status of all notifications to true
  const markAllAsRead = async () => {
    try {
      await notificationsService.markAllAsRead()
      setNotificationsList((prev) => prev.map((notification) => ({ ...notification, read: true })))
      onNotificationRead?.() // Refresh badge count
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  // Mark a specific notification as read
  // Updates the read status of a single notification by ID
  const markAsRead = async (id: string) => {
    try {
      await notificationsService.markAsRead(id)
      setNotificationsList((prev) =>
        prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
      )
      onNotificationRead?.() // Refresh badge count
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  // Format time ago
  const formatTimeAgo = (dateString: string): string => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return 'Recently'
    }
  }

  // Get appropriate icon for notification type
  // Returns visual indicator based on notification category
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "alert":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />
      case "update":
        return <Info className="h-5 w-5 text-blue-500" />
      case "info":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      default:
        return <Info className="h-5 w-5 text-gray-500" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-hidden flex flex-col">
        {/* Dialog header with title and mark all as read button */}
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Notifications</DialogTitle>
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          </div>
          <DialogDescription>Stay updated on your projects and resources</DialogDescription>
        </DialogHeader>

        {/* Tabbed interface for notification filtering */}
        <Tabs
          defaultValue="all"
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 overflow-hidden flex flex-col"
        >
          {/* Tab navigation with notification counts */}
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">
              Unread
              {/* Badge showing count of unread notifications */}
              <Badge className="ml-1 bg-red-500 text-white" variant="secondary">
                {notificationsList.filter((n) => !n.read).length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="updates">Updates</TabsTrigger>
          </TabsList>

          {/* Tab content area with scrollable notifications list */}
          <TabsContent value={activeTab} className="flex-1 overflow-auto mt-4 -mx-6 px-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-sm text-gray-500">Loading notifications...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Conditional rendering based on filtered notifications */}
                {getFilteredNotifications().length > 0 ? (
                  /* Map through filtered notifications and display each one */
                  getFilteredNotifications().map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        notification.read ? "bg-white hover:bg-gray-50" : "bg-blue-50 border-blue-100 hover:bg-blue-100"
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        {/* Notification type icon */}
                        <div className="mt-0.5">{getNotificationIcon(notification.type)}</div>
                        
                        {/* Notification content area */}
                        <div className="flex-1">
                          {/* Header row with title and timestamp */}
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm">{notification.title}</h4>
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 text-gray-400 mr-1" />
                              <span className="text-xs text-gray-500">{formatTimeAgo(notification.created_at)}</span>
                            </div>
                          </div>
                          
                          {/* Notification message body */}
                          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  /* Empty state when no notifications match current filter */
                  <div className="text-center py-8 text-gray-500">
                    <Info className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>No notifications found</p>
                    <p className="text-xs mt-1">Notifications will appear here based on your projects and resources</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

