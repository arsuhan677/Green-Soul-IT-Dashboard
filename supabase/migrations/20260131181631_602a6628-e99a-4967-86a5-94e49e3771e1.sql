-- =============================================
-- FIX RLS POLICIES FOR invoices AND quotations
-- Admin-only write, All authenticated can read
-- Using existing has_role() function
-- =============================================

-- =============================================
-- INVOICES TABLE
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can view invoices" ON public.invoices;
DROP POLICY IF EXISTS "Authenticated users can view all invoices" ON public.invoices;
DROP POLICY IF EXISTS "Permitted users can insert invoices" ON public.invoices;
DROP POLICY IF EXISTS "Permitted users can update invoices" ON public.invoices;
DROP POLICY IF EXISTS "Permitted users can delete invoices" ON public.invoices;

-- SELECT: All authenticated users can view non-deleted invoices
CREATE POLICY "invoices_select_all_auth"
ON public.invoices
FOR SELECT
TO authenticated
USING (is_deleted = false);

-- INSERT: Admin only
CREATE POLICY "invoices_insert_admin"
ON public.invoices
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
);

-- UPDATE: Admin only (WITH CHECK true for soft delete to work)
CREATE POLICY "invoices_update_admin"
ON public.invoices
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (true);

-- DELETE: Admin only (for hard delete if needed)
CREATE POLICY "invoices_delete_admin"
ON public.invoices
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- QUOTATIONS TABLE
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can view quotations" ON public.quotations;
DROP POLICY IF EXISTS "Authenticated users can view all quotations" ON public.quotations;
DROP POLICY IF EXISTS "Permitted users can insert quotations" ON public.quotations;
DROP POLICY IF EXISTS "Permitted users can update quotations" ON public.quotations;
DROP POLICY IF EXISTS "Permitted users can delete quotations" ON public.quotations;

-- SELECT: All authenticated users can view non-deleted quotations
CREATE POLICY "quotations_select_all_auth"
ON public.quotations
FOR SELECT
TO authenticated
USING (is_deleted = false);

-- INSERT: Admin only
CREATE POLICY "quotations_insert_admin"
ON public.quotations
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
);

-- UPDATE: Admin only (WITH CHECK true for soft delete to work)
CREATE POLICY "quotations_update_admin"
ON public.quotations
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (true);

-- DELETE: Admin only (for hard delete if needed)
CREATE POLICY "quotations_delete_admin"
ON public.quotations
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));