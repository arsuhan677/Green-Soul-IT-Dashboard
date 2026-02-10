import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  Download,
  Printer,
  Eye,
  Edit2,
  Trash2,
  MoreVertical,
  FileText,
  Loader2,
  CheckCircle,
} from 'lucide-react';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useInvoices, Invoice } from '@/hooks/useInvoices';
import { useClients } from '@/hooks/useClients';
import { useCompany } from '@/contexts/CompanyContext';
import { PrintableDocument } from '@/components/documents/PrintableDocument';

const invoiceStatuses = ['পরিশোধিত', 'বকেয়া', 'আংশিক'] as const;

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

function InvoicesContent() {
  const { canDelete } = usePermissions();
  const { 
    invoices, 
    loading, 
    addInvoice, 
    updateInvoice, 
    canDeleteInvoice, 
    deleteInvoice 
  } = useInvoices();
  const { clients } = useClients();
  const { settings: companySettings } = useCompany();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    clientId: '',
    items: [{ description: '', quantity: 1, rate: 0, amount: 0 }] as InvoiceItem[],
    discount: 0,
    tax: 0,
    status: 'বকেয়া' as typeof invoiceStatuses[number],
  });

  const filteredInvoices = invoices.filter((invoice) => {
    const client = clients.find((c) => c.id === invoice.client_id);
    const matchesSearch =
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getClientName = (clientId: string | null) => {
    if (!clientId) return 'অজানা ক্লায়েন্ট';
    return clients.find((c) => c.id === clientId)?.name || 'অজানা ক্লায়েন্ট';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'পরিশোধিত':
        return 'bg-success/15 text-success';
      case 'বকেয়া':
        return 'bg-destructive/15 text-destructive';
      case 'আংশিক':
        return 'bg-warning/15 text-warning';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  // Calculate totals
  const totalAmount = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const paidAmount = invoices
    .filter((inv) => inv.status === 'পরিশোধিত')
    .reduce((sum, inv) => sum + inv.total, 0);
  const pendingAmount = invoices
    .filter((inv) => inv.status !== 'পরিশোধিত')
    .reduce((sum, inv) => sum + inv.total, 0);

  // Reset form
  const resetForm = () => {
    setFormData({
      clientId: '',
      items: [{ description: '', quantity: 1, rate: 0, amount: 0 }],
      discount: 0,
      tax: 0,
      status: 'বকেয়া',
    });
  };

  // Calculate item amount
  const calculateItemAmount = (quantity: number, rate: number) => {
    return quantity * rate;
  };

  // Update item
  const updateItem = (index: number, field: string, value: string | number) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'rate') {
      newItems[index].amount = calculateItemAmount(
        field === 'quantity' ? Number(value) : newItems[index].quantity,
        field === 'rate' ? Number(value) : newItems[index].rate
      );
    }
    
    setFormData({ ...formData, items: newItems });
  };

  // Add item
  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 1, rate: 0, amount: 0 }],
    });
  };

  // Remove item
  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData({ ...formData, items: newItems });
    }
  };

  // Calculate subtotal
  const getSubtotal = () => {
    return formData.items.reduce((sum, item) => sum + item.amount, 0);
  };

  // Calculate total
  const getTotal = () => {
    const subtotal = getSubtotal();
    return subtotal - formData.discount + (subtotal * formData.tax / 100);
  };

  // Handle add invoice
  const handleAddInvoice = async () => {
    if (!formData.clientId || formData.items.every(item => !item.description)) return;

    setIsSubmitting(true);
    const success = await addInvoice({
      client_id: formData.clientId,
      items: formData.items.filter(item => item.description),
      discount: formData.discount,
      tax: formData.tax,
      status: formData.status,
    });

    if (success) {
      resetForm();
      setIsAddModalOpen(false);
    }
    setIsSubmitting(false);
  };

  // Handle view invoice
  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsViewModalOpen(true);
  };

  // Handle edit invoice
  const handleOpenEdit = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setFormData({
      clientId: invoice.client_id || '',
      items: invoice.items.length > 0 ? invoice.items : [{ description: '', quantity: 1, rate: 0, amount: 0 }],
      discount: invoice.discount,
      tax: invoice.tax,
      status: invoice.status as typeof invoiceStatuses[number],
    });
    setIsEditModalOpen(true);
  };

  const handleEditInvoice = async () => {
    if (!selectedInvoice || !formData.clientId) return;

    setIsSubmitting(true);
    const success = await updateInvoice(selectedInvoice.id, {
      client_id: formData.clientId,
      items: formData.items.filter(item => item.description),
      discount: formData.discount,
      tax: formData.tax,
      status: formData.status,
    });

    if (success) {
      resetForm();
      setIsEditModalOpen(false);
      setSelectedInvoice(null);
    }
    setIsSubmitting(false);
  };

  // Handle delete invoice
  const handleOpenDelete = async (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setDeleteError(null);
    
    const { canDelete, reason } = await canDeleteInvoice(invoice.id);
    if (!canDelete && reason) {
      setDeleteError(reason);
    }
    
    setIsDeleteModalOpen(true);
  };

  const handleDeleteInvoice = async () => {
    if (!selectedInvoice || deleteError) return;

    setIsSubmitting(true);
    const success = await deleteInvoice(selectedInvoice.id);
    
    if (success) {
      setIsDeleteModalOpen(false);
      setSelectedInvoice(null);
    }
    setIsSubmitting(false);
  };

  const handlePrintInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsPrintModalOpen(true);
  };

  const handleMarkAsPaid = async (invoice: Invoice) => {
    await updateInvoice(invoice.id, { status: 'পরিশোধিত' });
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
          <h1 className="page-title">ইনভয়েস ও পেমেন্ট</h1>
          <p className="text-muted-foreground mt-1">সকল ইনভয়েস ও পেমেন্ট পরিচালনা করুন</p>
        </div>
        <Button className="btn-primary" onClick={() => { resetForm(); setIsAddModalOpen(true); }}>
          <Plus className="w-4 h-4" />
          নতুন ইনভয়েস তৈরি করুন
        </Button>
      </div>

      {/* Add Invoice Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>নতুন ইনভয়েস তৈরি করুন</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="client">ক্লায়েন্ট *</Label>
                <Select 
                  value={formData.clientId} 
                  onValueChange={(value) => setFormData({ ...formData, clientId: value })}
                >
                  <SelectTrigger className="mt-1">
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
              <div>
                <Label htmlFor="status">স্ট্যাটাস</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: typeof invoiceStatuses[number]) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {invoiceStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Invoice Items */}
            <div>
              <Label>আইটেম সমূহ</Label>
              <div className="mt-2 border border-border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">
                        বিবরণ
                      </th>
                      <th className="px-4 py-2 text-center text-sm font-medium text-muted-foreground w-20">
                        পরিমাণ
                      </th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-muted-foreground w-28">
                        রেট
                      </th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-muted-foreground w-28">
                        মোট
                      </th>
                      <th className="px-2 py-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((item, index) => (
                      <tr key={index} className="border-t border-border">
                        <td className="px-4 py-2">
                          <Input 
                            placeholder="আইটেমের বিবরণ" 
                            className="h-9"
                            value={item.description}
                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input 
                            type="number" 
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                            className="h-9 text-center" 
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input 
                            type="number" 
                            placeholder="০" 
                            value={item.rate || ''}
                            onChange={(e) => updateItem(index, 'rate', parseInt(e.target.value) || 0)}
                            className="h-9 text-right" 
                          />
                        </td>
                        <td className="px-4 py-2 text-right font-medium">
                          ৳{item.amount.toLocaleString('bn-BD')}
                        </td>
                        <td className="px-2 py-2">
                          {formData.items.length > 1 && (
                            <Button 
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
              <Button variant="ghost" size="sm" className="mt-2" onClick={addItem}>
                <Plus className="w-4 h-4 mr-1" />
                আইটেম যোগ করুন
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="discount">ডিসকাউন্ট (৳)</Label>
                <Input 
                  id="discount" 
                  type="number" 
                  placeholder="০" 
                  className="form-input mt-1"
                  value={formData.discount || ''}
                  onChange={(e) => setFormData({ ...formData, discount: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="tax">ট্যাক্স/ভ্যাট (%)</Label>
                <Input 
                  id="tax" 
                  type="number" 
                  placeholder="০" 
                  className="form-input mt-1"
                  value={formData.tax || ''}
                  onChange={(e) => setFormData({ ...formData, tax: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-2 text-right">
              <div className="flex justify-between">
                <span className="text-muted-foreground">সাবটোটাল</span>
                <span className="font-medium">৳{getSubtotal().toLocaleString('bn-BD')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ডিসকাউন্ট</span>
                <span className="font-medium text-destructive">-৳{formData.discount.toLocaleString('bn-BD')}</span>
              </div>
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

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                বাতিল করুন
              </Button>
              <Button className="btn-primary" onClick={handleAddInvoice} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                সংরক্ষণ করুন
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Invoice Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>ইনভয়েস এডিট করুন</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {/* Same form as add */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="client">ক্লায়েন্ট *</Label>
                <Select 
                  value={formData.clientId} 
                  onValueChange={(value) => setFormData({ ...formData, clientId: value })}
                >
                  <SelectTrigger className="mt-1">
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
              <div>
                <Label htmlFor="status">স্ট্যাটাস</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: typeof invoiceStatuses[number]) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {invoiceStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>আইটেম সমূহ</Label>
              <div className="mt-2 border border-border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">বিবরণ</th>
                      <th className="px-4 py-2 text-center text-sm font-medium text-muted-foreground w-20">পরিমাণ</th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-muted-foreground w-28">রেট</th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-muted-foreground w-28">মোট</th>
                      <th className="px-2 py-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((item, index) => (
                      <tr key={index} className="border-t border-border">
                        <td className="px-4 py-2">
                          <Input 
                            placeholder="আইটেমের বিবরণ" 
                            className="h-9"
                            value={item.description}
                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input 
                            type="number" 
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                            className="h-9 text-center" 
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input 
                            type="number" 
                            placeholder="০" 
                            value={item.rate || ''}
                            onChange={(e) => updateItem(index, 'rate', parseInt(e.target.value) || 0)}
                            className="h-9 text-right" 
                          />
                        </td>
                        <td className="px-4 py-2 text-right font-medium">
                          ৳{item.amount.toLocaleString('bn-BD')}
                        </td>
                        <td className="px-2 py-2">
                          {formData.items.length > 1 && (
                            <Button 
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
              <Button variant="ghost" size="sm" className="mt-2" onClick={addItem}>
                <Plus className="w-4 h-4 mr-1" />
                আইটেম যোগ করুন
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="discount">ডিসকাউন্ট (৳)</Label>
                <Input 
                  id="discount" 
                  type="number" 
                  placeholder="০" 
                  className="form-input mt-1"
                  value={formData.discount || ''}
                  onChange={(e) => setFormData({ ...formData, discount: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="tax">ট্যাক্স/ভ্যাট (%)</Label>
                <Input 
                  id="tax" 
                  type="number" 
                  placeholder="০" 
                  className="form-input mt-1"
                  value={formData.tax || ''}
                  onChange={(e) => setFormData({ ...formData, tax: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-2 text-right">
              <div className="flex justify-between">
                <span className="text-muted-foreground">সাবটোটাল</span>
                <span className="font-medium">৳{getSubtotal().toLocaleString('bn-BD')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ডিসকাউন্ট</span>
                <span className="font-medium text-destructive">-৳{formData.discount.toLocaleString('bn-BD')}</span>
              </div>
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

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                বাতিল করুন
              </Button>
              <Button className="btn-primary" onClick={handleEditInvoice} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                আপডেট করুন
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Invoice Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedInvoice && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  {selectedInvoice.invoice_number}
                </DialogTitle>
              </DialogHeader>

              <div className="mt-4 space-y-4">
                {/* Company Header */}
                <div className="flex items-start justify-between p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-4">
                    {companySettings?.logo_url && (
                      <img 
                        src={companySettings.logo_url} 
                        alt="Company Logo" 
                        className="w-16 h-16 object-contain"
                      />
                    )}
                    <div>
                      <h3 className="font-bold text-lg">{companySettings?.company_name_bn || 'আশমা টেক লিমিটেড'}</h3>
                      {companySettings?.address && (
                        <p className="text-sm text-muted-foreground">{companySettings.address}</p>
                      )}
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-1">
                        {companySettings?.phone && <span>📞 {companySettings.phone}</span>}
                        {companySettings?.email && <span>✉️ {companySettings.email}</span>}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">ক্লায়েন্ট</p>
                    <p className="font-semibold">{getClientName(selectedInvoice.client_id)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">তারিখ</p>
                    <p className="font-medium">
                      {new Date(selectedInvoice.created_at).toLocaleDateString('bn-BD')}
                    </p>
                  </div>
                  <div>
                    <span className={`status-badge ${getStatusColor(selectedInvoice.status)}`}>
                      {selectedInvoice.status}
                    </span>
                  </div>
                </div>

                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">বিবরণ</th>
                        <th className="px-4 py-2 text-center text-sm font-medium text-muted-foreground">পরিমাণ</th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-muted-foreground">রেট</th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-muted-foreground">মোট</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.items.map((item, index) => (
                        <tr key={index} className="border-t border-border">
                          <td className="px-4 py-3">{item.description}</td>
                          <td className="px-4 py-3 text-center">{item.quantity}</td>
                          <td className="px-4 py-3 text-right">৳{item.rate.toLocaleString('bn-BD')}</td>
                          <td className="px-4 py-3 text-right font-medium">৳{item.amount.toLocaleString('bn-BD')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="space-y-2 text-right p-4 bg-muted/30 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">সাবটোটাল</span>
                    <span className="font-medium">৳{selectedInvoice.subtotal.toLocaleString('bn-BD')}</span>
                  </div>
                  {selectedInvoice.discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ডিসকাউন্ট</span>
                      <span className="font-medium text-destructive">-৳{selectedInvoice.discount.toLocaleString('bn-BD')}</span>
                    </div>
                  )}
                  {selectedInvoice.tax > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ট্যাক্স</span>
                      <span className="font-medium">+৳{(selectedInvoice.subtotal * selectedInvoice.tax / 100).toLocaleString('bn-BD')}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg">
                    <span className="font-semibold">মোট</span>
                    <span className="font-bold text-primary">৳{selectedInvoice.total.toLocaleString('bn-BD')}</span>
                  </div>
                </div>

                {/* Invoice Note */}
                {companySettings?.invoice_note_bn && (
                  <div className="p-3 bg-muted/20 rounded-lg text-sm text-muted-foreground">
                    <p>{companySettings.invoice_note_bn}</p>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm">
                    <Printer className="w-4 h-4 mr-1" />
                    প্রিন্ট
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-1" />
                    ডাউনলোড
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Invoice Confirmation */}
      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ইনভয়েস মুছে ফেলবেন?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteError ? (
                <span className="text-destructive font-medium">{deleteError}</span>
              ) : (
                selectedInvoice && (
                  <>
                    <strong>{selectedInvoice.invoice_number}</strong> মুছে ফেলতে চান?
                    <br />
                    এই ইনভয়েস মুছে ফেলা হলে এটি আর ফিরে আসবে না।
                  </>
                )
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>বাতিল করুন</AlertDialogCancel>
            {!deleteError && (
              <AlertDialogAction className="btn-danger" onClick={handleDeleteInvoice} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <Trash2 className="w-4 h-4 mr-1" />
                হ্যাঁ, মুছে ফেলুন
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">মোট বিল</p>
              <p className="text-2xl font-bold text-foreground">৳{totalAmount.toLocaleString('bn-BD')}</p>
            </div>
            <FileText className="w-8 h-8 text-primary/30" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">পরিশোধিত</p>
              <p className="text-2xl font-bold text-success">৳{paidAmount.toLocaleString('bn-BD')}</p>
            </div>
            <FileText className="w-8 h-8 text-success/30" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">বকেয়া</p>
              <p className="text-2xl font-bold text-destructive">৳{pendingAmount.toLocaleString('bn-BD')}</p>
            </div>
            <FileText className="w-8 h-8 text-destructive/30" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="ইনভয়েস নম্বর বা ক্লায়েন্ট নাম দিয়ে খুঁজুন..."
                className="pl-10 form-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="স্ট্যাটাস" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সকল স্ট্যাটাস</SelectItem>
                {invoiceStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">ইনভয়েস নম্বর</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">ক্লায়েন্ট</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">মোট</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">স্ট্যাটাস</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">তারিখ</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                      কোনো ইনভয়েস পাওয়া যায়নি
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((invoice, index) => (
                    <motion.tr
                      key={invoice.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="font-medium text-foreground">{invoice.invoice_number}</span>
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {getClientName(invoice.client_id)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-foreground">
                        ৳{invoice.total.toLocaleString('bn-BD')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`status-badge ${getStatusColor(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(invoice.created_at).toLocaleDateString('bn-BD')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewInvoice(invoice)}>
                                <Eye className="w-4 h-4 mr-2" />
                                বিস্তারিত দেখুন
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handlePrintInvoice(invoice)}>
                                <Printer className="w-4 h-4 mr-2" />
                                প্রিন্ট / PDF
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenEdit(invoice)}>
                                <Edit2 className="w-4 h-4 mr-2" />
                                এডিট করুন
                              </DropdownMenuItem>
                              {invoice.status !== 'পরিশোধিত' && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleMarkAsPaid(invoice)}>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    পরিশোধিত হিসেবে চিহ্নিত করুন
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onClick={() => handleOpenDelete(invoice)}
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

      {/* Print Modal */}
      {isPrintModalOpen && selectedInvoice && (
        <PrintableDocument
          type="invoice"
          documentNumber={selectedInvoice.invoice_number}
          clientId={selectedInvoice.client_id}
          issueDate={selectedInvoice.created_at}
          items={selectedInvoice.items}
          subtotal={selectedInvoice.subtotal}
          discount={selectedInvoice.discount}
          tax={selectedInvoice.tax}
          total={selectedInvoice.total}
          status={selectedInvoice.status}
          onClose={() => {
            setIsPrintModalOpen(false);
            setSelectedInvoice(null);
          }}
        />
      )}
    </motion.div>
  );
}

export default function InvoicesPage() {
  return (
    <PermissionGate permission="can_manage_invoices">
      <InvoicesContent />
    </PermissionGate>
  );
}
