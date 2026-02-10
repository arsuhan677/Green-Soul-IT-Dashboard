import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { User, Lock, Phone, Mail, Save, Loader2 } from 'lucide-react';

export default function Profile() {
  const { user, profile, refreshSession } = useAuth();
  const { toast } = useToast();
  
  const [name, setName] = useState(profile?.name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleUpdateProfile = async () => {
    if (!user || !profile) return;
    
    if (!name.trim()) {
      toast({
        title: "ত্রুটি",
        description: "নাম খালি রাখা যাবে না",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: name.trim(),
          phone: phone.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "সফল",
        description: "প্রোফাইল আপডেট হয়েছে",
      });
      
      // Refresh to get updated profile
      await refreshSession();
    } catch (error: any) {
      toast({
        title: "ত্রুটি",
        description: error.message || "প্রোফাইল আপডেট করতে সমস্যা হয়েছে",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast({
        title: "ত্রুটি",
        description: "নতুন পাসওয়ার্ড দিন",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "ত্রুটি",
        description: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "ত্রুটি",
        description: "পাসওয়ার্ড মিলছে না",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: "সফল",
        description: "পাসওয়ার্ড পরিবর্তন হয়েছে",
      });
      
      // Clear password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({
        title: "ত্রুটি",
        description: error.message || "পাসওয়ার্ড পরিবর্তন করতে সমস্যা হয়েছে",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">প্রোফাইল সেটিংস</h1>
        <p className="text-muted-foreground">আপনার প্রোফাইল তথ্য এবং পাসওয়ার্ড পরিবর্তন করুন</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              ব্যক্তিগত তথ্য
            </CardTitle>
            <CardDescription>
              আপনার নাম এবং যোগাযোগের তথ্য আপডেট করুন
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                ইমেইল
              </Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ''}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">ইমেইল পরিবর্তন করা যাবে না</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                নাম
              </Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="আপনার নাম"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                ফোন নম্বর
              </Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="০১XXXXXXXXX"
              />
            </div>

            <Separator />

            <Button 
              onClick={handleUpdateProfile} 
              disabled={isUpdatingProfile}
              className="w-full"
            >
              {isUpdatingProfile ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              প্রোফাইল সেভ করুন
            </Button>
          </CardContent>
        </Card>

        {/* Password Change */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              পাসওয়ার্ড পরিবর্তন
            </CardTitle>
            <CardDescription>
              আপনার অ্যাকাউন্টের পাসওয়ার্ড আপডেট করুন
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">নতুন পাসওয়ার্ড</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="নতুন পাসওয়ার্ড"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">পাসওয়ার্ড নিশ্চিত করুন</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="পাসওয়ার্ড আবার লিখুন"
              />
            </div>

            <p className="text-xs text-muted-foreground">
              পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে
            </p>

            <Separator />

            <Button 
              onClick={handleUpdatePassword} 
              disabled={isUpdatingPassword}
              variant="outline"
              className="w-full"
            >
              {isUpdatingPassword ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Lock className="h-4 w-4 mr-2" />
              )}
              পাসওয়ার্ড পরিবর্তন করুন
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
