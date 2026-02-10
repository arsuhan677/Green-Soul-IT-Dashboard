-- Create user_permissions table for granular access control
CREATE TABLE public.user_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
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
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create activity_logs table for audit trail
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  module TEXT NOT NULL CHECK (module IN ('leads', 'clients', 'projects', 'tasks', 'services', 'invoices', 'payments', 'users', 'roles', 'permissions')),
  record_id UUID,
  record_title TEXT,
  performed_by_user_id UUID NOT NULL,
  performed_by_name TEXT,
  details TEXT,
  performed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS for user_permissions: Admin can do everything, users can view their own
CREATE POLICY "Admins can manage all permissions"
ON public.user_permissions
FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own permissions"
ON public.user_permissions
FOR SELECT
USING (auth.uid() = user_id);

-- RLS for activity_logs: Admin can see all, users can see their own actions
CREATE POLICY "Admins can view all activity logs"
ON public.activity_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert activity logs"
ON public.activity_logs
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view own activity"
ON public.activity_logs
FOR SELECT
USING (auth.uid() = performed_by_user_id);

-- Function to auto-create permissions for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_permissions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_permissions (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

-- Trigger to create permissions when a new auth user is created
CREATE TRIGGER on_auth_user_created_permissions
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_permissions();

-- Function to check if user has specific permission
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  is_admin boolean;
  has_perm boolean;
BEGIN
  -- Check if user is admin (admin has all permissions)
  SELECT EXISTS (
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
END;
$$;

-- Update timestamp trigger for user_permissions
CREATE TRIGGER update_user_permissions_updated_at
  BEFORE UPDATE ON public.user_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster activity log queries
CREATE INDEX idx_activity_logs_performed_at ON public.activity_logs(performed_at DESC);
CREATE INDEX idx_activity_logs_module ON public.activity_logs(module);
CREATE INDEX idx_activity_logs_user ON public.activity_logs(performed_by_user_id);