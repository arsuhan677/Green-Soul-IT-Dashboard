import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  MoreVertical,
  FileText,
  Loader2,
  Printer,
  ArrowRight,
  Send,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useQuotations, Quotation, QuotationInput } from '@/hooks/useQuotations';
import { useClients } from '@/hooks/useClients';
import { useInvoices } from '@/hooks/useInvoices';
import { QuotationFormModal } from '@/components/quotations/QuotationFormModal';
import { PrintableDocument } from '@/components/documents/PrintableDocument';
import { useToast } from '@/hooks/use-toast';

const quoteStatuses = ['খসড়া', 'প্রেরিত', 'গৃহীত', 'প্রত্যাখ্যাত', 'মেয়াদ শেষ'];

function QuotationsContent() {
  const { canDelete, isAdmin } = usePermissions();
  const { quotations, loading, addQuotation, updateQuotation, deleteQuotation, updateStatus } = useQuotations();
  const { clients } = useClients();
  const { addInvoice } = useInvoices();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quotation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredQuotes = quotations.filter((quote) => {
    const matchesSearch =
      quote.quote_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (quote.client_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getClientName = (clientId: string | null, clientName: string | null) => {
    if (clientName) return clientName;
    if (!clientId) return 'অজানা ক্লায়েন্ট';
    return clients.find((c) => c.id === clientId)?.name || 'অজানা ক্লায়েন্ট';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'খসড়া':
        return 'bg-muted text-muted-foreground';
      case 'প্রেরিত':
        return 'bg-info/15 text-info';
      case 'গৃহীত':
        return 'bg-success/15 text-success';
      case 'প্রত্যাখ্যাত':
        return 'bg-destructive/15 text-destructive';
      case 'মেয়াদ শেষ':
        return 'bg-warning/15 text-warning';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('bn-BD');
  };

  // Calculate totals
  const totalAmount = quotations.reduce((sum, q) => sum + q.grand_total, 0);
  const acceptedAmount = quotations
    .filter((q) => q.status === 'গৃহীত')
    .reduce((sum, q) => sum + q.grand_total, 0);
  const pendingAmount = quotations
    .filter((q) => q.status === 'প্রেরিত' || q.status === 'খসড়া')
    .reduce((sum, q) => sum + q.grand_total, 0);

  const handleAddQuote = async (data: QuotationInput): Promise<boolean> => {
    return await addQuotation(data);
  };

  const handleEditQuote = async (data: QuotationInput): Promise<boolean> => {
    if (!selectedQuote) return false;
    return await updateQuotation(selectedQuote.id, data);
  };

  const handleOpenEdit = (quote: Quotation) => {
    setSelectedQuote(quote);
    setIsEditModalOpen(true);
  };

  const handleOpenDelete = (quote: Quotation) => {
    setSelectedQuote(quote);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteQuote = async () => {
    if (!selectedQuote) return;
    setIsSubmitting(true);
    await deleteQuotation(selectedQuote.id);
    setIsSubmitting(false);
    setIsDeleteModalOpen(false);
    setSelectedQuote(null);
  };

  const handleViewPrint = (quote: Quotation) => {
    setSelectedQuote(quote);
    setIsPrintModalOpen(true);
  };

  const handleSendQuote = async (quote: Quotation) => {
    await updateStatus(quote.id, 'প্রেরিত');
  };

  const handleConvertToInvoice = async (quote: Quotation) => {
    if (!quote.client_id) {
      toast({
        title: "ত্রুটি!",
        description: "কোটেশনে ক্লায়েন্ট নেই",
        variant: "destructive",
      });
      return;
    }

    // Convert quotation items to invoice items
    const invoiceItems = quote.items.map((item) => ({
      description: item.title + (item.description ? ` - ${item.description}` : ''),
      quantity: item.qty,
      rate: item.price,
      amount: item.total,
    }));

    const success = await addInvoice({
      client_id: quote.client_id,
      items: invoiceItems,
      discount: quote.discount,
      tax: quote.tax,
      status: 'বকেয়া',
    });

    if (success) {
      // Update quote status to accepted
      await updateStatus(quote.id, 'গৃহীত');
      toast({
        title: "সফল!",
        description: "কোটেশন থেকে ইনভয়েস তৈরি হয়েছে",
      });
    }
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
          <h1 className="page-title">কোটেশন</h1>
          <p className="text-muted-foreground mt-1">ক্লায়েন্টদের জন্য পেশাদার কোটেশন তৈরি করুন</p>
        </div>
        <Button className="btn-primary" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="w-4 h-4" />
          নতুন কোটেশন তৈরি করুন
        </Button>
      </div>

      {/* Add Modal */}
      <QuotationFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddQuote}
      />

      {/* Edit Modal */}
      <QuotationFormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedQuote(null);
        }}
        onSubmit={handleEditQuote}
        quotation={selectedQuote}
        isEdit
      />

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>কোটেশন মুছে ফেলবেন?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedQuote && (
                <>
                  <strong>{selectedQuote.quote_number}</strong> মুছে ফেলতে চান?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>বাতিল করুন</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteQuote}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Trash2 className="w-4 h-4 mr-1" />
              হ্যাঁ, মুছে ফেলুন
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Print Modal */}
      {isPrintModalOpen && selectedQuote && (
        <PrintableDocument
          type="quotation"
          documentNumber={selectedQuote.quote_number}
          clientId={selectedQuote.client_id}
          clientName={selectedQuote.client_name}
          issueDate={selectedQuote.issue_date}
          validUntil={selectedQuote.valid_until}
          items={selectedQuote.items}
          subtotal={selectedQuote.subtotal}
          discount={selectedQuote.discount}
          tax={selectedQuote.tax}
          total={selectedQuote.grand_total}
          status={selectedQuote.status}
          note={selectedQuote.note}
          onClose={() => {
            setIsPrintModalOpen(false);
            setSelectedQuote(null);
          }}
        />
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">মোট কোটেশন</p>
            <p className="text-2xl font-bold">৳{totalAmount.toLocaleString('bn-BD')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">গৃহীত</p>
            <p className="text-2xl font-bold text-success">৳{acceptedAmount.toLocaleString('bn-BD')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">পেন্ডিং</p>
            <p className="text-2xl font-bold text-warning">৳{pendingAmount.toLocaleString('bn-BD')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="কোটেশন নম্বর বা ক্লায়েন্ট খুঁজুন..."
                className="pl-10"
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
                {quoteStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>কোটেশন নং</TableHead>
                <TableHead>ক্লায়েন্ট</TableHead>
                <TableHead>তারিখ</TableHead>
                <TableHead>মেয়াদ</TableHead>
                <TableHead>মোট</TableHead>
                <TableHead>স্ট্যাটাস</TableHead>
                <TableHead className="text-right">অ্যাকশন</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuotes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    কোনো কোটেশন পাওয়া যায়নি
                  </TableCell>
                </TableRow>
              ) : (
                filteredQuotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell className="font-medium">{quote.quote_number}</TableCell>
                    <TableCell>{getClientName(quote.client_id, quote.client_name)}</TableCell>
                    <TableCell>{formatDate(quote.issue_date)}</TableCell>
                    <TableCell>{formatDate(quote.valid_until)}</TableCell>
                    <TableCell className="font-semibold">
                      ৳{quote.grand_total.toLocaleString('bn-BD')}
                    </TableCell>
                    <TableCell>
                      <span className={`status-badge ${getStatusColor(quote.status)}`}>
                        {quote.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewPrint(quote)}>
                            <Printer className="w-4 h-4 mr-2" />
                            দেখুন / প্রিন্ট
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenEdit(quote)}>
                            <Edit2 className="w-4 h-4 mr-2" />
                            এডিট করুন
                          </DropdownMenuItem>
                          {quote.status === 'খসড়া' && (
                            <DropdownMenuItem onClick={() => handleSendQuote(quote)}>
                              <Send className="w-4 h-4 mr-2" />
                              প্রেরণ করুন
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {(quote.status === 'প্রেরিত' || quote.status === 'গৃহীত') && (
                            <DropdownMenuItem onClick={() => handleConvertToInvoice(quote)}>
                              <ArrowRight className="w-4 h-4 mr-2" />
                              ইনভয়েসে রূপান্তর
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleOpenDelete(quote)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            মুছে ফেলুন
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Quotations() {
  return (
    <PermissionGate permission="can_manage_invoices">
      <QuotationsContent />
    </PermissionGate>
  );
}
