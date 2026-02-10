-- Add client_code to clients table
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS client_code TEXT UNIQUE;

-- Create function to generate client code
CREATE OR REPLACE FUNCTION public.generate_client_code()
RETURNS TRIGGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(client_code FROM 4) AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.clients
  WHERE client_code IS NOT NULL AND client_code ~ '^CL-[0-9]+$';
  
  NEW.client_code := 'CL-' || LPAD(next_num::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger to auto-generate client code
DROP TRIGGER IF EXISTS generate_client_code_trigger ON public.clients;
CREATE TRIGGER generate_client_code_trigger
  BEFORE INSERT ON public.clients
  FOR EACH ROW
  WHEN (NEW.client_code IS NULL)
  EXECUTE FUNCTION public.generate_client_code();

-- Update existing clients with client codes
DO $$
DECLARE
  client_record RECORD;
  counter INTEGER := 1;
BEGIN
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
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL UNIQUE REFERENCES public.clients(id) ON DELETE CASCADE,
  client_code TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project_client_notes table
CREATE TABLE IF NOT EXISTS public.project_client_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  note_text TEXT NOT NULL,
  note_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create client_sessions table for session management
CREATE TABLE IF NOT EXISTS public.client_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

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
  ON public.project_client_notes
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS for client_sessions (admin only for management)
CREATE POLICY "Admins can manage sessions"
  ON public.client_sessions
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

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
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for updated_at on project_client_notes
CREATE TRIGGER update_project_client_notes_updated_at
  BEFORE UPDATE ON public.project_client_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();