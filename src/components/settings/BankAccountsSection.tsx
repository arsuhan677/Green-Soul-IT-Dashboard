import { useState } from 'react';
import {
  Landmark,
  Smartphone,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Save,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
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
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useBankAccounts, BankAccount, BankAccountInput } from '@/hooks/useBankAccounts';

const ACCOUNT_TYPES = [
  { value: 'ব্যাংক', label: 'ব্যাংক', icon: Landmark },
  { value: 'MFS', label: 'মোবাইল ব্যাংকিং (MFS)', icon: Smartphone },
  { value: 'অন্যান্য', label: 'অন্যান্য', icon: Landmark },
];

const initialFormState: BankAccountInput = {
  account_type: 'ব্যাংক',
  bank_name: '',
  account_name: '',
  account_number: '',
  branch_name: '',
  routing_number: '',
  swift_code: '',
  is_active: true,
  display_order: 0,
};

export function BankAccountsSection() {
  const { bankAccounts, loading, saving, addBankAccount, updateBankAccount, deleteBankAccount } = useBankAccounts();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [formData, setFormData] = useState<BankAccountInput>(initialFormState);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleOpenModal = (account?: BankAccount) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        account_type: account.account_type,
        bank_name: account.bank_name,
        account_name: account.account_name,
        account_number: account.account_number,
        branch_name: account.branch_name || '',
        routing_number: account.routing_number || '',
        swift_code: account.swift_code || '',
        is_active: account.is_active,
        display_order: account.display_order,
      });
    } else {
      setEditingAccount(null);
      setFormData({
        ...initialFormState,
        display_order: bankAccounts.length,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAccount(null);
    setFormData(initialFormState);
  };

  const handleSubmit = async () => {
    if (!formData.bank_name || !formData.account_name || !formData.account_number) {
      return;
    }

    if (editingAccount) {
      await updateBankAccount(editingAccount.id, formData);
    } else {
      await addBankAccount(formData);
    }
    handleCloseModal();
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteBankAccount(deleteId);
      setDeleteId(null);
    }
  };

  const handleToggleActive = async (account: BankAccount) => {
    await updateBankAccount(account.id, { is_active: !account.is_active });
  };

  const getAccountIcon = (type: string) => {
    const accountType = ACCOUNT_TYPES.find((t) => t.value === type);
    const Icon = accountType?.icon || Landmark;
    return <Icon className="w-5 h-5" />;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-primary" />
            ব্যাংক ও পেমেন্ট অ্যাকাউন্ট
          </CardTitle>
          <Button className="btn-primary" onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-2" />
            নতুন অ্যাকাউন্ট যোগ করুন
          </Button>
        </CardHeader>
        <CardContent>
          {bankAccounts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Landmark className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>কোনো ব্যাংক অ্যাকাউন্ট যোগ করা হয়নি</p>
              <p className="text-sm mt-1">ইনভয়েসে পেমেন্ট তথ্য দেখাতে এখানে অ্যাকাউন্ট যোগ করুন</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bankAccounts.map((account) => (
                <div
                  key={account.id}
                  className={`border rounded-lg p-4 ${
                    account.is_active ? 'bg-background' : 'bg-muted/50 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${account.account_type === 'MFS' ? 'bg-pink-100 text-pink-600' : 'bg-primary/10 text-primary'}`}>
                        {getAccountIcon(account.account_type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{account.bank_name}</h4>
                          <Badge variant={account.is_active ? 'default' : 'secondary'}>
                            {account.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                          </Badge>
                          <Badge variant="outline">{account.account_type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {account.account_name}
                        </p>
                        <p className="font-mono text-sm mt-1">{account.account_number}</p>
                        {account.branch_name && (
                          <p className="text-xs text-muted-foreground mt-1">
                            শাখা: {account.branch_name}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={account.is_active}
                        onCheckedChange={() => handleToggleActive(account)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenModal(account)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(account.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingAccount ? 'অ্যাকাউন্ট সম্পাদনা করুন' : 'নতুন অ্যাকাউন্ট যোগ করুন'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>অ্যাকাউন্টের ধরন *</Label>
              <Select
                value={formData.account_type}
                onValueChange={(value) => setFormData({ ...formData, account_type: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>
                {formData.account_type === 'MFS' ? 'সার্ভিস প্রোভাইডার *' : 'ব্যাংকের নাম *'}
              </Label>
              <Input
                placeholder={formData.account_type === 'MFS' ? 'যেমন: বিকাশ, নগদ, রকেট' : 'যেমন: ব্র্যাক ব্যাংক'}
                value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label>অ্যাকাউন্টের নাম *</Label>
              <Input
                placeholder="অ্যাকাউন্ট হোল্ডারের নাম"
                value={formData.account_name}
                onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label>
                {formData.account_type === 'MFS' ? 'মোবাইল নম্বর *' : 'অ্যাকাউন্ট নম্বর *'}
              </Label>
              <Input
                placeholder={formData.account_type === 'MFS' ? '01XXXXXXXXX' : 'অ্যাকাউন্ট নম্বর'}
                value={formData.account_number}
                onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                className="mt-1"
              />
            </div>

            {formData.account_type === 'ব্যাংক' && (
              <>
                <div>
                  <Label>শাখার নাম</Label>
                  <Input
                    placeholder="ব্রাঞ্চের নাম"
                    value={formData.branch_name}
                    onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>রাউটিং নম্বর</Label>
                    <Input
                      placeholder="রাউটিং নম্বর"
                      value={formData.routing_number}
                      onChange={(e) => setFormData({ ...formData, routing_number: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>SWIFT কোড</Label>
                    <Input
                      placeholder="SWIFT কোড"
                      value={formData.swift_code}
                      onChange={(e) => setFormData({ ...formData, swift_code: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="flex items-center justify-between">
              <Label>সক্রিয় অ্যাকাউন্ট</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={handleCloseModal}>
                <X className="w-4 h-4 mr-2" />
                বাতিল করুন
              </Button>
              <Button className="btn-primary" onClick={handleSubmit} disabled={saving}>
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {editingAccount ? 'আপডেট করুন' : 'যোগ করুন'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>অ্যাকাউন্ট ডিলিট করতে চান?</AlertDialogTitle>
            <AlertDialogDescription>
              এই ব্যাংক অ্যাকাউন্টটি ডিলিট করলে ইনভয়েসে আর দেখাবে না। এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>বাতিল করুন</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              ডিলিট করুন
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
