import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Clock,
  Tag,
  Loader2,
  Eye,
  MoreVertical,
} from 'lucide-react';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useServices, Service, ServiceInput } from '@/hooks/useServices';
import { useToast } from '@/hooks/use-toast';

const categories = ['ডেভেলপমেন্ট', 'মার্কেটিং', 'ভিডিও প্রোডাকশন', 'স্টুডিও', 'কাস্টম'];

function ServicesContent() {
  const { toast } = useToast();
  const { canDelete } = usePermissions();
  const { 
    services, 
    loading, 
    addService, 
    updateService, 
    toggleServiceActive, 
    canDeleteService, 
    deleteService 
  } = useServices();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteBlockReason, setDeleteBlockReason] = useState<string | null>(null);
  
  // Form state for new service
  const [newService, setNewService] = useState<ServiceInput>({
    name: '',
    category: '',
    price: 0,
    delivery_time: '',
    description: '',
    active: true,
  });

  // Form state for edit service
  const [editService, setEditService] = useState<ServiceInput>({
    name: '',
    category: '',
    price: 0,
    delivery_time: '',
    description: '',
    active: true,
  });

  const filteredServices = services.filter((service) => {
    return (
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Handle Add Service
  const handleAddService = async () => {
    if (!newService.name || !newService.category) {
      toast({
        title: "ত্রুটি!",
        description: "সার্ভিস নাম ও ক্যাটাগরি আবশ্যক",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    const success = await addService(newService);
    
    if (success) {
      setNewService({
        name: '',
        category: '',
        price: 0,
        delivery_time: '',
        description: '',
        active: true,
      });
      setIsAddModalOpen(false);
    }
    setIsSubmitting(false);
  };

  // Handle Edit Service
  const handleOpenEdit = (service: Service) => {
    setSelectedService(service);
    setEditService({
      name: service.name,
      category: service.category,
      price: service.price,
      delivery_time: service.delivery_time || '',
      description: service.description || '',
      active: service.active,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateService = async () => {
    if (!selectedService || !editService.name || !editService.category) {
      toast({
        title: "ত্রুটি!",
        description: "সার্ভিস নাম ও ক্যাটাগরি আবশ্যক",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    const success = await updateService(selectedService.id, editService);
    
    if (success) {
      setIsEditModalOpen(false);
      setSelectedService(null);
    }
    setIsSubmitting(false);
  };

  // Handle View Service
  const handleOpenView = (service: Service) => {
    setSelectedService(service);
    setIsViewModalOpen(true);
  };

  // Handle Delete Service
  const handleOpenDelete = async (service: Service) => {
    setSelectedService(service);
    setDeleteBlockReason(null);
    
    // Check if service can be deleted
    const { canDelete, reason } = await canDeleteService(service.id);
    
    if (!canDelete && reason) {
      setDeleteBlockReason(reason);
    }
    
    setIsDeleteModalOpen(true);
  };

  const handleDeleteService = async () => {
    if (!selectedService) return;

    setIsSubmitting(true);
    const success = await deleteService(selectedService.id);
    
    if (success) {
      setIsDeleteModalOpen(false);
      setSelectedService(null);
    }
    setIsSubmitting(false);
  };

  // Handle Toggle Status
  const handleToggleStatus = async (service: Service) => {
    await toggleServiceActive(service.id, !service.active);
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
          <h1 className="page-title">সার্ভিস ম্যানেজমেন্ট</h1>
          <p className="text-muted-foreground mt-1">সকল সার্ভিস যোগ, এডিট ও পরিচালনা করুন</p>
        </div>
        <Button className="btn-primary" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="w-4 h-4" />
          নতুন সার্ভিস যোগ করুন
        </Button>
      </div>

      {/* Add Service Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>নতুন সার্ভিস যোগ করুন</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 pr-4 max-h-[60vh]">
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="name">সার্ভিস নাম *</Label>
                <Input 
                  id="name" 
                  placeholder="সার্ভিসের নাম লিখুন" 
                  className="form-input mt-1"
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">ক্যাটাগরি *</Label>
                  <Select 
                    value={newService.category}
                    onValueChange={(value) => setNewService({ ...newService, category: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="ক্যাটাগরি নির্বাচন করুন" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="price">মূল্য (৳) *</Label>
                  <Input 
                    id="price" 
                    type="number" 
                    placeholder="০" 
                    className="form-input mt-1"
                    value={newService.price}
                    onChange={(e) => setNewService({ ...newService, price: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="deliveryTime">ডেলিভারি সময়</Label>
                <Input 
                  id="deliveryTime" 
                  placeholder="যেমন: ৭-১০ দিন" 
                  className="form-input mt-1"
                  value={newService.delivery_time}
                  onChange={(e) => setNewService({ ...newService, delivery_time: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="description">সংক্ষিপ্ত বিবরণ</Label>
                <Textarea 
                  id="description" 
                  placeholder="সার্ভিস সম্পর্কে বিস্তারিত..." 
                  className="mt-1" 
                  rows={3}
                  value={newService.description}
                  onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                />
              </div>
            </div>
          </ScrollArea>
          <div className="flex justify-end gap-3 pt-4 border-t mt-4">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              বাতিল করুন
            </Button>
            <Button className="btn-primary" onClick={handleAddService} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              সংরক্ষণ করুন
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Service Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>সার্ভিস এডিট করুন</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 pr-4 max-h-[60vh]">
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="edit-name">সার্ভিস নাম *</Label>
                <Input 
                  id="edit-name"
                  className="form-input mt-1"
                  value={editService.name}
                  onChange={(e) => setEditService({ ...editService, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-category">ক্যাটাগরি *</Label>
                  <Select 
                    value={editService.category}
                    onValueChange={(value) => setEditService({ ...editService, category: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-price">মূল্য (৳) *</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    className="form-input mt-1"
                    value={editService.price}
                    onChange={(e) => setEditService({ ...editService, price: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-delivery">ডেলিভারি সময়</Label>
                <Input
                  id="edit-delivery"
                  className="form-input mt-1"
                  value={editService.delivery_time}
                  onChange={(e) => setEditService({ ...editService, delivery_time: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-description">সংক্ষিপ্ত বিবরণ</Label>
                <Textarea
                  id="edit-description"
                  className="mt-1"
                  rows={3}
                  value={editService.description}
                  onChange={(e) => setEditService({ ...editService, description: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="edit-active"
                  checked={editService.active}
                  onCheckedChange={(checked) => setEditService({ ...editService, active: checked })}
                />
                <Label htmlFor="edit-active">সক্রিয়</Label>
              </div>
            </div>
          </ScrollArea>
          <div className="flex justify-end gap-3 pt-4 border-t mt-4">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              বাতিল করুন
            </Button>
            <Button className="btn-primary" onClick={handleUpdateService} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              আপডেট করুন
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Service Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>সার্ভিস বিস্তারিত</DialogTitle>
          </DialogHeader>
          {selectedService && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">নাম</Label>
                  <p className="font-semibold">{selectedService.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">ক্যাটাগরি</Label>
                  <p className="font-semibold">{selectedService.category}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">মূল্য</Label>
                  <p className="font-semibold text-lg">৳{selectedService.price.toLocaleString('bn-BD')}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">ডেলিভারি সময়</Label>
                  <p className="font-semibold">{selectedService.delivery_time || 'উল্লেখ নেই'}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">বিবরণ</Label>
                <p className="mt-1">{selectedService.description || 'কোনো বিবরণ নেই'}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${selectedService.active ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span>{selectedService.active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>সার্ভিস মুছে ফেলবেন?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteBlockReason ? (
                <span className="text-destructive font-medium">{deleteBlockReason}</span>
              ) : (
                <>
                  <strong>{selectedService?.name}</strong> মুছে ফেলতে চান?
                  <br />
                  এই সার্ভিস মুছে ফেলা হলে এটি আর দেখা যাবে না।
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>বাতিল করুন</AlertDialogCancel>
            {!deleteBlockReason && (
              <AlertDialogAction 
                className="btn-danger" 
                onClick={handleDeleteService}
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <Trash2 className="w-4 h-4 mr-1" />
                হ্যাঁ, মুছে ফেলুন
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="সার্ভিস বা ক্যাটাগরি খুঁজুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Services Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServices.map((service, index) => (
          <motion.div
            key={service.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className={`card-hover ${!service.active && 'opacity-60'}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      service.active
                        ? 'bg-gradient-to-br from-primary to-accent text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <Tag className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={service.active}
                      onCheckedChange={() => handleToggleStatus(service)}
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover">
                        <DropdownMenuItem onClick={() => handleOpenView(service)}>
                          <Eye className="w-4 h-4 mr-2" />
                          দেখুন
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenEdit(service)}>
                          <Edit2 className="w-4 h-4 mr-2" />
                          এডিট করুন
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleOpenDelete(service)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          মুছে ফেলুন
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <h3 className="font-semibold text-foreground text-lg">{service.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{service.category}</p>

                <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                  {service.description || 'কোনো বিবরণ নেই'}
                </p>

                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        ৳{service.price.toLocaleString('bn-BD')}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        {service.delivery_time || 'উল্লেখ নেই'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {filteredServices.length === 0 && (
          <div className="col-span-full">
            <Card>
              <CardContent className="py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">কোনো সার্ভিস পাওয়া যায়নি</h3>
                <p className="text-muted-foreground mt-1">সার্চ পরিবর্তন করুন অথবা নতুন সার্ভিস যোগ করুন</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function ServicesPage() {
  return (
    <PermissionGate permission="can_manage_services">
      <ServicesContent />
    </PermissionGate>
  );
}
