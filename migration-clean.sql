-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'sales', 'project_manager', 'staff', 'client');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;
-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);
-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  USING (public.has_role(auth.uid(), 'admin'));
-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
-- Trigger to auto-create profile and assign default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'à¦¨à¦¤à§à¦¨ à¦¬à§à¦¯à¦¬à¦¹à¦¾à¦°à¦•à¦¾à¦°à§€'), NEW.email);
  
  -- Assign default 'admin' role for first user, 'staff' for others
  INSERT INTO public.user_roles (user_id, role)
  SELECT NEW.id, 
    CASE 
      WHEN (SELECT COUNT(*) FROM public.user_roles) = 0 THEN 'admin'::app_role
      ELSE 'staff'::app_role
    END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
  NEW.updated_at = now();
$$ LANGUAGE plpgsql SET search_path = public;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- Create services table
CREATE TABLE public.services (
  category TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  delivery_time TEXT,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMP WITH TIME ZONE,
-- Create leads table
CREATE TABLE public.leads (
  phone TEXT NOT NULL,
  email TEXT,
  company TEXT,
  service_id UUID REFERENCES public.services(id),
  source TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'à¦¨à¦¤à§à¦¨',
  notes JSONB DEFAULT '[]'::jsonb,
  next_follow_up_at TIMESTAMP WITH TIME ZONE,
  assigned_to UUID REFERENCES auth.users(id),
-- Create clients table
CREATE TABLE public.clients (
  address TEXT,
  social_links TEXT[],
-- Create projects table
CREATE TABLE public.projects (
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  budget NUMERIC NOT NULL DEFAULT 0,
  start_date DATE,
  deadline DATE,
  status TEXT NOT NULL DEFAULT 'à¦šà¦²à¦®à¦¾à¦¨',
  progress INTEGER NOT NULL DEFAULT 0,
  assigned_team UUID[],
-- Create invoices table
CREATE TABLE public.invoices (
  invoice_number TEXT NOT NULL UNIQUE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  tax NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'à¦¬à¦•à§‡à¦¯à¦¼à¦¾',
-- Create payments table
CREATE TABLE public.payments (
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL,
  method TEXT NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  note TEXT,
-- Enable RLS on all tables
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
-- RLS policies for services
CREATE POLICY "Users can view their own services" ON public.services FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own services" ON public.services FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own services" ON public.services FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own services" ON public.services FOR DELETE USING (auth.uid() = user_id);
-- RLS policies for leads
CREATE POLICY "Users can view their own leads" ON public.leads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own leads" ON public.leads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own leads" ON public.leads FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own leads" ON public.leads FOR DELETE USING (auth.uid() = user_id);
-- RLS policies for clients
CREATE POLICY "Users can view their own clients" ON public.clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own clients" ON public.clients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own clients" ON public.clients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own clients" ON public.clients FOR DELETE USING (auth.uid() = user_id);
-- RLS policies for projects
CREATE POLICY "Users can view their own projects" ON public.projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own projects" ON public.projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own projects" ON public.projects FOR DELETE USING (auth.uid() = user_id);
-- RLS policies for invoices
CREATE POLICY "Users can view their own invoices" ON public.invoices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own invoices" ON public.invoices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own invoices" ON public.invoices FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own invoices" ON public.invoices FOR DELETE USING (auth.uid() = user_id);
-- RLS policies for payments
CREATE POLICY "Users can view their own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own payments" ON public.payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own payments" ON public.payments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own payments" ON public.payments FOR DELETE USING (auth.uid() = user_id);
-- Triggers for updated_at
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- Create indexes for better performance
CREATE INDEX idx_leads_is_deleted ON public.leads(is_deleted);
CREATE INDEX idx_leads_user_id ON public.leads(user_id);
CREATE INDEX idx_clients_is_deleted ON public.clients(is_deleted);
CREATE INDEX idx_clients_user_id ON public.clients(user_id);
CREATE INDEX idx_projects_is_deleted ON public.projects(is_deleted);
CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_invoices_is_deleted ON public.invoices(is_deleted);
CREATE INDEX idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX idx_payments_invoice_id ON public.payments(invoice_id);
-- Create custom_roles table for dynamic role names
CREATE TABLE public.custom_roles (
  role_name_bn TEXT NOT NULL,
  role_name_en TEXT,
  permissions JSONB DEFAULT '[]'::jsonb,
-- Enable RLS on custom_roles
ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;
-- Only admins can manage custom roles
ON public.custom_roles
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));
-- All authenticated users can view roles
CREATE POLICY "Authenticated users can view roles"
FOR SELECT
TO authenticated
USING (is_deleted = false);
-- Add custom_role_id to profiles for dynamic role assignment
ALTER TABLE public.profiles 
ADD COLUMN custom_role_id UUID REFERENCES public.custom_roles(id),
ADD COLUMN phone TEXT,
ADD COLUMN active BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
-- Create trigger for updated_at on custom_roles
CREATE TRIGGER update_custom_roles_updated_at
BEFORE UPDATE ON public.custom_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Insert default roles in Bengali
INSERT INTO public.custom_roles (role_name_bn, role_name_en, permissions, description) VALUES
('à¦…à§à¦¯à¦¾à¦¡à¦®à¦¿à¦¨', 'admin', '["all"]', 'à¦¸à¦®à§à¦ªà§‚à¦°à§à¦£ à¦…à§à¦¯à¦¾à¦•à§à¦¸à§‡à¦¸'),
('à¦¸à§‡à¦²à¦¸', 'sales', '["leads", "clients", "followups", "view_projects"]', 'à¦²à¦¿à¦¡ à¦à¦¬à¦‚ à¦•à§à¦²à¦¾à¦¯à¦¼à§‡à¦¨à§à¦Ÿ à¦®à§à¦¯à¦¾à¦¨à§‡à¦œà¦®à§‡à¦¨à§à¦Ÿ'),
('à¦ªà§à¦°à¦œà§‡à¦•à§à¦Ÿ à¦®à§à¦¯à¦¾à¦¨à§‡à¦œà¦¾à¦°', 'project_manager', '["projects", "tasks", "assign_team"]', 'à¦ªà§à¦°à¦œà§‡à¦•à§à¦Ÿ à¦à¦¬à¦‚ à¦Ÿà¦¾à¦¸à§à¦• à¦®à§à¦¯à¦¾à¦¨à§‡à¦œà¦®à§‡à¦¨à§à¦Ÿ'),
('à¦¡à¦¿à¦œà¦¾à¦‡à¦¨à¦¾à¦°', 'designer', '["assigned_projects", "tasks", "comments"]', 'à¦…à§à¦¯à¦¾à¦¸à¦¾à¦‡à¦¨ à¦•à¦°à¦¾ à¦ªà§à¦°à¦œà§‡à¦•à§à¦Ÿà§‡ à¦•à¦¾à¦œ à¦•à¦°à¦¾'),
('à¦—à§à¦°à¦¾à¦«à¦¿à¦•à§à¦¸ à¦¡à¦¿à¦œà¦¾à¦‡à¦¨à¦¾à¦°', 'graphics_designer', '["assigned_projects", "tasks", "comments"]', 'à¦—à§à¦°à¦¾à¦«à¦¿à¦•à§à¦¸ à¦¡à¦¿à¦œà¦¾à¦‡à¦¨ à¦•à¦¾à¦œ'),
('à¦­à¦¿à¦¡à¦¿à¦“ à¦à¦¡à¦¿à¦Ÿà¦°', 'video_editor', '["assigned_projects", "tasks", "comments"]', 'à¦­à¦¿à¦¡à¦¿à¦“ à¦à¦¡à¦¿à¦Ÿà¦¿à¦‚ à¦•à¦¾à¦œ'),
('à¦¸à§à¦Ÿà¦¾à¦«', 'staff', '["assigned_projects", "tasks"]', 'à¦¸à¦¾à¦§à¦¾à¦°à¦£ à¦¸à§à¦Ÿà¦¾à¦« à¦…à§à¦¯à¦¾à¦•à§à¦¸à§‡à¦¸');
-- Create project_updates table for tracking changes
CREATE TABLE public.project_updates (
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  updated_by UUID NOT NULL,
  updated_by_name TEXT,
  change_type TEXT NOT NULL,
  change_note TEXT,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
-- Enable RLS on project_updates
ALTER TABLE public.project_updates ENABLE ROW LEVEL SECURITY;
-- Users can view updates for their projects
CREATE POLICY "Users can view their own project updates"
ON public.project_updates
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_updates.project_id 
    AND (projects.user_id = auth.uid() OR auth.uid() = ANY(projects.assigned_team))
-- Users can insert updates for assigned projects
CREATE POLICY "Users can insert updates for assigned projects"
FOR INSERT
WITH CHECK (
    WHERE projects.id = project_id 
-- Update projects RLS to allow assigned team members to view and update
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;
CREATE POLICY "Users can view their own or assigned projects"
ON public.projects
  auth.uid() = user_id 
  OR auth.uid() = ANY(assigned_team)
  OR has_role(auth.uid(), 'admin'::app_role)
DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
CREATE POLICY "Users can update their own or assigned projects"
FOR UPDATE
-- Admins can view all profiles for user management
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
ON public.profiles
-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles"
-- Create user_permissions table for granular access control
CREATE TABLE public.user_permissions (
  user_id UUID NOT NULL UNIQUE,
  can_view_dashboard BOOLEAN NOT NULL DEFAULT true,
  can_manage_leads BOOLEAN NOT NULL DEFAULT false,
  can_manage_clients BOOLEAN NOT NULL DEFAULT false,
  can_manage_projects BOOLEAN NOT NULL DEFAULT false,
  can_manage_tasks BOOLEAN NOT NULL DEFAULT false,
  can_manage_services BOOLEAN NOT NULL DEFAULT false,
  can_manage_invoices BOOLEAN NOT NULL DEFAULT false,
  can_manage_payments BOOLEAN NOT NULL DEFAULT false,
  can_manage_users BOOLEAN NOT NULL DEFAULT false,
  can_manage_roles BOOLEAN NOT NULL DEFAULT false,
  can_delete_records BOOLEAN NOT NULL DEFAULT false,
-- Create activity_logs table for audit trail
CREATE TABLE public.activity_logs (
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  module TEXT NOT NULL CHECK (module IN ('leads', 'clients', 'projects', 'tasks', 'services', 'invoices', 'payments', 'users', 'roles', 'permissions')),
  record_id UUID,
  record_title TEXT,
  performed_by_user_id UUID NOT NULL,
  performed_by_name TEXT,
  details TEXT,
  performed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
-- RLS for user_permissions: Admin can do everything, users can view their own
CREATE POLICY "Admins can manage all permissions"
ON public.user_permissions
USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own permissions"
USING (auth.uid() = user_id);
-- RLS for activity_logs: Admin can see all, users can see their own actions
CREATE POLICY "Admins can view all activity logs"
ON public.activity_logs
CREATE POLICY "Admins can insert activity logs"
WITH CHECK (true);
CREATE POLICY "Users can view own activity"
USING (auth.uid() = performed_by_user_id);
-- Function to auto-create permissions for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_permissions()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
  INSERT INTO public.user_permissions (user_id)
  VALUES (NEW.id);
-- Trigger to create permissions when a new auth user is created
CREATE TRIGGER on_auth_user_created_permissions
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_permissions();
-- Function to check if user has specific permission
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission text)
RETURNS boolean
DECLARE
  is_admin boolean;
  has_perm boolean;
  -- Check if user is admin (admin has all permissions)
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'
  ) INTO is_admin;
  IF is_admin THEN
    RETURN true;
  END IF;
  -- Check specific permission
  EXECUTE format('SELECT %I FROM public.user_permissions WHERE user_id = $1', _permission)
  INTO has_perm
  USING _user_id;
  RETURN COALESCE(has_perm, false);
-- Update timestamp trigger for user_permissions
CREATE TRIGGER update_user_permissions_updated_at
  BEFORE UPDATE ON public.user_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
-- Create index for faster activity log queries
CREATE INDEX idx_activity_logs_performed_at ON public.activity_logs(performed_at DESC);
CREATE INDEX idx_activity_logs_module ON public.activity_logs(module);
CREATE INDEX idx_activity_logs_user ON public.activity_logs(performed_by_user_id);
-- Fix the permissive RLS policy for activity_logs insert
DROP POLICY IF EXISTS "Admins can insert activity logs" ON public.activity_logs;
-- Create proper insert policy - any authenticated user can log their own actions
CREATE POLICY "Users can insert own activity logs"
WITH CHECK (auth.uid() = performed_by_user_id);
-- Drop existing SELECT policy for leads
DROP POLICY IF EXISTS "Users can view their own leads" ON public.leads;
-- Create new policy: All authenticated users can view all leads
CREATE POLICY "Authenticated users can view all leads"
ON public.leads
-- Keep existing INSERT/UPDATE/DELETE policies for permission-based control
-- They already check auth.uid() = user_id which is fine for ownership-based writes
-- Add created_by_name column to store the creator's name for display
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS created_by_name text;
-- Drop existing SELECT policy for clients
DROP POLICY IF EXISTS "Users can view their own clients" ON public.clients;
-- Create new policy: All authenticated users can view all clients
CREATE POLICY "Authenticated users can view all clients"
ON public.clients
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS created_by_name text;
-- Create company_settings table for storing company information and logo
CREATE TABLE public.company_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name_bn text NOT NULL DEFAULT 'à¦†à¦¶à¦®à¦¾ à¦Ÿà§‡à¦• à¦²à¦¿à¦®à¦¿à¦Ÿà§‡à¦¡',
  company_name_en text DEFAULT 'Ashma Tech Limited',
  phone text DEFAULT '',
  email text DEFAULT '',
  address text DEFAULT '',
  website text DEFAULT '',
  invoice_note_bn text DEFAULT '',
  logo_url text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
-- Enable Row Level Security
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
-- All authenticated users can view company settings
CREATE POLICY "All authenticated users can view company settings"
ON public.company_settings
USING (true);
-- Only admins can modify company settings
CREATE POLICY "Admins can manage company settings"
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
-- Insert default company settings record
INSERT INTO public.company_settings (
  company_name_bn, 
  company_name_en, 
  phone, 
  email, 
  address, 
  website,
  invoice_note_bn
) VALUES (
  'à¦†à¦¶à¦®à¦¾ à¦Ÿà§‡à¦• à¦²à¦¿à¦®à¦¿à¦Ÿà§‡à¦¡',
  'Ashma Tech Limited',
  '+880 1712-345678',
  'info@ashmatech.com',
  'à¦—à§à¦²à¦¶à¦¾à¦¨-à§¨, à¦¢à¦¾à¦•à¦¾ à§§à§¨à§§à§¨, à¦¬à¦¾à¦‚à¦²à¦¾à¦¦à§‡à¦¶',
  'https://ashmatech.com',
  ''
-- Create trigger for auto-updating updated_at
CREATE TRIGGER update_company_settings_updated_at
BEFORE UPDATE ON public.company_settings
-- Create storage bucket for company assets (logo)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('company-assets', 'company-assets', true);
-- Storage policies for company assets
CREATE POLICY "Anyone can view company assets"
ON storage.objects
USING (bucket_id = 'company-assets');
CREATE POLICY "Admins can upload company assets"
  bucket_id = 'company-assets' 
  AND has_role(auth.uid(), 'admin'::app_role)
CREATE POLICY "Admins can update company assets"
CREATE POLICY "Admins can delete company assets"
FOR DELETE
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can insert their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can update their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can delete their own clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can view all clients" ON public.clients;
-- SELECT: All authenticated users can view non-deleted clients
-- INSERT: Authenticated users with permission or admin can insert
CREATE POLICY "Permitted users can insert clients"
  AND (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_permission(auth.uid(), 'can_manage_clients')
-- UPDATE: Admin or users with can_manage_clients permission can update any client
-- Also allows users to update their own clients if they have permission
CREATE POLICY "Permitted users can update clients"
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_permission(auth.uid(), 'can_manage_clients')
-- DELETE: Admin or users with can_manage_clients permission can delete
CREATE POLICY "Permitted users can delete clients"
-- Drop existing policies
DROP POLICY IF EXISTS "Permitted users can update clients" ON public.clients;
DROP POLICY IF EXISTS "Permitted users can delete clients" ON public.clients;
DROP POLICY IF EXISTS "Permitted users can insert clients" ON public.clients;
-- Must set user_id to their own id
-- WITH CHECK allows the update to proceed (including soft delete)
)
-- =============================================
-- UNIFIED RLS POLICIES FOR ALL CORE TABLES
-- Admin + Permission-based write access
-- All authenticated users can read
-- Soft delete support with WITH CHECK (true)
-- ===================
-- 1. LEADS TABLE
DROP POLICY IF EXISTS "Authenticated users can view all leads" ON public.leads;
DROP POLICY IF EXISTS "Users can insert their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can update their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can delete their own leads" ON public.leads;
-- SELECT: All authenticated can view non-deleted
-- INSERT: Admin or can_manage_leads permission
CREATE POLICY "Permitted users can insert leads"
    OR has_permission(auth.uid(), 'can_manage_leads')
-- UPDATE: Admin or can_manage_leads permission (WITH CHECK true for soft delete)
CREATE POLICY "Permitted users can update leads"
  OR has_permission(auth.uid(), 'can_manage_leads')
-- DELETE: Admin or can_manage_leads permission
CREATE POLICY "Permitted users can delete leads"
-- 2. PROJECTS TABLE
DROP POLICY IF EXISTS "Users can view their own or assigned projects" ON public.projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update their own or assigned projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;
-- SELECT: All authenticated can view non-deleted (or assigned)
CREATE POLICY "Authenticated users can view all projects"
-- INSERT: Admin or can_manage_projects permission
CREATE POLICY "Permitted users can insert projects"
    OR has_permission(auth.uid(), 'can_manage_projects')
-- UPDATE: Admin or can_manage_projects or assigned team member
CREATE POLICY "Permitted users can update projects"
  OR has_permission(auth.uid(), 'can_manage_projects')
  OR auth.uid() = ANY (assigned_team)
-- DELETE: Admin or can_manage_projects permission
CREATE POLICY "Permitted users can delete projects"
-- 3. SERVICES TABLE
DROP POLICY IF EXISTS "Users can view their own services" ON public.services;
DROP POLICY IF EXISTS "Users can insert their own services" ON public.services;
DROP POLICY IF EXISTS "Users can update their own services" ON public.services;
DROP POLICY IF EXISTS "Users can delete their own services" ON public.services;
CREATE POLICY "Authenticated users can view all services"
ON public.services
-- INSERT: Admin or can_manage_services permission
CREATE POLICY "Permitted users can insert services"
    OR has_permission(auth.uid(), 'can_manage_services')
-- UPDATE: Admin or can_manage_services permission
CREATE POLICY "Permitted users can update services"
  OR has_permission(auth.uid(), 'can_manage_services')
-- DELETE: Admin or can_manage_services permission
CREATE POLICY "Permitted users can delete services"
-- 4. INVOICES TABLE
DROP POLICY IF EXISTS "Users can view their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can insert their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can update their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can delete their own invoices" ON public.invoices;
CREATE POLICY "Authenticated users can view all invoices"
ON public.invoices
-- INSERT: Admin or can_manage_invoices permission
CREATE POLICY "Permitted users can insert invoices"
    OR has_permission(auth.uid(), 'can_manage_invoices')
-- UPDATE: Admin or can_manage_invoices permission
CREATE POLICY "Permitted users can update invoices"
  OR has_permission(auth.uid(), 'can_manage_invoices')
-- DELETE: Admin or can_manage_invoices permission
CREATE POLICY "Permitted users can delete invoices"
-- 5. PAYMENTS TABLE
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can insert their own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can update their own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can delete their own payments" ON public.payments;
CREATE POLICY "Authenticated users can view all payments"
ON public.payments
-- INSERT: Admin or can_manage_payments permission
CREATE POLICY "Permitted users can insert payments"
    OR has_permission(auth.uid(), 'can_manage_payments')
-- UPDATE: Admin or can_manage_payments permission
CREATE POLICY "Permitted users can update payments"
  OR has_permission(auth.uid(), 'can_manage_payments')
-- DELETE: Admin or can_manage_payments permission
CREATE POLICY "Permitted users can delete payments"
-- Create project_notes table for date-wise notes with timeline
CREATE TABLE public.project_notes (
  note_date DATE NOT NULL,
  note_time TEXT,
  note_type TEXT DEFAULT 'à¦†à¦ªà¦¡à§‡à¦Ÿ',
  note_text TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_by_name TEXT,
ALTER TABLE public.project_notes ENABLE ROW LEVEL SECURITY;
-- SELECT: Authenticated users can view notes for projects they're assigned to or all if admin
CREATE POLICY "Authenticated users can view project notes"
ON public.project_notes
FOR SELECT TO authenticated
  is_deleted = false AND
  (
    has_role(auth.uid(), 'admin'::app_role) OR
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_notes.project_id
      AND (p.user_id = auth.uid() OR auth.uid() = ANY(p.assigned_team))
    )
-- INSERT: Admin or users assigned to the project can add notes
CREATE POLICY "Permitted users can insert project notes"
FOR INSERT TO authenticated
  auth.uid() = created_by AND
-- UPDATE: Admin or note creator can update
CREATE POLICY "Permitted users can update project notes"
FOR UPDATE TO authenticated
  has_role(auth.uid(), 'admin'::app_role) OR created_by = auth.uid()
-- DELETE: Only admin can delete
CREATE POLICY "Admins can delete project notes"
FOR DELETE TO authenticated
-- Add trigger for updated_at
CREATE TRIGGER update_project_notes_updated_at
BEFORE UPDATE ON public.project_notes
-- Create index for faster queries
CREATE INDEX idx_project_notes_project_id ON public.project_notes(project_id);
CREATE INDEX idx_project_notes_note_date ON public.project_notes(note_date DESC);
-- Comment for documentation
COMMENT ON TABLE public.project_notes IS 'Date-wise notes/updates for projects with timeline view';
-- Create quotations table for professional quotes
CREATE TABLE public.quotations (
  quote_number TEXT NOT NULL,
  client_id UUID REFERENCES public.clients(id),
  client_name TEXT,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE,
  grand_total NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'à¦–à¦¸à¦¡à¦¼à¦¾',
-- Add from_quote_id to invoices table (link invoice to quotation)
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS from_quote_id UUID REFERENCES public.quotations(id),
ADD COLUMN IF NOT EXISTS issue_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS due_date DATE;
-- Enable RLS on quotations
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
-- SELECT: Authenticated users can view non-deleted quotations
CREATE POLICY "Authenticated users can view quotations"
ON public.quotations
-- INSERT: Admin or users with can_manage_invoices permission
CREATE POLICY "Permitted users can insert quotations"
  (has_role(auth.uid(), 'admin'::app_role) OR has_permission(auth.uid(), 'can_manage_invoices'))
-- UPDATE: Admin or users with can_manage_invoices permission
CREATE POLICY "Permitted users can update quotations"
  has_role(auth.uid(), 'admin'::app_role) OR has_permission(auth.uid(), 'can_manage_invoices')
-- DELETE: Admin or users with can_manage_invoices permission
CREATE POLICY "Permitted users can delete quotations"
-- Trigger for updated_at
CREATE TRIGGER update_quotations_updated_at
BEFORE UPDATE ON public.quotations
-- Create indexes
CREATE INDEX idx_quotations_client_id ON public.quotations(client_id);
CREATE INDEX idx_quotations_status ON public.quotations(status);
CREATE INDEX idx_quotations_quote_number ON public.quotations(quote_number);
CREATE INDEX idx_invoices_from_quote_id ON public.invoices(from_quote_id);
-- Comment
COMMENT ON TABLE public.quotations IS 'Professional quotations that can be converted to invoices';
-- Add client_code to clients table
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS client_code TEXT UNIQUE;
-- Create function to generate client code
CREATE OR REPLACE FUNCTION public.generate_client_code()
  next_num INTEGER;
  SELECT COALESCE(MAX(CAST(SUBSTRING(client_code FROM 4) AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.clients
  WHERE client_code IS NOT NULL AND client_code ~ '^CL-[0-9]+$';
  NEW.client_code := 'CL-' || LPAD(next_num::TEXT, 6, '0');
-- Create trigger to auto-generate client code
DROP TRIGGER IF EXISTS generate_client_code_trigger ON public.clients;
CREATE TRIGGER generate_client_code_trigger
  BEFORE INSERT ON public.clients
  WHEN (NEW.client_code IS NULL)
  EXECUTE FUNCTION public.generate_client_code();
-- Update existing clients with client codes
DO $$
  client_record RECORD;
  counter INTEGER := 1;
  FOR client_record IN 
    SELECT id FROM public.clients WHERE client_code IS NULL ORDER BY created_at
  LOOP
    UPDATE public.clients 
    SET client_code = 'CL-' || LPAD(counter::TEXT, 6, '0')
    WHERE id = client_record.id;
    counter := counter + 1;
  END LOOP;
END $$;
-- Create client_auth table for client login credentials
CREATE TABLE IF NOT EXISTS public.client_auth (
  client_id UUID NOT NULL UNIQUE REFERENCES public.clients(id) ON DELETE CASCADE,
  client_code TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
-- Create project_client_notes table
CREATE TABLE IF NOT EXISTS public.project_client_notes (
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  note_date DATE NOT NULL DEFAULT CURRENT_DATE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE
-- Create client_sessions table for session management
CREATE TABLE IF NOT EXISTS public.client_sessions (
  session_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
-- Enable RLS on new tables
ALTER TABLE public.client_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_client_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_sessions ENABLE ROW LEVEL SECURITY;
-- RLS for client_auth (admin only)
CREATE POLICY "Admins can manage client auth"
  ON public.client_auth
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));
-- RLS for project_client_notes
CREATE POLICY "Admins can view all client notes"
  ON public.project_client_notes
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) AND is_deleted = false);
CREATE POLICY "Admins can manage client notes"
-- RLS for client_sessions (admin only for management)
CREATE POLICY "Admins can manage sessions"
  ON public.client_sessions
-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_client_auth_client_code ON public.client_auth(client_code);
CREATE INDEX IF NOT EXISTS idx_client_auth_client_id ON public.client_auth(client_id);
CREATE INDEX IF NOT EXISTS idx_project_client_notes_project_id ON public.project_client_notes(project_id);
CREATE INDEX IF NOT EXISTS idx_project_client_notes_client_id ON public.project_client_notes(client_id);
CREATE INDEX IF NOT EXISTS idx_client_sessions_token ON public.client_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_client_sessions_client_id ON public.client_sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_clients_client_code ON public.clients(client_code);
-- Add trigger for updated_at on client_auth
CREATE TRIGGER update_client_auth_updated_at
  BEFORE UPDATE ON public.client_auth
-- Add trigger for updated_at on project_client_notes
CREATE TRIGGER update_project_client_notes_updated_at
  BEFORE UPDATE ON public.project_client_notes
-- Create sequence for invoice numbers
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;
-- Function to generate invoice number
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT
  year_part TEXT;
  seq_num INTEGER;
  year_part := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  seq_num := nextval('invoice_number_seq');
  RETURN 'INV-' || year_part || '-' || LPAD(seq_num::TEXT, 4, '0');
-- Set default value for invoice_number column
ALTER COLUMN invoice_number SET DEFAULT generate_invoice_number();
-- Create sequence for quotation numbers
CREATE SEQUENCE IF NOT EXISTS quotation_number_seq START 1;
-- Function to generate quote number
CREATE OR REPLACE FUNCTION public.generate_quote_number()
  seq_num := nextval('quotation_number_seq');
  RETURN 'QT-' || year_part || '-' || LPAD(seq_num::TEXT, 4, '0');
-- Set default value for quote_number column
ALTER TABLE public.quotations 
ALTER COLUMN quote_number SET DEFAULT generate_quote_number();
-- Drop and recreate invoices policies for clarity
-- First drop existing policies
DROP POLICY IF EXISTS "Authenticated users can view all invoices" ON public.invoices;
DROP POLICY IF EXISTS "Permitted users can insert invoices" ON public.invoices;
DROP POLICY IF EXISTS "Permitted users can update invoices" ON public.invoices;
DROP POLICY IF EXISTS "Permitted users can delete invoices" ON public.invoices;
-- SELECT: All authenticated users can view non-deleted invoices
CREATE POLICY "Authenticated users can view invoices"
-- INSERT: Admin or users with can_manage_invoices permission (must own the record)
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_permission(auth.uid(), 'can_manage_invoices'::text))
-- WITH CHECK (true) allows soft delete to work
USING (has_role(auth.uid(), 'admin'::app_role) OR has_permission(auth.uid(), 'can_manage_invoices'::text))
-- DELETE: Admin or users with can_manage_invoices permission (for hard delete if ever needed)
USING (has_role(auth.uid(), 'admin'::app_role) OR has_permission(auth.uid(), 'can_manage_invoices'::text));
-- FIX RLS POLICIES FOR invoices AND quotations
-- Admin-only write, All authenticated can read
-- Using existing has_role() function
-- INVOICES TABLE
DROP POLICY IF EXISTS "Authenticated users can view invoices" ON public.invoices;
CREATE POLICY "invoices_select_all_auth"
-- INSERT: Admin only
CREATE POLICY "invoices_insert_admin"
  has_role(auth.uid(), 'admin'::app_role)
-- UPDATE: Admin only (WITH CHECK true for soft delete to work)
CREATE POLICY "invoices_update_admin"
-- DELETE: Admin only (for hard delete if needed)
CREATE POLICY "invoices_delete_admin"
-- QUOTATIONS TABLE
DROP POLICY IF EXISTS "Authenticated users can view quotations" ON public.quotations;
DROP POLICY IF EXISTS "Authenticated users can view all quotations" ON public.quotations;
DROP POLICY IF EXISTS "Permitted users can insert quotations" ON public.quotations;
DROP POLICY IF EXISTS "Permitted users can update quotations" ON public.quotations;
DROP POLICY IF EXISTS "Permitted users can delete quotations" ON public.quotations;
-- SELECT: All authenticated users can view non-deleted quotations
CREATE POLICY "quotations_select_all_auth"
CREATE POLICY "quotations_insert_admin"
CREATE POLICY "quotations_update_admin"
CREATE POLICY "quotations_delete_admin"
-- Fully-qualify has_role() in RLS policies to avoid search_path resolution issues
-- =====================
-- INVOICES
DROP POLICY IF EXISTS "invoices_insert_admin" ON public.invoices;
DROP POLICY IF EXISTS "invoices_update_admin" ON public.invoices;
DROP POLICY IF EXISTS "invoices_delete_admin" ON public.invoices;
  public.has_role(auth.uid(), 'admin'::app_role)
USING (public.has_role(auth.uid(), 'admin'::app_role))
USING (public.has_role(auth.uid(), 'admin'::app_role));
-- QUOTATIONS
DROP POLICY IF EXISTS "quotations_insert_admin" ON public.quotations;
DROP POLICY IF EXISTS "quotations_update_admin" ON public.quotations;
DROP POLICY IF EXISTS "quotations_delete_admin" ON public.quotations;
-- Replace has_role() usage in invoices/quotations RLS with direct EXISTS on user_roles
-- to avoid any function resolution/security-definer edge cases.
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'::app_role
-- Update leads DELETE policy to use direct EXISTS on user_roles (like invoices/quotations)
DROP POLICY IF EXISTS "Permitted users can delete leads" ON public.leads;
CREATE POLICY "leads_delete_admin"
-- Update clients DELETE policy to admin-only with direct EXISTS check
CREATE POLICY "clients_delete_admin"
-- Update services DELETE policy to admin-only with direct EXISTS check
DROP POLICY IF EXISTS "Permitted users can delete services" ON public.services;
CREATE POLICY "services_delete_admin"
-- Update projects DELETE policy to admin-only with direct EXISTS check
DROP POLICY IF EXISTS "Permitted users can delete projects" ON public.projects;
CREATE POLICY "projects_delete_admin"
-- Create bank_accounts table for storing bank/MFS payment information
CREATE TABLE public.bank_accounts (
  account_type TEXT NOT NULL DEFAULT 'à¦¬à§à¦¯à¦¾à¦‚à¦•', -- à¦¬à§à¦¯à¦¾à¦‚à¦•, MFS, à¦…à¦¨à§à¦¯à¦¾à¦¨à§à¦¯
  bank_name TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  branch_name TEXT,
  routing_number TEXT,
  swift_code TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
-- All authenticated users can view active bank accounts
CREATE POLICY "Authenticated users can view active bank accounts"
ON public.bank_accounts
USING (is_active = true);
-- Only admins can manage bank accounts
CREATE POLICY "Admins can manage bank accounts"
-- Create trigger for updated_at
CREATE TRIGGER update_bank_accounts_updated_at
BEFORE UPDATE ON public.bank_accounts
