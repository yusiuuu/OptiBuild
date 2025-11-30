-- ============================================================================
-- Create project_team_members table
-- ============================================================================
-- This table creates a many-to-many relationship between projects and team members
-- It allows team members from the team_members table to be assigned to specific projects
-- with optional role information for each project assignment
-- ============================================================================
-- Run this script in your Supabase SQL Editor
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create project_team_members table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.project_team_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    team_member_id UUID REFERENCES public.team_members(id) ON DELETE CASCADE NOT NULL,
    role_in_project TEXT, -- Optional role in this specific project (e.g., "Project Manager", "Site Engineer", "Lead Architect")
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Ensure a team member can only be assigned once per project
    UNIQUE(project_id, team_member_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_project_team_members_project_id ON public.project_team_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_team_members_team_member_id ON public.project_team_members(team_member_id);
CREATE INDEX IF NOT EXISTS idx_project_team_members_project_team ON public.project_team_members(project_id, team_member_id);

-- Enable Row Level Security
ALTER TABLE public.project_team_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view project team members for own projects" ON public.project_team_members;
DROP POLICY IF EXISTS "Users can add team members to own projects" ON public.project_team_members;
DROP POLICY IF EXISTS "Users can update project team members for own projects" ON public.project_team_members;
DROP POLICY IF EXISTS "Users can delete project team members from own projects" ON public.project_team_members;

-- Create RLS policies
-- Policy: Users can view project team members for their own projects
CREATE POLICY "Users can view project team members for own projects" 
ON public.project_team_members FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.projects 
        WHERE projects.id = project_team_members.project_id 
        AND projects.user_id = auth.uid()
    )
);

-- Policy: Users can add team members to their own projects (must own both project and team member)
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

-- Policy: Users can update project team members for their own projects
CREATE POLICY "Users can update project team members for own projects" 
ON public.project_team_members FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.projects 
        WHERE projects.id = project_team_members.project_id 
        AND projects.user_id = auth.uid()
    )
);

-- Policy: Users can remove team members from their own projects
CREATE POLICY "Users can delete project team members from own projects" 
ON public.project_team_members FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM public.projects 
        WHERE projects.id = project_team_members.project_id 
        AND projects.user_id = auth.uid()
    )
);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_project_team_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at on row update
DROP TRIGGER IF EXISTS trigger_update_project_team_members_updated_at ON public.project_team_members;
CREATE TRIGGER trigger_update_project_team_members_updated_at
BEFORE UPDATE ON public.project_team_members
FOR EACH ROW
EXECUTE FUNCTION update_project_team_members_updated_at();

-- Grant necessary permissions
GRANT ALL ON public.project_team_members TO anon, authenticated;

-- Add comments to document the table
COMMENT ON TABLE public.project_team_members IS 'Many-to-many relationship between projects and team members. Links team members from the team_members table to specific projects with optional role information.';
COMMENT ON COLUMN public.project_team_members.id IS 'Primary key - unique identifier for the project-team member assignment';
COMMENT ON COLUMN public.project_team_members.project_id IS 'Foreign key reference to the project this team member is assigned to';
COMMENT ON COLUMN public.project_team_members.team_member_id IS 'Foreign key reference to the team member from the team_members table';
COMMENT ON COLUMN public.project_team_members.role_in_project IS 'Optional role of the team member in this specific project (e.g., "Project Manager", "Site Engineer", "Lead Architect")';
COMMENT ON COLUMN public.project_team_members.added_at IS 'Timestamp when the team member was added to the project';
COMMENT ON COLUMN public.project_team_members.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN public.project_team_members.updated_at IS 'Timestamp when the record was last updated';

-- ============================================================================
-- Table Creation Complete
-- ============================================================================
-- The project_team_members table is now ready to use!
-- 
-- Usage Example:
--   INSERT INTO public.project_team_members (project_id, team_member_id, role_in_project)
--   VALUES ('project-uuid', 'team-member-uuid', 'Project Manager');
-- ============================================================================
