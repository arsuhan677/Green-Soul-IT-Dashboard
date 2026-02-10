-- Fully-qualify has_role() in RLS policies to avoid search_path resolution issues

-- =====================
-- INVOICES
-- =====================
DROP POLICY IF EXISTS "invoices_insert_admin" ON public.invoices;
DROP POLICY IF EXISTS "invoices_update_admin" ON public.invoices;
DROP POLICY IF EXISTS "invoices_delete_admin" ON public.invoices;

CREATE POLICY "invoices_insert_admin"
ON public.invoices
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "invoices_update_admin"
ON public.invoices
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (true);

CREATE POLICY "invoices_delete_admin"
ON public.invoices
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- =====================
-- QUOTATIONS
-- =====================
DROP POLICY IF EXISTS "quotations_insert_admin" ON public.quotations;
DROP POLICY IF EXISTS "quotations_update_admin" ON public.quotations;
DROP POLICY IF EXISTS "quotations_delete_admin" ON public.quotations;

CREATE POLICY "quotations_insert_admin"
ON public.quotations
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "quotations_update_admin"
ON public.quotations
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (true);

CREATE POLICY "quotations_delete_admin"
ON public.quotations
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));