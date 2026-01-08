-- Add quantity column to resources table if it doesn't exist
-- This allows resources in the catalog to have a base quantity

DO $$
BEGIN
    -- Add quantity column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'resources' 
        AND column_name = 'quantity'
    ) THEN
        ALTER TABLE public.resources 
        ADD COLUMN quantity DECIMAL(10,2) DEFAULT 0 CHECK (quantity >= 0);
        
        -- Add comment
        COMMENT ON COLUMN public.resources.quantity IS 'Base quantity available in the resource catalog';
    END IF;
END $$;
