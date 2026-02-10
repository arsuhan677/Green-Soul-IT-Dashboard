import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCompany, CompanySettings } from '@/contexts/CompanyContext';

export interface CompanySettingsInput {
  company_name_bn: string;
  company_name_en?: string;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  invoice_note_bn?: string;
  logo_url?: string;
}

export function useCompanySettings() {
  const { toast } = useToast();
  const { settings, loading, refreshSettings } = useCompany();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const updateSettings = async (input: CompanySettingsInput): Promise<boolean> => {
    if (!settings) return false;

    try {
      setSaving(true);
      const { error: updateError } = await supabase
        .from('company_settings')
        .update({
          company_name_bn: input.company_name_bn,
          company_name_en: input.company_name_en || null,
          phone: input.phone || null,
          email: input.email || null,
          address: input.address || null,
          website: input.website || null,
          invoice_note_bn: input.invoice_note_bn || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', settings.id);

      if (updateError) throw updateError;

      toast({
        title: "সফল!",
        description: "কোম্পানি তথ্য সফলভাবে সংরক্ষণ হয়েছে",
      });

      await refreshSettings();
      return true;
    } catch (err: any) {
      toast({
        title: "ত্রুটি!",
        description: err.message || "সংরক্ষণ করা যায়নি, আবার চেষ্টা করুন",
        variant: "destructive",
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const uploadLogo = async (file: File): Promise<string | null> => {
    if (!settings) return null;

    try {
      setUploading(true);

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `logo_${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('company-assets')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('company-assets')
        .getPublicUrl(filePath);

      // Update settings with new logo URL
      const { error: updateError } = await supabase
        .from('company_settings')
        .update({ 
          logo_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', settings.id);

      if (updateError) throw updateError;

      toast({
        title: "সফল!",
        description: "লোগো সফলভাবে আপলোড হয়েছে",
      });

      await refreshSettings();
      return publicUrl;
    } catch (err: any) {
      toast({
        title: "ত্রুটি!",
        description: err.message || "লোগো আপলোড ব্যর্থ হয়েছে",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const removeLogo = async (): Promise<boolean> => {
    if (!settings) return false;

    try {
      setUploading(true);

      // Update settings to remove logo URL
      const { error: updateError } = await supabase
        .from('company_settings')
        .update({ 
          logo_url: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', settings.id);

      if (updateError) throw updateError;

      toast({
        title: "সফল!",
        description: "লোগো সরানো হয়েছে",
      });

      await refreshSettings();
      return true;
    } catch (err: any) {
      toast({
        title: "ত্রুটি!",
        description: err.message || "লোগো সরাতে সমস্যা হয়েছে",
        variant: "destructive",
      });
      return false;
    } finally {
      setUploading(false);
    }
  };

  return {
    settings,
    loading,
    saving,
    uploading,
    updateSettings,
    uploadLogo,
    removeLogo,
    refreshSettings,
  };
}
