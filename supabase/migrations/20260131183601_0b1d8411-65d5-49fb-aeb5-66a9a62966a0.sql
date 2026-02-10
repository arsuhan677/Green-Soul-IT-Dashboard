-- Update leads DELETE policy to use direct EXISTS on user_roles (like invoices/quotations)

DROP POLICY IF EXISTS "Permitted users can delete leads" ON public.leads;

CREATE POLICY "leads_delete_admin"
ON public.leads
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