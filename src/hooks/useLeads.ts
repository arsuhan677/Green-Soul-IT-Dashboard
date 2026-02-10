import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { isValidUUID } from '@/lib/validation';
import { logActivity } from '@/lib/activityLogger';
import type { Json } from '@/integrations/supabase/types';

interface LeadNote {
  text: string;
  date: string;
}

export interface Lead {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  email: string | null;
  company: string | null;
  service_id: string | null;
  source: string;
  status: string;
  notes: LeadNote[];
  next_follow_up_at: string | null;
  assigned_to: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  created_by_name: string | null;
}

export interface LeadInput {
  name: string;
  phone: string;
  email?: string;
  company?: string;
  service_id?: string;
  source: string;
  note?: string;
  next_follow_up_at?: string;
}

// Helper to parse notes from JSONB
const parseNotes = (notes: Json): LeadNote[] => {
  if (!notes || !Array.isArray(notes)) return [];
  return notes.map(note => {
    if (typeof note === 'object' && note !== null && !Array.isArray(note)) {
      return {
        text: String((note as Record<string, Json>).text || ''),
        date: String((note as Record<string, Json>).date || new Date().toISOString())
      };
    }
    return { text: '', date: new Date().toISOString() };
  });
};

// Helper to convert notes to JSON
const notesToJson = (notes: LeadNote[]): Json => {
  return notes.map(note => ({
    text: note.text,
    date: note.date
  })) as Json;
};

export function useLeads() {
  const { user, profile, isAuthenticated, refreshSession } = useAuth();
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Fetch leads (excluding deleted ones)
  const fetchLeads = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('leads')
        .select('*')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Parse notes from JSONB
      const parsedLeads: Lead[] = (data || []).map(lead => ({
        ...lead,
        notes: parseNotes(lead.notes as Json)
      }));

      setLeads(parsedLeads);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching leads:', err);
    } finally {
      setLoading(false);
    }
  };

  // Add new lead
  const addLead = async (input: LeadInput): Promise<boolean> => {
    if (!user) return false;

    // Validate service_id UUID if provided
    if (input.service_id && !isValidUUID(input.service_id)) {
      toast({
        title: "ত্রুটি!",
        description: "ভুল সার্ভিস আইডি পাঠানো হয়েছে, অনুগ্রহ করে আবার নির্বাচন করুন।",
        variant: "destructive",
      });
      return false;
    }

    try {
      const notes: LeadNote[] = input.note 
        ? [{ text: input.note, date: new Date().toISOString() }] 
        : [];

      const { error: insertError } = await supabase
        .from('leads')
        .insert({
          user_id: user.id,
          name: input.name,
          phone: input.phone,
          email: input.email || null,
          company: input.company || null,
          service_id: input.service_id || null,
          source: input.source,
          status: 'নতুন',
          notes: notesToJson(notes),
          next_follow_up_at: input.next_follow_up_at || null,
          is_deleted: false,
          created_by_name: profile?.name || 'অজানা ব্যবহারকারী',
        });

      if (insertError) throw insertError;

      toast({
        title: "সফল!",
        description: "নতুন লিড সফলভাবে যোগ করা হয়েছে",
      });

      // Log activity
      await logActivity({
        userId: user.id,
        userName: profile?.name || 'অজানা ব্যবহারকারী',
        action: 'create',
        module: 'leads',
        recordTitle: input.name,
        details: `নতুন লিড যোগ করা হয়েছে: ${input.name}`,
      });

      await fetchLeads();
      return true;
    } catch (err: any) {
      toast({
        title: "ত্রুটি!",
        description: err.message || "লিড যোগ করতে সমস্যা হয়েছে",
        variant: "destructive",
      });
      return false;
    }
  };

  // Update lead status with auto logging
  const updateLeadStatus = async (leadId: string, newStatus: string, oldStatus: string): Promise<boolean> => {
    if (!user) {
      console.error('updateLeadStatus: No user authenticated');
      return false;
    }

    // Validate leadId UUID
    if (!isValidUUID(leadId)) {
      console.error('updateLeadStatus: Invalid lead ID:', leadId);
      toast({
        title: "ত্রুটি!",
        description: "ভুল লিড আইডি পাঠানো হয়েছে, অনুগ্রহ করে আবার নির্বাচন করুন।",
        variant: "destructive",
      });
      return false;
    }

    try {
      // Find the lead from current state
      const lead = leads.find(l => l.id === leadId);
      if (!lead) {
        console.error('updateLeadStatus: Lead not found in state:', leadId);
        toast({
          title: "ত্রুটি!",
          description: "লিড খুঁজে পাওয়া যায়নি।",
          variant: "destructive",
        });
        return false;
      }

      // Build new note for timeline
      const newNote: LeadNote = {
        text: `স্ট্যাটাস পরিবর্তন: ${oldStatus} → ${newStatus}`,
        date: new Date().toISOString()
      };

      const updatedNotes = [...lead.notes, newNote];

      console.log('updateLeadStatus: Updating lead', { leadId, newStatus, oldStatus });

      const { data, error: updateError } = await supabase
        .from('leads')
        .update({
          status: newStatus,
          notes: notesToJson(updatedNotes),
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId)
        .select();

      if (updateError) {
        console.error('updateLeadStatus: Supabase error:', updateError);
        throw updateError;
      }

      console.log('updateLeadStatus: Success, updated data:', data);

      // Immediately update local state for instant UI feedback
      setLeads(prev => prev.map(l => 
        l.id === leadId 
          ? { ...l, status: newStatus, notes: updatedNotes, updated_at: new Date().toISOString() }
          : l
      ));

      toast({
        title: "স্ট্যাটাস আপডেট হয়েছে",
        description: `স্ট্যাটাস পরিবর্তন: ${oldStatus} → ${newStatus}`,
      });

      // Log activity
      await logActivity({
        userId: user.id,
        userName: profile?.name || 'অজানা ব্যবহারকারী',
        action: 'update',
        module: 'leads',
        recordId: leadId,
        recordTitle: lead.name,
        details: `স্ট্যাটাস পরিবর্তন: ${oldStatus} → ${newStatus}`,
      });

      return true;
    } catch (err: any) {
      console.error('updateLeadStatus: Error:', err);
      toast({
        title: "ত্রুটি!",
        description: err.message || "স্ট্যাটাস আপডেট হয়নি, আবার চেষ্টা করুন",
        variant: "destructive",
      });
      return false;
    }
  };

  // Add note to lead
  const addLeadNote = async (leadId: string, noteText: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const lead = leads.find(l => l.id === leadId);
      if (!lead) return false;

      const newNote: LeadNote = {
        text: noteText,
        date: new Date().toISOString()
      };

      const updatedNotes = [...lead.notes, newNote];

      const { error: updateError } = await supabase
        .from('leads')
        .update({ notes: notesToJson(updatedNotes) })
        .eq('id', leadId);

      if (updateError) throw updateError;

      await fetchLeads();
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

  // Set follow-up date
  const setFollowUp = async (leadId: string, date: string, note?: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const lead = leads.find(l => l.id === leadId);
      if (!lead) return false;

      const newNote: LeadNote = {
        text: note ? `ফলোআপ সেট করা হয়েছে: ${note}` : 'ফলোআপ তারিখ আপডেট করা হয়েছে',
        date: new Date().toISOString()
      };

      const updatedNotes = [...lead.notes, newNote];

      const { error: updateError } = await supabase
        .from('leads')
        .update({
          next_follow_up_at: date,
          notes: notesToJson(updatedNotes)
        })
        .eq('id', leadId);

      if (updateError) throw updateError;

      toast({
        title: "সফল!",
        description: `ফলোআপ সেট করা হয়েছে: ${new Date(date).toLocaleDateString('bn-BD')}`,
      });

      await fetchLeads();
      return true;
    } catch (err: any) {
      toast({
        title: "ত্রুটি!",
        description: err.message || "ফলোআপ সেট করতে সমস্যা হয়েছে",
        variant: "destructive",
      });
      return false;
    }
  };

  // Hard delete lead (admin only)
  const deleteLead = async (leadId: string): Promise<boolean> => {
    // Check authentication first
    if (!isAuthenticated() || !user) {
      toast({
        title: "সেশন শেষ!",
        description: "অনুগ্রহ করে আবার লগইন করুন",
        variant: "destructive",
      });
      navigate('/auth');
      return false;
    }

    if (!isValidUUID(leadId)) {
      toast({
        title: "ত্রুটি!",
        description: "ভুল লিড আইডি পাঠানো হয়েছে।",
        variant: "destructive",
      });
      return false;
    }

    try {
      // Refresh session to ensure valid token
      const refreshedSession = await refreshSession();
      if (!refreshedSession) {
        toast({
          title: "সেশন শেষ!",
          description: "অনুগ্রহ করে আবার লগইন করুন",
          variant: "destructive",
        });
        navigate('/auth');
        return false;
      }

      // Check admin status directly from database
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
          title: "অনুমতি নেই!",
          description: "শুধুমাত্র অ্যাডমিন লিড মুছতে পারেন",
          variant: "destructive",
        });
        return false;
      }

      const lead = leads.find(l => l.id === leadId);
      
      // Hard delete - permanently remove from database
      const { error: deleteError } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId);

      if (deleteError) {
        console.error('Lead delete error details:', {
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
        module: 'leads',
        recordId: leadId,
        recordTitle: lead?.name,
        details: `লিড স্থায়ীভাবে মুছে ফেলা হয়েছে: ${lead?.name || 'অজানা'}`,
      });

      // Refetch list after success
      await fetchLeads();

      toast({
        title: "সফলভাবে মুছে ফেলা হয়েছে",
        description: "লিড স্থায়ীভাবে মুছে ফেলা হয়েছে",
      });

      return true;
    } catch (err: any) {
      console.error('Lead delete error:', err);
      
      if (err.code === '42501' || err.message?.includes('row-level security')) {
        toast({
          title: "RLS ত্রুটি!",
          description: `ডাটাবেজ অনুমতি সমস্যা: ${err.message}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "ত্রুটি!",
          description: err.message || "মুছে ফেলতে সমস্যা হয়েছে",
          variant: "destructive",
        });
      }
      return false;
    }
  };

  // Update lead (edit)
  const updateLead = async (leadId: string, input: LeadInput): Promise<boolean> => {
    if (!user) return false;

    // Validate leadId UUID
    if (!isValidUUID(leadId)) {
      toast({
        title: "ত্রুটি!",
        description: "ভুল লিড আইডি পাঠানো হয়েছে।",
        variant: "destructive",
      });
      return false;
    }

    // Validate service_id UUID if provided
    if (input.service_id && !isValidUUID(input.service_id)) {
      toast({
        title: "ত্রুটি!",
        description: "ভুল সার্ভিস আইডি পাঠানো হয়েছে।",
        variant: "destructive",
      });
      return false;
    }

    try {
      const lead = leads.find(l => l.id === leadId);
      if (!lead) return false;

      // Build notes array with new note if provided
      let updatedNotes = [...lead.notes];
      if (input.note) {
        updatedNotes.push({
          text: input.note,
          date: new Date().toISOString()
        });
      }

      const { error: updateError } = await supabase
        .from('leads')
        .update({
          name: input.name,
          phone: input.phone,
          email: input.email || null,
          company: input.company || null,
          service_id: input.service_id || null,
          source: input.source,
          notes: notesToJson(updatedNotes),
          next_follow_up_at: input.next_follow_up_at || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);

      if (updateError) throw updateError;

      // Log activity
      await logActivity({
        userId: user.id,
        userName: profile?.name || 'অজানা ব্যবহারকারী',
        action: 'update',
        module: 'leads',
        recordId: leadId,
        recordTitle: input.name,
        details: `লিড আপডেট করা হয়েছে: ${input.name}`,
      });

      toast({
        title: "সফল!",
        description: "লিড সফলভাবে আপডেট হয়েছে",
      });

      await fetchLeads();
      return true;
    } catch (err: any) {
      toast({
        title: "ত্রুটি!",
        description: err.message || "লিড আপডেট করতে সমস্যা হয়েছে",
        variant: "destructive",
      });
      return false;
    }
  };

  // Convert lead to client
  const convertToClient = async (leadId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const lead = leads.find(l => l.id === leadId);
      if (!lead) return false;

      // Create client from lead
      const { error: clientError } = await supabase
        .from('clients')
        .insert({
          user_id: user.id,
          name: lead.name,
          phone: lead.phone,
          email: lead.email || '',
          company: lead.company,
          is_deleted: false,
        });

      if (clientError) throw clientError;

      // Update lead status
      const newNote: LeadNote = {
        text: 'ক্লায়েন্টে রূপান্তরিত হয়েছে',
        date: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('leads')
        .update({
          status: 'ক্লোজড/সেল',
          notes: notesToJson([...lead.notes, newNote])
        })
        .eq('id', leadId);

      if (updateError) throw updateError;

      toast({
        title: "সফল! 🎉",
        description: `${lead.name} সফলভাবে ক্লায়েন্টে রূপান্তরিত হয়েছে`,
      });

      await fetchLeads();
      return true;
    } catch (err: any) {
      toast({
        title: "ত্রুটি!",
        description: err.message || "রূপান্তর করতে সমস্যা হয়েছে",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [user]);

  return {
    leads,
    loading,
    error,
    fetchLeads,
    addLead,
    updateLead,
    updateLeadStatus,
    addLeadNote,
    setFollowUp,
    deleteLead,
    convertToClient,
  };
}
