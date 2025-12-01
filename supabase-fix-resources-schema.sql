-- ============================================================================
-- Fix Resources Table - Remove project_id NOT NULL Constraint
-- ============================================================================
-- Run this script if you get: "null value in column 'project_id' violates not-null constraint"
-- This makes resources a global catalog (user-owned) instead of project-specific
-- ============================================================================

-- Step 1: Make project_id nullable (if constraint exists)
DO $$
BEGIN
    -- Check if project_id column exists and has NOT NULL constraint
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'resources' 
        AND column_name = 'project_id'
        AND is_nullable = 'NO'
    ) THEN
        -- Drop NOT NULL constraint
        ALTER TABLE public.resources 
        ALTER COLUMN project_id DROP NOT NULL;
        
        RAISE NOTICE 'Removed NOT NULL constraint from project_id';
    ELSE
        RAISE NOTICE 'project_id column does not exist or is already nullable';
    END IF;
END $$;

-- Step 2: Ensure the table has the correct structure for global resources
-- Add user_id if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'resources' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.resources 
        ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        
        -- Update existing rows to have a user_id (use first user or set manually)
        UPDATE public.resources 
        SET user_id = (SELECT id FROM auth.users ORDER BY created_at LIMIT 1)
        WHERE user_id IS NULL;
        
        -- Make it NOT NULL after populating
        ALTER TABLE public.resources 
        ALTER COLUMN user_id SET NOT NULL;
        
        RAISE NOTICE 'Added user_id column';
    END IF;
END $$;

-- Step 3: Add base_cost if it doesn't exist (migration from cost_per_unit)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'resources' 
        AND column_name = 'base_cost'
    ) THEN
        ALTER TABLE public.resources 
        ADD COLUMN base_cost DECIMAL(15,2) NOT NULL DEFAULT 0;
        
        -- Migrate data from cost_per_unit if it exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'resources' 
            AND column_name = 'cost_per_unit'
        ) THEN
            UPDATE public.resources 
            SET base_cost = COALESCE(cost_per_unit, 0)
            WHERE base_cost = 0;
        END IF;
        
        RAISE NOTICE 'Added base_cost column';
    END IF;
END $$;

-- Step 4: Ensure type constraint is correct
DO $$
BEGIN
    -- Drop old constraint if it exists
    ALTER TABLE public.resources 
    DROP CONSTRAINT IF EXISTS resources_type_check;
    
    -- Add correct constraint
    ALTER TABLE public.resources 
    ADD CONSTRAINT resources_type_check 
    CHECK (type IN ('material', 'labour', 'equipment'));
    
    RAISE NOTICE 'Updated type constraint';
END $$;

-- Step 5: Ensure unit is NOT NULL (required field)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'resources' 
        AND column_name = 'unit'
        AND is_nullable = 'YES'
    ) THEN
        -- Set default for NULL values
        UPDATE public.resources 
        SET unit = 'unit' 
        WHERE unit IS NULL;
        
        -- Make it NOT NULL
        ALTER TABLE public.resources 
        ALTER COLUMN unit SET NOT NULL;
        
        RAISE NOTICE 'Made unit column NOT NULL';
    END IF;
END $$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Resources table schema fix completed successfully!';
    RAISE NOTICE 'Resources are now global (user-owned) and can be assigned to projects via project_resources table.';
END $$;











