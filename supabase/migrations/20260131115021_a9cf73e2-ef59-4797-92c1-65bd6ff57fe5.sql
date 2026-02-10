-- Drop existing policies
DROP POLICY IF EXISTS "Permitted users can update clients" ON public.clients;
DROP POLICY IF EXISTS "Permitted users can delete clients" ON public.clients;
DROP POLICY IF EXISTS "Permitted users can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can view all clients" ON public.clients;

-- SELECT: All authenticated users can view non-deleted clients
CREATE POLICY "Authenticated users can view all clients"
ON public.clients
FOR SELECT
TO authenticated
USING (is_deleted = false);

-- INSERT: Authenticated users with permission or admin can insert
-- Must set user_id to their own id
CREATE POLICY "Permitted users can insert clients"
ON public.clients
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_permission(auth.uid(), 'can_manage_clients')
  )
);

-- UPDATE: Admin or users with can_manage_clients permission can update any client
-- WITH CHECK allows the update to proceed (including soft delete)
CREATE POLICY "Permitted users can update clients"
ON public.clients
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_permission(auth.uid(), 'can_manage_clients')
)
WITH CHECK (true);

-- DELETE: Admin or users with can_manage_clients permission can delete
CREATE POLICY "Permitted users can delete clients"
ON public.clients
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_permission(auth.uid(), 'can_manage_clients')
);