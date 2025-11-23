# Implementation Guide - Extended Database Schema

## ✅ COMPLETED

### 1. Database Schema Migration
**File**: `supabase-migration-extended-schema.sql`

✅ **New Tables Created:**
- `project_team_members` - Many-to-many link between projects and team members
- `tasks` - Enhanced task management with proper schema
- `resources` - Global resource catalog (user-owned)
- `project_resources` - Resource assignments to projects
- `constraints_master` - Master list of available constraints (seeded)
- `project_constraints` - Project-specific constraint assignments
- `budget_categories` - Budget breakdown by category
- `expenses` - Expense tracking linked to budget categories

✅ **Table Modifications:**
- `projects` - Added `total_area` and `building_height` columns
- `documents` - Added `project_id` column (nullable for backward compatibility)

✅ **Features:**
- All tables have Row Level Security (RLS) enabled
- Comprehensive RLS policies for data isolation
- Automatic triggers for `updated_at` timestamps
- Automatic budget calculation when expenses are added/updated
- Indexes for optimal query performance
- Constraints master table seeded with 10 standard constraints

### 2. Backend Services
**File**: `lib/data-service.ts`

✅ **New Service Functions:**
- `projectTeamMembersService` - Manage project-team member relationships
- `resourcesCatalogService` - Manage global resource catalog
- `projectResourcesService` - Manage resource assignments to projects
- `constraintsService` - Manage constraints master and project constraints
- `budgetCategoriesService` - Manage budget categories
- `expensesService` - Manage expenses with automatic budget updates
- `projectDetailsService` - Comprehensive project details fetch (all related data in one call)

✅ **Updated Services:**
- `tasksService` - Updated to use `title` instead of `name`, added validation
- `enhancedProjectsService` - Create projects with constraints

✅ **New TypeScript Interfaces:**
- `ProjectTeamMember`
- `Resource` (updated for global catalog)
- `ProjectResource`
- `ConstraintMaster`
- `ProjectConstraint`
- `BudgetCategory`
- `Expense`
- `ProjectDetails` (comprehensive type)

---

## 🚧 TODO - Frontend Implementation

### Priority 1: Core Functionality

#### 1. Update Project Creation Dialog
**File**: `components/dashboard/new-project-dialog.tsx`

**Required Changes:**
- [ ] Add `total_area` input field (number, sqft)
- [ ] Add `building_height` input field (number, meters/feet)
- [ ] Add constraint selection (multi-select checkboxes from `constraints_master`)
- [ ] Update form submission to use `enhancedProjectsService.createProjectWithConstraints()`
- [ ] Add validation for new fields

**Example Fields to Add:**
```tsx
<Input
  label="Total Area (sqft)"
  type="number"
  value={formData.total_area}
  onChange={(e) => setFormData({...formData, total_area: parseFloat(e.target.value)})}
/>

<Select
  label="Constraints"
  multiple
  options={constraintsMaster.map(c => ({value: c.id, label: c.name}))}
  value={selectedConstraints}
  onChange={setSelectedConstraints}
/>
```

#### 2. Update Project Details Page
**File**: `app/dashboard/projects/[id]/page.tsx`

**Required Changes:**
- [ ] Replace current data fetching with `projectDetailsService.getProjectDetails(projectId)`
- [ ] Add new tabs: Tasks, Team, Resources, Documents, Constraints, Budget
- [ ] Update Overview section to show:
  - Team members count
  - Tasks progress summary
  - Resources count
  - Constraints badges
  - Budget summary

**Tab Structure:**
```tsx
<Tabs>
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="tasks">Tasks</TabsTrigger>
    <TabsTrigger value="team">Team</TabsTrigger>
    <TabsTrigger value="resources">Resources</TabsTrigger>
    <TabsTrigger value="documents">Documents</TabsTrigger>
    <TabsTrigger value="constraints">Constraints</TabsTrigger>
    <TabsTrigger value="budget">Budget</TabsTrigger>
  </TabsList>
</Tabs>
```

#### 3. Create Task Management Components

**New File**: `components/projects/task-kanban-board.tsx`
- [ ] Kanban board with columns: Todo, Ongoing, Done, Blocked
- [ ] Drag-and-drop task reordering
- [ ] Task creation modal
- [ ] Task edit modal
- [ ] Task assignment dropdown (from project team members)
- [ ] Task progress slider

**New File**: `components/projects/new-task-dialog.tsx`
- [ ] Form fields: title, description, priority, assigned_to, start_date, end_date
- [ ] Validation: dates within project dates, assigned_to in project team
- [ ] Use `tasksService.createTask()`

**New File**: `components/projects/task-card.tsx`
- [ ] Display task information
- [ ] Quick actions: edit, delete, change status
- [ ] Progress indicator
- [ ] Assigned team member badge

#### 4. Create Team Management Components

**Update File**: `app/dashboard/projects/[id]/page.tsx` (Team Tab)
- [ ] List project team members with roles
- [ ] "Add Team Member" button
- [ ] Modal to select from global team members
- [ ] Role assignment dropdown
- [ ] Remove team member functionality

**New File**: `components/projects/add-team-member-dialog.tsx`
- [ ] Fetch available team members (not yet in project)
- [ ] Multi-select or single select
- [ ] Role in project input
- [ ] Use `projectTeamMembersService.addTeamMemberToProject()`

#### 5. Create Resource Management Components

**New File**: `app/dashboard/resources/page.tsx` (Resource Catalog)
- [ ] List all global resources
- [ ] Create new resource form
- [ ] Edit/delete resources
- [ ] Show "Assigned to X projects" indicator
- [ ] Use `resourcesCatalogService`

**Update File**: `app/dashboard/projects/[id]/page.tsx` (Resources Tab)
- [ ] List assigned resources with quantities and dates
- [ ] "Assign Resource" button
- [ ] Resource assignment modal (select resource, quantity, dates)
- [ ] Resource cost summary
- [ ] Remove resource assignment
- [ ] Use `projectResourcesService`

**New File**: `components/projects/assign-resource-dialog.tsx`
- [ ] Select resource from catalog
- [ ] Quantity input
- [ ] Date range picker (allocated_from, allocated_to)
- [ ] Cost preview
- [ ] Validation: no overlapping assignments (optional)

#### 6. Update Documents Management

**Update File**: `app/dashboard/documents/page.tsx`
- [ ] Add project filter dropdown
- [ ] Show project name for each document
- [ ] Filter by project_id

**Update File**: `app/dashboard/projects/[id]/page.tsx` (Documents Tab)
- [ ] List only documents for this project
- [ ] Upload document with project_id set
- [ ] Use `documentsService.createDocument()` with `project_id`

#### 7. Create Constraints Management

**Update File**: `app/dashboard/projects/[id]/page.tsx` (Constraints Tab)
- [ ] List assigned constraints with details
- [ ] "Add Constraint" button
- [ ] Modal to select from constraints master
- [ ] Optional details/notes field
- [ ] Remove constraint
- [ ] Use `constraintsService`

**New File**: `components/projects/add-constraint-dialog.tsx`
- [ ] Fetch constraints master list
- [ ] Multi-select checkboxes
- [ ] Details textarea (optional)
- [ ] Use `constraintsService.assignConstraintToProject()`

#### 8. Create Budget Management

**Update File**: `app/dashboard/projects/[id]/page.tsx` (Budget Tab)
- [ ] List budget categories with planned vs actual
- [ ] Create budget category
- [ ] Add expense to category
- [ ] Expense list with filtering
- [ ] Budget summary chart
- [ ] Use `budgetCategoriesService` and `expensesService`

**New File**: `components/projects/budget-summary.tsx`
- [ ] Visual budget breakdown
- [ ] Planned vs actual comparison
- [ ] Category-wise breakdown
- [ ] Over/under budget indicators

**New File**: `components/projects/add-expense-dialog.tsx`
- [ ] Select budget category
- [ ] Description input
- [ ] Amount input
- [ ] Date picker
- [ ] Optional resource link
- [ ] Use `expensesService.createExpense()`

---

### Priority 2: Enhanced Features

#### 9. State Management
- [ ] Consider using Zustand or React Context for project state
- [ ] Cache project details to avoid refetching
- [ ] Optimistic updates for better UX

#### 10. Validation & Error Handling
- [ ] Add comprehensive form validation
- [ ] Show user-friendly error messages
- [ ] Handle network errors gracefully
- [ ] Validate dates, quantities, amounts

#### 11. UI/UX Improvements
- [ ] Loading states for all async operations
- [ ] Empty states for lists
- [ ] Success/error toasts
- [ ] Confirmation dialogs for destructive actions
- [ ] Responsive design for mobile

---

## 📋 Database Migration Steps

1. **Backup your database** (if you have existing data)
2. **Run the migration script**:
   - Go to Supabase Dashboard → SQL Editor
   - Copy contents of `supabase-migration-extended-schema.sql`
   - Paste and run
3. **Verify tables were created**:
   - Check Table Editor in Supabase
   - Verify RLS policies are enabled
   - Check that constraints_master has 10 seeded rows

---

## 🔍 Testing Checklist

### Backend Testing
- [ ] Test project creation with constraints
- [ ] Test project details fetch (all related data)
- [ ] Test task creation with validation
- [ ] Test resource assignment
- [ ] Test team member assignment
- [ ] Test constraint assignment
- [ ] Test budget category creation
- [ ] Test expense creation (verify budget auto-update)
- [ ] Test RLS policies (users can only see their own data)

### Frontend Testing
- [ ] Project creation with all new fields
- [ ] Project details page loads all tabs
- [ ] Task creation and management
- [ ] Team member assignment
- [ ] Resource catalog and assignment
- [ ] Document upload with project_id
- [ ] Constraint assignment
- [ ] Budget and expense management
- [ ] All CRUD operations work correctly

---

## 🚀 Quick Start Guide

### 1. Run Database Migration
```sql
-- In Supabase SQL Editor, run:
-- Copy and paste contents of supabase-migration-extended-schema.sql
```

### 2. Update Your Code
```typescript
// Import new services
import {
  projectDetailsService,
  projectTeamMembersService,
  resourcesCatalogService,
  projectResourcesService,
  constraintsService,
  budgetCategoriesService,
  expensesService,
  enhancedProjectsService
} from '@/lib/data-service'

// Use in your components
const projectDetails = await projectDetailsService.getProjectDetails(projectId)
```

### 3. Start with Project Details Page
- Update `app/dashboard/projects/[id]/page.tsx` to use `projectDetailsService`
- Add tabs for new features
- Implement one tab at a time

---

## 📚 API Reference

### Project Details (Comprehensive)
```typescript
const details = await projectDetailsService.getProjectDetails(projectId)
// Returns: { project, team_members, tasks, resources, assigned_resources, constraints, documents, budget_categories, expenses }
```

### Create Project with Constraints
```typescript
const project = await enhancedProjectsService.createProjectWithConstraints(
  projectData,
  ['constraint-id-1', 'constraint-id-2']
)
```

### Task Management
```typescript
// Create task
await tasksService.createTask({
  project_id: '...',
  title: 'Task Title',
  description: '...',
  priority: 'high',
  status: 'todo',
  assigned_to: 'team-member-id',
  start_date: '2024-01-01',
  end_date: '2024-01-05'
})

// Get tasks
const tasks = await tasksService.getTasks(projectId)
```

### Resource Management
```typescript
// Create global resource
await resourcesCatalogService.createResource({
  name: 'Cement',
  type: 'material',
  unit: 'kg',
  base_cost: 0.5
})

// Assign to project
await projectResourcesService.assignResourceToProject({
  project_id: '...',
  resource_id: '...',
  quantity: 1000,
  allocated_from: '2024-01-01',
  allocated_to: '2024-01-31'
})
```

### Team Management
```typescript
// Add team member to project
await projectTeamMembersService.addTeamMemberToProject(
  projectId,
  teamMemberId,
  'Project Manager'
)
```

### Budget Management
```typescript
// Create budget category
await budgetCategoriesService.createBudgetCategory({
  project_id: '...',
  name: 'Materials',
  planned_amount: 50000
})

// Add expense
await expensesService.createExpense({
  project_id: '...',
  category_id: '...',
  description: 'Cement purchase',
  amount: 5000,
  date: '2024-01-15'
})
// Note: actual_amount in budget_category is automatically updated
```

---

## ⚠️ Important Notes

1. **Data Migration**: If you have existing data, you may need to migrate it:
   - Existing tasks may need to be updated (name → title)
   - Existing resources may need to be converted to the new schema
   - Documents may need project_id assigned

2. **Backward Compatibility**: 
   - Documents table has nullable `project_id` for backward compatibility
   - Old project constraints in JSONB are still accessible but new ones use the normalized table

3. **Performance**:
   - The `projectDetailsService.getProjectDetails()` makes multiple queries in parallel
   - Consider caching for frequently accessed projects
   - Indexes are already created for optimal performance

4. **Validation**:
   - Task dates must be within project dates
   - Assigned team members must be in project team
   - Resource quantities must be positive
   - Expense amounts must be positive

---

## 🎯 Next Steps

1. **Run the database migration** (Priority 1)
2. **Update project creation dialog** (Priority 1)
3. **Update project details page** to use new service (Priority 1)
4. **Implement Tasks tab** with Kanban board (Priority 1)
5. **Implement Team tab** (Priority 1)
6. **Implement Resources tab** (Priority 1)
7. **Implement remaining tabs** (Priority 2)
8. **Add state management** (Priority 2)
9. **Testing and bug fixes** (Priority 2)

---

*This guide provides a complete roadmap for implementing the extended database schema. Follow the priorities and check off items as you complete them.*

