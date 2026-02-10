import { useState } from 'react';
import { useClientAuth } from '@/hooks/useClientAuthAdmin';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Loader2, Key, Shield, Copy, Check, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ClientAccess() {
  const { hasRole } = useAuth();
  const { clients, loading, createCredentials, toggleActive, fetchClients } = useClientAuth();
  const { toast } = useToast();

  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isAdmin = hasRole('admin');

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">শুধুমাত্র অ্যাডমিন এই পেজ দেখতে পারেন</p>
      </div>
    );
  }

  const handleCreateCredentials = async () => {
    if (!selectedClient || !password) {
      toast({
        variant: 'destructive',
        title: 'ত্রুটি',
        description: 'ক্লায়েন্ট এবং পাসওয়ার্ড নির্বাচন করুন',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        variant: 'destructive',
        title: 'ত্রুটি',
        description: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে',
      });
      return;
    }

    setSubmitting(true);
    const result = await createCredentials(selectedClient, password);
    setSubmitting(false);

    if (result.success && result.client_code) {
      setCreatedCode(result.client_code);
      setPassword('');
    }
  };

  const handleToggleActive = async (clientId: string, currentActive: boolean) => {
    await toggleActive(clientId, !currentActive);
  };

  const handleCopyCode = () => {
    if (createdCode) {
      navigator.clipboard.writeText(createdCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedClient(null);
    setPassword('');
    setCreatedCode(null);
  };

  const openCredentialDialog = (clientId: string) => {
    setSelectedClient(clientId);
    setPassword('');
    setCreatedCode(null);
    setIsDialogOpen(true);
  };

  const selectedClientData = clients.find((c) => c.id === selectedClient);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            ক্লায়েন্ট অ্যাক্সেস
          </h1>
          <p className="text-muted-foreground">
            ক্লায়েন্টদের লগইন তৈরি এবং পরিচালনা করুন
          </p>
        </div>
        <Button variant="outline" onClick={fetchClients} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          রিফ্রেশ
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ক্লায়েন্ট তালিকা</CardTitle>
          <CardDescription>
            ক্লায়েন্টদের লগইন তৈরি করুন এবং অ্যাক্সেস নিয়ন্ত্রণ করুন
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2">লোড হচ্ছে...</span>
            </div>
          ) : clients.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">কোনো ক্লায়েন্ট নেই</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ক্লায়েন্ট আইডি</TableHead>
                  <TableHead>নাম</TableHead>
                  <TableHead>ফোন</TableHead>
                  <TableHead>কোম্পানি</TableHead>
                  <TableHead>লগইন স্ট্যাটাস</TableHead>
                  <TableHead>সক্রিয়</TableHead>
                  <TableHead className="text-right">অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-mono text-sm">
                      {client.client_code || '-'}
                    </TableCell>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.phone}</TableCell>
                    <TableCell>{client.company || '-'}</TableCell>
                    <TableCell>
                      {client.has_login ? (
                        <Badge variant="default">লগইন আছে</Badge>
                      ) : (
                        <Badge variant="secondary">লগইন নেই</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {client.has_login && (
                        <Switch
                          checked={client.login_active}
                          onCheckedChange={() => handleToggleActive(client.id, client.login_active)}
                        />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openCredentialDialog(client.id)}
                      >
                        <Key className="h-4 w-4 mr-2" />
                        {client.has_login ? 'পাসওয়ার্ড রিসেট' : 'লগইন তৈরি'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Reset Credentials Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedClientData?.has_login ? 'পাসওয়ার্ড রিসেট' : 'লগইন তৈরি করুন'}
            </DialogTitle>
            <DialogDescription>
              {selectedClientData?.name} ({selectedClientData?.client_code})
            </DialogDescription>
          </DialogHeader>

          {createdCode ? (
            <div className="space-y-4 pt-4">
              <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg text-center">
                <p className="text-green-600 dark:text-green-400 mb-2">লগইন সফলভাবে তৈরি হয়েছে!</p>
                <p className="text-sm text-muted-foreground mb-4">
                  এই তথ্যগুলো ক্লায়েন্টকে জানিয়ে দিন:
                </p>
                <div className="bg-background p-3 rounded border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">ক্লায়েন্ট আইডি</p>
                      <p className="font-mono font-bold text-lg">{createdCode}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleCopyCode}>
                      {copied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              <Button className="w-full" onClick={handleCloseDialog}>
                বন্ধ করুন
              </Button>
            </div>
          ) : (
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>ক্লায়েন্ট আইডি</Label>
                <Input value={selectedClientData?.client_code || ''} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">নতুন পাসওয়ার্ড</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="কমপক্ষে ৬ অক্ষর"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleCloseDialog} disabled={submitting}>
                  বাতিল
                </Button>
                <Button onClick={handleCreateCredentials} disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      সংরক্ষণ হচ্ছে...
                    </>
                  ) : selectedClientData?.has_login ? (
                    'পাসওয়ার্ড রিসেট করুন'
                  ) : (
                    'লগইন তৈরি করুন'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
