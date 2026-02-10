-- Drop existing SELECT policy for leads
DROP POLICY IF EXISTS "Users can view their own leads" ON public.leads;

-- Create new policy: All authenticated users can view all leads
CREATE POLICY "Authenticated users can view all leads"
ON public.leads
FOR SELECT
TO authenticated
USING (is_deleted = false);

-- Keep existing INSERT/UPDATE/DELETE policies for permission-based control
-- They already check auth.uid() = user_id which is fine for ownership-based writes