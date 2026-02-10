import { useState, useCallback } from 'react';
import { getClientSessionToken } from '@/contexts/ClientAuthContext';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface Project {
  id: string;
  title: string;
  status: string;
  progress: number;
  deadline: string | null;
  start_date: string | null;
  created_at: string;
  services?: {
    id: string;
    name: string;
    category: string;
    description?: string;
  } | null;
}

interface ClientNote {
  id: string;
  project_id: string;
  client_id: string;
  note_text: string;
  note_date: string;
  created_at: string;
}

interface ProjectDetail {
  project: Project;
  notes: ClientNote[];
}

export function useClientPortal() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectDetail, setProjectDetail] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiCall = useCallback(async (action: string, data: Record<string, unknown> = {}) => {
    const sessionToken = getClientSessionToken();
    if (!sessionToken) {
      throw new Error('সেশন টোকেন পাওয়া যায়নি');
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/client-portal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-session': sessionToken,
      },
      body: JSON.stringify({ action, ...data }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'অনুরোধ ব্যর্থ হয়েছে');
    }

    return result;
  }, []);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiCall('get_projects');
      setProjects(result.projects || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'প্রজেক্ট লোড করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  const fetchProjectDetail = useCallback(async (projectId: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiCall('get_project_detail', { project_id: projectId });
      setProjectDetail({ project: result.project, notes: result.notes || [] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'প্রজেক্ট লোড করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  const addNote = useCallback(async (projectId: string, noteText: string, noteDate?: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiCall('add_note', {
        project_id: projectId,
        note_text: noteText,
        note_date: noteDate,
      });
      
      if (result.success && result.note) {
        setProjectDetail((prev) => 
          prev 
            ? { ...prev, notes: [result.note, ...prev.notes] }
            : null
        );
      }
      
      return { success: true };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'নোট যোগ করতে সমস্যা হয়েছে';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  const deleteNote = useCallback(async (noteId: string) => {
    setLoading(true);
    setError(null);
    try {
      await apiCall('delete_note', { note_id: noteId });
      
      setProjectDetail((prev) => 
        prev 
          ? { ...prev, notes: prev.notes.filter((n) => n.id !== noteId) }
          : null
      );
      
      return { success: true };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'নোট মুছতে সমস্যা হয়েছে';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  return {
    projects,
    projectDetail,
    loading,
    error,
    fetchProjects,
    fetchProjectDetail,
    addNote,
    deleteNote,
  };
}
