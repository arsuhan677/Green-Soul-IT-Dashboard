import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Bell,
  Lock,
  Building2,
  Users,
  Shield,
  Save,
  Plus,
  Upload,
  Trash2,
  Loader2,
  ImageIcon,
  Landmark,
} from 'lucide-react';
import { userRoles } from '@/data/sampleData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { usePermissions } from '@/hooks/usePermissions';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useAuth } from '@/contexts/AuthContext';
import { BankAccountsSection } from '@/components/settings/BankAccountsSection';

export default function SettingsPage() {
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const { isAdmin } = usePermissions();
  const { profile } = useAuth();
  const { 
    settings, 
    loading, 
    saving, 
    uploading, 
    updateSettings, 
    uploadLogo, 
    removeLogo 
  } = useCompanySettings();
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Company form state
  const [companyForm, setCompanyForm] = useState({
    company_name_bn: '',
    company_name_en: '',
    phone: '',
    email: '',
    address: '',
    website: '',
    invoice_note_bn: '',
  });

  // Sync form with settings
  useEffect(() => {
    if (settings) {
      setCompanyForm({
        company_name_bn: settings.company_name_bn || '',
        company_name_en: settings.company_name_en || '',
        phone: settings.phone || '',
        email: settings.email || '',
        address: settings.address || '',
        website: settings.website || '',
        invoice_note_bn: settings.invoice_note_bn || '',
      });
    }
  }, [settings]);

  const handleSaveCompanySettings = async () => {
    await updateSettings(companyForm);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return;
    }

    await uploadLogo(file);
  };

  const handleRemoveLogo = async () => {
    await removeLogo();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">সেটিংস</h1>
          <p className="text-muted-foreground mt-1">অ্যাপ্লিকেশন সেটিংস ও ব্যবহারকারী পরিচালনা</p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 flex-wrap">
          <TabsTrigger value="profile" className="gap-2">
            <User className="w-4 h-4" />
            প্রোফাইল
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="company" className="gap-2">
              <Building2 className="w-4 h-4" />
              কোম্পানি
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="bank" className="gap-2">
              <Landmark className="w-4 h-4" />
              ব্যাংক/পেমেন্ট
            </TabsTrigger>
          )}
          <TabsTrigger value="users" className="gap-2">
            <Users className="w-4 h-4" />
            ব্যবহারকারী
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            নোটিফিকেশন
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Lock className="w-4 h-4" />
            সিকিউরিটি
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                প্রোফাইল তথ্য
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-2xl font-bold">
                  {profile?.name?.charAt(0) || 'অ'}
                </div>
                <div>
                  <Button variant="outline" size="sm">
                    ছবি পরিবর্তন করুন
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    JPG, PNG বা GIF। সর্বোচ্চ ২MB
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="name">পুরো নাম</Label>
                  <Input id="name" defaultValue={profile?.name || ''} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="email">ইমেইল</Label>
                  <Input id="email" type="email" defaultValue={profile?.email || ''} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="phone">ফোন</Label>
                  <Input id="phone" defaultValue={profile?.phone || ''} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="role">রোল</Label>
                  <Input id="role" defaultValue={isAdmin ? 'অ্যাডমিন' : 'স্টাফ'} disabled className="mt-1" />
                </div>
              </div>

              <div className="flex justify-end">
                <Button className="btn-primary">
                  <Save className="w-4 h-4 mr-2" />
                  পরিবর্তন সংরক্ষণ করুন
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Company Tab (Admin Only) */}
        {isAdmin && (
          <TabsContent value="company">
            <div className="space-y-6">
              {/* Logo Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-primary" />
                    কোম্পানি লোগো
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-6">
                    {settings?.logo_url ? (
                      <div className="relative">
                        <img 
                          src={settings.logo_url} 
                          alt="Company Logo" 
                          className="w-32 h-32 object-contain border border-border rounded-lg p-2"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6"
                          onClick={handleRemoveLogo}
                          disabled={uploading}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="w-32 h-32 border-2 border-dashed border-border rounded-lg flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={handleLogoUpload}
                      />
                      <Button 
                        variant="outline" 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        {uploading ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4 mr-2" />
                        )}
                        {settings?.logo_url ? 'লোগো পরিবর্তন করুন' : 'লোগো আপলোড করুন'}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        PNG, JPG বা WebP। সর্বোচ্চ ২MB
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Company Info Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary" />
                    কোম্পানি তথ্য
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="companyNameBn">কোম্পানির নাম (বাংলা) *</Label>
                          <Input 
                            id="companyNameBn" 
                            value={companyForm.company_name_bn}
                            onChange={(e) => setCompanyForm({ ...companyForm, company_name_bn: e.target.value })}
                            className="mt-1" 
                          />
                        </div>
                        <div>
                          <Label htmlFor="companyNameEn">কোম্পানির নাম (ইংরেজি)</Label>
                          <Input 
                            id="companyNameEn" 
                            value={companyForm.company_name_en}
                            onChange={(e) => setCompanyForm({ ...companyForm, company_name_en: e.target.value })}
                            className="mt-1" 
                          />
                        </div>
                        <div>
                          <Label htmlFor="companyPhone">ফোন</Label>
                          <Input 
                            id="companyPhone" 
                            value={companyForm.phone}
                            onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                            className="mt-1" 
                          />
                        </div>
                        <div>
                          <Label htmlFor="companyEmail">ইমেইল</Label>
                          <Input 
                            id="companyEmail" 
                            type="email" 
                            value={companyForm.email}
                            onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                            className="mt-1" 
                          />
                        </div>
                        <div>
                          <Label htmlFor="website">ওয়েবসাইট</Label>
                          <Input 
                            id="website" 
                            value={companyForm.website}
                            onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
                            className="mt-1" 
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="address">ঠিকানা</Label>
                          <Input 
                            id="address" 
                            value={companyForm.address}
                            onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                            className="mt-1" 
                          />
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h4 className="font-medium text-foreground mb-4">ইনভয়েস সেটিংস</h4>
                        <div>
                          <Label htmlFor="invoiceNote">ইনভয়েস নোট (বাংলা)</Label>
                          <Textarea 
                            id="invoiceNote" 
                            placeholder="ইনভয়েসের নীচে প্রদর্শিত হবে..."
                            value={companyForm.invoice_note_bn}
                            onChange={(e) => setCompanyForm({ ...companyForm, invoice_note_bn: e.target.value })}
                            className="mt-1" 
                            rows={3}
                          />
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button 
                          className="btn-primary" 
                          onClick={handleSaveCompanySettings}
                          disabled={saving}
                        >
                          {saving ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4 mr-2" />
                          )}
                          সংরক্ষণ করুন
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

        {/* Bank Accounts Tab (Admin Only) */}
        {isAdmin && (
          <TabsContent value="bank">
            <BankAccountsSection />
          </TabsContent>
        )}

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                ব্যবহারকারী ম্যানেজমেন্ট
              </CardTitle>
              <Dialog open={isAddUserModalOpen} onOpenChange={setIsAddUserModalOpen}>
                <DialogTrigger asChild>
                  <Button className="btn-primary">
                    <Plus className="w-4 h-4" />
                    নতুন ব্যবহারকারী যোগ করুন
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>নতুন ব্যবহারকারী যোগ করুন</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="newName">নাম *</Label>
                      <Input id="newName" placeholder="পুরো নাম" className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="newEmail">ইমেইল *</Label>
                      <Input id="newEmail" type="email" placeholder="email@example.com" className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="newPassword">পাসওয়ার্ড *</Label>
                      <Input id="newPassword" type="password" placeholder="••••••••" className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="newRole">রোল *</Label>
                      <Select>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="রোল নির্বাচন করুন" />
                        </SelectTrigger>
                        <SelectContent>
                          {userRoles.map((role) => (
                            <SelectItem key={role} value={role}>
                              {role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                      <Button variant="outline" onClick={() => setIsAddUserModalOpen(false)}>
                        বাতিল করুন
                      </Button>
                      <Button className="btn-primary" onClick={() => setIsAddUserModalOpen(false)}>
                        ব্যবহারকারী যোগ করুন
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Sample Users */}
                {[
                  { name: 'অ্যাডমিন ইউজার', email: 'admin@ashmatech.com', role: 'অ্যাডমিন' },
                  { name: 'সেলস এক্সিকিউটিভ', email: 'sales@ashmatech.com', role: 'সেলস' },
                  { name: 'প্রজেক্ট ম্যানেজার', email: 'pm@ashmatech.com', role: 'প্রজেক্ট ম্যানেজার' },
                ].map((user, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 border border-border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-medium">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="status-badge bg-primary/10 text-primary">{user.role}</span>
                      <Button variant="ghost" size="sm">
                        এডিট করুন
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                নোটিফিকেশন সেটিংস
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">নতুন লিড নোটিফিকেশন</p>
                    <p className="text-sm text-muted-foreground">নতুন লিড আসলে নোটিফিকেশন পান</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">ফলোআপ রিমাইন্ডার</p>
                    <p className="text-sm text-muted-foreground">ফলোআপ সময় হলে রিমাইন্ডার পান</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">প্রজেক্ট আপডেট</p>
                    <p className="text-sm text-muted-foreground">প্রজেক্ট স্ট্যাটাস পরিবর্তনে নোটিফিকেশন</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">পেমেন্ট নোটিফিকেশন</p>
                    <p className="text-sm text-muted-foreground">পেমেন্ট সম্পন্ন বা বকেয়া হলে জানান</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">ইমেইল নোটিফিকেশন</p>
                    <p className="text-sm text-muted-foreground">গুরুত্বপূর্ণ আপডেট ইমেইলে পান</p>
                  </div>
                  <Switch />
                </div>
              </div>

              <div className="flex justify-end">
                <Button className="btn-primary">
                  <Save className="w-4 h-4 mr-2" />
                  সেটিংস সংরক্ষণ করুন
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                সিকিউরিটি সেটিংস
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium text-foreground mb-4">পাসওয়ার্ড পরিবর্তন</h4>
                <div className="space-y-4 max-w-md">
                  <div>
                    <Label htmlFor="currentPassword">বর্তমান পাসওয়ার্ড</Label>
                    <Input id="currentPassword" type="password" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="newPassword2">নতুন পাসওয়ার্ড</Label>
                    <Input id="newPassword2" type="password" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">পাসওয়ার্ড নিশ্চিত করুন</Label>
                    <Input id="confirmPassword" type="password" className="mt-1" />
                  </div>
                  <Button className="btn-primary">
                    পাসওয়ার্ড আপডেট করুন
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">টু-ফ্যাক্টর অথেনটিকেশন</p>
                    <p className="text-sm text-muted-foreground">অতিরিক্ত সুরক্ষার জন্য 2FA সক্রিয় করুন</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">সেশন টাইমআউট</p>
                    <p className="text-sm text-muted-foreground">৩০ মিনিট পর স্বয়ংক্রিয় লগআউট</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
