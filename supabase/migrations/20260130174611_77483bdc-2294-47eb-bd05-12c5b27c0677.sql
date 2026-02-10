-- Create custom_roles table for dynamic role names
CREATE TABLE public.custom_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role_name_bn TEXT NOT NULL,
  role_name_en TEXT,
  permissions JSONB DEFAULT '[]'::jsonb,
  description TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on custom_roles
ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;

-- Only admins can manage custom roles
CREATE POLICY "Admins can manage all roles"
ON public.custom_roles
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- All authenticated users can view roles
CREATE POLICY "Authenticated users can view roles"
ON public.custom_roles
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
('অ্যাডমিন', 'admin', '["all"]', 'সম্পূর্ণ অ্যাক্সেস'),
('সেলস', 'sales', '["leads", "clients", "followups", "view_projects"]', 'লিড এবং ক্লায়েন্ট ম্যানেজমেন্ট'),
('প্রজেক্ট ম্যানেজার', 'project_manager', '["projects", "tasks", "assign_team"]', 'প্রজেক্ট এবং টাস্ক ম্যানেজমেন্ট'),
('ডিজাইনার', 'designer', '["assigned_projects", "tasks", "comments"]', 'অ্যাসাইন করা প্রজেক্টে কাজ করা'),
('গ্রাফিক্স ডিজাইনার', 'graphics_designer', '["assigned_projects", "tasks", "comments"]', 'গ্রাফিক্স ডিজাইন কাজ'),
('ভিডিও এডিটর', 'video_editor', '["assigned_projects", "tasks", "comments"]', 'ভিডিও এডিটিং কাজ'),
('স্টাফ', 'staff', '["assigned_projects", "tasks"]', 'সাধারণ স্টাফ অ্যাক্সেস');

-- Create project_updates table for tracking changes
CREATE TABLE public.project_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  updated_by UUID NOT NULL,
  updated_by_name TEXT,
  change_type TEXT NOT NULL,
  change_note TEXT,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on project_updates
ALTER TABLE public.project_updates ENABLE ROW LEVEL SECURITY;

-- Users can view updates for their projects
CREATE POLICY "Users can view their own project updates"
ON public.project_updates
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_updates.project_id 
    AND (projects.user_id = auth.uid() OR auth.uid() = ANY(projects.assigned_team))
  )
);

-- Users can insert updates for assigned projects
CREATE POLICY "Users can insert updates for assigned projects"
ON public.project_updates
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_id 
    AND (projects.user_id = auth.uid() OR auth.uid() = ANY(projects.assigned_team))
  )
);

-- Update projects RLS to allow assigned team members to view and update
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;
CREATE POLICY "Users can view their own or assigned projects"
ON public.projects
FOR SELECT
USING (
  auth.uid() = user_id 
  OR auth.uid() = ANY(assigned_team)
  OR has_role(auth.uid(), 'admin'::app_role)
);

DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
CREATE POLICY "Users can update their own or assigned projects"
ON public.projects
FOR UPDATE
USING (
  auth.uid() = user_id 
  OR auth.uid() = ANY(assigned_team)
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Admins can view all profiles for user management
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));