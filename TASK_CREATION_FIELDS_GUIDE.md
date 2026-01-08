# Task Creation Fields Guide

## All Required Parameters (Matching CONSTRUCTION_PROJECT_TASKS.md)

The task creation form now includes all parameters from the construction project tasks format:

### ✅ 1. Task Title
- **Field**: Task Title (required)
- **Type**: Text input
- **Example**: "Project Kickoff Meeting"

### ✅ 2. Duration
- **Field**: Duration (Days)
- **Type**: Number input
- **Example**: 1, 3-5, 15-30 days
- **Features**:
  - Auto-calculates end date from start date + duration
  - Can be entered as a single number (e.g., 5 for 5 days)
  - Optional field

### ✅ 3. Priority
- **Field**: Priority (required)
- **Type**: Dropdown select
- **Options**: Low, Medium, High
- **Default**: Medium
- **Matches**: Priority from markdown (Low/Medium/High)

### ✅ 4. Dependencies
- **Field**: Dependencies (optional)
- **Type**: Multi-select with checkboxes
- **Features**:
  - Select from existing tasks in the project
  - Can select multiple dependencies
  - Shows selected dependencies as badges
  - Can remove dependencies by clicking X on badge
  - Displays "None (No Dependencies)" if no dependencies selected
- **Example**: 
  - Task: "Site Survey & Assessment"
  - Dependencies: "Project Kickoff Meeting"

### ✅ 5. Status
- **Field**: Status (required)
- **Type**: Dropdown select
- **Options**: 
  - To Do (matches "Pending" in markdown)
  - Ongoing (matches "In Progress")
  - Done (matches "Completed")
  - Blocked
- **Default**: To Do

## Additional Fields (Enhanced Features)

### Phase/Folder
- Organize tasks by construction phases
- Select from predefined phases or create custom
- Set order within phase

### Dates
- Start Date: When the task begins
- End Date: When the task ends (auto-calculated from duration if provided)

### Assignment
- Assign to team members
- Optional field

### Progress
- Track completion percentage (0-100%)
- Visual progress bar

### Description
- Additional task details
- Optional field

## Form Layout

The form is organized as follows:

1. **Task Title** (required)
2. **Description** (optional)
3. **Priority & Status** (side by side, both required)
4. **Assign To** (optional)
5. **Start Date & End Date** (side by side, optional)
6. **Phase/Folder** (optional)
7. **Duration & Progress** (side by side)
8. **Dependencies** (optional, multi-select)

## How to Use

### Creating a Task with All Parameters

1. **Task Title**: Enter task name (e.g., "Site Survey & Assessment")
2. **Description**: Add details if needed
3. **Priority**: Select High/Medium/Low
4. **Status**: Select To Do/Ongoing/Done/Blocked
5. **Duration**: Enter number of days (e.g., 5)
6. **Dependencies**: 
   - Click "Select dependencies" button
   - Check the tasks this task depends on
   - Selected tasks appear as badges
7. **Phase/Folder**: Select phase and sub-phase (optional)
8. **Dates**: Set start/end dates (or let duration calculate end date)
9. **Assign To**: Select team member (optional)
10. Click **"Create Task"**

### Example: Creating "Site Survey & Assessment"

Based on CONSTRUCTION_PROJECT_TASKS.md:

- **Task Title**: "Site Survey & Assessment"
- **Duration**: 5 (days)
- **Priority**: High
- **Dependencies**: Select "Project Kickoff Meeting"
- **Status**: To Do
- **Phase**: "PHASE 1: PRE-CONSTRUCTION & PLANNING > 1.1 Project Initiation"
- **Order**: 2

## Database Schema

Tasks table includes:
- `title` - Task name
- `duration_days` - Duration in days
- `priority` - Low/Medium/High
- `status` - Todo/Ongoing/Done/Blocked
- `dependencies` - JSONB array of task IDs
- `phase` - Phase/folder path
- `phase_order` - Order within phase
- `start_date` - Start date
- `end_date` - End date
- `progress` - Completion percentage
- `assigned_to` - Team member ID

## Migration Required

Run the SQL migration to add dependencies and duration fields:

```sql
-- File: supabase-add-task-dependencies-duration.sql
```

This adds:
- `dependencies` JSONB column
- `duration_days` INTEGER column

## Notes

- **Duration vs Dates**: You can either:
  - Set start date + duration (end date auto-calculated)
  - Set start date + end date (duration calculated automatically)
  - Set all three (duration takes precedence)

- **Dependencies**: 
  - Only shows tasks from the same project
  - Can select multiple dependencies
  - Dependencies are stored as array of task IDs
  - Used for task sequencing and scheduling

- **Status Mapping**:
  - Markdown "Pending" → "To Do"
  - Markdown "In Progress" → "Ongoing"
  - Markdown "Completed" → "Done"

All parameters from CONSTRUCTION_PROJECT_TASKS.md are now supported! 🎉
