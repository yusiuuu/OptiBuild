-- ============================================================================
-- Create project_resources table
-- ============================================================================
-- This table stores resource assignments to projects
-- Links resources from the global catalog to specific projects with quantity and dates
-- ============================================================================

-- Create project_resources table
CREATE TABLE IF NOT EXISTS public.project_resources (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    resource_id UUID REFERENCES public.resources(id) ON DELETE CASCADE NOT NULL,
    quantity DECIMAL(10,2) NOT NULL CHECK (quantity > 0),
    allocated_from DATE NOT NULL,
    allocated_to DATE NOT NULL,
    total_cost DECIMAL(15,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (allocated_to >= allocated_from),
    -- Prevent duplicate assignments (same resource to same project with overlapping dates)
    UNIQUE(project_id, resource_id, allocated_from, allocated_to)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_project_resources_project_id ON public.project_resources(project_id);
CREATE INDEX IF NOT EXISTS idx_project_resources_resource_id ON public.project_resources(resource_id);
CREATE INDEX IF NOT EXISTS idx_project_resources_dates ON public.project_resources(allocated_from, allocated_to);
CREATE INDEX IF NOT EXISTS idx_project_resources_project_resource ON public.project_resources(project_id, resource_id);

-- Enable Row Level Security
ALTER TABLE public.project_resources ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view project resources for own projects" ON public.project_resources;
DROP POLICY IF EXISTS "Users can assign resources to own projects" ON public.project_resources;
DROP POLICY IF EXISTS "Users can update project resources for own projects" ON public.project_resources;
DROP POLICY IF EXISTS "Users can remove resources from own projects" ON public.project_resources;

-- Create RLS policies
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

-- Create function to automatically calculate total_cost
CREATE OR REPLACE FUNCTION calculate_project_resource_cost()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate total_cost = quantity * base_cost from resources table
    SELECT NEW.quantity * COALESCE(r.base_cost, 0) INTO NEW.total_cost
    FROM public.resources r
    WHERE r.id = NEW.resource_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically calculate total_cost on insert/update
DROP TRIGGER IF EXISTS trigger_calculate_project_resource_cost ON public.project_resources;
CREATE TRIGGER trigger_calculate_project_resource_cost
    BEFORE INSERT OR UPDATE ON public.project_resources
    FOR EACH ROW
    EXECUTE FUNCTION calculate_project_resource_cost();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_project_resources_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at
DROP TRIGGER IF EXISTS trigger_update_project_resources_updated_at ON public.project_resources;
CREATE TRIGGER trigger_update_project_resources_updated_at
    BEFORE UPDATE ON public.project_resources
    FOR EACH ROW
    EXECUTE FUNCTION update_project_resources_updated_at();

-- Add comments to document the table
COMMENT ON TABLE public.project_resources IS 'Stores resource assignments to projects. Links resources from the global catalog to specific projects with quantity and allocation dates.';
COMMENT ON COLUMN public.project_resources.project_id IS 'Reference to the project this resource is assigned to';
COMMENT ON COLUMN public.project_resources.resource_id IS 'Reference to the resource from the global catalog';
COMMENT ON COLUMN public.project_resources.quantity IS 'Quantity of the resource allocated (must be greater than 0)';
COMMENT ON COLUMN public.project_resources.allocated_from IS 'Start date of resource allocation';
COMMENT ON COLUMN public.project_resources.allocated_to IS 'End date of resource allocation (must be >= allocated_from)';
COMMENT ON COLUMN public.project_resources.total_cost IS 'Calculated total cost (quantity * base_cost). Automatically calculated by trigger.';

-- Grant permissions
GRANT ALL ON public.project_resources TO anon, authenticated;






