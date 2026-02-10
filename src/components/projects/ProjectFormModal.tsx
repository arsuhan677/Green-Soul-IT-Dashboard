import { useState, useEffect, useCallback } from 'react';
import { Loader2, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useServices } from '@/hooks/useServices';
import { useUsers } from '@/hooks/useUsers';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/hooks/use-toast';
import { isValidUUID } from '@/lib/validation';
import type { Project } from '@/hooks/useProjects';

interface Client {
  id: string;
  name: string;
}

interface ProjectFormData {
  title: string;
  clientId: string;
  serviceId: string;
  budget: string;
  startDate: string;
  deadline: string;
  status: string;
  progress: number;
  assignedTeam: string[];
}

const projectStatuses = ['চলমান', 'রিভিউ', 'সম্পন্ন', 'হোল্ড'] as const;

const initialFormData: ProjectFormData = {
  title: '',
  clientId: '',
  serviceId: '',
  budget: '',
  startDate: '',
  deadline: '',
  status: 'চলমান',
  progress: 0,
  assignedTeam: [],
};

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    client_id: string;
    service_id?: string;
    budget: number;
    start_date?: string;
    deadline?: string;
    status: string;
    progress: number;
    assigned_team?: string[];
  }) => Promise<boolean>;
  clients: Client[];
  project?: Project | null;
  isEdit?: boolean;
}

export function ProjectFormModal({
  isOpen,
  onClose,
  onSubmit,
  clients,
  project,
  isEdit = false,
}: ProjectFormModalProps) {
  const { services, loading: servicesLoading } = useServices();
  const { activeUsers } = useUsers();
  const { isAdmin } = usePermissions();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ProjectFormData>(initialFormData);

  // Reset form when modal opens with project data (for edit) or empty (for add)
  useEffect(() => {
    if (isOpen) {
      if (isEdit && project) {
        setFormData({
          title: project.title || '',
          clientId: project.client_id || '',
          serviceId: project.service_id || '',
          budget: project.budget?.toString() || '',
          startDate: project.start_date 
            ? new Date(project.start_date).toISOString().split('T')[0] 
            : '',
          deadline: project.deadline 
            ? new Date(project.deadline).toISOString().split('T')[0] 
            : '',
          status: project.status || 'চলমান',
          progress: project.progress || 0,
          assignedTeam: project.assigned_team || [],
        });
      } else {
        setFormData(initialFormData);
      }
    }
  }, [isOpen, isEdit, project]);

  const handleInputChange = useCallback((field: keyof ProjectFormData, value: string | number | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const toggleTeamMember = useCallback((userId: string) => {
    setFormData(prev => {
      const isSelected = prev.assignedTeam.includes(userId);
      return {
        ...prev,
        assignedTeam: isSelected
          ? prev.assignedTeam.filter(id => id !== userId)
          : [...prev.assignedTeam, userId]
      };
    });
  }, []);

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "ত্রুটি!",
        description: "প্রজেক্টের নাম দিন",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.clientId) {
      toast({
        title: "ত্রুটি!",
        description: "অনুগ্রহ করে একটি ক্লায়েন্ট নির্বাচন করুন",
        variant: "destructive",
      });
      return;
    }

    if (!isValidUUID(formData.clientId)) {
      toast({
        title: "ত্রুটি!",
        description: "ভুল ক্লায়েন্ট আইডি পাঠানো হয়েছে, অনুগ্রহ করে আবার নির্বাচন করুন।",
        variant: "destructive",
      });
      return;
    }

    if (formData.serviceId && !isValidUUID(formData.serviceId)) {
      toast({
        title: "ত্রুটি!",
        description: "ভুল সার্ভিস আইডি পাঠানো হয়েছে, অনুগ্রহ করে আবার নির্বাচন করুন।",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    const success = await onSubmit({
      title: formData.title.trim(),
      client_id: formData.clientId,
      service_id: formData.serviceId || undefined,
      // Only include budget if user is admin
      budget: isAdmin ? (parseInt(formData.budget) || 0) : (isEdit && project ? project.budget : 0),
      start_date: formData.startDate || undefined,
      deadline: formData.deadline || undefined,
      status: formData.status,
      progress: formData.progress,
      assigned_team: formData.assignedTeam.length > 0 ? formData.assignedTeam : undefined,
    });

    if (success) {
      onClose();
    }
    setIsSubmitting(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
      e.preventDefault();
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className="max-w-lg max-h-[90vh]" 
        onPointerDownOutside={(e) => {
          if (isSubmitting) e.preventDefault();
        }}
        onInteractOutside={(e) => {
          if (isSubmitting) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'প্রজেক্ট এডিট করুন' : 'নতুন প্রজেক্ট তৈরি করুন'}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? 'প্রজেক্টের তথ্য আপডেট করুন' : 'নতুন প্রজেক্টের তথ্য দিন'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4 mt-4" onKeyDown={handleKeyDown}>
            <div>
              <Label htmlFor="project-title">প্রজেক্ট নাম *</Label>
              <Input 
                id="project-title"
                placeholder="প্রজেক্টের নাম লিখুন" 
                className="form-input mt-1"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                autoComplete="off"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="project-client">ক্লায়েন্ট *</Label>
                <Select 
                  value={formData.clientId} 
                  onValueChange={(value) => handleInputChange('clientId', value)}
                >
                  <SelectTrigger className="mt-1" id="project-client">
                    <SelectValue placeholder="ক্লায়েন্ট নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        কোনো ক্লায়েন্ট পাওয়া যায়নি
                      </div>
                    ) : (
                      clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="project-service">সার্ভিস নির্বাচন করুন</Label>
                <Select 
                  value={formData.serviceId} 
                  onValueChange={(value) => handleInputChange('serviceId', value)}
                >
                  <SelectTrigger className="mt-1" id="project-service">
                    <SelectValue placeholder="সার্ভিস নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    {servicesLoading ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        লোড হচ্ছে...
                      </div>
                    ) : services.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        কোনো সার্ভিস পাওয়া যায়নি
                      </div>
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              {isAdmin && (
                <div>
                  <Label htmlFor="project-budget">বাজেট (৳)</Label>
                  <Input 
                    id="project-budget"
                    type="number" 
                    placeholder="০" 
                    className="form-input mt-1"
                    value={formData.budget}
                    onChange={(e) => handleInputChange('budget', e.target.value)}
                  />
                </div>
              )}
              <div className={isAdmin ? '' : 'col-span-2'}>
                <Label htmlFor="project-status">স্ট্যাটাস</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => handleInputChange('status', value)}
                >
                  <SelectTrigger className="mt-1" id="project-status">
                    <SelectValue placeholder="স্ট্যাটাস" />
                  </SelectTrigger>
                  <SelectContent>
                    {projectStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="project-start-date">শুরুর তারিখ</Label>
                <Input 
                  id="project-start-date"
                  type="date" 
                  className="form-input mt-1"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="project-deadline">ডেডলাইন</Label>
                <Input 
                  id="project-deadline"
                  type="date" 
                  className="form-input mt-1"
                  value={formData.deadline}
                  onChange={(e) => handleInputChange('deadline', e.target.value)}
                />
              </div>
            </div>

            {isEdit && (
              <div>
                <Label>অগ্রগতি: {formData.progress}%</Label>
                <Slider
                  value={[formData.progress]}
                  onValueChange={(value) => handleInputChange('progress', value[0])}
                  max={100}
                  step={5}
                  className="mt-2"
                />
              </div>
            )}

            {/* Team Assignment */}
            <div>
              <Label>টিম অ্যাসাইন করুন</Label>
              <div className="mt-2 space-y-2">
                {formData.assignedTeam.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.assignedTeam.map((userId) => {
                      const user = activeUsers.find(u => u.user_id === userId);
                      return (
                        <Badge key={userId} variant="secondary" className="gap-1">
                          {user?.name || 'অজানা'}
                          <button
                            type="button"
                            onClick={() => toggleTeamMember(userId)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                )}
                <div className="border rounded-lg p-3 max-h-32 overflow-y-auto space-y-2">
                  {activeUsers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">কোনো সক্রিয় ইউজার পাওয়া যায়নি</p>
                  ) : (
                    activeUsers.map((user) => (
                      <div key={user.user_id} className="flex items-center gap-2">
                        <Checkbox
                          id={`team-${user.user_id}`}
                          checked={formData.assignedTeam.includes(user.user_id)}
                          onCheckedChange={() => toggleTeamMember(user.user_id)}
                        />
                        <label
                          htmlFor={`team-${user.user_id}`}
                          className="text-sm cursor-pointer flex-1"
                        >
                          {user.name}
                          {user.custom_roles && (
                            <span className="text-xs text-muted-foreground ml-2">
                              ({user.custom_roles.role_name_bn})
                            </span>
                          )}
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button 
                type="button"
                variant="outline" 
                onClick={handleClose}
                disabled={isSubmitting}
              >
                বাতিল করুন
              </Button>
              <Button 
                type="button"
                className="btn-primary" 
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isEdit ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
