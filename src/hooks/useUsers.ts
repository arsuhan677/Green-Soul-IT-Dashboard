import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  custom_role_id: string | null;
  active: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  custom_roles?: {
    id: string;
    role_name_bn: string;
    role_name_en: string | null;
  } | null;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
  custom_role_id?: string;
  active?: boolean;
}

export interface UpdateUserInput {
  id: string;
  name?: string;
  phone?: string;
  custom_role_id?: string;
  active?: boolean;
}

export function useUsers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, hasRole } = useAuth();

  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          custom_roles (
            id,
            role_name_bn,
            role_name_en
          )
        `)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as UserProfile[];
    },
    enabled: !!user && hasRole('admin'),
  });

  // Get active users for team assignment
  const { data: activeUsers = [] } = useQuery({
    queryKey: ['active_users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          name,
          email,
          custom_roles (
            id,
            role_name_bn
          )
        `)
        .eq('is_deleted', false)
        .eq('active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      return (data || []) as Pick<UserProfile, 'id' | 'user_id' | 'name' | 'email' | 'custom_roles'>[];
    },
    enabled: !!user,
  });

  const createUser = useMutation({
    mutationFn: async (input: CreateUserInput) => {
      // Create user in Supabase Auth using admin API
      // Note: This requires a backend function since we can't create users from client side
      // For now, we'll use signUp which will require email verification
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: {
            name: input.name
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('ইউজার তৈরি করা যায়নি');

      // Update the profile with additional info
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          phone: input.phone || null,
          custom_role_id: input.custom_role_id || null,
          active: input.active ?? true,
        })
        .eq('user_id', authData.user.id);

      if (profileError) throw profileError;

      return authData.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['active_users'] });
      toast({
        title: "সফল",
        description: "ইউজার সফলভাবে তৈরি হয়েছে। ইমেইল ভেরিফিকেশন লিংক পাঠানো হয়েছে।",
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

  const updateUser = useMutation({
    mutationFn: async (input: UpdateUserInput) => {
      const { id, ...updates } = input;
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['active_users'] });
      toast({
        title: "সফল",
        description: "ইউজার সফলভাবে আপডেট হয়েছে",
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

  const deleteUser = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_deleted: true, deleted_at: new Date().toISOString(), active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['active_users'] });
      toast({
        title: "সফল",
        description: "ইউজার সফলভাবে মুছে ফেলা হয়েছে",
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

  const toggleUserActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ active })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, { active }) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['active_users'] });
      toast({
        title: "সফল",
        description: active ? "ইউজার সক্রিয় করা হয়েছে" : "ইউজার নিষ্ক্রিয় করা হয়েছে",
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
    users,
    activeUsers,
    isLoading,
    error,
    createUser: createUser.mutateAsync,
    updateUser: updateUser.mutateAsync,
    deleteUser: deleteUser.mutateAsync,
    toggleUserActive: toggleUserActive.mutateAsync,
    isCreating: createUser.isPending,
    isUpdating: updateUser.isPending,
    isDeleting: deleteUser.isPending,
  };
}
