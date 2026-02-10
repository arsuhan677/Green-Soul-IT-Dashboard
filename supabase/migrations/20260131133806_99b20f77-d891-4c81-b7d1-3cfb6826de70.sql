-- Create quotations table for professional quotes
CREATE TABLE public.quotations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_number TEXT NOT NULL,
  client_id UUID REFERENCES public.clients(id),
  client_name TEXT,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  tax NUMERIC NOT NULL DEFAULT 0,
  grand_total NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'খসড়া',
  note TEXT,
  created_by UUID NOT NULL,
  created_by_name TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

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
FOR SELECT TO authenticated
USING (is_deleted = false);

-- INSERT: Admin or users with can_manage_invoices permission
CREATE POLICY "Permitted users can insert quotations"
ON public.quotations
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = created_by AND
  (has_role(auth.uid(), 'admin'::app_role) OR has_permission(auth.uid(), 'can_manage_invoices'))
);

-- UPDATE: Admin or users with can_manage_invoices permission
CREATE POLICY "Permitted users can update quotations"
ON public.quotations
FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_permission(auth.uid(), 'can_manage_invoices')
)
WITH CHECK (true);

-- DELETE: Admin or users with can_manage_invoices permission
CREATE POLICY "Permitted users can delete quotations"
ON public.quotations
FOR DELETE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_permission(auth.uid(), 'can_manage_invoices')
);

-- Trigger for updated_at
CREATE TRIGGER update_quotations_updated_at
BEFORE UPDATE ON public.quotations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes
CREATE INDEX idx_quotations_client_id ON public.quotations(client_id);
CREATE INDEX idx_quotations_status ON public.quotations(status);
CREATE INDEX idx_quotations_quote_number ON public.quotations(quote_number);
CREATE INDEX idx_invoices_from_quote_id ON public.invoices(from_quote_id);

-- Comment
COMMENT ON TABLE public.quotations IS 'Professional quotations that can be converted to invoices';