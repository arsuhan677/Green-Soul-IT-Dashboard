import { supabase } from '@/integrations/supabase/client';

export type ActionType = 'create' | 'update' | 'delete';
export type ModuleType = 'leads' | 'clients' | 'projects' | 'tasks' | 'services' | 'invoices' | 'payments' | 'users' | 'roles' | 'permissions';

interface LogActivityParams {
  userId: string;
  userName: string;
  action: ActionType;
  module: ModuleType;
  recordId?: string;
  recordTitle?: string;
  details?: string;
}

export async function logActivity({
  userId,
  userName,
  action,
  module,
  recordId,
  recordTitle,
  details,
}: LogActivityParams): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('activity_logs')
      .insert({
        action,
        module,
        record_id: recordId || null,
        record_title: recordTitle || null,
        performed_by_user_id: userId,
        performed_by_name: userName,
        details,
      });

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error logging activity:', err);
    return false;
  }
}
