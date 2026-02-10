-- =============================================
-- UNIFIED RLS POLICIES FOR ALL CORE TABLES
-- Admin + Permission-based write access
-- All authenticated users can read
-- Soft delete support with WITH CHECK (true)
-- =============================================

-- ===================
-- 1. LEADS TABLE
-- ===================
DROP POLICY IF EXISTS "Authenticated users can view all leads" ON public.leads;
DROP POLICY IF EXISTS "Users can insert their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can update their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can delete their own leads" ON public.leads;

-- SELECT: All authenticated can view non-deleted
CREATE POLICY "Authenticated users can view all leads"
ON public.leads
FOR SELECT
TO authenticated
USING (is_deleted = false);

-- INSERT: Admin or can_manage_leads permission
CREATE POLICY "Permitted users can insert leads"
ON public.leads
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_permission(auth.uid(), 'can_manage_leads')
  )
);

-- UPDATE: Admin or can_manage_leads permission (WITH CHECK true for soft delete)
CREATE POLICY "Permitted users can update leads"
ON public.leads
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_permission(auth.uid(), 'can_manage_leads')
)
WITH CHECK (true);

-- DELETE: Admin or can_manage_leads permission
CREATE POLICY "Permitted users can delete leads"
ON public.leads
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_permission(auth.uid(), 'can_manage_leads')
);

-- ===================
-- 2. PROJECTS TABLE
-- ===================
DROP POLICY IF EXISTS "Users can view their own or assigned projects" ON public.projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update their own or assigned projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;

-- SELECT: All authenticated can view non-deleted (or assigned)
CREATE POLICY "Authenticated users can view all projects"
ON public.projects
FOR SELECT
TO authenticated
USING (is_deleted = false);

-- INSERT: Admin or can_manage_projects permission
CREATE POLICY "Permitted users can insert projects"
ON public.projects
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_permission(auth.uid(), 'can_manage_projects')
  )
);

-- UPDATE: Admin or can_manage_projects or assigned team member
CREATE POLICY "Permitted users can update projects"
ON public.projects
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_permission(auth.uid(), 'can_manage_projects')
  OR auth.uid() = ANY (assigned_team)
)
WITH CHECK (true);

-- DELETE: Admin or can_manage_projects permission
CREATE POLICY "Permitted users can delete projects"
ON public.projects
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_permission(auth.uid(), 'can_manage_projects')
);

-- ===================
-- 3. SERVICES TABLE
-- ===================
DROP POLICY IF EXISTS "Users can view their own services" ON public.services;
DROP POLICY IF EXISTS "Users can insert their own services" ON public.services;
DROP POLICY IF EXISTS "Users can update their own services" ON public.services;
DROP POLICY IF EXISTS "Users can delete their own services" ON public.services;

-- SELECT: All authenticated can view non-deleted
CREATE POLICY "Authenticated users can view all services"
ON public.services
FOR SELECT
TO authenticated
USING (is_deleted = false);

-- INSERT: Admin or can_manage_services permission
CREATE POLICY "Permitted users can insert services"
ON public.services
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_permission(auth.uid(), 'can_manage_services')
  )
);

-- UPDATE: Admin or can_manage_services permission
CREATE POLICY "Permitted users can update services"
ON public.services
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_permission(auth.uid(), 'can_manage_services')
)
WITH CHECK (true);

-- DELETE: Admin or can_manage_services permission
CREATE POLICY "Permitted users can delete services"
ON public.services
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_permission(auth.uid(), 'can_manage_services')
);

-- ===================
-- 4. INVOICES TABLE
-- ===================
DROP POLICY IF EXISTS "Users can view their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can insert their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can update their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can delete their own invoices" ON public.invoices;

-- SELECT: All authenticated can view non-deleted
CREATE POLICY "Authenticated users can view all invoices"
ON public.invoices
FOR SELECT
TO authenticated
USING (is_deleted = false);

-- INSERT: Admin or can_manage_invoices permission
CREATE POLICY "Permitted users can insert invoices"
ON public.invoices
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_permission(auth.uid(), 'can_manage_invoices')
  )
);

-- UPDATE: Admin or can_manage_invoices permission
CREATE POLICY "Permitted users can update invoices"
ON public.invoices
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_permission(auth.uid(), 'can_manage_invoices')
)
WITH CHECK (true);

-- DELETE: Admin or can_manage_invoices permission
CREATE POLICY "Permitted users can delete invoices"
ON public.invoices
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_permission(auth.uid(), 'can_manage_invoices')
);

-- ===================
-- 5. PAYMENTS TABLE
-- ===================
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can insert their own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can update their own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can delete their own payments" ON public.payments;

-- SELECT: All authenticated can view non-deleted
CREATE POLICY "Authenticated users can view all payments"
ON public.payments
FOR SELECT
TO authenticated
USING (is_deleted = false);

-- INSERT: Admin or can_manage_payments permission
CREATE POLICY "Permitted users can insert payments"
ON public.payments
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_permission(auth.uid(), 'can_manage_payments')
  )
);

-- UPDATE: Admin or can_manage_payments permission
CREATE POLICY "Permitted users can update payments"
ON public.payments
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_permission(auth.uid(), 'can_manage_payments')
)
WITH CHECK (true);

-- DELETE: Admin or can_manage_payments permission
CREATE POLICY "Permitted users can delete payments"
ON public.payments
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_permission(auth.uid(), 'can_manage_payments')
);