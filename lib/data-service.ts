import { supabase } from './supabase'

// Data service layer for OptiBuild application
// Provides centralized data management for all construction-related entities

// Type definitions for all application entities

// Project entity representing construction projects
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
  structure_type?: string
  floors?: number
  constraints?: Record<string, any>
  project_requirements?: Record<string, any>
  created_at?: string
  updated_at?: string
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

// Document entity for project file management
export interface Document {
  id?: string
  user_id?: string
  name: string
  type?: string
  size?: string
  file_url?: string
  uploaded_at?: string
  created_at?: string
}

// Task entity for project scheduling
export interface Task {
  id?: string
  project_id?: string
  user_id?: string
  name: string
  description?: string
  start_date?: string
  end_date?: string
  duration_days?: number
  progress: number
  status: string
  priority: string
  dependencies?: any[]
  assigned_to?: string
  estimated_cost?: number
  actual_cost?: number
  created_at?: string
  updated_at?: string
}

// Resource entity for resource management
export interface Resource {
  id?: string
  project_id?: string
  user_id?: string
  name: string
  type: string
  category?: string
  quantity: number
  unit?: string
  cost_per_unit?: number
  total_cost?: number
  availability_start?: string
  availability_end?: string
  status: string
  specifications?: Record<string, any>
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

// Tasks Management Service
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
    return data || []
  },

  // Create a new task
  async createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) {
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError

    const payload = {
      ...task,
      user_id: task.user_id || userData.user?.id,
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert([payload])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Update an existing task
  async updateTask(id: string, updates: Partial<Task>) {
    const { data, error } = await supabase
      .from('tasks')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
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
