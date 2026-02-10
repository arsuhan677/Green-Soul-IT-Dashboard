import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  Phone,
  Mail,
  Calendar,
  UserPlus,
  Trash2,
  Loader2,
  Edit2,
  MoreVertical,
  Eye,
} from 'lucide-react';
import { leadSources, leadStatuses } from '@/data/sampleData';
import { useServices } from '@/hooks/useServices';
import { useToast } from '@/hooks/use-toast';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LeadStatusDropdown } from '@/components/leads/LeadStatusDropdown';
import { LeadFormModal } from '@/components/leads/LeadFormModal';
import { useAuth } from '@/contexts/AuthContext';
import { useLeads, Lead, LeadInput } from '@/hooks/useLeads';
import { Switch } from '@/components/ui/switch';

function LeadsContent() {
  const { canEditLeadStatus, user } = useAuth();
  const { toast } = useToast();
  const { canDelete } = usePermissions();
  const { 
    leads, 
    loading, 
    addLead, 
    updateLead,
    updateLeadStatus, 
    setFollowUp, 
    deleteLead, 
    convertToClient 
  } = useLeads();
  const { services, loading: servicesLoading } = useServices();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [showMyLeadsOnly, setShowMyLeadsOnly] = useState(false);
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Follow-up form state
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNote, setFollowUpNote] = useState('');

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm) ||
      (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter;
    const matchesOwner = !showMyLeadsOnly || lead.user_id === user?.id;
    return matchesSearch && matchesStatus && matchesSource && matchesOwner;
  });

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'নতুন':
        return 'status-new';
      case 'যোগাযোগ হয়েছে':
        return 'status-contacted';
      case 'আগ্রহী':
        return 'status-interested';
      case 'প্রস্তাব পাঠানো':
        return 'status-proposal';
      case 'ক্লোজড/সেল':
        return 'status-closed';
      case 'হারানো':
        return 'status-lost';
      default:
        return 'status-badge bg-muted text-muted-foreground';
    }
  };

  const getServiceName = (serviceId: string | null) => {
    if (!serviceId) return 'অজানা সার্ভিস';
    return services.find((s) => s.id === serviceId)?.name || 'অজানা সার্ভিস';
  };

  // Handle adding new lead
  const handleAddLead = async (input: LeadInput): Promise<boolean> => {
    return await addLead(input);
  };

  // Handle editing lead
  const handleEditLead = async (input: LeadInput): Promise<boolean> => {
    if (!selectedLead) return false;
    return await updateLead(selectedLead.id, input);
  };

  const handleOpenEdit = (lead: Lead) => {
    setSelectedLead(lead);
    setIsEditModalOpen(true);
  };

  // Handle view lead
  const handleViewLead = (lead: Lead) => {
    setSelectedLead(lead);
    setIsViewModalOpen(true);
  };

  // Handle call button
  const handleCall = async (lead: Lead) => {
    // Update lead status to "যোগাযোগ হয়েছে" if it's "নতুন"
    if (lead.status === 'নতুন') {
      await updateLeadStatus(lead.id, 'যোগাযোগ হয়েছে', lead.status);
    }
    
    // Open phone dialer
    window.open(`tel:${lead.phone}`, '_self');
  };

  // Handle set follow-up
  const handleOpenFollowUp = (lead: Lead) => {
    setSelectedLead(lead);
    setFollowUpDate('');
    setFollowUpNote('');
    setIsFollowUpModalOpen(true);
  };

  const handleSetFollowUp = async () => {
    if (!followUpDate || !selectedLead) return;

    setIsSubmitting(true);
    const success = await setFollowUp(selectedLead.id, followUpDate, followUpNote);
    
    if (success) {
      setIsFollowUpModalOpen(false);
      setSelectedLead(null);
    }
    setIsSubmitting(false);
  };

  // Handle convert to client
  const handleOpenConvert = (lead: Lead) => {
    setSelectedLead(lead);
    setIsConvertModalOpen(true);
  };

  const handleConvertToClient = async () => {
    if (!selectedLead) return;

    setIsSubmitting(true);
    const success = await convertToClient(selectedLead.id);
    
    if (success) {
      setIsConvertModalOpen(false);
      setSelectedLead(null);
    }
    setIsSubmitting(false);
  };

  // Handle delete lead
  const handleOpenDelete = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteLead = async () => {
    if (!selectedLead) return;

    setIsSubmitting(true);
    const success = await deleteLead(selectedLead.id);
    
    if (success) {
      setIsDeleteModalOpen(false);
      setSelectedLead(null);
    }
    setIsSubmitting(false);
  };

  // Handle status change with auto logging
  const handleStatusChange = async (leadId: string, newStatus: string, oldStatus: string): Promise<boolean> => {
    return await updateLeadStatus(leadId, newStatus, oldStatus);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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
          <h1 className="page-title">লিড ম্যানেজমেন্ট</h1>
          <p className="text-muted-foreground mt-1">সকল লিড ও সম্ভাব্য ক্লায়েন্ট পরিচালনা করুন</p>
        </div>
        <Button className="btn-primary" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="w-4 h-4" />
          নতুন লিড যোগ করুন
        </Button>
      </div>

      {/* Add Lead Modal */}
      <LeadFormModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSubmit={handleAddLead}
        isEdit={false}
      />

      {/* Edit Lead Modal */}
      <LeadFormModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        lead={selectedLead}
        onSubmit={handleEditLead}
        isEdit={true}
      />

      {/* View Lead Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>লিডের বিস্তারিত</DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <ScrollArea className="flex-1 pr-4 max-h-[60vh]">
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">নাম</Label>
                    <p className="font-medium">{selectedLead.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">ফোন</Label>
                    <p className="font-medium">{selectedLead.phone}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">ইমেইল</Label>
                    <p className="font-medium">{selectedLead.email || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">কোম্পানি</Label>
                    <p className="font-medium">{selectedLead.company || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">সোর্স</Label>
                    <p className="font-medium">{selectedLead.source}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">স্ট্যাটাস</Label>
                    <p className="font-medium">{selectedLead.status}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">আগ্রহী সার্ভিস</Label>
                    <p className="font-medium">{getServiceName(selectedLead.service_id)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">পরবর্তী ফলোআপ</Label>
                    <p className="font-medium">
                      {selectedLead.next_follow_up_at 
                        ? new Date(selectedLead.next_follow_up_at).toLocaleDateString('bn-BD')
                        : 'সেট করা হয়নি'}
                    </p>
                  </div>
                </div>

                {selectedLead.notes.length > 0 && (
                  <div>
                    <Label className="text-muted-foreground">টাইমলাইন</Label>
                    <div className="mt-2 space-y-2">
                      {selectedLead.notes.map((note, idx) => (
                        <div key={idx} className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm">{note.text}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(note.date).toLocaleString('bn-BD')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Follow-up Modal */}
      <Dialog open={isFollowUpModalOpen} onOpenChange={setIsFollowUpModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>ফলোআপ সেট করুন</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="followupDate">ফলোআপ তারিখ ও সময় *</Label>
              <Input 
                id="followupDate" 
                type="datetime-local" 
                className="form-input mt-1"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="followupNote">নোট</Label>
              <Textarea 
                id="followupNote" 
                placeholder="ফলোআপ সম্পর্কে নোট..." 
                className="mt-1" 
                rows={3}
                value={followUpNote}
                onChange={(e) => setFollowUpNote(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsFollowUpModalOpen(false)}>
                বাতিল করুন
              </Button>
              <Button className="btn-primary" onClick={handleSetFollowUp} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                সেট করুন
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Convert to Client Confirmation */}
      <AlertDialog open={isConvertModalOpen} onOpenChange={setIsConvertModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ক্লায়েন্টে রূপান্তর করুন</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedLead && (
                <>
                  <strong>{selectedLead.name}</strong> কে ক্লায়েন্টে রূপান্তর করতে চান?
                  <br />
                  এই লিডের তথ্য দিয়ে নতুন ক্লায়েন্ট তৈরি হবে এবং লিডের স্ট্যাটাস "ক্লোজড/সেল" হয়ে যাবে।
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>বাতিল করুন</AlertDialogCancel>
            <AlertDialogAction className="btn-primary" onClick={handleConvertToClient} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <UserPlus className="w-4 h-4 mr-1" />
              হ্যাঁ, রূপান্তর করুন
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Lead Confirmation */}
      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>লিড মুছে ফেলবেন?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedLead && (
                <>
                  আপনি কি নিশ্চিত? <strong>{selectedLead.name}</strong> লিডটি মুছে ফেললে আর ফিরে পাওয়া যাবে না।
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>বাতিল করুন</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDeleteLead} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Trash2 className="w-4 h-4 mr-1" />
              হ্যাঁ, মুছে ফেলুন
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="নাম, ফোন বা ইমেইল দিয়ে খুঁজুন..."
                className="pl-10 form-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2 px-3 py-2 border border-border rounded-md">
                <Switch
                  id="my-leads"
                  checked={showMyLeadsOnly}
                  onCheckedChange={setShowMyLeadsOnly}
                />
                <Label htmlFor="my-leads" className="text-sm cursor-pointer whitespace-nowrap">
                  আমার লিড
                </Label>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="স্ট্যাটাস" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">সকল স্ট্যাটাস</SelectItem>
                  {leadStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="সোর্স" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">সকল সোর্স</SelectItem>
                  {leadSources.map((source) => (
                    <SelectItem key={source} value={source}>
                      {source}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                    নাম ও যোগাযোগ
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                    সার্ভিস
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                    সোর্স
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                    স্ট্যাটাস
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                    পরবর্তী ফলোআপ
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                    তৈরি করেছেন
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">
                    অ্যাকশন
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                      কোনো লিড পাওয়া যায়নি
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead, index) => (
                    <motion.tr
                      key={lead.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-primary font-bold">
                            {lead.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{lead.name}</p>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {lead.phone}
                              </span>
                              {lead.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {lead.email}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-foreground">{getServiceName(lead.service_id)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-secondary/50 text-secondary-foreground">
                          {lead.source}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <LeadStatusDropdown
                          currentStatus={lead.status}
                          onStatusChange={(newStatus, oldStatus) => handleStatusChange(lead.id, newStatus, oldStatus)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        {lead.next_follow_up_at ? (
                          <span className="flex items-center gap-1 text-sm text-foreground">
                            <Calendar className="w-4 h-4 text-warning" />
                            {new Date(lead.next_follow_up_at).toLocaleDateString('bn-BD')}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">সেট করা হয়নি</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-muted-foreground">
                          {lead.created_by_name || 'অজানা'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewLead(lead)}>
                                <Eye className="w-4 h-4 mr-2" />
                                দেখুন
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenEdit(lead)}>
                                <Edit2 className="w-4 h-4 mr-2" />
                                এডিট করুন
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleCall(lead)}>
                                <Phone className="w-4 h-4 mr-2" />
                                কল করুন
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenFollowUp(lead)}>
                                <Calendar className="w-4 h-4 mr-2" />
                                ফলোআপ সেট করুন
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenConvert(lead)}>
                                <UserPlus className="w-4 h-4 mr-2" />
                                ক্লায়েন্টে রূপান্তর
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleOpenDelete(lead)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                মুছে ফেলুন
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {leadStatuses.slice(0, 4).map((status) => {
          const count = leads.filter((l) => l.status === status).length;
          return (
            <Card key={status} className="p-4">
              <div className="flex items-center justify-between">
                <span className={`status-badge ${getStatusBadgeClass(status)}`}>{status}</span>
                <span className="text-2xl font-bold text-foreground">{count}</span>
              </div>
            </Card>
          );
        })}
      </div>
    </motion.div>
  );
}

export default function LeadsPage() {
  return (
    <PermissionGate permission="can_manage_leads">
      <LeadsContent />
    </PermissionGate>
  );
}
