-- Update services DELETE policy to admin-only with direct EXISTS check
DROP POLICY IF EXISTS "Permitted users can delete services" ON public.services;

CREATE POLICY "services_delete_admin"
ON public.services
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

-- Update projects DELETE policy to admin-only with direct EXISTS check
DROP POLICY IF EXISTS "Permitted users can delete projects" ON public.projects;

CREATE POLICY "projects_delete_admin"
ON public.projects
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