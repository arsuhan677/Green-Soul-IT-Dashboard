import { useState } from 'react';
import { ChevronDown, Check, Lock, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { leadStatuses } from '@/data/sampleData';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface LeadStatusDropdownProps {
  currentStatus: string;
  onStatusChange: (newStatus: string, oldStatus: string) => Promise<boolean>;
}

export function LeadStatusDropdown({ currentStatus, onStatusChange }: LeadStatusDropdownProps) {
  const { hasRole } = useAuth();
  const { hasPermission, isAdmin } = usePermissions();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Check if user can edit lead status: admin OR has can_manage_leads permission
  const canEdit = isAdmin || hasRole('sales') || hasPermission('can_manage_leads');

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'নতুন':
        return 'bg-info/20 text-info border-info/30';
      case 'যোগাযোগ হয়েছে':
        return 'bg-secondary/20 text-secondary-foreground border-secondary/30';
      case 'আগ্রহী':
        return 'bg-warning/20 text-warning border-warning/30';
      case 'প্রস্তাব পাঠানো':
        return 'bg-primary/20 text-primary border-primary/30';
      case 'ক্লোজড/সেল':
        return 'bg-success/20 text-success border-success/30';
      case 'হারানো':
        return 'bg-destructive/20 text-destructive border-destructive/30';
      default:
        return 'bg-muted text-muted-foreground border-muted-foreground/30';
    }
  };

  const handleStatusSelect = async (newStatus: string) => {
    if (newStatus === currentStatus) {
      setOpen(false);
      return;
    }

    if (!canEdit) {
      toast({
        title: "অনুমতি নেই",
        description: "আপনার স্ট্যাটাস পরিবর্তনের অনুমতি নেই।",
        variant: "destructive",
      });
      setOpen(false);
      return;
    }

    setIsUpdating(true);
    try {
      const success = await onStatusChange(newStatus, currentStatus);
      if (!success) {
        toast({
          title: "ত্রুটি!",
          description: "স্ট্যাটাস আপডেট হয়নি, আবার চেষ্টা করুন",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Status update error:', error);
      toast({
        title: "ত্রুটি!",
        description: error?.message || "স্ট্যাটাস আপডেট হয়নি, আবার চেষ্টা করুন",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
      setOpen(false);
    }
  };

  // If user can't edit, show a static badge
  if (!canEdit) {
    return (
      <div className="flex items-center gap-2">
        <span className={cn(
          "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border",
          getStatusBadgeClass(currentStatus)
        )}>
          {currentStatus}
        </span>
        <span className="text-muted-foreground" title="আপনার স্ট্যাটাস পরিবর্তনের অনুমতি নেই">
          <Lock className="w-3 h-3" />
        </span>
      </div>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild disabled={isUpdating}>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "flex items-center gap-2 h-auto py-1 px-3 text-xs font-medium border",
            getStatusBadgeClass(currentStatus),
            "hover:opacity-80"
          )}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            currentStatus
          )}
          <ChevronDown className="w-3 h-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <p className="px-2 py-1.5 text-xs text-muted-foreground font-medium border-b mb-1">
          স্ট্যাটাস পরিবর্তন করুন
        </p>
        {leadStatuses.map((status) => (
          <DropdownMenuItem
            key={status}
            onClick={() => handleStatusSelect(status)}
            className={cn(
              "flex items-center justify-between cursor-pointer",
              status === currentStatus && "bg-muted"
            )}
            disabled={isUpdating}
          >
            <span className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
              getStatusBadgeClass(status)
            )}>
              {status}
            </span>
            {status === currentStatus && <Check className="w-4 h-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
