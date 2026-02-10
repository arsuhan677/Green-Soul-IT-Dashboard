-- Update clients DELETE policy to admin-only with direct EXISTS check
DROP POLICY IF EXISTS "Permitted users can delete clients" ON public.clients;

CREATE POLICY "clients_delete_admin"
ON public.clients
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