-- Add created_by_name column to store the creator's name for display
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS created_by_name text;