-- ============================================================================
-- Create project_team_members table
-- ============================================================================
-- This table creates a many-to-many relationship between projects and team members
-- It allows team members to be assigned to specific projects with role information
-- ============================================================================

-- Create project_team_members table if it doesn't exist
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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_project_team_members_project_id ON public.project_team_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_team_members_team_member_id ON public.project_team_members(team_member_id);
CREATE INDEX IF NOT EXISTS idx_project_team_members_project_team ON public.project_team_members(project_id, team_member_id);

-- Enable Row Level Security
ALTER TABLE public.project_team_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view project team members for own projects" ON public.project_team_members;
DROP POLICY IF EXISTS "Users can add team members to own projects" ON public.project_team_members;
DROP POLICY IF EXISTS "Users can remove team members from own projects" ON public.project_team_members;
DROP POLICY IF EXISTS "Users can update team member roles in own projects" ON public.project_team_members;

-- Create RLS policies
CREATE POLICY "Users can view project team members for own projects" 
ON public.project_team_members FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.projects 
        WHERE projects.id = project_team_members.project_id 
        AND projects.user_id = auth.uid()
    )
);

CREATE POLICY "Users can add team members to own projects" 
ON public.project_team_members FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.projects 
        WHERE projects.id = project_team_members.project_id 
        AND projects.user_id = auth.uid()
    )
    AND
    EXISTS (
        SELECT 1 FROM public.team_members 
        WHERE team_members.id = project_team_members.team_member_id 
        AND team_members.user_id = auth.uid()
    )
);

CREATE POLICY "Users can remove team members from own projects" 
ON public.project_team_members FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM public.projects 
        WHERE projects.id = project_team_members.project_id 
        AND projects.user_id = auth.uid()
    )
);

CREATE POLICY "Users can update team member roles in own projects" 
ON public.project_team_members FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.projects 
        WHERE projects.id = project_team_members.project_id 
        AND projects.user_id = auth.uid()
    )
);

-- Add comment to document the table
COMMENT ON TABLE public.project_team_members IS 'Many-to-many relationship between projects and team members. Links team members to specific projects with optional role information.';
COMMENT ON COLUMN public.project_team_members.project_id IS 'Reference to the project this team member is assigned to';
COMMENT ON COLUMN public.project_team_members.team_member_id IS 'Reference to the team member assigned to this project';
COMMENT ON COLUMN public.project_team_members.role_in_project IS 'Optional role of the team member in this specific project (e.g., "Project Manager", "Site Engineer")';

