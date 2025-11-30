-- ============================================================================
-- SIMPLE FIX: Drop and Recreate project_resources table with UUID columns
-- ============================================================================
-- ⚠️  WARNING: This will DELETE ALL existing data in project_resources table!
-- Use this only if you don't have important data or have already backed it up.
-- ============================================================================
-- Run this script in your Supabase SQL Editor
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop the existing table (this will delete all data!)
DROP TABLE IF EXISTS public.project_resources CASCADE;

-- Recreate the table with correct UUID types
CREATE TABLE public.project_resources (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    resource_id UUID REFERENCES public.resources(id) ON DELETE CASCADE NOT NULL,
    quantity DECIMAL(10,2) NOT NULL CHECK (quantity > 0),
    allocated_from DATE NOT NULL,
    allocated_to DATE NOT NULL,
    total_cost DECIMAL(15,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (allocated_to >= allocated_from)
);

-- Create indexes
CREATE INDEX idx_project_resources_project_id ON public.project_resources(project_id);
CREATE INDEX idx_project_resources_resource_id ON public.project_resources(resource_id);
CREATE INDEX idx_project_resources_dates ON public.project_resources(allocated_from, allocated_to);
CREATE INDEX idx_project_resources_project_resource ON public.project_resources(project_id, resource_id);

-- Enable Row Level Security
ALTER TABLE public.project_resources ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Users can view project resources for own projects" 
ON public.project_resources FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.projects 
        WHERE projects.id = project_resources.project_id 
        AND projects.user_id = auth.uid()
    )
);

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

CREATE POLICY "Users can update project resources for own projects" 
ON public.project_resources FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.projects 
        WHERE projects.id = project_resources.project_id 
        AND projects.user_id = auth.uid()
    )
);

CREATE POLICY "Users can remove resources from own projects" 
ON public.project_resources FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM public.projects 
        WHERE projects.id = project_resources.project_id 
        AND projects.user_id = auth.uid()
    )
);

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_project_resources_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_update_project_resources_updated_at
BEFORE UPDATE ON public.project_resources
FOR EACH ROW
EXECUTE FUNCTION update_project_resources_updated_at();

-- Grant permissions
GRANT ALL ON public.project_resources TO anon, authenticated;

-- ============================================================================
-- Fix Complete!
-- ============================================================================
-- The project_resources table has been recreated with UUID columns.
-- You can now assign resources to projects without errors.
-- ============================================================================

