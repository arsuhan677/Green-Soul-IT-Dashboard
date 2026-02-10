import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { isValidUUID } from '@/lib/validation';

export interface ProjectNote {
  id: string;
  project_id: string;
  note_date: string;
  note_time: string | null;
  note_type: string | null;
  note_text: string;
  created_by: string;
  created_by_name: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectNoteInput {
  project_id: string;
  note_date: string;
  note_time?: string;
  note_type?: string;
  note_text: string;
}

export function useProjectNotes(projectId: string) {
  const { user, profile, hasRole } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState<ProjectNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = hasRole('admin');

  // Fetch notes for a specific project
  const fetchNotes = useCallback(async () => {
    if (!user || !projectId || !isValidUUID(projectId)) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('project_notes')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_deleted', false)
        .order('note_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setNotes(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching project notes:', err);
    } finally {
      setLoading(false);
    }
  }, [user, projectId]);

  // Add new note
  const addNote = async (input: ProjectNoteInput): Promise<boolean> => {
    if (!user) return false;

    if (!isValidUUID(input.project_id)) {
      toast({
        title: "ত্রুটি!",
        description: "ভুল প্রজেক্ট আইডি পাঠানো হয়েছে।",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error: insertError } = await supabase
        .from('project_notes')
        .insert({
          project_id: input.project_id,
          note_date: input.note_date,
          note_time: input.note_time || null,
          note_type: input.note_type || 'আপডেট',
          note_text: input.note_text,
          created_by: user.id,
          created_by_name: profile?.name || 'অজানা ব্যবহারকারী',
          is_deleted: false,
        });

      if (insertError) throw insertError;

      toast({
        title: "সফল!",
        description: "নোট সফলভাবে যোগ করা হয়েছে",
      });

      await fetchNotes();
      return true;
    } catch (err: any) {
      toast({
        title: "ত্রুটি!",
        description: err.message || "নোট যোগ করতে সমস্যা হয়েছে",
        variant: "destructive",
      });
      return false;
    }
  };

  // Update note
  const updateNote = async (noteId: string, input: Partial<ProjectNoteInput>): Promise<boolean> => {
    if (!user) return false;

    if (!isValidUUID(noteId)) {
      toast({
        title: "ত্রুটি!",
        description: "ভুল নোট আইডি পাঠানো হয়েছে।",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error: updateError } = await supabase
        .from('project_notes')
        .update({
          note_date: input.note_date,
          note_time: input.note_time,
          note_type: input.note_type,
          note_text: input.note_text,
        })
        .eq('id', noteId);

      if (updateError) throw updateError;

      toast({
        title: "সফল!",
        description: "নোট সফলভাবে আপডেট করা হয়েছে",
      });

      await fetchNotes();
      return true;
    } catch (err: any) {
      toast({
        title: "ত্রুটি!",
        description: err.message || "নোট আপডেট করতে সমস্যা হয়েছে",
        variant: "destructive",
      });
      return false;
    }
  };

  // Soft delete note
  const deleteNote = async (noteId: string): Promise<boolean> => {
    if (!user) return false;

    if (!isValidUUID(noteId)) {
      toast({
        title: "ত্রুটি!",
        description: "ভুল নোট আইডি পাঠানো হয়েছে।",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error: deleteError } = await supabase
        .from('project_notes')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
        })
        .eq('id', noteId);

      if (deleteError) throw deleteError;

      // Immediately update UI
      setNotes((prev) => prev.filter((n) => n.id !== noteId));

      toast({
        title: "সফল!",
        description: "নোট সফলভাবে মুছে ফেলা হয়েছে",
      });

      return true;
    } catch (err: any) {
      toast({
        title: "ত্রুটি!",
        description: err.message || "নোট মুছে ফেলতে সমস্যা হয়েছে",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  return {
    notes,
    loading,
    error,
    fetchNotes,
    addNote,
    updateNote,
    deleteNote,
    isAdmin,
  };
}
