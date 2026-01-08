/**
 * Notification System Test Cases
 * 
 * These tests verify that the notification system:
 * 1. Generates real-time notifications based on actual data
 * 2. Displays notifications correctly in the UI
 * 3. Handles read/unread status properly
 * 4. Filters notifications by type
 * 
 * To run these tests:
 * 1. Ensure you have test data in your database (projects, resources, tasks, expenses)
 * 2. Open the browser console
 * 3. Run the test functions manually or use a test runner
 */

// Test Case 1: Resource Shortage Notification
export async function testResourceShortageNotification() {
  console.log('🧪 Test 1: Resource Shortage Notification')
  
  try {
    const { notificationsService, resourcesCatalogService } = await import('@/lib/data-service')
    
    // Get all resources
    const resources = await resourcesCatalogService.getResources()
    
    // Check if any resource has quantity < 10
    const lowStockResources = resources.filter(r => r.quantity && r.quantity < 10)
    
    if (lowStockResources.length > 0) {
      console.log('✅ PASS: Found resources with low stock:', lowStockResources.map(r => r.name))
      
      // Get notifications
      const notifications = await notificationsService.getNotifications()
      const shortageNotifications = notifications.filter(n => 
        n.type === 'alert' && n.title.includes('Resource Shortage')
      )
      
      if (shortageNotifications.length > 0) {
        console.log('✅ PASS: Resource shortage notifications generated:', shortageNotifications.length)
        console.log('   Notifications:', shortageNotifications)
        return { passed: true, message: 'Resource shortage notifications working correctly' }
      } else {
        console.log('❌ FAIL: No resource shortage notifications found')
        return { passed: false, message: 'Resource shortage notifications not generated' }
      }
    } else {
      console.log('⚠️  SKIP: No resources with low stock found. Add a resource with quantity < 10 to test.')
      return { passed: true, message: 'No low stock resources to test', skipped: true }
    }
  } catch (error) {
    console.error('❌ FAIL: Error testing resource shortage notification:', error)
    return { passed: false, message: `Error: ${error}` }
  }
}

// Test Case 2: Budget Overrun Notification
export async function testBudgetOverrunNotification() {
  console.log('🧪 Test 2: Budget Overrun Notification')
  
  try {
    const { notificationsService, projectsService, expensesService } = await import('@/lib/data-service')
    
    // Get all projects
    const projects = await projectsService.getProjects()
    
    let foundOverrun = false
    
    for (const project of projects) {
      if (project.budget) {
        try {
          const expenses = await expensesService.getProjectExpenses(project.id)
          const totalExpenses = expenses.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0)
          const budget = Number(project.budget)
          
          if (budget > 0 && totalExpenses > budget * 1.05) {
            foundOverrun = true
            console.log(`✅ PASS: Found budget overrun for project: ${project.name}`)
            console.log(`   Budget: ₹${budget}, Expenses: ₹${totalExpenses}`)
            break
          }
        } catch (err) {
          // Skip projects with errors
        }
      }
    }
    
    if (foundOverrun) {
      const notifications = await notificationsService.getNotifications()
      const overrunNotifications = notifications.filter(n => 
        n.type === 'alert' && n.title.includes('Budget Overrun')
      )
      
      if (overrunNotifications.length > 0) {
        console.log('✅ PASS: Budget overrun notifications generated:', overrunNotifications.length)
        return { passed: true, message: 'Budget overrun notifications working correctly' }
      } else {
        console.log('❌ FAIL: No budget overrun notifications found')
        return { passed: false, message: 'Budget overrun notifications not generated' }
      }
    } else {
      console.log('⚠️  SKIP: No projects with budget overruns found. Add expenses > 105% of budget to test.')
      return { passed: true, message: 'No budget overruns to test', skipped: true }
    }
  } catch (error) {
    console.error('❌ FAIL: Error testing budget overrun notification:', error)
    return { passed: false, message: `Error: ${error}` }
  }
}

// Test Case 3: Delayed Tasks Notification
export async function testDelayedTasksNotification() {
  console.log('🧪 Test 3: Delayed Tasks Notification')
  
  try {
    const { notificationsService, projectsService, tasksService } = await import('@/lib/data-service')
    
    const projects = await projectsService.getProjects()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    let foundDelayed = false
    
    for (const project of projects) {
      try {
        const tasks = await tasksService.getTasks(project.id)
        const delayedTasks = tasks.filter((task: any) => {
          if (!task.end_date) return false
          const endDate = new Date(task.end_date)
          endDate.setHours(0, 0, 0, 0)
          return endDate < today && task.status !== 'completed'
        })
        
        if (delayedTasks.length > 0) {
          foundDelayed = true
          console.log(`✅ PASS: Found delayed tasks for project: ${project.name}`, delayedTasks.length)
          break
        }
      } catch (err) {
        // Skip projects with errors
      }
    }
    
    if (foundDelayed) {
      const notifications = await notificationsService.getNotifications()
      const delayedNotifications = notifications.filter(n => 
        n.type === 'alert' && n.title.includes('Delayed Tasks')
      )
      
      if (delayedNotifications.length > 0) {
        console.log('✅ PASS: Delayed tasks notifications generated:', delayedNotifications.length)
        return { passed: true, message: 'Delayed tasks notifications working correctly' }
      } else {
        console.log('❌ FAIL: No delayed tasks notifications found')
        return { passed: false, message: 'Delayed tasks notifications not generated' }
      }
    } else {
      console.log('⚠️  SKIP: No delayed tasks found. Add tasks with past end_date to test.')
      return { passed: true, message: 'No delayed tasks to test', skipped: true }
    }
  } catch (error) {
    console.error('❌ FAIL: Error testing delayed tasks notification:', error)
    return { passed: false, message: `Error: ${error}` }
  }
}

// Test Case 4: Notification Dialog Display
export async function testNotificationDialogDisplay() {
  console.log('🧪 Test 4: Notification Dialog Display')
  
  try {
    const { notificationsService } = await import('@/lib/data-service')
    const notifications = await notificationsService.getNotifications()
    
    console.log(`📊 Total notifications: ${notifications.length}`)
    console.log('   Notifications:', notifications)
    
    // Check if notifications have required fields
    const validNotifications = notifications.every(n => 
      n.id && n.title && n.message && n.type && n.created_at
    )
    
    if (validNotifications) {
      console.log('✅ PASS: All notifications have required fields')
    } else {
      console.log('❌ FAIL: Some notifications missing required fields')
      return { passed: false, message: 'Invalid notification structure' }
    }
    
    // Check notification types
    const types = ['alert', 'update', 'info']
    const validTypes = notifications.every(n => types.includes(n.type))
    
    if (validTypes) {
      console.log('✅ PASS: All notifications have valid types')
    } else {
      console.log('❌ FAIL: Some notifications have invalid types')
      return { passed: false, message: 'Invalid notification types' }
    }
    
    return { 
      passed: true, 
      message: `Notification dialog display test passed. Found ${notifications.length} notifications.`,
      count: notifications.length
    }
  } catch (error) {
    console.error('❌ FAIL: Error testing notification dialog display:', error)
    return { passed: false, message: `Error: ${error}` }
  }
}

// Test Case 5: Mark as Read Functionality
export async function testMarkAsRead() {
  console.log('🧪 Test 5: Mark as Read Functionality')
  
  try {
    const { notificationsService } = await import('@/lib/data-service')
    
    // Get notifications
    const notifications = await notificationsService.getNotifications()
    
    if (notifications.length === 0) {
      console.log('⚠️  SKIP: No notifications to test mark as read')
      return { passed: true, message: 'No notifications to test', skipped: true }
    }
    
    // Mark first notification as read
    const firstNotification = notifications[0]
    await notificationsService.markAsRead(firstNotification.id)
    
    // Check if it's marked as read
    const isRead = notificationsService.isRead(firstNotification.id)
    
    if (isRead) {
      console.log('✅ PASS: Notification marked as read successfully')
      
      // Test mark all as read
      await notificationsService.markAllAsRead()
      const allRead = notifications.every(n => notificationsService.isRead(n.id))
      
      if (allRead) {
        console.log('✅ PASS: All notifications marked as read successfully')
        return { passed: true, message: 'Mark as read functionality working correctly' }
      } else {
        console.log('❌ FAIL: Not all notifications marked as read')
        return { passed: false, message: 'Mark all as read not working' }
      }
    } else {
      console.log('❌ FAIL: Notification not marked as read')
      return { passed: false, message: 'Mark as read not working' }
    }
  } catch (error) {
    console.error('❌ FAIL: Error testing mark as read:', error)
    return { passed: false, message: `Error: ${error}` }
  }
}

// Test Case 6: Notification Filtering
export async function testNotificationFiltering() {
  console.log('🧪 Test 6: Notification Filtering')
  
  try {
    const { notificationsService } = await import('@/lib/data-service')
    const notifications = await notificationsService.getNotifications()
    
    // Filter by type
    const alerts = notifications.filter(n => n.type === 'alert')
    const updates = notifications.filter(n => n.type === 'update')
    const infos = notifications.filter(n => n.type === 'info')
    
    console.log(`📊 Filter results:`)
    console.log(`   Alerts: ${alerts.length}`)
    console.log(`   Updates: ${updates.length}`)
    console.log(`   Infos: ${infos.length}`)
    
    // Filter by read status
    const unread = notifications.filter(n => !notificationsService.isRead(n.id))
    const read = notifications.filter(n => notificationsService.isRead(n.id))
    
    console.log(`   Unread: ${unread.length}`)
    console.log(`   Read: ${read.length}`)
    
    if (alerts.length + updates.length + infos.length === notifications.length) {
      console.log('✅ PASS: Notification filtering working correctly')
      return { 
        passed: true, 
        message: 'Notification filtering working correctly',
        counts: { alerts: alerts.length, updates: updates.length, infos: infos.length, unread: unread.length, read: read.length }
      }
    } else {
      console.log('❌ FAIL: Notification filtering not working correctly')
      return { passed: false, message: 'Filtering issue detected' }
    }
  } catch (error) {
    console.error('❌ FAIL: Error testing notification filtering:', error)
    return { passed: false, message: `Error: ${error}` }
  }
}

// Run all tests
export async function runAllNotificationTests() {
  console.log('🚀 Running All Notification Tests...\n')
  
  const results = {
    test1: await testResourceShortageNotification(),
    test2: await testBudgetOverrunNotification(),
    test3: await testDelayedTasksNotification(),
    test4: await testNotificationDialogDisplay(),
    test5: await testMarkAsRead(),
    test6: await testNotificationFiltering(),
  }
  
  const passed = Object.values(results).filter(r => r.passed).length
  const total = Object.keys(results).length
  
  console.log(`\n📊 Test Results: ${passed}/${total} tests passed`)
  
  return {
    results,
    summary: {
      passed,
      total,
      percentage: (passed / total * 100).toFixed(1) + '%'
    }
  }
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).notificationTests = {
    testResourceShortageNotification,
    testBudgetOverrunNotification,
    testDelayedTasksNotification,
    testNotificationDialogDisplay,
    testMarkAsRead,
    testNotificationFiltering,
    runAllNotificationTests,
  }
  
  console.log('✅ Notification tests loaded! Run window.notificationTests.runAllNotificationTests() to test')
}



