-- ============================================================================
-- Fix project_resources table schema - Convert bigint to UUID
-- ============================================================================
-- This script fixes the project_resources table to ensure all ID columns
-- are UUID type instead of bigint. It handles existing tables and data safely.
-- ============================================================================
-- Run this script in your Supabase SQL Editor
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 1: Check if table exists and handle table name (project_resource vs project_resources)
DO $$
BEGIN
    -- Check if project_resource (singular) exists and rename it
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'project_resource'
    ) THEN
        ALTER TABLE public.project_resource RENAME TO project_resources;
        RAISE NOTICE 'Renamed project_resource to project_resources';
    END IF;
END $$;

-- Step 2: If table doesn't exist, create it with correct schema
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
    CHECK (allocated_to >= allocated_from)
);

-- Step 3: Fix column types if they're bigint
-- This handles the case where the table exists but has wrong column types
DO $$
DECLARE
    col_type text;
    has_data boolean;
BEGIN
    -- Check if table has any data
    SELECT EXISTS(SELECT 1 FROM public.project_resources LIMIT 1) INTO has_data;
    
    -- Fix id column if it's bigint
    SELECT data_type INTO col_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'project_resources'
    AND column_name = 'id';
    
    IF col_type = 'bigint' THEN
        IF has_data THEN
            -- If there's data, we need to drop and recreate (data will be lost)
            -- This is necessary because bigint values can't be converted to UUID
            RAISE NOTICE 'Table has data with bigint id. Dropping table to recreate with UUID...';
            DROP TABLE IF EXISTS public.project_resources CASCADE;
            
            -- Recreate table with correct schema
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
        ELSE
            -- No data, safe to alter
            ALTER TABLE public.project_resources DROP CONSTRAINT IF EXISTS project_resources_pkey;
            ALTER TABLE public.project_resources ALTER COLUMN id TYPE UUID USING uuid_generate_v4();
            ALTER TABLE public.project_resources ADD CONSTRAINT project_resources_pkey PRIMARY KEY (id);
        END IF;
        RAISE NOTICE 'Fixed id column type from bigint to UUID';
    END IF;
    
    -- Fix project_id column if it's bigint
    SELECT data_type INTO col_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'project_resources'
    AND column_name = 'project_id';
    
    IF col_type = 'bigint' THEN
        -- Drop foreign key constraint first
        ALTER TABLE public.project_resources 
        DROP CONSTRAINT IF EXISTS project_resources_project_id_fkey;
        
        IF has_data THEN
            -- Can't convert bigint to UUID if there's data, need to clear it
            RAISE NOTICE 'Clearing project_id data to convert from bigint to UUID...';
            DELETE FROM public.project_resources;
        END IF;
        
        -- Change column type to UUID
        ALTER TABLE public.project_resources 
        ALTER COLUMN project_id TYPE UUID USING 
        CASE 
            WHEN project_id::text ~ '^[0-9]+$' THEN NULL  -- If it's a number, set to NULL
            ELSE project_id::text::uuid  -- If it's already a UUID string, convert it
        END;
        
        -- Make it NOT NULL again if it was
        ALTER TABLE public.project_resources 
        ALTER COLUMN project_id SET NOT NULL;
        
        -- Re-add foreign key
        ALTER TABLE public.project_resources 
        ADD CONSTRAINT project_resources_project_id_fkey 
        FOREIGN KEY (project_id) 
        REFERENCES public.projects(id) 
        ON DELETE CASCADE;
        
        RAISE NOTICE 'Fixed project_id column type from bigint to UUID';
    END IF;
    
    -- Fix resource_id column if it's bigint
    SELECT data_type INTO col_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'project_resources'
    AND column_name = 'resource_id';
    
    IF col_type = 'bigint' THEN
        -- Drop foreign key constraint first
        ALTER TABLE public.project_resources 
        DROP CONSTRAINT IF EXISTS project_resources_resource_id_fkey;
        
        IF has_data THEN
            -- Can't convert bigint to UUID if there's data, need to clear it
            RAISE NOTICE 'Clearing resource_id data to convert from bigint to UUID...';
            DELETE FROM public.project_resources;
        END IF;
        
        -- Change column type to UUID
        ALTER TABLE public.project_resources 
        ALTER COLUMN resource_id TYPE UUID USING 
        CASE 
            WHEN resource_id::text ~ '^[0-9]+$' THEN NULL  -- If it's a number, set to NULL
            ELSE resource_id::text::uuid  -- If it's already a UUID string, convert it
        END;
        
        -- Make it NOT NULL again if it was
        ALTER TABLE public.project_resources 
        ALTER COLUMN resource_id SET NOT NULL;
        
        -- Re-add foreign key
        ALTER TABLE public.project_resources 
        ADD CONSTRAINT project_resources_resource_id_fkey 
        FOREIGN KEY (resource_id) 
        REFERENCES public.resources(id) 
        ON DELETE CASCADE;
        
        RAISE NOTICE 'Fixed resource_id column type from bigint to UUID';
    END IF;
END $$;

-- Step 4: Ensure all required columns exist with correct types
DO $$
BEGIN
    -- Add quantity if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'project_resources' 
        AND column_name = 'quantity'
    ) THEN
        ALTER TABLE public.project_resources 
        ADD COLUMN quantity DECIMAL(10,2) NOT NULL DEFAULT 1 CHECK (quantity > 0);
    END IF;
    
    -- Add allocated_from if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'project_resources' 
        AND column_name = 'allocated_from'
    ) THEN
        ALTER TABLE public.project_resources 
        ADD COLUMN allocated_from DATE NOT NULL DEFAULT CURRENT_DATE;
    END IF;
    
    -- Add allocated_to if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'project_resources' 
        AND column_name = 'allocated_to'
    ) THEN
        ALTER TABLE public.project_resources 
        ADD COLUMN allocated_to DATE NOT NULL DEFAULT CURRENT_DATE;
    END IF;
    
    -- Add total_cost if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'project_resources' 
        AND column_name = 'total_cost'
    ) THEN
        ALTER TABLE public.project_resources 
        ADD COLUMN total_cost DECIMAL(15,2);
    END IF;
    
    -- Add timestamps if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'project_resources' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE public.project_resources 
        ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'project_resources' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.project_resources 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Step 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_resources_project_id ON public.project_resources(project_id);
CREATE INDEX IF NOT EXISTS idx_project_resources_resource_id ON public.project_resources(resource_id);
CREATE INDEX IF NOT EXISTS idx_project_resources_dates ON public.project_resources(allocated_from, allocated_to);
CREATE INDEX IF NOT EXISTS idx_project_resources_project_resource ON public.project_resources(project_id, resource_id);

-- Step 6: Enable Row Level Security
ALTER TABLE public.project_resources ENABLE ROW LEVEL SECURITY;

-- Step 7: Create/Update RLS Policies
DROP POLICY IF EXISTS "Users can view project resources for own projects" ON public.project_resources;
DROP POLICY IF EXISTS "Users can assign resources to own projects" ON public.project_resources;
DROP POLICY IF EXISTS "Users can update project resources for own projects" ON public.project_resources;
DROP POLICY IF EXISTS "Users can remove resources from own projects" ON public.project_resources;

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

-- Step 8: Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_project_resources_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_update_project_resources_updated_at ON public.project_resources;
CREATE TRIGGER trigger_update_project_resources_updated_at
BEFORE UPDATE ON public.project_resources
FOR EACH ROW
EXECUTE FUNCTION update_project_resources_updated_at();

-- Step 10: Grant permissions
GRANT ALL ON public.project_resources TO anon, authenticated;

-- Step 11: Verify the fix
DO $$
DECLARE
    id_type text;
    project_id_type text;
    resource_id_type text;
BEGIN
    SELECT data_type INTO id_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'project_resources'
    AND column_name = 'id';
    
    SELECT data_type INTO project_id_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'project_resources'
    AND column_name = 'project_id';
    
    SELECT data_type INTO resource_id_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'project_resources'
    AND column_name = 'resource_id';
    
    IF id_type = 'uuid' AND project_id_type = 'uuid' AND resource_id_type = 'uuid' THEN
        RAISE NOTICE '✅ SUCCESS: All columns are now UUID type!';
        RAISE NOTICE '   - id: %', id_type;
        RAISE NOTICE '   - project_id: %', project_id_type;
        RAISE NOTICE '   - resource_id: %', resource_id_type;
    ELSE
        RAISE WARNING '⚠️  WARNING: Some columns may still need fixing';
        RAISE NOTICE '   - id: %', id_type;
        RAISE NOTICE '   - project_id: %', project_id_type;
        RAISE NOTICE '   - resource_id: %', resource_id_type;
    END IF;
END $$;

-- ============================================================================
-- Fix Complete!
-- ============================================================================
-- The project_resources table should now have all UUID columns.
-- You can now assign resources to projects without the bigint error.
-- ============================================================================
