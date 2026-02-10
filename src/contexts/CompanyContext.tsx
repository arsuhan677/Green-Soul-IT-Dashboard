import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CompanySettings {
  id: string;
  company_name_bn: string;
  company_name_en: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  website: string | null;
  invoice_note_bn: string | null;
  logo_url: string | null;
  updated_at: string;
}

interface CompanyContextType {
  settings: CompanySettings | null;
  loading: boolean;
  error: string | null;
  refreshSettings: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('company_settings')
        .select('*')
        .limit(1)
        .single();

      if (fetchError) throw fetchError;
      setSettings(data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching company settings:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <CompanyContext.Provider value={{ 
      settings, 
      loading, 
      error, 
      refreshSettings: fetchSettings 
    }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
}
