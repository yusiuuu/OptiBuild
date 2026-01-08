-- Add phase/folder support to tasks table
-- This allows organizing tasks into phases and sub-phases like the construction project structure

DO $$
BEGIN
    -- Add phase field if missing (stores the full path like "PHASE 1: PRE-CONSTRUCTION & PLANNING > 1.1 Project Initiation")
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tasks' 
        AND column_name = 'phase'
    ) THEN
        ALTER TABLE public.tasks 
        ADD COLUMN phase TEXT;
        
        COMMENT ON COLUMN public.tasks.phase IS 'Task phase/folder path for organization (e.g., "PHASE 1: PRE-CONSTRUCTION > 1.1 Project Initiation")';
    END IF;
    
    -- Add phase_order field for sorting within phases
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tasks' 
        AND column_name = 'phase_order'
    ) THEN
        ALTER TABLE public.tasks 
        ADD COLUMN phase_order INTEGER DEFAULT 0;
        
        COMMENT ON COLUMN public.tasks.phase_order IS 'Order of task within its phase for proper sequencing';
    END IF;
END $$;

-- Create index for faster phase-based queries
CREATE INDEX IF NOT EXISTS idx_tasks_phase ON public.tasks(phase);
CREATE INDEX IF NOT EXISTS idx_tasks_phase_order ON public.tasks(phase, phase_order);
