import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface UserPermissions {
  id: string;
  user_id: string;
  can_view_dashboard: boolean;
  can_manage_leads: boolean;
  can_manage_clients: boolean;
  can_manage_projects: boolean;
  can_manage_tasks: boolean;
  can_manage_services: boolean;
  can_manage_invoices: boolean;
  can_manage_payments: boolean;
  can_manage_users: boolean;
  can_manage_roles: boolean;
  can_delete_records: boolean;
  created_at: string;
  updated_at: string;
}

export type PermissionKey = 
  | 'can_view_dashboard'
  | 'can_manage_leads'
  | 'can_manage_clients'
  | 'can_manage_projects'
  | 'can_manage_tasks'
  | 'can_manage_services'
  | 'can_manage_invoices'
  | 'can_manage_payments'
  | 'can_manage_users'
  | 'can_manage_roles'
  | 'can_delete_records';

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  can_view_dashboard: 'ড্যাশবোর্ড দেখা',
  can_manage_leads: 'লিড ম্যানেজ',
  can_manage_clients: 'ক্লায়েন্ট ম্যানেজ',
  can_manage_projects: 'প্রজেক্ট ম্যানেজ',
  can_manage_tasks: 'টাস্ক ম্যানেজ',
  can_manage_services: 'সার্ভিস ম্যানেজ',
  can_manage_invoices: 'ইনভয়েস/পেমেন্ট ম্যানেজ',
  can_manage_payments: 'পেমেন্ট ম্যানেজ',
  can_manage_users: 'ইউজার ম্যানেজ',
  can_manage_roles: 'রোল ম্যানেজ',
  can_delete_records: 'ডিলিট অনুমতি',
};

export function usePermissions() {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [allPermissions, setAllPermissions] = useState<UserPermissions[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = hasRole('admin');

  // Fetch current user's permissions
  const fetchMyPermissions = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setPermissions(data as UserPermissions | null);
    } catch (err: any) {
      console.error('Error fetching permissions:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch all users' permissions (admin only)
  const fetchAllPermissions = useCallback(async () => {
    if (!user || !isAdmin) return;

    try {
      const { data, error } = await supabase
        .from('user_permissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAllPermissions(data as UserPermissions[] || []);
    } catch (err: any) {
      console.error('Error fetching all permissions:', err);
    }
  }, [user, isAdmin]);

  // Check if user has a specific permission
  const hasPermission = useCallback((permission: PermissionKey): boolean => {
    // Admin has all permissions
    if (isAdmin) return true;
    
    if (!permissions) return false;
    return permissions[permission] === true;
  }, [isAdmin, permissions]);

  // Check if user can delete records
  const canDelete = useCallback((): boolean => {
    if (isAdmin) return true;
    return permissions?.can_delete_records === true;
  }, [isAdmin, permissions]);

  // Update user permissions (admin only)
  const updatePermissions = async (
    userId: string, 
    updates: Partial<Record<PermissionKey, boolean>>
  ): Promise<boolean> => {
    if (!user || !isAdmin) return false;

    try {
      const { error } = await supabase
        .from('user_permissions')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "সফল!",
        description: "পারমিশন আপডেট করা হয়েছে",
      });

      await fetchAllPermissions();
      return true;
    } catch (err: any) {
      toast({
        title: "ত্রুটি!",
        description: err.message || "পারমিশন আপডেট করতে সমস্যা হয়েছে",
        variant: "destructive",
      });
      return false;
    }
  };

  // Create permissions for a user if they don't exist
  const ensurePermissions = async (userId: string): Promise<boolean> => {
    if (!user || !isAdmin) return false;

    try {
      // Check if permissions exist
      const { data: existing } = await supabase
        .from('user_permissions')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) return true;

      // Create permissions
      const { error } = await supabase
        .from('user_permissions')
        .insert({ user_id: userId });

      if (error) throw error;
      return true;
    } catch (err: any) {
      console.error('Error ensuring permissions:', err);
      return false;
    }
  };

  useEffect(() => {
    fetchMyPermissions();
    if (isAdmin) {
      fetchAllPermissions();
    }
  }, [fetchMyPermissions, fetchAllPermissions, isAdmin]);

  return {
    permissions,
    allPermissions,
    loading,
    isAdmin,
    hasPermission,
    canDelete,
    updatePermissions,
    ensurePermissions,
    fetchAllPermissions,
    fetchMyPermissions,
  };
}
