-- ============================================================================
-- Extended Database Schema Migration for Smart Resource Optimization
-- ============================================================================
-- This migration extends the existing schema with comprehensive project management features
-- Run this AFTER the base supabase-setup.sql script
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PART 1: MODIFY EXISTING TABLES
-- ============================================================================

-- Add missing columns to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS total_area DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS building_height DECIMAL(10,2);

-- Add project_id to documents table (nullable for backward compatibility)
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;

-- Fix resources table: Make project_id nullable (for global resource catalog)
-- If project_id column exists with NOT NULL constraint, make it nullable
DO $$
BEGIN
    -- Check if project_id column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'resources' 
        AND column_name = 'project_id'
    ) THEN
        -- Drop NOT NULL constraint if it exists
        ALTER TABLE public.resources 
        ALTER COLUMN project_id DROP NOT NULL;
        
        -- Ensure it has the correct foreign key with SET NULL on delete
        ALTER TABLE public.resources 
        DROP CONSTRAINT IF EXISTS resources_project_id_fkey;
        
        ALTER TABLE public.resources 
        ADD CONSTRAINT resources_project_id_fkey 
        FOREIGN KEY (project_id) 
        REFERENCES public.projects(id) 
        ON DELETE SET NULL;
    ELSE
        -- Add project_id column as nullable if it doesn't exist
        ALTER TABLE public.resources 
        ADD COLUMN project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ============================================================================
-- PART 2: CREATE NEW TABLES
-- ============================================================================

-- 1. PROJECT_TEAM_MEMBERS (Many-to-Many Link Table)
-- Links projects to team members with role information
CREATE TABLE IF NOT EXISTS public.project_team_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    team_member_id UUID REFERENCES public.team_members(id) ON DELETE CASCADE NOT NULL,
    role_in_project TEXT,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, team_member_id)
);

-- 2. TASKS (Enhanced - Update if exists, create if not)
-- Drop and recreate with proper schema
DROP TABLE IF EXISTS public.tasks CASCADE;

CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    status TEXT CHECK (status IN ('todo', 'ongoing', 'done', 'blocked')) DEFAULT 'todo',
    assigned_to UUID REFERENCES public.project_team_members(id) ON DELETE SET NULL,
    start_date DATE,
    end_date DATE,
    progress INTEGER CHECK (progress >= 0 AND progress <= 100) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. RESOURCES (Global Resource Catalog)
-- User-owned global resource catalog
-- Note: project_id is nullable - resources are global to users, not project-specific
-- Resources are assigned to projects via project_resources table
CREATE TABLE IF NOT EXISTS public.resources (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL, -- Nullable for global catalog
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('material', 'labour', 'equipment')) NOT NULL,
    unit TEXT NOT NULL, -- kg, hr, item, etc.
    base_cost DECIMAL(15,2) NOT NULL DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. PROJECT_RESOURCES (Resource Assignment to Projects)
-- Links resources to projects with quantity and dates
CREATE TABLE IF NOT EXISTS public.project_resources (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    resource_id UUID REFERENCES public.resources(id) ON DELETE CASCADE NOT NULL,
    quantity DECIMAL(10,2) NOT NULL CHECK (quantity > 0),
    allocated_from DATE NOT NULL,
    allocated_to DATE NOT NULL,
    total_cost DECIMAL(15,2) GENERATED ALWAYS AS (quantity * (SELECT base_cost FROM public.resources WHERE id = resource_id)) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (allocated_to >= allocated_from)
);

-- 5. CONSTRAINTS_MASTER (Master List of Constraints)
-- Seeded table with standard construction constraints
CREATE TABLE IF NOT EXISTS public.constraints_master (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    category TEXT, -- budget, time, environmental, safety, legal
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. PROJECT_CONSTRAINTS (Project-Specific Constraints)
-- Links constraints to projects with optional details
CREATE TABLE IF NOT EXISTS public.project_constraints (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    constraint_id UUID REFERENCES public.constraints_master(id) ON DELETE CASCADE NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, constraint_id)
);

-- 7. BUDGET_CATEGORIES (Project Budget Breakdown)
-- Budget categories for each project
CREATE TABLE IF NOT EXISTS public.budget_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL, -- materials, labour, equipment, misc
    planned_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    actual_amount DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. EXPENSES (Project Expenses Tracking)
-- Tracks actual expenses against budget categories
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES public.budget_categories(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    resource_id UUID REFERENCES public.resources(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PART 3: ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.project_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.constraints_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_constraints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 4: CREATE RLS POLICIES
-- ============================================================================

-- Project Team Members Policies
DROP POLICY IF EXISTS "Users can view project team members for own projects" ON public.project_team_members;
CREATE POLICY "Users can view project team members for own projects" 
ON public.project_team_members FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.projects 
        WHERE projects.id = project_team_members.project_id 
        AND projects.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can add team members to own projects" ON public.project_team_members;
CREATE POLICY "Users can add team members to own projects" 
ON public.project_team_members FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.projects 
        WHERE projects.id = project_team_members.project_id 
        AND projects.user_id = auth.uid()
    )
    AND EXISTS (
        SELECT 1 FROM public.team_members 
        WHERE team_members.id = project_team_members.team_member_id 
        AND team_members.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can update project team members for own projects" ON public.project_team_members;
CREATE POLICY "Users can update project team members for own projects" 
ON public.project_team_members FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.projects 
        WHERE projects.id = project_team_members.project_id 
        AND projects.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can delete project team members from own projects" ON public.project_team_members;
CREATE POLICY "Users can delete project team members from own projects" 
ON public.project_team_members FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM public.projects 
        WHERE projects.id = project_team_members.project_id 
        AND projects.user_id = auth.uid()
    )
);

-- Tasks Policies
DROP POLICY IF EXISTS "Users can view tasks for own projects" ON public.tasks;
CREATE POLICY "Users can view tasks for own projects" 
ON public.tasks FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create tasks for own projects" ON public.tasks;
CREATE POLICY "Users can create tasks for own projects" 
ON public.tasks FOR INSERT 
WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
        SELECT 1 FROM public.projects 
        WHERE projects.id = tasks.project_id 
        AND projects.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can update own tasks" ON public.tasks;
CREATE POLICY "Users can update own tasks" 
ON public.tasks FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own tasks" ON public.tasks;
CREATE POLICY "Users can delete own tasks" 
ON public.tasks FOR DELETE 
USING (auth.uid() = user_id);

-- Resources Policies (Global Catalog)
DROP POLICY IF EXISTS "Users can view own resources" ON public.resources;
CREATE POLICY "Users can view own resources" 
ON public.resources FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own resources" ON public.resources;
CREATE POLICY "Users can create own resources" 
ON public.resources FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own resources" ON public.resources;
CREATE POLICY "Users can update own resources" 
ON public.resources FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own resources" ON public.resources;
CREATE POLICY "Users can delete own resources" 
ON public.resources FOR DELETE 
USING (auth.uid() = user_id);

-- Project Resources Policies
DROP POLICY IF EXISTS "Users can view project resources for own projects" ON public.project_resources;
CREATE POLICY "Users can view project resources for own projects" 
ON public.project_resources FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.projects 
        WHERE projects.id = project_resources.project_id 
        AND projects.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can assign resources to own projects" ON public.project_resources;
CREATE POLICY "Users can assign resources to own projects" 
ON public.project_resources FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.projects 
        WHERE projects.id = project_resources.project_id 
        AND projects.user_id = auth.uid()
    )
    AND EXISTS (
        SELECT 1 FROM public.resources 
        WHERE resources.id = project_resources.resource_id 
        AND resources.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can update project resources for own projects" ON public.project_resources;
CREATE POLICY "Users can update project resources for own projects" 
ON public.project_resources FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.projects 
        WHERE projects.id = project_resources.project_id 
        AND projects.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can remove resources from own projects" ON public.project_resources;
CREATE POLICY "Users can remove resources from own projects" 
ON public.project_resources FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM public.projects 
        WHERE projects.id = project_resources.project_id 
        AND projects.user_id = auth.uid()
    )
);

-- Constraints Master Policies (Read-only for all authenticated users)
DROP POLICY IF EXISTS "All authenticated users can view constraints master" ON public.constraints_master;
CREATE POLICY "All authenticated users can view constraints master" 
ON public.constraints_master FOR SELECT 
USING (auth.role() = 'authenticated');

-- Project Constraints Policies
DROP POLICY IF EXISTS "Users can view project constraints for own projects" ON public.project_constraints;
CREATE POLICY "Users can view project constraints for own projects" 
ON public.project_constraints FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.projects 
        WHERE projects.id = project_constraints.project_id 
        AND projects.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can add constraints to own projects" ON public.project_constraints;
CREATE POLICY "Users can add constraints to own projects" 
ON public.project_constraints FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.projects 
        WHERE projects.id = project_constraints.project_id 
        AND projects.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can update project constraints for own projects" ON public.project_constraints;
CREATE POLICY "Users can update project constraints for own projects" 
ON public.project_constraints FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.projects 
        WHERE projects.id = project_constraints.project_id 
        AND projects.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can remove constraints from own projects" ON public.project_constraints;
CREATE POLICY "Users can remove constraints from own projects" 
ON public.project_constraints FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM public.projects 
        WHERE projects.id = project_constraints.project_id 
        AND projects.user_id = auth.uid()
    )
);

-- Budget Categories Policies
DROP POLICY IF EXISTS "Users can view budget categories for own projects" ON public.budget_categories;
CREATE POLICY "Users can view budget categories for own projects" 
ON public.budget_categories FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.projects 
        WHERE projects.id = budget_categories.project_id 
        AND projects.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can create budget categories for own projects" ON public.budget_categories;
CREATE POLICY "Users can create budget categories for own projects" 
ON public.budget_categories FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.projects 
        WHERE projects.id = budget_categories.project_id 
        AND projects.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can update budget categories for own projects" ON public.budget_categories;
CREATE POLICY "Users can update budget categories for own projects" 
ON public.budget_categories FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.projects 
        WHERE projects.id = budget_categories.project_id 
        AND projects.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can delete budget categories from own projects" ON public.budget_categories;
CREATE POLICY "Users can delete budget categories from own projects" 
ON public.budget_categories FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM public.projects 
        WHERE projects.id = budget_categories.project_id 
        AND projects.user_id = auth.uid()
    )
);

-- Expenses Policies
DROP POLICY IF EXISTS "Users can view expenses for own projects" ON public.expenses;
CREATE POLICY "Users can view expenses for own projects" 
ON public.expenses FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create expenses for own projects" ON public.expenses;
CREATE POLICY "Users can create expenses for own projects" 
ON public.expenses FOR INSERT 
WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
        SELECT 1 FROM public.projects 
        WHERE projects.id = expenses.project_id 
        AND projects.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can update own expenses" ON public.expenses;
CREATE POLICY "Users can update own expenses" 
ON public.expenses FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own expenses" ON public.expenses;
CREATE POLICY "Users can delete own expenses" 
ON public.expenses FOR DELETE 
USING (auth.uid() = user_id);

-- Documents Policies (Update to include project_id check)
DROP POLICY IF EXISTS "Users can view own documents" ON public.documents;
CREATE POLICY "Users can view own documents" 
ON public.documents FOR SELECT 
USING (auth.uid() = user_id);

-- ============================================================================
-- PART 5: SEED CONSTRAINTS_MASTER TABLE
-- ============================================================================

INSERT INTO public.constraints_master (name, description, category) VALUES
('Budget Limit', 'Maximum budget constraint for the project', 'budget'),
('Time Constraint', 'Strict deadline or timeline restrictions', 'time'),
('Environmental Restrictions', 'Environmental compliance and sustainability requirements', 'environmental'),
('Safety Requirements', 'Safety standards and regulations compliance', 'safety'),
('Accessibility Compliance', 'ADA and accessibility standards compliance', 'legal'),
('Zoning Restrictions', 'Local zoning laws and building code restrictions', 'legal'),
('Material Availability', 'Constraints related to material sourcing and availability', 'logistics'),
('Weather Constraints', 'Seasonal or weather-related limitations', 'environmental'),
('Labor Availability', 'Workforce availability and skill requirements', 'logistics'),
('Equipment Constraints', 'Equipment availability and maintenance requirements', 'logistics')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- PART 6: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_project_team_members_project_id ON public.project_team_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_team_members_team_member_id ON public.project_team_members(team_member_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
-- Index for tasks.assigned_to (now references project_team_members.id)
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_resources_user_id ON public.resources(user_id);
CREATE INDEX IF NOT EXISTS idx_resources_type ON public.resources(type);
CREATE INDEX IF NOT EXISTS idx_project_resources_project_id ON public.project_resources(project_id);
CREATE INDEX IF NOT EXISTS idx_project_resources_resource_id ON public.project_resources(resource_id);
CREATE INDEX IF NOT EXISTS idx_project_constraints_project_id ON public.project_constraints(project_id);
CREATE INDEX IF NOT EXISTS idx_project_constraints_constraint_id ON public.project_constraints(constraint_id);
CREATE INDEX IF NOT EXISTS idx_budget_categories_project_id ON public.budget_categories(project_id);
CREATE INDEX IF NOT EXISTS idx_expenses_project_id ON public.expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON public.expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date);
CREATE INDEX IF NOT EXISTS idx_documents_project_id ON public.documents(project_id);

-- ============================================================================
-- PART 7: CREATE FUNCTIONS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Function to update actual_amount in budget_categories when expenses are added/updated
CREATE OR REPLACE FUNCTION update_budget_category_actual()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.budget_categories
    SET actual_amount = (
        SELECT COALESCE(SUM(amount), 0)
        FROM public.expenses
        WHERE category_id = COALESCE(NEW.category_id, OLD.category_id)
    ),
    updated_at = NOW()
    WHERE id = COALESCE(NEW.category_id, OLD.category_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update budget category when expense is inserted
DROP TRIGGER IF EXISTS trigger_update_budget_on_expense_insert ON public.expenses;
CREATE TRIGGER trigger_update_budget_on_expense_insert
AFTER INSERT ON public.expenses
FOR EACH ROW
EXECUTE FUNCTION update_budget_category_actual();

-- Trigger to update budget category when expense is updated
DROP TRIGGER IF EXISTS trigger_update_budget_on_expense_update ON public.expenses;
CREATE TRIGGER trigger_update_budget_on_expense_update
AFTER UPDATE ON public.expenses
FOR EACH ROW
EXECUTE FUNCTION update_budget_category_actual();

-- Trigger to update budget category when expense is deleted
DROP TRIGGER IF EXISTS trigger_update_budget_on_expense_delete ON public.expenses;
CREATE TRIGGER trigger_update_budget_on_expense_delete
AFTER DELETE ON public.expenses
FOR EACH ROW
EXECUTE FUNCTION update_budget_category_actual();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to new tables
DROP TRIGGER IF EXISTS update_project_team_members_updated_at ON public.project_team_members;
CREATE TRIGGER update_project_team_members_updated_at
BEFORE UPDATE ON public.project_team_members
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_resources_updated_at ON public.resources;
CREATE TRIGGER update_resources_updated_at
BEFORE UPDATE ON public.resources
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_project_resources_updated_at ON public.project_resources;
CREATE TRIGGER update_project_resources_updated_at
BEFORE UPDATE ON public.project_resources
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_budget_categories_updated_at ON public.budget_categories;
CREATE TRIGGER update_budget_categories_updated_at
BEFORE UPDATE ON public.budget_categories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_expenses_updated_at ON public.expenses;
CREATE TRIGGER update_expenses_updated_at
BEFORE UPDATE ON public.expenses
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PART 8: GRANT PERMISSIONS
-- ============================================================================

GRANT ALL ON public.project_team_members TO anon, authenticated;
GRANT ALL ON public.tasks TO anon, authenticated;
GRANT ALL ON public.resources TO anon, authenticated;
GRANT ALL ON public.project_resources TO anon, authenticated;
GRANT ALL ON public.constraints_master TO anon, authenticated;
GRANT ALL ON public.project_constraints TO anon, authenticated;
GRANT ALL ON public.budget_categories TO anon, authenticated;
GRANT ALL ON public.expenses TO anon, authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary:
-- ✅ Modified projects table (added total_area, building_height)
-- ✅ Modified documents table (added project_id)
-- ✅ Created project_team_members (many-to-many link table)
-- ✅ Created tasks table (enhanced)
-- ✅ Created resources table (global catalog)
-- ✅ Created project_resources table (resource assignments)
-- ✅ Created constraints_master table (seeded)
-- ✅ Created project_constraints table (project-constraint links)
-- ✅ Created budget_categories table
-- ✅ Created expenses table
-- ✅ All RLS policies created
-- ✅ All indexes created
-- ✅ Automatic update functions and triggers created
-- ============================================================================

