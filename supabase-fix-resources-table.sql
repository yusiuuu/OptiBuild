-- ============================================================================
-- Fix Resources Table Schema
-- ============================================================================
-- This migration fixes the resources table to make it a global catalog
-- (user-owned) instead of project-specific. The project_id constraint is removed.
-- ============================================================================

-- Step 1: Check if resources table exists with project_id constraint
-- If it does, we need to alter it

-- First, drop the NOT NULL constraint on project_id if it exists
ALTER TABLE public.resources 
    ALTER COLUMN project_id DROP NOT NULL;

-- Make project_id nullable (resources can be global or project-specific)
-- Note: For global resources (catalog), project_id should be NULL
ALTER TABLE public.resources 
    ALTER COLUMN project_id DROP NOT NULL;

-- If the table doesn't have the correct columns, add them
DO $$
BEGIN
    -- Add user_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'resources' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.resources 
        ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- Add base_cost if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'resources' 
        AND column_name = 'base_cost'
    ) THEN
        ALTER TABLE public.resources 
        ADD COLUMN base_cost DECIMAL(15,2) NOT NULL DEFAULT 0;
    END IF;

    -- Ensure type column has the correct CHECK constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage 
        WHERE table_schema = 'public' 
        AND table_name = 'resources' 
        AND constraint_name LIKE '%type%check%'
    ) THEN
        -- Drop existing type constraint if it exists with different values
        ALTER TABLE public.resources 
        DROP CONSTRAINT IF EXISTS resources_type_check;
        
        -- Add correct type constraint
        ALTER TABLE public.resources 
        ADD CONSTRAINT resources_type_check 
        CHECK (type IN ('material', 'labour', 'equipment'));
    END IF;
END $$;

-- Update existing resources to have user_id if they don't have one
-- (This assumes resources belong to the first user or need manual assignment)
UPDATE public.resources 
SET user_id = (
    SELECT id FROM auth.users LIMIT 1
)
WHERE user_id IS NULL;

-- For existing resources with project_id, we can keep them as-is
-- But new resources should be global (project_id = NULL)

-- Add comment to document the change
COMMENT ON TABLE public.resources IS 'Global resource catalog - user-owned resources that can be assigned to projects via project_resources table';
COMMENT ON COLUMN public.resources.project_id IS 'DEPRECATED: Use project_resources table instead. This column is kept for backward compatibility but should be NULL for new resources.';
COMMENT ON COLUMN public.resources.user_id IS 'Owner of the resource - resources are global to the user, not project-specific';

