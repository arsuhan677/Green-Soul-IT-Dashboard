-- Create sequence for invoice numbers
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  year_part TEXT;
  seq_num INTEGER;
BEGIN
  year_part := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  seq_num := nextval('invoice_number_seq');
  RETURN 'INV-' || year_part || '-' || LPAD(seq_num::TEXT, 4, '0');
END;
$$;

-- Set default value for invoice_number column
ALTER TABLE public.invoices 
ALTER COLUMN invoice_number SET DEFAULT generate_invoice_number();