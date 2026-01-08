# Task Folder/Phase Organization Feature Guide

## Overview
This feature allows you to organize tasks into folders/phases, similar to the structure in `CONSTRUCTION_PROJECT_TASKS.md`. Tasks can be grouped hierarchically by phase and sub-phase.

## Setup

### 1. Run Database Migration
First, run the SQL migration to add phase support to the tasks table:

```sql
-- Run this in your Supabase SQL Editor
-- File: supabase-add-task-folder-phase.sql
```

This adds:
- `phase` column: Stores the full phase path (e.g., "PHASE 1: PRE-CONSTRUCTION > 1.1 Project Initiation")
- `phase_order` column: Order of task within its phase

## Features

### 1. Phase/Folder Selector
When creating a new task, you'll see a **Phase/Folder** selector with:

- **Predefined Construction Phases**: 
  - PHASE 1: PRE-CONSTRUCTION & PLANNING
  - PHASE 2: SITE PREPARATION
  - PHASE 3: FOUNDATION WORK
  - PHASE 4: STRUCTURAL WORK
  - PHASE 5: MEP (MECHANICAL, ELECTRICAL, PLUMBING)
  - PHASE 6: MASONRY & BRICKWORK
  - PHASE 7: FINISHING WORK
  - PHASE 8: EXTERNAL WORK
  - PHASE 9: TESTING & COMMISSIONING
  - PHASE 10: FINAL INSPECTIONS & HANDOVER

- **Sub-Phases**: Each phase has sub-phases (e.g., "1.1 Project Initiation", "1.2 Design & Documentation")

- **Custom Phases**: You can create custom phase/folder paths

- **Order in Phase**: Set the order number for tasks within the same phase (lower numbers appear first)

### 2. Folder Tree View
In the Schedule page, switch to the **"Folders"** view to see tasks organized hierarchically:

- **Expandable Folders**: Click folders to expand/collapse
- **Task Count**: See how many tasks are in each folder
- **Hierarchical Structure**: 
  ```
  PHASE 1: PRE-CONSTRUCTION & PLANNING
    └─ 1.1 Project Initiation
       ├─ Project Kickoff Meeting
       ├─ Site Survey & Assessment
       └─ Obtain Building Permits
    └─ 1.2 Design & Documentation
       ├─ Architectural Design Finalization
       └─ Structural Engineering Design
  ```

## How to Use

### Adding Tasks with Phases

1. **Go to Schedule Page** or **Project Details → Tasks**
2. Click **"Add Task"** or **"New Task"**
3. Fill in task details:
   - **Task Title**: e.g., "Project Kickoff Meeting"
   - **Description**: Optional details
   - **Priority**: Low/Medium/High
   - **Status**: Todo/Ongoing/Done/Blocked
   - **Phase/Folder**: 
     - Select a phase from dropdown (e.g., "PHASE 1: PRE-CONSTRUCTION & PLANNING")
     - Select a sub-phase (e.g., "1.1 Project Initiation")
     - Or create a custom phase
   - **Order in Phase**: Set order number (e.g., 1, 2, 3)
   - **Dates, Assignee, etc.**
4. Click **"Create Task"**

### Viewing Tasks in Folders

1. Go to **Schedule** page
2. Click the **"Folders"** tab (next to List, Day, Week, Month)
3. See tasks organized by phase/folder
4. Click on any task to view/edit details
5. Expand/collapse folders by clicking the folder name

### Example: Adding Construction Tasks

Based on `CONSTRUCTION_PROJECT_TASKS.md`:

**Task 1: Project Kickoff Meeting**
- Phase: `PHASE 1: PRE-CONSTRUCTION & PLANNING > 1.1 Project Initiation`
- Order: 1
- Duration: 1 day
- Priority: High

**Task 2: Site Survey & Assessment**
- Phase: `PHASE 1: PRE-CONSTRUCTION & PLANNING > 1.1 Project Initiation`
- Order: 2
- Duration: 3-5 days
- Priority: High
- Dependencies: Project Kickoff Meeting

**Task 3: Obtain Building Permits**
- Phase: `PHASE 1: PRE-CONSTRUCTION & PLANNING > 1.1 Project Initiation`
- Order: 3
- Duration: 15-30 days
- Priority: Critical
- Dependencies: Site Survey & Assessment

## Phase Path Format

Phase paths use the format: `PHASE > Sub-Phase`

Examples:
- `PHASE 1: PRE-CONSTRUCTION & PLANNING > 1.1 Project Initiation`
- `PHASE 4: STRUCTURAL WORK > 4.1 Ground Floor`
- `PHASE 5: MEP (MECHANICAL, ELECTRICAL, PLUMBING) > 5.1 Electrical Work`

## Benefits

1. **Organized Structure**: Tasks are organized by project phases
2. **Easy Navigation**: Quickly find tasks by phase
3. **Progress Tracking**: See progress by phase/folder
4. **Hierarchical View**: Understand task relationships
5. **Custom Organization**: Create your own phase structure

## Technical Details

### Database Schema
```sql
tasks
├── phase TEXT          -- Full phase path
└── phase_order INTEGER -- Order within phase
```

### Components
- `PhaseFolderSelector`: Phase selection component
- `TaskFolderTree`: Folder tree display component
- Updated `NewTaskDialog`: Includes phase selector
- Updated `SchedulePage`: Includes folder view

## Tips

1. **Start with Predefined Phases**: Use the predefined construction phases for consistency
2. **Set Order Numbers**: Use order numbers to control task sequence within phases
3. **Use Custom Phases**: Create custom phases for project-specific organization
4. **Update Status**: Update task status as work progresses
5. **Track Progress**: Monitor progress by phase in the folder view

## Future Enhancements

Potential improvements:
- Drag-and-drop to reorganize tasks
- Phase-level progress indicators
- Filter by phase
- Export tasks by phase
- Phase templates
- Bulk phase assignment

Enjoy organizing your tasks! 🏗️
