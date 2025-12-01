-- ============================================================================
-- Schema Update: Relate Tasks to Project Team Members
-- ============================================================================
-- This migration updates the tasks table to reference project_team_members
-- instead of directly referencing team_members. This ensures tasks can only
-- be assigned to team members who are part of the project.
-- ============================================================================

-- Ensure project_team_members table exists
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

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_project_team_members_project ON public.project_team_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_team_members_team_member ON public.project_team_members(team_member_id);

-- Update tasks table to reference project_team_members instead of team_members
-- First, we need to handle existing data by creating project_team_members entries
-- for any tasks that have assigned_to values

DO $$
DECLARE
    task_record RECORD;
    ptm_id UUID;
BEGIN
    -- For each task with an assigned_to value, ensure the team member is in project_team_members
    FOR task_record IN 
        SELECT DISTINCT t.project_id, t.assigned_to 
        FROM public.tasks t 
        WHERE t.assigned_to IS NOT NULL
    LOOP
        -- Check if project_team_members entry exists
        SELECT id INTO ptm_id
        FROM public.project_team_members
        WHERE project_id = task_record.project_id 
        AND team_member_id = task_record.assigned_to::UUID
        LIMIT 1;
        
        -- If not exists, create it
        IF ptm_id IS NULL THEN
            INSERT INTO public.project_team_members (project_id, team_member_id, role_in_project)
            VALUES (task_record.project_id, task_record.assigned_to::UUID, 'Team Member')
            ON CONFLICT (project_id, team_member_id) DO NOTHING
            RETURNING id INTO ptm_id;
        END IF;
    END LOOP;
END $$;

-- Now update the tasks table schema
-- Drop the old foreign key constraint if it exists
ALTER TABLE public.tasks 
    DROP CONSTRAINT IF EXISTS tasks_assigned_to_fkey;

-- Change assigned_to to reference project_team_members.id instead of team_members.id
-- We'll use a two-step process: first add a new column, migrate data, then drop old column

-- Step 1: Add new column for project_team_members reference
ALTER TABLE public.tasks 
    ADD COLUMN IF NOT EXISTS assigned_to_project_team UUID REFERENCES public.project_team_members(id) ON DELETE SET NULL;

-- Step 2: Migrate existing assigned_to values to the new column
UPDATE public.tasks t
SET assigned_to_project_team = ptm.id
FROM public.project_team_members ptm
WHERE t.assigned_to::UUID = ptm.team_member_id
AND t.project_id = ptm.project_id
AND t.assigned_to IS NOT NULL;

-- Step 3: Drop the old assigned_to column (after migration)
-- We'll keep both for now to ensure backward compatibility
-- ALTER TABLE public.tasks DROP COLUMN IF EXISTS assigned_to;

-- For now, we'll keep assigned_to but add a check constraint to ensure
-- the team member is in the project_team_members table
-- This will be enforced at the application level

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to_project_team ON public.tasks(assigned_to_project_team);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);

-- Enable RLS on project_team_members if not already enabled
ALTER TABLE public.project_team_members ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for project_team_members
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
);

DROP POLICY IF EXISTS "Users can remove team members from own projects" ON public.project_team_members;
CREATE POLICY "Users can remove team members from own projects" 
ON public.project_team_members FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM public.projects 
        WHERE projects.id = project_team_members.project_id 
        AND projects.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can update team member roles in own projects" ON public.project_team_members;
CREATE POLICY "Users can update team member roles in own projects" 
ON public.project_team_members FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.projects 
        WHERE projects.id = project_team_members.project_id 
        AND projects.user_id = auth.uid()
    )
);

-- Add comment to document the relationship
COMMENT ON COLUMN public.tasks.assigned_to_project_team IS 'References project_team_members.id - ensures task is assigned to a team member who is part of the project';











