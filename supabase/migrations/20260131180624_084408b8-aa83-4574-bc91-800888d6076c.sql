-- Drop and recreate invoices policies for clarity

-- First drop existing policies
DROP POLICY IF EXISTS "Authenticated users can view all invoices" ON public.invoices;
DROP POLICY IF EXISTS "Permitted users can insert invoices" ON public.invoices;
DROP POLICY IF EXISTS "Permitted users can update invoices" ON public.invoices;
DROP POLICY IF EXISTS "Permitted users can delete invoices" ON public.invoices;

-- SELECT: All authenticated users can view non-deleted invoices
CREATE POLICY "Authenticated users can view invoices"
ON public.invoices
FOR SELECT
TO authenticated
USING (is_deleted = false);

-- INSERT: Admin or users with can_manage_invoices permission (must own the record)
CREATE POLICY "Permitted users can insert invoices"
ON public.invoices
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_permission(auth.uid(), 'can_manage_invoices'::text))
);

-- UPDATE: Admin or users with can_manage_invoices permission
-- WITH CHECK (true) allows soft delete to work
CREATE POLICY "Permitted users can update invoices"
ON public.invoices
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_permission(auth.uid(), 'can_manage_invoices'::text))
WITH CHECK (true);

-- DELETE: Admin or users with can_manage_invoices permission (for hard delete if ever needed)
CREATE POLICY "Permitted users can delete invoices"
ON public.invoices
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_permission(auth.uid(), 'can_manage_invoices'::text));