-- Add dependencies and duration fields to tasks table
-- This allows tasks to reference other tasks and specify duration in days

DO $$
BEGIN
    -- Add dependencies field (JSONB array of task IDs)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tasks' 
        AND column_name = 'dependencies'
    ) THEN
        ALTER TABLE public.tasks 
        ADD COLUMN dependencies JSONB DEFAULT '[]'::jsonb;
        
        COMMENT ON COLUMN public.tasks.dependencies IS 'Array of task IDs that this task depends on';
    END IF;
    
    -- Add duration_days field for task duration
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tasks' 
        AND column_name = 'duration_days'
    ) THEN
        ALTER TABLE public.tasks 
        ADD COLUMN duration_days INTEGER;
        
        COMMENT ON COLUMN public.tasks.duration_days IS 'Duration of task in days';
    END IF;
END $$;

-- Create index for faster dependency queries
CREATE INDEX IF NOT EXISTS idx_tasks_dependencies ON public.tasks USING GIN (dependencies);
