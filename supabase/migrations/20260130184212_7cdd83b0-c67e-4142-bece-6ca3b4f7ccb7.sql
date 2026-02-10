-- Drop existing SELECT policy for clients
DROP POLICY IF EXISTS "Users can view their own clients" ON public.clients;

-- Create new policy: All authenticated users can view all clients
CREATE POLICY "Authenticated users can view all clients"
ON public.clients
FOR SELECT
TO authenticated
USING (is_deleted = false);

-- Add created_by_name column to store the creator's name for display
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS created_by_name text;