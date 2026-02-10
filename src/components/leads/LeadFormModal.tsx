import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { isValidUUID } from '@/lib/validation';
import { leadSources } from '@/data/sampleData';
import { useServices } from '@/hooks/useServices';
import { useToast } from '@/hooks/use-toast';
import { Lead, LeadInput } from '@/hooks/useLeads';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface LeadFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: Lead | null;
  onSubmit: (input: LeadInput) => Promise<boolean>;
  isEdit?: boolean;
}

export function LeadFormModal({
  open,
  onOpenChange,
  lead,
  onSubmit,
  isEdit = false,
}: LeadFormModalProps) {
  const { toast } = useToast();
  const { services, loading: servicesLoading } = useServices();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    company: '',
    serviceId: '',
    source: '',
    note: '',
    followUpDate: '',
  });

  // Reset form when modal opens/closes or lead changes
  useEffect(() => {
    if (open && lead && isEdit) {
      setFormData({
        name: lead.name || '',
        phone: lead.phone || '',
        email: lead.email || '',
        company: lead.company || '',
        serviceId: lead.service_id || '',
        source: lead.source || '',
        note: '',
        followUpDate: lead.next_follow_up_at 
          ? new Date(lead.next_follow_up_at).toISOString().slice(0, 16) 
          : '',
      });
    } else if (open && !isEdit) {
      setFormData({
        name: '',
        phone: '',
        email: '',
        company: '',
        serviceId: '',
        source: '',
        note: '',
        followUpDate: '',
      });
    }
  }, [open, lead, isEdit]);

  const handleSubmit = async () => {
    if (!formData.name || !formData.phone || !formData.source) {
      toast({
        title: "ত্রুটি!",
        description: "নাম, ফোন এবং সোর্স আবশ্যক",
        variant: "destructive",
      });
      return;
    }

    // Validate UUID if service is selected
    if (formData.serviceId && !isValidUUID(formData.serviceId)) {
      toast({
        title: "ত্রুটি!",
        description: "ভুল আইডি পাঠানো হয়েছে, অনুগ্রহ করে আবার নির্বাচন করুন।",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    const success = await onSubmit({
      name: formData.name,
      phone: formData.phone,
      email: formData.email || undefined,
      company: formData.company || undefined,
      service_id: formData.serviceId || undefined,
      source: formData.source,
      note: formData.note || undefined,
      next_follow_up_at: formData.followUpDate || undefined,
    });

    if (success) {
      onOpenChange(false);
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'লিড এডিট করুন' : 'নতুন লিড যোগ করুন'}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-4 max-h-[60vh]">
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">নাম *</Label>
                <Input
                  id="name"
                  placeholder="পুরো নাম লিখুন"
                  className="form-input mt-1"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="phone">ফোন/হোয়াটসঅ্যাপ *</Label>
                <Input
                  id="phone"
                  placeholder="০১XXXXXXXXX"
                  className="form-input mt-1"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">ইমেইল</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  className="form-input mt-1"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="company">কোম্পানি</Label>
                <Input
                  id="company"
                  placeholder="কোম্পানির নাম"
                  className="form-input mt-1"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="service">আগ্রহী সার্ভিস</Label>
                <Select
                  value={formData.serviceId}
                  onValueChange={(value) => setFormData({ ...formData, serviceId: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="সার্ভিস নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    {servicesLoading ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">লোড হচ্ছে...</div>
                    ) : services.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">কোনো সার্ভিস নেই</div>
                    ) : (
                      services.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="source">সোর্স *</Label>
                <Select
                  value={formData.source}
                  onValueChange={(value) => setFormData({ ...formData, source: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="সোর্স নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    {leadSources.map((source) => (
                      <SelectItem key={source} value={source}>
                        {source}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="followup">পরবর্তী ফলোআপ তারিখ</Label>
              <Input
                id="followup"
                type="datetime-local"
                className="form-input mt-1"
                value={formData.followUpDate}
                onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="note">{isEdit ? 'নতুন নোট যোগ করুন' : 'নোট'}</Label>
              <Textarea
                id="note"
                placeholder="লিড সম্পর্কে নোট..."
                className="mt-1"
                rows={3}
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              />
            </div>
          </div>
        </ScrollArea>
        <div className="flex justify-end gap-3 pt-4 border-t mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            বাতিল করুন
          </Button>
          <Button className="btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEdit ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
