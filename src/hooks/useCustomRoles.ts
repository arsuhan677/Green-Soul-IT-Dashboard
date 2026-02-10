import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface CustomRole {
  id: string;
  role_name_bn: string;
  role_name_en: string | null;
  permissions: string[];
  description: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateRoleInput {
  role_name_bn: string;
  role_name_en?: string;
  permissions?: string[];
  description?: string;
}

export interface UpdateRoleInput extends Partial<CreateRoleInput> {
  id: string;
}

export function useCustomRoles() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: roles = [], isLoading, error } = useQuery({
    queryKey: ['custom_roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_roles')
        .select('*')
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []).map(role => ({
        ...role,
        permissions: Array.isArray(role.permissions) ? role.permissions : []
      })) as CustomRole[];
    },
    enabled: !!user,
  });

  const addRole = useMutation({
    mutationFn: async (input: CreateRoleInput) => {
      const { data, error } = await supabase
        .from('custom_roles')
        .insert({
          role_name_bn: input.role_name_bn,
          role_name_en: input.role_name_en || null,
          permissions: input.permissions || [],
          description: input.description || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom_roles'] });
      toast({
        title: "সফল",
        description: "রোল সফলভাবে তৈরি হয়েছে",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "ত্রুটি",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateRole = useMutation({
    mutationFn: async (input: UpdateRoleInput) => {
      const { id, ...updates } = input;
      const { data, error } = await supabase
        .from('custom_roles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom_roles'] });
      toast({
        title: "সফল",
        description: "রোল সফলভাবে আপডেট হয়েছে",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "ত্রুটি",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteRole = useMutation({
    mutationFn: async (id: string) => {
      // Check if role is being used by any user
      const { data: usersWithRole } = await supabase
        .from('profiles')
        .select('id')
        .eq('custom_role_id', id)
        .eq('is_deleted', false)
        .limit(1);

      if (usersWithRole && usersWithRole.length > 0) {
        throw new Error('এই রোলটি বর্তমানে ব্যবহার হচ্ছে, তাই ডিলিট করা যাবে না।');
      }

      const { error } = await supabase
        .from('custom_roles')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom_roles'] });
      toast({
        title: "সফল",
        description: "রোল সফলভাবে মুছে ফেলা হয়েছে",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "ত্রুটি",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    roles,
    isLoading,
    error,
    addRole: addRole.mutateAsync,
    updateRole: updateRole.mutateAsync,
    deleteRole: deleteRole.mutateAsync,
    isAdding: addRole.isPending,
    isUpdating: updateRole.isPending,
    isDeleting: deleteRole.isPending,
  };
}
