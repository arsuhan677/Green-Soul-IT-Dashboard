import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Phone,
  Mail,
  Building2,
  MapPin,
  FolderKanban,
  FileText,
  MoreVertical,
  Eye,
  Edit2,
  Trash2,
  Loader2,
} from 'lucide-react';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Switch } from '@/components/ui/switch';
import { useClients, Client, ClientInput } from '@/hooks/useClients';
import { useProjects } from '@/hooks/useProjects';
import { useInvoices } from '@/hooks/useInvoices';
import { useAuth } from '@/contexts/AuthContext';

function ClientsContent() {
  const { canDelete } = usePermissions();
  const { user } = useAuth();
  const { 
    clients, 
    loading, 
    addClient, 
    updateClient, 
    canDeleteClient, 
    deleteClient 
  } = useClients();
  const { getProjectsByClient } = useProjects();
  const { getInvoicesByClient } = useInvoices();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showMyClientsOnly, setShowMyClientsOnly] = useState(false);
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    company: '',
    address: '',
    website: '',
  });

  const filteredClients = clients.filter((client) => {
    const matchesSearch = 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.company?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOwner = !showMyClientsOnly || client.user_id === user?.id;
    return matchesSearch && matchesOwner;
  });

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      company: '',
      address: '',
      website: '',
    });
  };

  // Handle add client
  const handleAddClient = async () => {
    if (!formData.name || !formData.phone || !formData.email) return;

    setIsSubmitting(true);
    const success = await addClient({
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      company: formData.company || undefined,
      address: formData.address || undefined,
      website: formData.website || undefined,
    });

    if (success) {
      resetForm();
      setIsAddModalOpen(false);
    }
    setIsSubmitting(false);
  };

  // Handle view client
  const handleViewClient = (client: Client) => {
    setSelectedClient(client);
    setIsViewModalOpen(true);
  };

  // Handle edit client
  const handleOpenEdit = (client: Client) => {
    setSelectedClient(client);
    setFormData({
      name: client.name,
      phone: client.phone,
      email: client.email,
      company: client.company || '',
      address: client.address || '',
      website: client.social_links?.[0] || '',
    });
    setIsEditModalOpen(true);
  };

  const handleEditClient = async () => {
    if (!selectedClient || !formData.name || !formData.phone || !formData.email) return;

    setIsSubmitting(true);
    const success = await updateClient(selectedClient.id, {
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      company: formData.company || undefined,
      address: formData.address || undefined,
      website: formData.website || undefined,
    });

    if (success) {
      resetForm();
      setIsEditModalOpen(false);
      setSelectedClient(null);
    }
    setIsSubmitting(false);
  };

  // Handle delete client
  const handleOpenDelete = async (client: Client) => {
    setSelectedClient(client);
    setDeleteError(null);
    
    const { canDelete, reason } = await canDeleteClient(client.id);
    if (!canDelete && reason) {
      setDeleteError(reason);
    }
    
    setIsDeleteModalOpen(true);
  };

  const handleDeleteClient = async () => {
    if (!selectedClient || deleteError) return;

    setIsSubmitting(true);
    const success = await deleteClient(selectedClient.id);
    
    if (success) {
      setIsDeleteModalOpen(false);
      setSelectedClient(null);
    }
    setIsSubmitting(false);
  };

  // Client form component (reused for add/edit)
  const ClientForm = ({ isEdit = false }: { isEdit?: boolean }) => (
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
          <Label htmlFor="phone">ফোন *</Label>
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
          <Label htmlFor="email">ইমেইল *</Label>
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
      <div>
        <Label htmlFor="address">ঠিকানা</Label>
        <Input 
          id="address" 
          placeholder="সম্পূর্ণ ঠিকানা" 
          className="form-input mt-1"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="website">ওয়েবসাইট/সোশ্যাল লিংক</Label>
        <Input 
          id="website" 
          placeholder="https://" 
          className="form-input mt-1"
          value={formData.website}
          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
        />
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <Button 
          variant="outline" 
          onClick={() => {
            resetForm();
            isEdit ? setIsEditModalOpen(false) : setIsAddModalOpen(false);
          }}
        >
          বাতিল করুন
        </Button>
        <Button 
          className="btn-primary" 
          onClick={isEdit ? handleEditClient : handleAddClient}
          disabled={isSubmitting}
        >
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {isEdit ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}
        </Button>
      </div>
    </div>
  );

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
          <h1 className="page-title">ক্লায়েন্ট ম্যানেজমেন্ট</h1>
          <p className="text-muted-foreground mt-1">সকল ক্লায়েন্ট ও তাদের প্রজেক্ট পরিচালনা করুন</p>
        </div>
        <Button className="btn-primary" onClick={() => { resetForm(); setIsAddModalOpen(true); }}>
          <Plus className="w-4 h-4" />
          নতুন ক্লায়েন্ট যোগ করুন
        </Button>
      </div>

      {/* Add Client Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>নতুন ক্লায়েন্ট যোগ করুন</DialogTitle>
          </DialogHeader>
          <ClientForm />
        </DialogContent>
      </Dialog>

      {/* Edit Client Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>ক্লায়েন্ট এডিট করুন</DialogTitle>
          </DialogHeader>
          <ClientForm isEdit />
        </DialogContent>
      </Dialog>

      {/* View Client Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedClient && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
                    {selectedClient.name.charAt(0)}
                  </div>
                  {selectedClient.name}
                </DialogTitle>
              </DialogHeader>

              <div className="mt-4 space-y-6">
                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{selectedClient.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{selectedClient.email}</span>
                  </div>
                  {selectedClient.company && (
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{selectedClient.company}</span>
                    </div>
                  )}
                  {selectedClient.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{selectedClient.address}</span>
                    </div>
                  )}
                </div>

                {/* Projects */}
                <div>
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <FolderKanban className="w-5 h-5 text-primary" />
                    প্রজেক্ট সমূহ
                  </h4>
                  <div className="space-y-2">
                    {getProjectsByClient(selectedClient.id).map((project) => (
                      <div
                        key={project.id}
                        className="p-3 border border-border rounded-lg flex items-center justify-between"
                      >
                        <p className="font-medium text-foreground">{project.title}</p>
                      </div>
                    ))}
                    {getProjectsByClient(selectedClient.id).length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        কোনো প্রজেক্ট নেই
                      </p>
                    )}
                  </div>
                </div>

                {/* Invoices */}
                <div>
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    ইনভয়েস সমূহ
                  </h4>
                  <div className="space-y-2">
                    {getInvoicesByClient(selectedClient.id).map((invoice) => (
                      <div
                        key={invoice.id}
                        className="p-3 border border-border rounded-lg flex items-center justify-between"
                      >
                        <p className="font-medium text-foreground">{invoice.invoice_number}</p>
                      </div>
                    ))}
                    {getInvoicesByClient(selectedClient.id).length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        কোনো ইনভয়েস নেই
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Client Confirmation */}
      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ক্লায়েন্ট মুছে ফেলবেন?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteError ? (
                <span className="text-destructive font-medium">{deleteError}</span>
              ) : (
                selectedClient && (
                  <>
                    <strong>{selectedClient.name}</strong> কে মুছে ফেলতে চান?
                    <br />
                    এই ক্লায়েন্ট মুছে ফেলা হলে এটি আর ফিরে আসবে না।
                  </>
                )
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>বাতিল করুন</AlertDialogCancel>
            {!deleteError && (
              <AlertDialogAction className="btn-danger" onClick={handleDeleteClient} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <Trash2 className="w-4 h-4 mr-1" />
                হ্যাঁ, মুছে ফেলুন
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="নাম, ফোন, ইমেইল বা কোম্পানি দিয়ে খুঁজুন..."
                className="pl-10 form-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 px-3 py-2 border border-border rounded-md">
              <Switch
                id="my-clients"
                checked={showMyClientsOnly}
                onCheckedChange={setShowMyClientsOnly}
              />
              <Label htmlFor="my-clients" className="text-sm cursor-pointer whitespace-nowrap">
                আমার ক্লায়েন্ট
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            কোনো ক্লায়েন্ট পাওয়া যায়নি
          </div>
        ) : (
          filteredClients.map((client, index) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg">
                        {client.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{client.name}</h3>
                        {client.company && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {client.company}
                          </p>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewClient(client)}>
                          <Eye className="w-4 h-4 mr-2" />
                          বিস্তারিত দেখুন
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenEdit(client)}>
                          <Edit2 className="w-4 h-4 mr-2" />
                          এডিট করুন
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleOpenDelete(client)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          মুছে ফেলুন
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {client.phone}
                    </p>
                    <p className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {client.email}
                    </p>
                    {client.address && (
                      <p className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {client.address}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border text-sm">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <FolderKanban className="w-4 h-4 text-primary" />
                        <span>{getProjectsByClient(client.id).length} প্রজেক্ট</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <FileText className="w-4 h-4 text-success" />
                        <span>{getInvoicesByClient(client.id).length} ইনভয়েস</span>
                      </div>
                    </div>
                    {client.created_by_name && (
                      <span className="text-xs text-muted-foreground">
                        তৈরি: {client.created_by_name}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">মোট ক্লায়েন্ট</span>
            <span className="text-2xl font-bold text-foreground">{clients.length}</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function ClientsPage() {
  return (
    <PermissionGate permission="can_manage_clients">
      <ClientsContent />
    </PermissionGate>
  );
}
