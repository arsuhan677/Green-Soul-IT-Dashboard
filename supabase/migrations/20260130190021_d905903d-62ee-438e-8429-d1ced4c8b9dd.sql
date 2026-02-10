-- Create company_settings table for storing company information and logo
CREATE TABLE public.company_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name_bn text NOT NULL DEFAULT 'আশমা টেক লিমিটেড',
  company_name_en text DEFAULT 'Ashma Tech Limited',
  phone text DEFAULT '',
  email text DEFAULT '',
  address text DEFAULT '',
  website text DEFAULT '',
  invoice_note_bn text DEFAULT '',
  logo_url text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view company settings
CREATE POLICY "All authenticated users can view company settings"
ON public.company_settings
FOR SELECT
TO authenticated
USING (true);

-- Only admins can modify company settings
CREATE POLICY "Admins can manage company settings"
ON public.company_settings
FOR ALL
TO authenticated
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
  'আশমা টেক লিমিটেড',
  'Ashma Tech Limited',
  '+880 1712-345678',
  'info@ashmatech.com',
  'গুলশান-২, ঢাকা ১২১২, বাংলাদেশ',
  'https://ashmatech.com',
  ''
);

-- Create trigger for auto-updating updated_at
CREATE TRIGGER update_company_settings_updated_at
BEFORE UPDATE ON public.company_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for company assets (logo)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('company-assets', 'company-assets', true);

-- Storage policies for company assets
CREATE POLICY "Anyone can view company assets"
ON storage.objects
FOR SELECT
USING (bucket_id = 'company-assets');

CREATE POLICY "Admins can upload company assets"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'company-assets' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update company assets"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'company-assets' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete company assets"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'company-assets' 
  AND has_role(auth.uid(), 'admin'::app_role)
);