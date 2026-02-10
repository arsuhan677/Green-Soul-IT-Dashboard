import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { logActivity } from '@/lib/activityLogger';

export interface Service {
  id: string;
  user_id: string;
  name: string;
  category: string;
  price: number;
  delivery_time: string | null;
  description: string | null;
  active: boolean;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ServiceInput {
  name: string;
  category: string;
  price: number;
  delivery_time?: string;
  description?: string;
  active?: boolean;
}

// UUID validation helper
export const isValidUUID = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

export function useServices() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all services (excluding deleted ones)
  const fetchServices = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('services')
        .select('*')
        .eq('is_deleted', false)
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;

      setServices(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching services:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch only active services (for dropdowns)
  const fetchActiveServices = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('services')
        .select('*')
        .eq('is_deleted', false)
        .eq('active', true)
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;

      setServices(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching services:', err);
    } finally {
      setLoading(false);
    }
  };

  // Add new service
  const addService = async (input: ServiceInput): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error: insertError } = await supabase
        .from('services')
        .insert({
          user_id: user.id,
          name: input.name,
          category: input.category,
          price: input.price,
          delivery_time: input.delivery_time || null,
          description: input.description || null,
          active: input.active ?? true,
          is_deleted: false,
        });

      if (insertError) throw insertError;

      toast({
        title: "সফল!",
        description: "সফলভাবে সংরক্ষণ হয়েছে",
      });

      // Log activity
      await logActivity({
        userId: user.id,
        userName: profile?.name || 'অজানা ব্যবহারকারী',
        action: 'create',
        module: 'services',
        recordTitle: input.name,
        details: `নতুন সার্ভিস যোগ করা হয়েছে: ${input.name}`,
      });

      await fetchServices();
      return true;
    } catch (err: any) {
      toast({
        title: "ত্রুটি!",
        description: err.message || "সার্ভিস যোগ করতে সমস্যা হয়েছে",
        variant: "destructive",
      });
      return false;
    }
  };

  // Update service
  const updateService = async (serviceId: string, input: Partial<ServiceInput>): Promise<boolean> => {
    if (!user) return false;

    if (!isValidUUID(serviceId)) {
      toast({
        title: "ত্রুটি!",
        description: "ভুল আইডি পাঠানো হয়েছে, অনুগ্রহ করে আবার নির্বাচন করুন।",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error: updateError } = await supabase
        .from('services')
        .update({
          ...input,
          updated_at: new Date().toISOString()
        })
        .eq('id', serviceId);

      if (updateError) throw updateError;

      toast({
        title: "সফল!",
        description: "সফলভাবে আপডেট হয়েছে",
      });

      await fetchServices();
      return true;
    } catch (err: any) {
      toast({
        title: "ত্রুটি!",
        description: err.message || "সার্ভিস আপডেট করতে সমস্যা হয়েছে",
        variant: "destructive",
      });
      return false;
    }
  };

  // Toggle service active status
  const toggleServiceActive = async (serviceId: string, active: boolean): Promise<boolean> => {
    if (!user) return false;

    if (!isValidUUID(serviceId)) {
      toast({
        title: "ত্রুটি!",
        description: "ভুল আইডি পাঠানো হয়েছে",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error: updateError } = await supabase
        .from('services')
        .update({
          active,
          updated_at: new Date().toISOString()
        })
        .eq('id', serviceId);

      if (updateError) throw updateError;

      // Immediately update UI state
      setServices(prev => prev.map(s => 
        s.id === serviceId ? { ...s, active } : s
      ));

      toast({
        title: active ? "সক্রিয় করা হয়েছে" : "নিষ্ক্রিয় করা হয়েছে",
        description: active ? "সার্ভিস সক্রিয় করা হয়েছে" : "সার্ভিস নিষ্ক্রিয় করা হয়েছে",
      });

      return true;
    } catch (err: any) {
      toast({
        title: "ত্রুটি!",
        description: err.message || "স্ট্যাটাস পরিবর্তন করতে সমস্যা হয়েছে",
        variant: "destructive",
      });
      return false;
    }
  };

  // Check if service can be deleted
  const canDeleteService = async (serviceId: string): Promise<{ canDelete: boolean; reason?: string }> => {
    if (!isValidUUID(serviceId)) {
      return { canDelete: false, reason: "ভুল আইডি পাঠানো হয়েছে" };
    }

    try {
      // Check for leads using this service
      const { data: leads } = await supabase
        .from('leads')
        .select('id')
        .eq('service_id', serviceId)
        .eq('is_deleted', false)
        .limit(1);

      if (leads && leads.length > 0) {
        return { canDelete: false, reason: "এই সার্ভিসটি বর্তমানে ব্যবহার হচ্ছে, তাই ডিলিট করা যাবে না।" };
      }

      // Check for projects using this service
      const { data: projects } = await supabase
        .from('projects')
        .select('id')
        .eq('service_id', serviceId)
        .eq('is_deleted', false)
        .limit(1);

      if (projects && projects.length > 0) {
        return { canDelete: false, reason: "এই সার্ভিসটি বর্তমানে ব্যবহার হচ্ছে, তাই ডিলিট করা যাবে না।" };
      }

      return { canDelete: true };
    } catch (err) {
      return { canDelete: false, reason: "যাচাই করতে সমস্যা হয়েছে" };
    }
  };

  // Hard delete service (Admin only)
  const deleteService = async (serviceId: string): Promise<boolean> => {
    if (!user) return false;

    if (!isValidUUID(serviceId)) {
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
          description: "শুধুমাত্র অ্যাডমিন সার্ভিস ডিলিট করতে পারবেন",
          variant: "destructive",
        });
        return false;
      }

      const service = services.find(s => s.id === serviceId);

      // Hard delete - permanently remove from database
      const { error: deleteError } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId);

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
        module: 'services',
        recordId: serviceId,
        recordTitle: service?.name,
        details: `সার্ভিস স্থায়ীভাবে মুছে ফেলা হয়েছে: ${service?.name || 'অজানা'}`,
      });

      // Immediately update UI state
      setServices(prev => prev.filter(s => s.id !== serviceId));

      toast({
        title: "সফলভাবে মুছে ফেলা হয়েছে",
        description: "সার্ভিস স্থায়ীভাবে মুছে ফেলা হয়েছে",
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
    fetchServices();
  }, [user]);

  return {
    services,
    loading,
    error,
    fetchServices,
    fetchActiveServices,
    addService,
    updateService,
    toggleServiceActive,
    canDeleteService,
    deleteService,
    isValidUUID,
  };
}
