import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { isValidUUID } from '@/lib/validation';
import { logActivity } from '@/lib/activityLogger';

export interface Client {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  email: string;
  company: string | null;
  address: string | null;
  social_links: string[] | null;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  created_by_name: string | null;
}

export interface ClientInput {
  name: string;
  phone: string;
  email: string;
  company?: string;
  address?: string;
  website?: string;
}

export function useClients() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch clients (excluding deleted ones)
  const fetchClients = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('clients')
        .select('*')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setClients(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching clients:', err);
    } finally {
      setLoading(false);
    }
  };

  // Add new client
  const addClient = async (input: ClientInput): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error: insertError } = await supabase
        .from('clients')
        .insert({
          user_id: user.id,
          name: input.name,
          phone: input.phone,
          email: input.email,
          company: input.company || null,
          address: input.address || null,
          social_links: input.website ? [input.website] : null,
          is_deleted: false,
          created_by_name: profile?.name || 'অজানা ব্যবহারকারী',
        });

      if (insertError) throw insertError;

      toast({
        title: "সফল!",
        description: "নতুন ক্লায়েন্ট সফলভাবে যোগ করা হয়েছে",
      });

      // Log activity
      await logActivity({
        userId: user.id,
        userName: profile?.name || 'অজানা ব্যবহারকারী',
        action: 'create',
        module: 'clients',
        recordTitle: input.name,
        details: `নতুন ক্লায়েন্ট যোগ করা হয়েছে: ${input.name}`,
      });

      await fetchClients();
      return true;
    } catch (err: any) {
      toast({
        title: "ত্রুটি!",
        description: err.message || "ক্লায়েন্ট যোগ করতে সমস্যা হয়েছে",
        variant: "destructive",
      });
      return false;
    }
  };

  // Update client
  const updateClient = async (clientId: string, input: ClientInput): Promise<boolean> => {
    if (!user) return false;

    // Validate clientId UUID
    if (!isValidUUID(clientId)) {
      toast({
        title: "ত্রুটি!",
        description: "ভুল আইডি পাঠানো হয়েছে, অনুগ্রহ করে আবার নির্বাচন করুন।",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error: updateError } = await supabase
        .from('clients')
        .update({
          name: input.name,
          phone: input.phone,
          email: input.email,
          company: input.company || null,
          address: input.address || null,
          social_links: input.website ? [input.website] : null,
        })
        .eq('id', clientId);

      if (updateError) throw updateError;

      toast({
        title: "সফল!",
        description: "সফলভাবে আপডেট হয়েছে",
      });

      // Log activity
      await logActivity({
        userId: user.id,
        userName: profile?.name || 'অজানা ব্যবহারকারী',
        action: 'update',
        module: 'clients',
        recordId: clientId,
        recordTitle: input.name,
        details: `ক্লায়েন্ট আপডেট করা হয়েছে: ${input.name}`,
      });

      await fetchClients();
      return true;
    } catch (err: any) {
      toast({
        title: "ত্রুটি!",
        description: err.message || "আপডেট করতে সমস্যা হয়েছে",
        variant: "destructive",
      });
      return false;
    }
  };

  // Check if client can be deleted
  const canDeleteClient = async (clientId: string): Promise<{ canDelete: boolean; reason?: string }> => {
    // Validate clientId UUID
    if (!isValidUUID(clientId)) {
      return { canDelete: false, reason: "ভুল আইডি পাঠানো হয়েছে" };
    }

    try {
      // Check for projects
      const { data: projects } = await supabase
        .from('projects')
        .select('id')
        .eq('client_id', clientId)
        .eq('is_deleted', false)
        .limit(1);

      if (projects && projects.length > 0) {
        return { canDelete: false, reason: "এই ক্লায়েন্টের সাথে প্রজেক্ট যুক্ত আছে, তাই ডিলিট করা যাবে না।" };
      }

      // Check for invoices
      const { data: invoices } = await supabase
        .from('invoices')
        .select('id')
        .eq('client_id', clientId)
        .eq('is_deleted', false)
        .limit(1);

      if (invoices && invoices.length > 0) {
        return { canDelete: false, reason: "এই ক্লায়েন্টের সাথে ইনভয়েস যুক্ত আছে, তাই ডিলিট করা যাবে না।" };
      }

      return { canDelete: true };
    } catch (err) {
      return { canDelete: false, reason: "যাচাই করতে সমস্যা হয়েছে" };
    }
  };

  // Hard delete client (Admin only)
  const deleteClient = async (clientId: string): Promise<boolean> => {
    if (!user) return false;

    // Validate clientId UUID
    if (!isValidUUID(clientId)) {
      toast({
        title: "ত্রুটি!",
        description: "ভুল আইডি পাঠানো হয়েছে, অনুগ্রহ করে আবার নির্বাচন করুন।",
        variant: "destructive",
      });
      return false;
    }

    try {
      // Refresh session for fresh token
      await supabase.auth.refreshSession();

      // Direct admin check from user_roles table
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (roleError) {
        console.error('Role check error:', roleError);
      }

      if (!roleData) {
        toast({
          title: "অনুমতি নেই",
          description: "শুধুমাত্র অ্যাডমিন ক্লায়েন্ট ডিলিট করতে পারবেন",
          variant: "destructive",
        });
        return false;
      }

      const client = clients.find(c => c.id === clientId);
      
      // Hard delete - permanently remove from database
      const { error: deleteError } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

      if (deleteError) {
        console.error('Delete error details:', {
          code: deleteError.code,
          message: deleteError.message,
          details: deleteError.details,
          hint: deleteError.hint
        });
        throw deleteError;
      }

      // Log activity
      await logActivity({
        userId: user.id,
        userName: profile?.name || 'অজানা ব্যবহারকারী',
        action: 'delete',
        module: 'clients',
        recordId: clientId,
        recordTitle: client?.name,
        details: `ক্লায়েন্ট স্থায়ীভাবে মুছে ফেলা হয়েছে: ${client?.name || 'অজানা'}`,
      });

      // Immediately update UI state
      setClients(prev => prev.filter(c => c.id !== clientId));

      toast({
        title: "সফলভাবে মুছে ফেলা হয়েছে",
        description: "ক্লায়েন্ট স্থায়ীভাবে মুছে ফেলা হয়েছে",
      });

      return true;
    } catch (err: any) {
      toast({
        title: "ত্রুটি!",
        description: err.message || "মুছে ফেলতে সমস্যা হয়েছে",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchClients();
  }, [user]);

  return {
    clients,
    loading,
    error,
    fetchClients,
    addClient,
    updateClient,
    canDeleteClient,
    deleteClient,
  };
}
