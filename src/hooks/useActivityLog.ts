import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type ActionType = 'create' | 'update' | 'delete';
export type ModuleType = 'leads' | 'clients' | 'projects' | 'tasks' | 'services' | 'invoices' | 'payments' | 'users' | 'roles' | 'permissions';

export interface ActivityLog {
  id: string;
  action: ActionType;
  module: ModuleType;
  record_id: string | null;
  record_title: string | null;
  performed_by_user_id: string;
  performed_by_name: string | null;
  details: string | null;
  performed_at: string;
}

export const MODULE_LABELS: Record<ModuleType, string> = {
  leads: 'লিড',
  clients: 'ক্লায়েন্ট',
  projects: 'প্রজেক্ট',
  tasks: 'টাস্ক',
  services: 'সার্ভিস',
  invoices: 'ইনভয়েস',
  payments: 'পেমেন্ট',
  users: 'ইউজার',
  roles: 'রোল',
  permissions: 'পারমিশন',
};

export const ACTION_LABELS: Record<ActionType, string> = {
  create: 'তৈরি করেছে',
  update: 'আপডেট করেছে',
  delete: 'ডিলিট করেছে',
};

export function useActivityLog() {
  const { user, profile, hasRole } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = hasRole('admin');

  // Fetch activity logs (admin sees all, users see their own)
  const fetchLogs = useCallback(async (filters?: {
    module?: ModuleType;
    userId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }) => {
    if (!user) return;

    try {
      setLoading(true);
      let query = supabase
        .from('activity_logs')
        .select('*')
        .order('performed_at', { ascending: false });

      if (filters?.module) {
        query = query.eq('module', filters.module);
      }

      if (filters?.userId) {
        query = query.eq('performed_by_user_id', filters.userId);
      }

      if (filters?.startDate) {
        query = query.gte('performed_at', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte('performed_at', filters.endDate);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      } else {
        query = query.limit(100);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data as ActivityLog[] || []);
    } catch (err: any) {
      console.error('Error fetching activity logs:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Log an activity
  const logActivity = useCallback(async ({
    action,
    module,
    recordId,
    recordTitle,
    details,
  }: {
    action: ActionType;
    module: ModuleType;
    recordId?: string;
    recordTitle?: string;
    details?: string;
  }): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('activity_logs')
        .insert({
          action,
          module,
          record_id: recordId || null,
          record_title: recordTitle || null,
          performed_by_user_id: user.id,
          performed_by_name: profile?.name || 'অজানা ব্যবহারকারী',
          details,
        });

      if (error) throw error;
      return true;
    } catch (err: any) {
      console.error('Error logging activity:', err);
      return false;
    }
  }, [user, profile]);

  useEffect(() => {
    if (isAdmin) {
      fetchLogs();
    }
  }, [fetchLogs, isAdmin]);

  return {
    logs,
    loading,
    isAdmin,
    fetchLogs,
    logActivity,
  };
}
