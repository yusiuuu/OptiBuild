import { supabase } from './supabase'

// Data service layer for OptiBuild application
// Provides centralized data management for all construction-related entities

// Type definitions for all application entities

// Project entity representing construction projects (Enhanced)
export interface Project {
  id?: string
  user_id?: string
  name: string
  location?: string
  type?: string
  status: string
  start_date?: string
  end_date?: string
  budget?: number
  progress: number
  description?: string
  // Enhanced project setup fields
  area_sqft?: number
  total_area?: number      // NEW: Alternative name
  structure_type?: string
  floors?: number
  building_height?: number // NEW
  constraints?: Record<string, any>
  project_requirements?: Record<string, any>
  created_at?: string
  updated_at?: string
}

// Constraint Master entity
export interface ConstraintMaster {
  id?: string
  name: string
  description?: string
  category?: string
  created_at?: string
}

// Project Constraint entity
export interface ProjectConstraint {
  id?: string
  project_id: string
  constraint_id: string
  details?: string
  created_at?: string
}

// Budget Category entity
export interface BudgetCategory {
  id?: string
  project_id: string
  name: string
  planned_amount: number
  actual_amount?: number
  created_at?: string
  updated_at?: string
}

// Expense entity
export interface Expense {
  id?: string
  project_id: string
  category_id: string
  user_id?: string
  description: string
  amount: number
  date: string
  resource_id?: string
  created_at?: string
  updated_at?: string
}

// Project Team Member Assignment entity
export interface ProjectTeamMember {
  id?: string
  project_id: string
  team_member_id: string
  role_in_project?: string
  added_at?: string
  created_at?: string
  updated_at?: string
}

// Comprehensive Project Details (for /projects/:id/full endpoint)
export interface ProjectDetails {
  project: Project
  team_members: (ProjectTeamMember & { team_member: TeamMember })[]
  tasks: Task[]
  resources: Resource[]
  assigned_resources: (ProjectResource & { resource: Resource })[]
  constraints: (ProjectConstraint & { constraint: ConstraintMaster })[]
  documents: Document[]
  budget_categories: BudgetCategory[]
  expenses: Expense[]
}

// Team member entity for project team management
export interface TeamMember {
  id?: string
  user_id?: string
  name: string
  role?: string
  department?: string
  contact?: string
  email?: string
  created_at?: string
  updated_at?: string
}

// Certification entity for team member qualifications
export interface Certification {
  id?: string
  user_id?: string
  name: string
  issuer?: string
  issue_date?: string
  valid_until?: string
  created_at?: string
  updated_at?: string
}

// Document entity for project file management (Updated with project_id)
export interface Document {
  id?: string
  user_id?: string
  project_id?: string  // NEW: Link to project
  name: string
  type?: string
  size?: string
  file_url?: string
  uploaded_at?: string
  created_at?: string
}

// Task entity for project scheduling (Updated schema)
export interface Task {
  id?: string
  project_id?: string
  user_id?: string
  title: string  // Changed from 'name' to 'title'
  description?: string
  start_date?: string
  end_date?: string
  progress: number
  status: 'todo' | 'ongoing' | 'done' | 'blocked'
  priority: 'low' | 'medium' | 'high'
  assigned_to?: string  // UUID of project_team_members.id (not team_members.id directly)
  created_at?: string
  updated_at?: string
}

// Resource entity for global resource catalog
export interface Resource {
  id?: string
  user_id?: string
  name: string
  type: 'material' | 'labour' | 'equipment'
  unit: string  // kg, hr, item, etc.
  base_cost: number
  description?: string
  created_at?: string
  updated_at?: string
}

// Project Resource Assignment entity
export interface ProjectResource {
  id?: string
  project_id: string
  resource_id: string
  quantity: number
  allocated_from: string  // DATE
  allocated_to: string    // DATE
  total_cost?: number     // Computed field
  created_at?: string
  updated_at?: string
}

// Optimization result entity for storing GA and ML results
export interface OptimizationResult {
  id?: string
  project_id?: string
  user_id?: string
  optimization_type: string
  algorithm_used: string
  input_parameters: Record<string, any>
  results: Record<string, any>
  performance_metrics?: Record<string, any>
  created_at?: string
}

// What-if scenario entity for scenario analysis
export interface WhatIfScenario {
  id?: string
  project_id?: string
  user_id?: string
  scenario_name: string
  scenario_type: string
  parameters: Record<string, any>
  results: Record<string, any>
  impact_analysis?: Record<string, any>
  created_at?: string
}

// Report entity for generated reports
export interface Report {
  id?: string
  project_id?: string
  user_id?: string
  report_name: string
  report_type: string
  report_data: Record<string, any>
  file_url?: string
  generated_at?: string
}

// Projects Management Service
// Handles all CRUD operations for construction projects
export const projectsService = {
  // Retrieve all projects for the current authenticated user
  // Returns projects ordered by creation date (newest first)
  async getProjects() {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  // Create a new construction project
  // Omits auto-generated fields (id, created_at, updated_at)
  async createProject(project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) {
    // Ensure user_id is set from the current authenticated user to satisfy RLS
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError

    const payload = {
      ...project,
      user_id: project.user_id || userData.user?.id,
    }

    const { data, error } = await supabase
      .from('projects')
      .insert([payload])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Update an existing project with new information
  // Automatically updates the updated_at timestamp
  async updateProject(id: string, updates: Partial<Project>) {
    const { data, error } = await supabase
      .from('projects')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Permanently delete a project and all associated data
  async deleteProject(id: string) {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Team Members Management Service
// Handles all CRUD operations for project team members
export const teamMembersService = {
  // Retrieve all team members for the current user
  // Returns members ordered by creation date (newest first)
  async getTeamMembers() {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  // Add a new team member to the project team
  // Omits auto-generated fields (id, created_at, updated_at)
  async createTeamMember(member: Omit<TeamMember, 'id' | 'created_at' | 'updated_at'>) {
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError

    const payload = {
      ...member,
      user_id: member.user_id || userData.user?.id,
    }

    const { data, error } = await supabase
      .from('team_members')
      .insert([payload])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Update existing team member information
  // Automatically updates the updated_at timestamp
  async updateTeamMember(id: string, updates: Partial<TeamMember>) {
    const { data, error } = await supabase
      .from('team_members')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Remove a team member from the project team
  async deleteTeamMember(id: string) {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Certifications Management Service
// Handles all CRUD operations for team member certifications
export const certificationsService = {
  // Retrieve all certifications for the current user
  // Returns certifications ordered by creation date (newest first)
  async getCertifications() {
    const { data, error } = await supabase
      .from('certifications')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  // Add a new certification for a team member
  // Omits auto-generated fields (id, created_at, updated_at)
  async createCertification(certification: Omit<Certification, 'id' | 'created_at' | 'updated_at'>) {
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError

    const payload = {
      ...certification,
      user_id: certification.user_id || userData.user?.id,
    }

    const { data, error } = await supabase
      .from('certifications')
      .insert([payload])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Update existing certification information
  // Automatically updates the updated_at timestamp
  async updateCertification(id: string, updates: Partial<Certification>) {
    const { data, error } = await supabase
      .from('certifications')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Remove a certification record
  async deleteCertification(id: string) {
    const { error } = await supabase
      .from('certifications')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Documents Management Service
// Handles all CRUD operations for project documents and files
export const documentsService = {
  // Retrieve all documents for the current user
  // Returns documents ordered by creation date (newest first)
  async getDocuments() {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  // Upload and create a new document record
  // Omits auto-generated fields (id, created_at)
  async createDocument(document: Omit<Document, 'id' | 'created_at'>) {
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError

    const payload = {
      ...document,
      user_id: document.user_id || userData.user?.id,
    }

    const { data, error } = await supabase
      .from('documents')
      .insert([payload])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Update existing document metadata
  async updateDocument(id: string, updates: Partial<Document>) {
    const { data, error } = await supabase
      .from('documents')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Remove a document record and associated file
  async deleteDocument(id: string) {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Tasks Management Service (Updated schema)
// Handles all CRUD operations for project tasks
export const tasksService = {
  // Retrieve all tasks for a specific project
  async getTasks(projectId: string) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('start_date', { ascending: true })
    
    if (error) throw error
    
    // Map 'name' to 'title' for interface compatibility
    // Database may use 'name', but Task interface uses 'title'
    const tasks = (data || []).map((task: any) => ({
      ...task,
      title: task.title || task.name, // Support both 'name' and 'title'
    }))
    
    // Load project_team_members details for assigned tasks
    // assigned_to now references project_team_members.id
    const assignedProjectTeamMemberIds = tasks
      .map((t: any) => t.assigned_to)
      .filter(Boolean)
    
    if (assignedProjectTeamMemberIds.length > 0) {
      // Load project_team_members
      const { data: projectTeamMembers } = await supabase
        .from('project_team_members')
        .select('*')
        .in('id', assignedProjectTeamMemberIds)
      
      // Load team_members for those project_team_members
      const teamMemberIds = projectTeamMembers?.map((ptm: any) => ptm.team_member_id).filter(Boolean) || []
      let teamMembers: any[] = []
      
      if (teamMemberIds.length > 0) {
        const { data: tmData } = await supabase
          .from('team_members')
          .select('*')
          .in('id', teamMemberIds)
        teamMembers = tmData || []
      }
      
      // Map project_team_members and team_members to tasks
      return tasks.map((task: any) => {
        if (task.assigned_to) {
          const ptm = projectTeamMembers?.find((ptm: any) => ptm.id === task.assigned_to)
          const teamMember = ptm ? teamMembers.find((tm: any) => tm.id === ptm.team_member_id) : null
          return {
            ...task,
            assigned_project_team_member: ptm || null,
            assigned_team_member: teamMember || null
          }
        }
        return task
      })
    }
    
    return tasks
  },

  // Create a new task
  async createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) {
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError

    // Validate dates are within project dates
    if (task.start_date && task.end_date) {
      const { data: project } = await supabase
        .from('projects')
        .select('start_date, end_date')
        .eq('id', task.project_id)
        .single()
      
      if (project) {
        if (project.start_date && task.start_date < project.start_date) {
          throw new Error('Task start date cannot be before project start date')
        }
        if (project.end_date && task.end_date > project.end_date) {
          throw new Error('Task end date cannot be after project end date')
        }
      }
    }

    // Handle assigned_to: It should be a project_team_members.id
    // Validate that the project_team_member belongs to this project
    let assignedToProjectTeamId: string | undefined = undefined
    
    if (task.assigned_to) {
      // Validate that the project_team_member exists and belongs to this project
      const { data: projectTeamMember, error: ptmError } = await supabase
        .from('project_team_members')
        .select('id, project_id')
        .eq('id', task.assigned_to)
        .eq('project_id', task.project_id)
        .single()
      
      if (ptmError || !projectTeamMember) {
        throw new Error('Assigned team member must be part of the project team. Please add them to the project team first.')
      }
      
      // Use the project_team_members.id (already validated)
      assignedToProjectTeamId = task.assigned_to
    }

    // Map 'title' to database column - handle both schema versions
    // Migration schema uses 'title', base schema uses 'name'
    // Use project_team_members.id for assigned_to instead of team_member_id
    const { title, assigned_to, ...restTask } = task
    const payload: any = {
      ...restTask,
      title: title, // Use 'title' (migration schema)
      assigned_to: assignedToProjectTeamId, // Use project_team_members.id
      user_id: task.user_id || userData.user?.id,
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert([payload])
      .select('*')
      .single()
    
    if (error) {
      // Check if error is due to column not found - try alternative schema
      if (error.code === '42703' || error.message?.includes('column') || error.message?.includes('does not exist')) {
        // Try with only 'name' (base schema)
        const { title: _, ...restTask2 } = task
        const payload2: any = {
          ...restTask2,
          name: title, // Use 'name' for base schema
          user_id: task.user_id || userData.user?.id,
        }
        
        const { data: data2, error: error2 } = await supabase
          .from('tasks')
          .insert([payload2])
          .select('*')
          .single()
        
        if (error2) {
          // Both failed, return the original error with better message
          const errorMessage = error2.message || error2.details || error2.hint || 'Unknown database error'
          const enhancedError = new Error(errorMessage)
          if (error2.code) (enhancedError as any).code = error2.code
          if (error2.details) (enhancedError as any).details = error2.details
          if (error2.hint) (enhancedError as any).hint = error2.hint
          throw enhancedError
        }
        
        // Success with 'name' schema - map response
        if (data2) {
          return {
            ...data2,
            title: (data2 as any).name || (data2 as any).title,
          }
        }
        return data2
      }
      
      // Other error - extract and enhance
      let errorMessage = 'Unknown database error'
      if (error.message) {
        errorMessage = String(error.message)
      } else if (error.details) {
        errorMessage = typeof error.details === 'string' ? error.details : JSON.stringify(error.details)
      } else if (error.hint) {
        errorMessage = String(error.hint)
      }
      
      const enhancedError = new Error(errorMessage)
      if (error.code) (enhancedError as any).code = error.code
      if (error.details) (enhancedError as any).details = error.details
      if (error.hint) (enhancedError as any).hint = error.hint
      throw enhancedError
    }
    
    // Map response to Task interface (handle both 'name' and 'title' columns)
    if (data) {
      return {
        ...data,
        title: (data as any).title || (data as any).name,
      }
    }
    return data
  },

  // Update an existing task
  async updateTask(id: string, updates: Partial<Task>) {
    // Handle both 'title' and 'name' columns
    const updatePayload: any = { ...updates }
    
    // If updating title, try to update both columns for compatibility
    if (updates.title !== undefined) {
      updatePayload.title = updates.title
      updatePayload.name = updates.title // Also set name for base schema compatibility
    }
    
    // Handle assigned_to: Validate it's a project_team_members.id for this project
    if (updates.assigned_to !== undefined) {
      // Get the task to find its project_id
      const { data: existingTask } = await supabase
        .from('tasks')
        .select('project_id')
        .eq('id', id)
        .single()
      
      if (existingTask && updates.assigned_to) {
        // Validate that the project_team_member belongs to this project
        const { data: projectTeamMember, error: ptmError } = await supabase
          .from('project_team_members')
          .select('id, project_id')
          .eq('id', updates.assigned_to)
          .eq('project_id', existingTask.project_id)
          .single()
        
        if (ptmError || !projectTeamMember) {
          throw new Error('Assigned team member must be part of the project team.')
        }
      }
      // assigned_to is already a project_team_members.id, use it directly
      updatePayload.assigned_to = updates.assigned_to
    }
    
    const { data, error } = await supabase
      .from('tasks')
      .update({ ...updatePayload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single()
    
    if (error) {
      // If error is due to column not found, try with only the column that exists
      if (error.code === '42703' || error.message?.includes('column')) {
        // Try with only 'name' if 'title' failed
        const updatePayload2: any = { ...updates }
        if (updates.title !== undefined) {
          updatePayload2.name = updates.title
          delete updatePayload2.title
        }
        
        const { data: data2, error: error2 } = await supabase
          .from('tasks')
          .update({ ...updatePayload2, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select('*')
          .single()
        
        if (error2) throw error2
        
        if (data2) {
          return {
            ...data2,
            title: (data2 as any).name || (data2 as any).title,
          }
        }
        return data2
      }
      throw error
    }
    
    // Map response to Task interface
    if (data) {
      return {
        ...data,
        title: (data as any).title || (data as any).name,
      }
    }
    return data
  },

  // Delete a task
  async deleteTask(id: string) {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Resources Management Service
// Handles all CRUD operations for project resources
export const resourcesService = {
  // Retrieve all resources for a specific project
  async getResources(projectId: string) {
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  // Create a new resource
  async createResource(resource: Omit<Resource, 'id' | 'created_at' | 'updated_at'>) {
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError

    const payload = {
      ...resource,
      user_id: resource.user_id || userData.user?.id,
    }

    const { data, error } = await supabase
      .from('resources')
      .insert([payload])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Update an existing resource
  async updateResource(id: string, updates: Partial<Resource>) {
    const { data, error } = await supabase
      .from('resources')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Delete a resource
  async deleteResource(id: string) {
    const { error } = await supabase
      .from('resources')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Optimization Results Service
// Handles storage and retrieval of optimization results
export const optimizationService = {
  // Retrieve optimization results for a project
  async getOptimizationResults(projectId: string) {
    const { data, error } = await supabase
      .from('optimization_results')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  // Store optimization results
  async createOptimizationResult(result: Omit<OptimizationResult, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('optimization_results')
      .insert([result])
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}

// What-If Scenarios Service
// Handles scenario analysis and storage
export const scenariosService = {
  // Retrieve scenarios for a project
  async getScenarios(projectId: string) {
    const { data, error } = await supabase
      .from('what_if_scenarios')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  // Create a new scenario
  async createScenario(scenario: Omit<WhatIfScenario, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('what_if_scenarios')
      .insert([scenario])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Delete a scenario
  async deleteScenario(id: string) {
    const { error } = await supabase
      .from('what_if_scenarios')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Reports Service
// Handles report generation and storage
export const reportsService = {
  // Retrieve reports for a project
  async getReports(projectId: string) {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('project_id', projectId)
      .order('generated_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  // Create a new report
  async createReport(report: Omit<Report, 'id' | 'generated_at'>) {
    const { data, error } = await supabase
      .from('reports')
      .insert([report])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Delete a report
  async deleteReport(id: string) {
    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// ============================================================================
// NEW SERVICES FOR EXTENDED SCHEMA
// ============================================================================

// Project Team Members Service (Many-to-Many)
export const projectTeamMembersService = {
  // Get all team members assigned to a project
  async getProjectTeamMembers(projectId: string) {
    const { data, error } = await supabase
      .from('project_team_members')
      .select('*')
      .eq('project_id', projectId)
      .order('added_at', { ascending: false })
    
    if (error) throw error
    
    // Load team member details separately to avoid relationship join issues
    const teamMemberIds = (data || []).map(ptm => ptm.team_member_id).filter(Boolean)
    if (teamMemberIds.length > 0) {
      const { data: teamMembers } = await supabase
        .from('team_members')
        .select('*')
        .in('id', teamMemberIds)
      
      // Map team members to project team members
      return (data || []).map(ptm => ({
        ...ptm,
        team_member: teamMembers?.find(tm => tm.id === ptm.team_member_id) || null
      }))
    }
    
    return (data || []).map(ptm => ({ ...ptm, team_member: null }))
  },

  // Add team member to project
  async addTeamMemberToProject(projectId: string, teamMemberId: string, roleInProject?: string) {
    const { data, error } = await supabase
      .from('project_team_members')
      .insert([{
        project_id: projectId,
        team_member_id: teamMemberId,
        role_in_project: roleInProject
      }])
      .select('*')
      .single()
    
    if (error) throw error
    
    // Load team member details separately
    if (data) {
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('*')
        .eq('id', teamMemberId)
        .single()
      
      return {
        ...data,
        team_member: teamMember || null
      }
    }
    
    return data
    
    if (error) throw error
    return data
  },

  // Remove team member from project
  async removeTeamMemberFromProject(projectId: string, teamMemberId: string) {
    const { error } = await supabase
      .from('project_team_members')
      .delete()
      .eq('project_id', projectId)
      .eq('team_member_id', teamMemberId)
    
    if (error) throw error
  },

  // Update role in project
  async updateProjectTeamMemberRole(projectId: string, teamMemberId: string, roleInProject: string) {
    const { data, error } = await supabase
      .from('project_team_members')
      .update({ role_in_project: roleInProject, updated_at: new Date().toISOString() })
      .eq('project_id', projectId)
      .eq('team_member_id', teamMemberId)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}

// Resources Catalog Service (Global Resources)
export const resourcesCatalogService = {
  // Get all global resources for user
  async getResources() {
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  // Create global resource
  async createResource(resource: Omit<Resource, 'id' | 'created_at' | 'updated_at'>) {
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError

    const payload = {
      ...resource,
      user_id: resource.user_id || userData.user?.id,
    }

    const { data, error } = await supabase
      .from('resources')
      .insert([payload])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Update resource
  async updateResource(id: string, updates: Partial<Resource>) {
    const { data, error } = await supabase
      .from('resources')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Delete resource
  async deleteResource(id: string) {
    const { error } = await supabase
      .from('resources')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  // Get projects where resource is assigned
  async getResourceProjects(resourceId: string) {
    const { data, error } = await supabase
      .from('project_resources')
      .select(`
        *,
        project:projects(*)
      `)
      .eq('resource_id', resourceId)
    
    if (error) throw error
    return data || []
  }
}

// Project Resources Service (Resource Assignments)
export const projectResourcesService = {
  // Get all resources assigned to a project
  async getProjectResources(projectId: string) {
    const { data, error } = await supabase
      .from('project_resources')
      .select('*')
      .eq('project_id', projectId)
      .order('allocated_from', { ascending: true })
    
    if (error) throw error
    
    // Load resource details separately to avoid relationship join issues
    if (data && data.length > 0) {
      const resourceIds = data.map((pr: any) => pr.resource_id).filter(Boolean)
      if (resourceIds.length > 0) {
        const { data: resources } = await supabase
          .from('resources')
          .select('*')
          .in('id', resourceIds)
        
        // Map resources to project resources
        return (data || []).map((pr: any) => ({
          ...pr,
          resource: resources?.find((r: any) => r.id === pr.resource_id) || null
        }))
      }
    }
    
    return (data || []).map((pr: any) => ({ ...pr, resource: null }))
  },

  // Assign resource to project
  async assignResourceToProject(assignment: Omit<ProjectResource, 'id' | 'total_cost' | 'created_at' | 'updated_at'>) {
    // Validate required fields
    if (!assignment.project_id) {
      throw new Error('Project ID is required')
    }
    if (!assignment.resource_id) {
      throw new Error('Resource ID is required')
    }
    if (!assignment.quantity || assignment.quantity <= 0) {
      throw new Error('Quantity must be greater than 0')
    }
    if (!assignment.allocated_from || !assignment.allocated_to) {
      throw new Error('Allocation dates are required')
    }
    if (new Date(assignment.allocated_to) < new Date(assignment.allocated_from)) {
      throw new Error('End date must be after start date')
    }

    // Prepare payload - ensure we only send valid fields
    const payload = {
      project_id: assignment.project_id,
      resource_id: assignment.resource_id,
      quantity: assignment.quantity,
      allocated_from: assignment.allocated_from,
      allocated_to: assignment.allocated_to,
      // Don't include total_cost - it's a generated column
    }

    const { data, error } = await supabase
      .from('project_resources')
      .insert([payload])
      .select('*')
      .single()
    
    if (error) {
      // Create enhanced error with all available information
      const errorMessage = error.message || error.details || error.hint || 'Unknown database error'
      const enhancedError = new Error(errorMessage)
      // Preserve original error properties
      ;(enhancedError as any).code = error.code
      ;(enhancedError as any).details = error.details
      ;(enhancedError as any).hint = error.hint
      ;(enhancedError as any).originalError = error
      throw enhancedError
    }
    
    // Load resource details separately to avoid relationship join issues
    if (data && data.resource_id) {
      const { data: resource } = await supabase
        .from('resources')
        .select('*')
        .eq('id', data.resource_id)
        .single()
      
      return {
        ...data,
        resource: resource || null
      }
    }
    
    return data
  },

  // Update resource assignment
  async updateResourceAssignment(id: string, updates: Partial<ProjectResource>) {
    const { data, error } = await supabase
      .from('project_resources')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(`
        *,
        resource:resources(*)
      `)
      .single()
    
    if (error) throw error
    return data
  },

  // Remove resource from project
  async removeResourceFromProject(id: string) {
    const { error } = await supabase
      .from('project_resources')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Constraints Service
export const constraintsService = {
  // Get all available constraints (master list)
  async getConstraintsMaster() {
    const { data, error } = await supabase
      .from('constraints_master')
      .select('*')
      .order('name', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  // Get constraints assigned to a project
  async getProjectConstraints(projectId: string) {
    const { data, error } = await supabase
      .from('project_constraints')
      .select(`
        *,
        constraint:constraints_master(*)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  // Assign constraint to project
  async assignConstraintToProject(projectId: string, constraintId: string, details?: string) {
    const { data, error } = await supabase
      .from('project_constraints')
      .insert([{
        project_id: projectId,
        constraint_id: constraintId,
        details
      }])
      .select(`
        *,
        constraint:constraints_master(*)
      `)
      .single()
    
    if (error) throw error
    return data
  },

  // Remove constraint from project
  async removeConstraintFromProject(projectId: string, constraintId: string) {
    const { error } = await supabase
      .from('project_constraints')
      .delete()
      .eq('project_id', projectId)
      .eq('constraint_id', constraintId)
    
    if (error) throw error
  },

  // Update constraint details
  async updateProjectConstraint(projectId: string, constraintId: string, details: string) {
    const { data, error } = await supabase
      .from('project_constraints')
      .update({ details })
      .eq('project_id', projectId)
      .eq('constraint_id', constraintId)
      .select(`
        *,
        constraint:constraints_master(*)
      `)
      .single()
    
    if (error) throw error
    return data
  }
}

// Budget Categories Service
export const budgetCategoriesService = {
  // Get budget categories for a project
  async getProjectBudgetCategories(projectId: string) {
    const { data, error } = await supabase
      .from('budget_categories')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  // Create budget category
  async createBudgetCategory(category: Omit<BudgetCategory, 'id' | 'actual_amount' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('budget_categories')
      .insert([category])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Update budget category
  async updateBudgetCategory(id: string, updates: Partial<BudgetCategory>) {
    const { data, error } = await supabase
      .from('budget_categories')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Delete budget category
  async deleteBudgetCategory(id: string) {
    const { error } = await supabase
      .from('budget_categories')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Expenses Service
export const expensesService = {
  // Get expenses for a project
  async getProjectExpenses(projectId: string) {
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        category:budget_categories(*),
        resource:resources(*)
      `)
      .eq('project_id', projectId)
      .order('date', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  // Get expenses by category
  async getExpensesByCategory(categoryId: string) {
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        resource:resources(*)
      `)
      .eq('category_id', categoryId)
      .order('date', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  // Create expense
  async createExpense(expense: Omit<Expense, 'id' | 'created_at' | 'updated_at'>) {
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError

    const payload = {
      ...expense,
      user_id: expense.user_id || userData.user?.id,
    }

    const { data, error } = await supabase
      .from('expenses')
      .insert([payload])
      .select(`
        *,
        category:budget_categories(*),
        resource:resources(*)
      `)
      .single()
    
    if (error) throw error
    return data
  },

  // Update expense
  async updateExpense(id: string, updates: Partial<Expense>) {
    const { data, error } = await supabase
      .from('expenses')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(`
        *,
        category:budget_categories(*),
        resource:resources(*)
      `)
      .single()
    
    if (error) throw error
    return data
  },

  // Delete expense
  async deleteExpense(id: string) {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// ============================================================================
// COMPREHENSIVE PROJECT DETAILS SERVICE
// ============================================================================

// Get full project details with all related data
export const projectDetailsService = {
  async getProjectDetails(projectId: string): Promise<ProjectDetails> {
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError) {
      const error = new Error(`Authentication error: ${userError.message}`)
      ;(error as any).code = userError.status
      throw error
    }

    if (!userData.user?.id) {
      throw new Error('User not authenticated')
    }

    // Get project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()
    
    if (projectError) {
      const error = new Error(projectError.message || 'Failed to load project')
      ;(error as any).code = projectError.code
      ;(error as any).details = projectError
      throw error
    }
    
    if (!project) {
      const error = new Error('Project not found')
      ;(error as any).code = 'PGRST116'
      throw error
    }

    // Helper function to safely fetch data with error handling
    const safeFetch = async <T>(
      query: Promise<{ data: T | null; error: any }>,
      fallback: T = [] as any
    ): Promise<T> => {
      try {
        const result = await query
        if (result.error) {
          // Log error but don't throw - return empty array instead
          // This allows the page to load even if some tables don't exist yet
          console.warn('Error fetching related data:', result.error)
          return fallback
        }
        return result.data || fallback
      } catch (error) {
        console.warn('Error in safe fetch:', error)
        return fallback
      }
    }

    // Get all related data in parallel with safe error handling
    const [
      teamMembersData,
      tasksData,
      resourcesData,
      assignedResourcesData,
      constraintsData,
      documentsData,
      budgetCategoriesData,
      expensesData
    ] = await Promise.all([
      // Team members (without relationship join to avoid schema issues)
      safeFetch(
        supabase
          .from('project_team_members')
          .select('*')
          .eq('project_id', projectId)
      ),
      
      // Tasks (map name to title for interface compatibility)
      safeFetch(
        supabase
          .from('tasks')
          .select('*')
          .eq('project_id', projectId)
          .order('start_date', { ascending: true })
      ),
      
      // Global resources (user's catalog)
      safeFetch(
        supabase
          .from('resources')
          .select('*')
          .eq('user_id', userData.user.id)
      ),
      
      // Assigned resources (without relationship join)
      safeFetch(
        supabase
          .from('project_resources')
          .select('*')
          .eq('project_id', projectId)
      ),
      
      // Constraints (without relationship join)
      safeFetch(
        supabase
          .from('project_constraints')
          .select('*')
          .eq('project_id', projectId)
      ),
      
      // Documents
      safeFetch(
        supabase
          .from('documents')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
      ),
      
      // Budget categories
      safeFetch(
        supabase
          .from('budget_categories')
          .select('*')
          .eq('project_id', projectId)
      ),
      
      // Expenses (without relationship joins)
      safeFetch(
        supabase
          .from('expenses')
          .select('*')
          .eq('project_id', projectId)
          .order('date', { ascending: false })
      )
    ])

    // Load related data separately to avoid relationship join issues
    // Load team member details
    const teamMemberIds = (teamMembersData || []).map((ptm: any) => ptm.team_member_id).filter(Boolean)
    let teamMembersWithDetails = teamMembersData || []
    if (teamMemberIds.length > 0) {
      const { data: teamMembers } = await supabase
        .from('team_members')
        .select('*')
        .in('id', teamMemberIds)
      
      teamMembersWithDetails = (teamMembersData || []).map((ptm: any) => ({
        ...ptm,
        team_member: teamMembers?.find((tm: any) => tm.id === ptm.team_member_id) || null
      }))
    }

    // Map tasks to include title (handle both name and title columns)
    // Also load project_team_members for assigned tasks
    const tasksWithTitle = (tasksData || []).map((task: any) => ({
      ...task,
      title: task.title || task.name
    }))
    
    // Load project_team_members for assigned tasks
    const assignedProjectTeamMemberIds = tasksWithTitle
      .map((t: any) => t.assigned_to)
      .filter(Boolean)
    
    let tasksWithTeamMembers = tasksWithTitle
    if (assignedProjectTeamMemberIds.length > 0) {
      const { data: projectTeamMembers } = await supabase
        .from('project_team_members')
        .select('*')
        .in('id', assignedProjectTeamMemberIds)
      
      const teamMemberIdsForTasks = projectTeamMembers?.map((ptm: any) => ptm.team_member_id).filter(Boolean) || []
      let teamMembersForTasks: any[] = []
      
      if (teamMemberIdsForTasks.length > 0) {
        const { data: tmData } = await supabase
          .from('team_members')
          .select('*')
          .in('id', teamMemberIdsForTasks)
        teamMembersForTasks = tmData || []
      }
      
      tasksWithTeamMembers = tasksWithTitle.map((task: any) => {
        if (task.assigned_to) {
          const ptm = projectTeamMembers?.find((ptm: any) => ptm.id === task.assigned_to)
          const teamMember = ptm ? teamMembersForTasks.find((tm: any) => tm.id === ptm.team_member_id) : null
          return {
            ...task,
            assigned_project_team_member: ptm || null,
            assigned_team_member: teamMember || null
          }
        }
        return task
      })
    }

    // Load resource details for assigned resources
    const resourceIds = (assignedResourcesData || []).map((pr: any) => pr.resource_id).filter(Boolean)
    let assignedResourcesWithDetails = assignedResourcesData || []
    if (resourceIds.length > 0) {
      const { data: resources } = await supabase
        .from('resources')
        .select('*')
        .in('id', resourceIds)
      
      assignedResourcesWithDetails = (assignedResourcesData || []).map((pr: any) => ({
        ...pr,
        resource: resources?.find((r: any) => r.id === pr.resource_id) || null
      }))
    }

    // Load constraint details
    const constraintIds = (constraintsData || []).map((pc: any) => pc.constraint_id).filter(Boolean)
    let constraintsWithDetails = constraintsData || []
    if (constraintIds.length > 0) {
      const { data: constraints } = await supabase
        .from('constraints_master')
        .select('*')
        .in('id', constraintIds)
      
      constraintsWithDetails = (constraintsData || []).map((pc: any) => ({
        ...pc,
        constraint: constraints?.find((c: any) => c.id === pc.constraint_id) || null
      }))
    }

    return {
      project,
      team_members: teamMembersWithDetails,
      tasks: tasksWithTeamMembers,
      resources: resourcesData || [],
      assigned_resources: assignedResourcesWithDetails,
      constraints: constraintsWithDetails,
      documents: documentsData || [],
      budget_categories: budgetCategoriesData || [],
      expenses: expensesData || []
    }
  }
}

// ============================================================================
// UPDATED PROJECTS SERVICE (Enhanced)
// ============================================================================

// Update projectsService to handle constraints
export const enhancedProjectsService = {
  ...projectsService,

  // Create project with constraints
  async createProjectWithConstraints(
    project: Omit<Project, 'id' | 'created_at' | 'updated_at'>,
    constraintIds?: string[]
  ) {
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError

    // Create project
    const createdProject = await projectsService.createProject({
      ...project,
      user_id: project.user_id || userData.user?.id,
    })

    // Add constraints if provided
    if (constraintIds && constraintIds.length > 0) {
      const constraintInserts = constraintIds.map(constraintId => ({
        project_id: createdProject.id,
        constraint_id: constraintId
      }))

      const { error: constraintsError } = await supabase
        .from('project_constraints')
        .insert(constraintInserts)

      if (constraintsError) throw constraintsError
    }

    return createdProject
  }
}

// ============================================================================
// NOTIFICATIONS SERVICE
// ============================================================================

// Notification entity for system alerts and updates
export interface Notification {
  id: string
  user_id: string
  type: 'alert' | 'update' | 'info'
  title: string
  message: string
  read: boolean
  created_at: string
  project_id?: string
  resource_id?: string
}

// Notifications Service
// Handles notification management with localStorage for read status
export const notificationsService = {
  // Get all notifications for the current user
  async getNotifications(): Promise<Notification[]> {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData.user) {
        // User not authenticated, return empty array
        return []
      }

      // Try to fetch from database first
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        // Check if notifications table doesn't exist
        const errorCode = error.code || ''
        const errorMessage = error.message || ''
        const errorDetails = error.details || ''
        
        // Handle table doesn't exist error
        if (
          errorCode === '42P01' || 
          errorCode === 'PGRST116' ||
          errorMessage.includes('does not exist') ||
          errorMessage.includes('relation') ||
          errorDetails.includes('does not exist')
        ) {
          // Table doesn't exist, return empty array (this is expected if table hasn't been created)
          return []
        }
        
        // For other errors, log and return empty array
        console.warn('Error fetching notifications from database:', {
          code: errorCode,
          message: errorMessage,
          details: errorDetails
        })
        return []
      }

      // Map database results to Notification interface
      return (data || []).map((n: any) => ({
        id: n.id,
        user_id: n.user_id,
        type: n.type || 'info',
        title: n.title || 'Notification',
        message: n.message || '',
        read: n.read || false,
        created_at: n.created_at,
        project_id: n.project_id,
        resource_id: n.resource_id
      }))
    } catch (error: any) {
      // Handle any unexpected errors gracefully
      const errorMessage = error?.message || 'Unknown error'
      const errorCode = error?.code || 'UNKNOWN'
      
      // Only log if it's not a table doesn't exist error
      if (!errorMessage.includes('does not exist') && !errorMessage.includes('relation')) {
        console.warn('Unexpected error fetching notifications:', {
          message: errorMessage,
          code: errorCode,
          error: error
        })
      }
      
      // Always return empty array on error to prevent app crash
      return []
    }
  },

  // Check if a notification is marked as read (uses localStorage)
  isRead(notificationId: string): boolean {
    if (typeof window === 'undefined') return false
    try {
      const readNotifications = JSON.parse(
        localStorage.getItem('read_notifications') || '[]'
      )
      return readNotifications.includes(notificationId)
    } catch {
      return false
    }
  },

  // Mark a notification as read
  async markAsRead(notificationId: string): Promise<void> {
    try {
      // Update in database if possible
      const { data: userData } = await supabase.auth.getUser()
      if (userData.user) {
        const { error } = await supabase
          .from('notifications')
          .update({ read: true })
          .eq('id', notificationId)
          .eq('user_id', userData.user.id)

        // If table doesn't exist, just use localStorage
        if (error && error.code !== '42P01' && !error.message.includes('does not exist')) {
          console.warn('Error updating notification in database:', error)
        }
      }

      // Also store in localStorage for offline support
      if (typeof window !== 'undefined') {
        try {
          const readNotifications = JSON.parse(
            localStorage.getItem('read_notifications') || '[]'
          )
          if (!readNotifications.includes(notificationId)) {
            readNotifications.push(notificationId)
            localStorage.setItem('read_notifications', JSON.stringify(readNotifications))
          }
        } catch (e) {
          console.warn('Error updating localStorage:', e)
        }
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  },

  // Mark all notifications as read
  async markAllAsRead(): Promise<void> {
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (userData.user) {
        // Update in database if possible
        const { error } = await supabase
          .from('notifications')
          .update({ read: true })
          .eq('user_id', userData.user.id)
          .eq('read', false)

        // If table doesn't exist, just use localStorage
        if (error && error.code !== '42P01' && !error.message.includes('does not exist')) {
          console.warn('Error updating notifications in database:', error)
        }
      }

      // Mark all current notifications as read in localStorage
      if (typeof window !== 'undefined') {
        try {
          const notifications = await this.getNotifications()
          const readNotifications = notifications.map(n => n.id)
          localStorage.setItem('read_notifications', JSON.stringify(readNotifications))
        } catch (e) {
          console.warn('Error updating localStorage:', e)
        }
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  },

  // Create a new notification (for internal use)
  async createNotification(notification: Omit<Notification, 'id' | 'created_at' | 'read'>): Promise<Notification | null> {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData.user) {
        return null
      }

      const { data, error } = await supabase
        .from('notifications')
        .insert([{
          ...notification,
          user_id: userData.user.id,
          read: false
        }])
        .select()
        .single()

      if (error) {
        // If notifications table doesn't exist, return null
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          console.warn('Notifications table does not exist, skipping notification creation')
          return null
        }
        throw error
      }

      return data
    } catch (error) {
      console.error('Error creating notification:', error)
      return null
    }
  }
}
