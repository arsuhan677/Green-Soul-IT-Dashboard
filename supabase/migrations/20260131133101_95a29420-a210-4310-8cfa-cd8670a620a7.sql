-- Create project_notes table for date-wise notes with timeline
CREATE TABLE public.project_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  note_date DATE NOT NULL,
  note_time TEXT,
  note_type TEXT DEFAULT 'আপডেট',
  note_text TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_by_name TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_notes ENABLE ROW LEVEL SECURITY;

-- SELECT: Authenticated users can view notes for projects they're assigned to or all if admin
CREATE POLICY "Authenticated users can view project notes"
ON public.project_notes
FOR SELECT TO authenticated
USING (
  is_deleted = false AND
  (
    has_role(auth.uid(), 'admin'::app_role) OR
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_notes.project_id
      AND (p.user_id = auth.uid() OR auth.uid() = ANY(p.assigned_team))
    )
  )
);

-- INSERT: Admin or users assigned to the project can add notes
CREATE POLICY "Permitted users can insert project notes"
ON public.project_notes
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = created_by AND
  (
    has_role(auth.uid(), 'admin'::app_role) OR
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_notes.project_id
      AND (p.user_id = auth.uid() OR auth.uid() = ANY(p.assigned_team))
    )
  )
);

-- UPDATE: Admin or note creator can update
CREATE POLICY "Permitted users can update project notes"
ON public.project_notes
FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR created_by = auth.uid()
)
WITH CHECK (true);

-- DELETE: Only admin can delete
CREATE POLICY "Admins can delete project notes"
ON public.project_notes
FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_project_notes_updated_at
BEFORE UPDATE ON public.project_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_project_notes_project_id ON public.project_notes(project_id);
CREATE INDEX idx_project_notes_note_date ON public.project_notes(note_date DESC);

-- Comment for documentation
COMMENT ON TABLE public.project_notes IS 'Date-wise notes/updates for projects with timeline view';