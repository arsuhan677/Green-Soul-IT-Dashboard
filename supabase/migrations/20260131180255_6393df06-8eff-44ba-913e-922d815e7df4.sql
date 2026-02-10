-- Create sequence for quotation numbers
CREATE SEQUENCE IF NOT EXISTS quotation_number_seq START 1;

-- Function to generate quote number
CREATE OR REPLACE FUNCTION public.generate_quote_number()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  year_part TEXT;
  seq_num INTEGER;
BEGIN
  year_part := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  seq_num := nextval('quotation_number_seq');
  RETURN 'QT-' || year_part || '-' || LPAD(seq_num::TEXT, 4, '0');
END;
$$;

-- Set default value for quote_number column
ALTER TABLE public.quotations 
ALTER COLUMN quote_number SET DEFAULT generate_quote_number();