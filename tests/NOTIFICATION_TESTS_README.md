# Notification System Test Cases

This document explains how to test the real-time notification system.

## Overview

The notification system generates real-time notifications based on actual data from your database:
- **Resource Shortage Alerts**: When resources have quantity < 10
- **Budget Overrun Alerts**: When project expenses exceed 105% of budget
- **Delayed Tasks Alerts**: When tasks are past their due date
- **Schedule Updates**: When projects are recently updated

## Running Tests

### Method 1: Browser Console

1. Open your application in the browser
2. Open the browser console (F12 or Right-click → Inspect → Console)
3. Import and run the tests:

```javascript
// Import the test file (adjust path as needed)
import { runAllNotificationTests } from './tests/notifications.test'

// Run all tests
runAllNotificationTests()
```

### Method 2: Individual Test Functions

You can also run individual tests:

```javascript
import {
  testResourceShortageNotification,
  testBudgetOverrunNotification,
  testDelayedTasksNotification,
  testNotificationDialogDisplay,
  testMarkAsRead,
  testNotificationFiltering
} from './tests/notifications.test'

// Run individual tests
await testResourceShortageNotification()
await testBudgetOverrunNotification()
await testDelayedTasksNotification()
await testNotificationDialogDisplay()
await testMarkAsRead()
await testNotificationFiltering()
```

### Method 3: Using Window Object

The tests are also available on the window object:

```javascript
// Run all tests
window.notificationTests.runAllNotificationTests()

// Or run individual tests
window.notificationTests.testResourceShortageNotification()
window.notificationTests.testBudgetOverrunNotification()
window.notificationTests.testDelayedTasksNotification()
window.notificationTests.testNotificationDialogDisplay()
window.notificationTests.testMarkAsRead()
window.notificationTests.testNotificationFiltering()
```

## Test Cases

### Test 1: Resource Shortage Notification
**Purpose**: Verify that notifications are generated when resources have low stock (quantity < 10)

**Steps to Test**:
1. Add a resource with quantity < 10 in your database
2. Run `testResourceShortageNotification()`
3. Check if a notification is generated

**Expected Result**: 
- ✅ Notification generated with type "alert" and title "Resource Shortage Alert"
- ✅ Notification includes resource name and current quantity

### Test 2: Budget Overrun Notification
**Purpose**: Verify that notifications are generated when project expenses exceed 105% of budget

**Steps to Test**:
1. Create a project with a budget
2. Add expenses that total more than 105% of the budget
3. Run `testBudgetOverrunNotification()`
4. Check if a notification is generated

**Expected Result**:
- ✅ Notification generated with type "alert" and title "Budget Overrun"
- ✅ Notification includes project name and overrun percentage

### Test 3: Delayed Tasks Notification
**Purpose**: Verify that notifications are generated for tasks past their due date

**Steps to Test**:
1. Create a task with an end_date in the past
2. Ensure the task status is not "completed"
3. Run `testDelayedTasksNotification()`
4. Check if a notification is generated

**Expected Result**:
- ✅ Notification generated with type "alert" and title "Delayed Tasks"
- ✅ Notification includes project name and number of delayed tasks

### Test 4: Notification Dialog Display
**Purpose**: Verify that notifications are displayed correctly in the UI

**Steps to Test**:
1. Ensure you have some notifications generated
2. Run `testNotificationDialogDisplay()`
3. Open the notifications dialog in the UI
4. Verify notifications are displayed

**Expected Result**:
- ✅ All notifications have required fields (id, title, message, type, created_at)
- ✅ All notification types are valid (alert, update, info)
- ✅ Notifications are sorted by date (newest first)

### Test 5: Mark as Read Functionality
**Purpose**: Verify that notifications can be marked as read

**Steps to Test**:
1. Ensure you have some notifications
2. Run `testMarkAsRead()`
3. Click on a notification in the UI
4. Verify it's marked as read

**Expected Result**:
- ✅ Individual notifications can be marked as read
- ✅ "Mark all as read" works correctly
- ✅ Read status persists (stored in localStorage)

### Test 6: Notification Filtering
**Purpose**: Verify that notifications can be filtered by type and read status

**Steps to Test**:
1. Ensure you have notifications of different types
2. Run `testNotificationFiltering()`
3. Use the filter tabs in the notifications dialog
4. Verify filtering works correctly

**Expected Result**:
- ✅ Filtering by type (All, Alerts, Updates) works
- ✅ Filtering by read status (Unread) works
- ✅ Badge shows correct count of unread notifications

## Manual Testing Checklist

### UI Testing

- [ ] Open notifications dialog (click bell icon in header)
- [ ] Verify notifications are displayed
- [ ] Check that unread notifications have blue background
- [ ] Click on a notification to mark it as read
- [ ] Verify notification background changes to white after marking as read
- [ ] Click "Mark all as read" button
- [ ] Verify all notifications are marked as read
- [ ] Test filter tabs (All, Unread, Alerts, Updates)
- [ ] Verify badge count updates correctly
- [ ] Close and reopen dialog - verify read status persists

### Real-time Testing

- [ ] Add a resource with quantity < 10
- [ ] Open notifications dialog - should see resource shortage alert
- [ ] Add expenses to exceed 105% of project budget
- [ ] Refresh notifications - should see budget overrun alert
- [ ] Create a task with past due date
- [ ] Refresh notifications - should see delayed tasks alert
- [ ] Update a project
- [ ] Refresh notifications - should see schedule update notification

## Troubleshooting

### No Notifications Appearing

1. **Check Database**: Ensure you have projects, resources, tasks, or expenses in your database
2. **Check Conditions**: 
   - Resources need quantity < 10 for shortage alerts
   - Expenses need to exceed 105% of budget for overrun alerts
   - Tasks need past end_date and status != 'completed' for delayed alerts
3. **Check Console**: Look for errors in the browser console
4. **Check Authentication**: Ensure you're logged in

### Notifications Not Updating

1. **Refresh Dialog**: Close and reopen the notifications dialog
2. **Check Auto-refresh**: Notifications refresh every 30 seconds when dialog is open
3. **Manual Refresh**: Reload the page to force refresh

### Read Status Not Persisting

1. **Check localStorage**: Open browser DevTools → Application → Local Storage
2. **Verify Key**: Should see "readNotifications" key with array of notification IDs
3. **Clear if Needed**: Clear localStorage and test again

## Test Data Setup

To properly test notifications, you'll need:

1. **For Resource Shortage**:
   - At least one resource with quantity < 10

2. **For Budget Overrun**:
   - A project with a budget (e.g., ₹1,000,000)
   - Expenses totaling > ₹1,050,000

3. **For Delayed Tasks**:
   - A project with tasks
   - At least one task with end_date in the past
   - Task status should not be "completed"

4. **For Schedule Updates**:
   - A project that was updated in the last 24 hours

## Expected Test Results

When all tests pass, you should see:

```
🚀 Running All Notification Tests...

🧪 Test 1: Resource Shortage Notification
✅ PASS: Resource shortage notifications working correctly

🧪 Test 2: Budget Overrun Notification
✅ PASS: Budget overrun notifications working correctly

🧪 Test 3: Delayed Tasks Notification
✅ PASS: Delayed tasks notifications working correctly

🧪 Test 4: Notification Dialog Display
✅ PASS: Notification dialog display test passed

🧪 Test 5: Mark as Read Functionality
✅ PASS: Mark as read functionality working correctly

🧪 Test 6: Notification Filtering
✅ PASS: Notification filtering working correctly

📊 Test Results: 6/6 tests passed
```

## Notes

- Notifications are generated on-the-fly based on current database state
- Read status is stored in localStorage (not in database)
- Notifications refresh automatically every 30 seconds when dialog is open
- Notifications are sorted by date (newest first)



