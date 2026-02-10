import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, User, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ClientLogin() {
  const [clientCode, setClientCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useClientAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientCode.trim() || !password.trim()) {
      toast({
        variant: 'destructive',
        title: 'ত্রুটি',
        description: 'ক্লায়েন্ট আইডি এবং পাসওয়ার্ড দিন',
      });
      return;
    }

    setLoading(true);
    
    const result = await login(clientCode.trim().toUpperCase(), password);
    
    setLoading(false);

    if (result.success) {
      toast({
        title: 'সফল',
        description: 'লগইন সফল হয়েছে',
      });
      navigate('/client-portal');
    } else {
      toast({
        variant: 'destructive',
        title: 'লগইন ব্যর্থ',
        description: result.error || 'লগইন করতে সমস্যা হয়েছে',
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">ক্লায়েন্ট পোর্টাল</CardTitle>
          <CardDescription>
            আপনার ক্লায়েন্ট আইডি এবং পাসওয়ার্ড দিয়ে লগইন করুন
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clientCode">ক্লায়েন্ট আইডি</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="clientCode"
                  placeholder="যেমন: CL-000001"
                  value={clientCode}
                  onChange={(e) => setClientCode(e.target.value.toUpperCase())}
                  className="pl-10"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">পাসওয়ার্ড</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="আপনার পাসওয়ার্ড"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  disabled={loading}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  লগইন হচ্ছে...
                </>
              ) : (
                'লগইন করুন'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>আপনার লগইন তথ্য প্রয়োজন?</p>
            <p>আপনার প্রজেক্ট ম্যানেজারের সাথে যোগাযোগ করুন।</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
