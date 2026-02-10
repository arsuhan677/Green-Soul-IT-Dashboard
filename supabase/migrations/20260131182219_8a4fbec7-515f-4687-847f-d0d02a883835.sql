-- Replace has_role() usage in invoices/quotations RLS with direct EXISTS on user_roles
-- to avoid any function resolution/security-definer edge cases.

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
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'::app_role
  )
);

CREATE POLICY "invoices_update_admin"
ON public.invoices
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'::app_role
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'::app_role
  )
);

CREATE POLICY "invoices_delete_admin"
ON public.invoices
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'::app_role
  )
);

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
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'::app_role
  )
);

CREATE POLICY "quotations_update_admin"
ON public.quotations
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'::app_role
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'::app_role
  )
);

CREATE POLICY "quotations_delete_admin"
ON public.quotations
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'::app_role
  )
);