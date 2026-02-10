import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BankAccount {
  id: string;
  account_type: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  branch_name: string | null;
  routing_number: string | null;
  swift_code: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface BankAccountInput {
  account_type: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  branch_name?: string;
  routing_number?: string;
  swift_code?: string;
  is_active?: boolean;
  display_order?: number;
}

export function useBankAccounts() {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchBankAccounts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setBankAccounts(data || []);
    } catch (err: any) {
      console.error('Error fetching bank accounts:', err);
      toast.error('ব্যাংক অ্যাকাউন্ট লোড করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  const addBankAccount = async (input: BankAccountInput) => {
    try {
      setSaving(true);
      const { data, error } = await supabase
        .from('bank_accounts')
        .insert([input])
        .select()
        .single();

      if (error) throw error;
      setBankAccounts((prev) => [...prev, data]);
      toast.success('ব্যাংক অ্যাকাউন্ট যোগ করা হয়েছে');
      return data;
    } catch (err: any) {
      console.error('Error adding bank account:', err);
      toast.error('ব্যাংক অ্যাকাউন্ট যোগ করতে সমস্যা হয়েছে');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const updateBankAccount = async (id: string, input: Partial<BankAccountInput>) => {
    try {
      setSaving(true);
      const { data, error } = await supabase
        .from('bank_accounts')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setBankAccounts((prev) =>
        prev.map((acc) => (acc.id === id ? data : acc))
      );
      toast.success('ব্যাংক অ্যাকাউন্ট আপডেট হয়েছে');
      return data;
    } catch (err: any) {
      console.error('Error updating bank account:', err);
      toast.error('ব্যাংক অ্যাকাউন্ট আপডেট করতে সমস্যা হয়েছে');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const deleteBankAccount = async (id: string) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('bank_accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setBankAccounts((prev) => prev.filter((acc) => acc.id !== id));
      toast.success('ব্যাংক অ্যাকাউন্ট ডিলিট হয়েছে');
      return true;
    } catch (err: any) {
      console.error('Error deleting bank account:', err);
      toast.error('ব্যাংক অ্যাকাউন্ট ডিলিট করতে সমস্যা হয়েছে');
      return false;
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchBankAccounts();
  }, []);

  const activeBankAccounts = bankAccounts.filter((acc) => acc.is_active);

  return {
    bankAccounts,
    activeBankAccounts,
    loading,
    saving,
    fetchBankAccounts,
    addBankAccount,
    updateBankAccount,
    deleteBankAccount,
  };
}
