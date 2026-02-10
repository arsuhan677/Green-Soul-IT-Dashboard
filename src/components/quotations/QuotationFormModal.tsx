import { useState, useEffect } from 'react';
import { Loader2, Plus, Trash2, Calendar, Clock, FileText, User } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Quotation, QuotationItem, QuotationInput } from '@/hooks/useQuotations';
import { useClients, Client } from '@/hooks/useClients';

interface QuotationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: QuotationInput) => Promise<boolean>;
  quotation?: Quotation | null;
  isEdit?: boolean;
}

const quoteStatuses = ['খসড়া', 'প্রেরিত', 'গৃহীত', 'প্রত্যাখ্যাত', 'মেয়াদ শেষ'];

export function QuotationFormModal({
  isOpen,
  onClose,
  onSubmit,
  quotation,
  isEdit = false,
}: QuotationFormModalProps) {
  const { clients } = useClients();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    client_id: '',
    issue_date: new Date().toISOString().split('T')[0],
    valid_until: '',
    items: [{ title: '', description: '', qty: 1, price: 0, total: 0 }] as QuotationItem[],
    discount: 0,
    tax: 0,
    note: '',
    status: 'খসড়া',
  });

  useEffect(() => {
    if (isOpen) {
      if (quotation && isEdit) {
        setFormData({
          client_id: quotation.client_id || '',
          issue_date: quotation.issue_date,
          valid_until: quotation.valid_until || '',
          items: quotation.items.length > 0 ? quotation.items : [{ title: '', description: '', qty: 1, price: 0, total: 0 }],
          discount: quotation.discount,
          tax: quotation.tax,
          note: quotation.note || '',
          status: quotation.status,
        });
      } else {
        // Set default valid_until to 30 days from now
        const validDate = new Date();
        validDate.setDate(validDate.getDate() + 30);
        setFormData({
          client_id: '',
          issue_date: new Date().toISOString().split('T')[0],
          valid_until: validDate.toISOString().split('T')[0],
          items: [{ title: '', description: '', qty: 1, price: 0, total: 0 }],
          discount: 0,
          tax: 0,
          note: '',
          status: 'খসড়া',
        });
      }
    }
  }, [isOpen, quotation, isEdit]);

  const updateItem = (index: number, field: keyof QuotationItem, value: string | number) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === 'qty' || field === 'price') {
      const qty = field === 'qty' ? Number(value) : newItems[index].qty;
      const price = field === 'price' ? Number(value) : newItems[index].price;
      newItems[index].total = qty * price;
    }

    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { title: '', description: '', qty: 1, price: 0, total: 0 }],
    });
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData({ ...formData, items: newItems });
    }
  };

  const getSubtotal = () => {
    return formData.items.reduce((sum, item) => sum + item.total, 0);
  };

  const getTotal = () => {
    const subtotal = getSubtotal();
    return subtotal - formData.discount + (subtotal * formData.tax / 100);
  };

  const getClientName = (clientId: string) => {
    return clients.find((c) => c.id === clientId)?.name || '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.client_id || formData.items.every((item) => !item.title)) {
      return;
    }

    setIsSubmitting(true);
    const success = await onSubmit({
      client_id: formData.client_id,
      client_name: getClientName(formData.client_id),
      issue_date: formData.issue_date,
      valid_until: formData.valid_until || undefined,
      items: formData.items.filter((item) => item.title),
      discount: formData.discount,
      tax: formData.tax,
      note: formData.note || undefined,
      status: formData.status,
    });

    if (success) {
      onClose();
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {isEdit ? 'কোটেশন এডিট করুন' : 'নতুন কোটেশন তৈরি করুন'}
          </DialogTitle>
          <DialogDescription>
            ক্লায়েন্টের জন্য পেশাদার কোটেশন তৈরি করুন
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <form onSubmit={handleSubmit} className="space-y-6 px-1">
            {/* Client & Dates */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="client_id" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  ক্লায়েন্ট *
                </Label>
                <Select
                  value={formData.client_id}
                  onValueChange={(value) => setFormData({ ...formData, client_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="ক্লায়েন্ট নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="issue_date" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  ইস্যু তারিখ *
                </Label>
                <Input
                  id="issue_date"
                  type="date"
                  value={formData.issue_date}
                  onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="valid_until" className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  মেয়াদ শেষ
                </Label>
                <Input
                  id="valid_until"
                  type="date"
                  value={formData.valid_until}
                  onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                />
              </div>
            </div>

            {/* Status for edit mode */}
            {isEdit && (
              <div className="space-y-2">
                <Label>স্ট্যাটাস</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {quoteStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Items */}
            <div className="space-y-2">
              <Label>আইটেম সমূহ</Label>
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-2 text-left text-sm font-medium text-muted-foreground">
                        সার্ভিস/আইটেম *
                      </th>
                      <th className="px-3 py-2 text-left text-sm font-medium text-muted-foreground w-32">
                        বিবরণ
                      </th>
                      <th className="px-3 py-2 text-center text-sm font-medium text-muted-foreground w-20">
                        পরিমাণ
                      </th>
                      <th className="px-3 py-2 text-right text-sm font-medium text-muted-foreground w-28">
                        ইউনিট মূল্য
                      </th>
                      <th className="px-3 py-2 text-right text-sm font-medium text-muted-foreground w-28">
                        মোট
                      </th>
                      <th className="px-2 py-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((item, index) => (
                      <tr key={index} className="border-t border-border">
                        <td className="px-3 py-2">
                          <Input
                            placeholder="সার্ভিস নাম"
                            className="h-9"
                            value={item.title}
                            onChange={(e) => updateItem(index, 'title', e.target.value)}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            placeholder="বিবরণ"
                            className="h-9"
                            value={item.description}
                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            value={item.qty}
                            onChange={(e) => updateItem(index, 'qty', parseInt(e.target.value) || 1)}
                            className="h-9 text-center"
                            min={1}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            placeholder="০"
                            value={item.price || ''}
                            onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                            className="h-9 text-right"
                          />
                        </td>
                        <td className="px-3 py-2 text-right font-medium">
                          ৳{item.total.toLocaleString('bn-BD')}
                        </td>
                        <td className="px-2 py-2">
                          {formData.items.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => removeItem(index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={addItem}>
                <Plus className="w-4 h-4 mr-1" />
                আইটেম যোগ করুন
              </Button>
            </div>

            {/* Discount & Tax */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="discount">ডিসকাউন্ট (৳)</Label>
                <Input
                  id="discount"
                  type="number"
                  placeholder="০"
                  value={formData.discount || ''}
                  onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax">ট্যাক্স/ভ্যাট (%)</Label>
                <Input
                  id="tax"
                  type="number"
                  placeholder="০"
                  value={formData.tax || ''}
                  onChange={(e) => setFormData({ ...formData, tax: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            {/* Note */}
            <div className="space-y-2">
              <Label htmlFor="note">নোট (ঐচ্ছিক)</Label>
              <Textarea
                id="note"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder="অতিরিক্ত তথ্য বা শর্তাবলী..."
                rows={3}
              />
            </div>

            <Separator />

            {/* Totals */}
            <div className="space-y-2 text-right">
              <div className="flex justify-between">
                <span className="text-muted-foreground">সাবটোটাল</span>
                <span className="font-medium">৳{getSubtotal().toLocaleString('bn-BD')}</span>
              </div>
              {formData.discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ডিসকাউন্ট</span>
                  <span className="font-medium text-destructive">-৳{formData.discount.toLocaleString('bn-BD')}</span>
                </div>
              )}
              {formData.tax > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ট্যাক্স ({formData.tax}%)</span>
                  <span className="font-medium">+৳{(getSubtotal() * formData.tax / 100).toLocaleString('bn-BD')}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg">
                <span className="font-semibold">মোট</span>
                <span className="font-bold text-primary">৳{getTotal().toLocaleString('bn-BD')}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                বাতিল করুন
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isEdit ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
