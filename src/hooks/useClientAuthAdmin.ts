import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ClientWithAuth {
  id: string;
  client_code: string;
  name: string;
  email: string;
  phone: string;
  company: string | null;
  has_login: boolean;
  login_active: boolean;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export function useClientAuth() {
  const [clients, setClients] = useState<ClientWithAuth[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id, client_code, name, email, phone, company')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (clientsError) throw clientsError;

      // Fetch all client_auth records (only admins can see this)
      const { data: authData, error: authError } = await supabase
        .from('client_auth')
        .select('client_id, active');

      // If error (likely RLS), just use empty array
      if (authError) {
        console.warn('Could not fetch client_auth (may need admin role):', authError);
      }

      // Create a map of client_id -> auth info
      const authMap = new Map(
        authData?.map((a) => [a.client_id, a.active]) || []
      );

      // Merge data
      const merged = clientsData?.map((client) => ({
        ...client,
        has_login: authMap.has(client.id),
        login_active: authMap.get(client.id) ?? false,
      })) || [];

      setClients(merged);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        variant: 'destructive',
        title: 'ত্রুটি',
        description: 'ক্লায়েন্ট তালিকা লোড করতে সমস্যা হয়েছে',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const createCredentials = useCallback(async (clientId: string, password: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('আপনি লগইন করা নেই');
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/client-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'create_credentials',
          client_id: clientId,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'লগইন তৈরি করতে সমস্যা হয়েছে');
      }

      toast({
        title: 'সফল',
        description: `লগইন তৈরি হয়েছে। ক্লায়েন্ট আইডি: ${data.client_code}`,
      });

      await fetchClients();
      return { success: true, client_code: data.client_code };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'লগইন তৈরি করতে সমস্যা হয়েছে';
      toast({
        variant: 'destructive',
        title: 'ত্রুটি',
        description: message,
      });
      return { success: false, error: message };
    }
  }, [toast, fetchClients]);

  const toggleActive = useCallback(async (clientId: string, active: boolean) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('আপনি লগইন করা নেই');
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/client-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'toggle_active',
          client_id: clientId,
          active,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'স্ট্যাটাস পরিবর্তন করতে সমস্যা হয়েছে');
      }

      toast({
        title: 'সফল',
        description: active ? 'লগইন সক্রিয় করা হয়েছে' : 'লগইন নিষ্ক্রিয় করা হয়েছে',
      });

      await fetchClients();
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'স্ট্যাটাস পরিবর্তন করতে সমস্যা হয়েছে';
      toast({
        variant: 'destructive',
        title: 'ত্রুটি',
        description: message,
      });
      return { success: false, error: message };
    }
  }, [toast, fetchClients]);

  return {
    clients,
    loading,
    fetchClients,
    createCredentials,
    toggleActive,
  };
}
