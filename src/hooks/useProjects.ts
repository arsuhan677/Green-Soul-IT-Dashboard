import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { isValidUUID } from '@/lib/validation';
import { logActivity } from '@/lib/activityLogger';

export interface Project {
  id: string;
  user_id: string;
  client_id: string | null;
  service_id: string | null;
  title: string;
  budget: number;
  start_date: string | null;
  deadline: string | null;
  status: string;
  progress: number;
  assigned_team: string[] | null;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectInput {
  title: string;
  client_id: string;
  service_id?: string;
  budget?: number;
  start_date?: string;
  deadline?: string;
  status?: string;
  progress?: number;
  assigned_team?: string[];
}

export function useProjects() {
  const { user, profile, hasRole } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const isAdmin = hasRole('admin');

  // Fetch projects (excluding deleted ones)
  const fetchProjects = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('projects')
        .select('*')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setProjects(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  // Add new project
  const addProject = async (input: ProjectInput): Promise<boolean> => {
    if (!user) return false;

    // Validate UUIDs
    if (!isValidUUID(input.client_id)) {
      toast({
        title: "ত্রুটি!",
        description: "ভুল ক্লায়েন্ট আইডি পাঠানো হয়েছে, অনুগ্রহ করে আবার নির্বাচন করুন।",
        variant: "destructive",
      });
      return false;
    }

    if (input.service_id && !isValidUUID(input.service_id)) {
      toast({
        title: "ত্রুটি!",
        description: "ভুল সার্ভিস আইডি পাঠানো হয়েছে, অনুগ্রহ করে আবার নির্বাচন করুন।",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error: insertError } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          title: input.title,
          client_id: input.client_id,
          service_id: input.service_id || null,
          budget: input.budget || 0,
          start_date: input.start_date || null,
          deadline: input.deadline || null,
          status: input.status || 'চলমান',
          progress: input.progress || 0,
          assigned_team: input.assigned_team || null,
          is_deleted: false,
        });

      if (insertError) throw insertError;

      toast({
        title: "সফল!",
        description: "নতুন প্রজেক্ট সফলভাবে তৈরি হয়েছে",
      });

      // Log activity
      await logActivity({
        userId: user.id,
        userName: profile?.name || 'অজানা ব্যবহারকারী',
        action: 'create',
        module: 'projects',
        recordTitle: input.title,
        details: `নতুন প্রজেক্ট তৈরি হয়েছে: ${input.title}`,
      });

      await fetchProjects();
      return true;
    } catch (err: any) {
      toast({
        title: "ত্রুটি!",
        description: err.message || "প্রজেক্ট তৈরি করতে সমস্যা হয়েছে",
        variant: "destructive",
      });
      return false;
    }
  };

  // Update project
  const updateProject = async (projectId: string, input: Partial<ProjectInput>): Promise<boolean> => {
    if (!user) return false;

    // Validate projectId UUID
    if (!isValidUUID(projectId)) {
      toast({
        title: "ত্রুটি!",
        description: "ভুল প্রজেক্ট আইডি পাঠানো হয়েছে, অনুগ্রহ করে আবার নির্বাচন করুন।",
        variant: "destructive",
      });
      return false;
    }

    try {
      // Strip budget from update if user is not admin
      const updateData = { ...input };
      if (!isAdmin) {
        delete updateData.budget;
      }

      const { error: updateError } = await supabase
        .from('projects')
        .update({
          ...updateData,
        })
        .eq('id', projectId);

      if (updateError) throw updateError;

      toast({
        title: "সফল!",
        description: "সফলভাবে আপডেট হয়েছে",
      });

      // Log activity
      const project = projects.find(p => p.id === projectId);
      await logActivity({
        userId: user.id,
        userName: profile?.name || 'অজানা ব্যবহারকারী',
        action: 'update',
        module: 'projects',
        recordId: projectId,
        recordTitle: project?.title || input.title,
        details: `প্রজেক্ট আপডেট হয়েছে: ${project?.title || input.title || 'অজানা'}`,
      });

      await fetchProjects();
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

  // Hard delete project (Admin only)
  const deleteProject = async (projectId: string): Promise<boolean> => {
    if (!user) return false;

    // Validate projectId UUID
    if (!isValidUUID(projectId)) {
      toast({
        title: "ত্রুটি!",
        description: "ভুল প্রজেক্ট আইডি পাঠানো হয়েছে, অনুগ্রহ করে আবার নির্বাচন করুন।",
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
          description: "শুধুমাত্র অ্যাডমিন প্রজেক্ট ডিলিট করতে পারবেন",
          variant: "destructive",
        });
        return false;
      }

      const project = projects.find(p => p.id === projectId);
      
      // Hard delete - permanently remove from database
      const { error: deleteError } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

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
        module: 'projects',
        recordId: projectId,
        recordTitle: project?.title,
        details: `প্রজেক্ট স্থায়ীভাবে মুছে ফেলা হয়েছে: ${project?.title || 'অজানা'}`,
      });

      // Immediately update UI state
      setProjects(prev => prev.filter(p => p.id !== projectId));

      toast({
        title: "সফলভাবে মুছে ফেলা হয়েছে",
        description: "প্রজেক্ট স্থায়ীভাবে মুছে ফেলা হয়েছে",
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

  // Get projects by client
  const getProjectsByClient = (clientId: string) => {
    return projects.filter(p => p.client_id === clientId);
  };

  useEffect(() => {
    fetchProjects();
  }, [user]);

  return {
    projects,
    loading,
    error,
    fetchProjects,
    addProject,
    updateProject,
    deleteProject,
    getProjectsByClient,
  };
}
