-- ============================================================================
-- Fix project_resource table schema
-- ============================================================================
-- This script fixes the project_resource table to ensure:
-- 1. Column types are correct (UUID, not bigint)
-- 2. Table name matches (project_resource or project_resources)
-- ============================================================================

-- Option 1: If table is named project_resource (singular), rename it to project_resources (plural)
-- OR create project_resources if it doesn't exist
DO $$
BEGIN
    -- Check if project_resource (singular) exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'project_resource'
    ) THEN
        -- Rename to project_resources (plural) to match code
        ALTER TABLE public.project_resource RENAME TO project_resources;
        RAISE NOTICE 'Renamed project_resource to project_resources';
    END IF;
END $$;

-- Ensure project_resources table exists with correct schema
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

-- Fix column types if they're wrong (bigint instead of UUID)
DO $$
BEGIN
    -- Fix project_id if it's bigint
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'project_resources' 
        AND column_name = 'project_id'
        AND data_type = 'bigint'
    ) THEN
        -- Drop foreign key constraint first
        ALTER TABLE public.project_resources 
        DROP CONSTRAINT IF EXISTS project_resources_project_id_fkey;
        
        -- Change column type to UUID
        ALTER TABLE public.project_resources 
        ALTER COLUMN project_id TYPE UUID USING project_id::text::uuid;
        
        -- Re-add foreign key
        ALTER TABLE public.project_resources 
        ADD CONSTRAINT project_resources_project_id_fkey 
        FOREIGN KEY (project_id) 
        REFERENCES public.projects(id) 
        ON DELETE CASCADE;
        
        RAISE NOTICE 'Fixed project_id column type from bigint to UUID';
    END IF;
    
    -- Fix resource_id if it's bigint
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'project_resources' 
        AND column_name = 'resource_id'
        AND data_type = 'bigint'
    ) THEN
        -- Drop foreign key constraint first
        ALTER TABLE public.project_resources 
        DROP CONSTRAINT IF EXISTS project_resources_resource_id_fkey;
        
        -- Change column type to UUID
        ALTER TABLE public.project_resources 
        ALTER COLUMN resource_id TYPE UUID USING resource_id::text::uuid;
        
        -- Re-add foreign key
        ALTER TABLE public.project_resources 
        ADD CONSTRAINT project_resources_resource_id_fkey 
        FOREIGN KEY (resource_id) 
        REFERENCES public.resources(id) 
        ON DELETE CASCADE;
        
        RAISE NOTICE 'Fixed resource_id column type from bigint to UUID';
    END IF;
    
    -- Fix id if it's bigint
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'project_resources' 
        AND column_name = 'id'
        AND data_type = 'bigint'
    ) THEN
        -- Drop primary key constraint first
        ALTER TABLE public.project_resources 
        DROP CONSTRAINT IF EXISTS project_resources_pkey;
        
        -- Change column type to UUID
        ALTER TABLE public.project_resources 
        ALTER COLUMN id TYPE UUID USING id::text::uuid;
        
        -- Re-add primary key
        ALTER TABLE public.project_resources 
        ADD CONSTRAINT project_resources_pkey PRIMARY KEY (id);
        
        RAISE NOTICE 'Fixed id column type from bigint to UUID';
    END IF;
END $$;

-- Ensure all required columns exist
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_project_resources_project_id ON public.project_resources(project_id);
CREATE INDEX IF NOT EXISTS idx_project_resources_resource_id ON public.project_resources(resource_id);
CREATE INDEX IF NOT EXISTS idx_project_resources_dates ON public.project_resources(allocated_from, allocated_to);

-- Enable RLS
ALTER TABLE public.project_resources ENABLE ROW LEVEL SECURITY;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'project_resources table schema fix completed!';
    RAISE NOTICE 'All UUID columns are now properly typed.';
END $$;

