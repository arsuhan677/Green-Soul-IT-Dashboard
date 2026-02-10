import { useState } from 'react';
import { Plus, Search, MoreHorizontal, Edit, Trash2, Eye, Shield, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCustomRoles, CustomRole, CreateRoleInput, UpdateRoleInput } from '@/hooks/useCustomRoles';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

const AVAILABLE_PERMISSIONS = [
  { id: 'all', label: 'সম্পূর্ণ অ্যাক্সেস', description: 'সব কিছুতে অ্যাক্সেস' },
  { id: 'leads', label: 'লিড ম্যানেজমেন্ট', description: 'লিড দেখা ও পরিচালনা' },
  { id: 'clients', label: 'ক্লায়েন্ট ম্যানেজমেন্ট', description: 'ক্লায়েন্ট দেখা ও পরিচালনা' },
  { id: 'projects', label: 'প্রজেক্ট ম্যানেজমেন্ট', description: 'প্রজেক্ট দেখা ও পরিচালনা' },
  { id: 'assigned_projects', label: 'অ্যাসাইন করা প্রজেক্ট', description: 'শুধুমাত্র অ্যাসাইন করা প্রজেক্ট' },
  { id: 'tasks', label: 'টাস্ক ম্যানেজমেন্ট', description: 'টাস্ক তৈরি ও আপডেট' },
  { id: 'services', label: 'সার্ভিস ম্যানেজমেন্ট', description: 'সার্ভিস দেখা ও পরিচালনা' },
  { id: 'invoices', label: 'ইনভয়েস ম্যানেজমেন্ট', description: 'ইনভয়েস দেখা ও পরিচালনা' },
  { id: 'users', label: 'ইউজার ম্যানেজমেন্ট', description: 'ইউজার তৈরি ও পরিচালনা' },
  { id: 'roles', label: 'রোল ম্যানেজমেন্ট', description: 'রোল তৈরি ও পরিচালনা' },
  { id: 'comments', label: 'কমেন্ট', description: 'কমেন্ট করা ও দেখা' },
  { id: 'followups', label: 'ফলোআপ', description: 'ফলোআপ করা ও দেখা' },
  { id: 'view_projects', label: 'প্রজেক্ট দেখা', description: 'শুধুমাত্র প্রজেক্ট দেখতে পারবে' },
  { id: 'assign_team', label: 'টিম অ্যাসাইন', description: 'প্রজেক্টে টিম অ্যাসাইন করা' },
];

export default function Roles() {
  const { roles, isLoading, addRole, updateRole, deleteRole, isAdding, isUpdating, isDeleting } = useCustomRoles();
  const { hasRole } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<CustomRole | null>(null);
  
  const [formData, setFormData] = useState<{
    role_name_bn: string;
    role_name_en: string;
    description: string;
    permissions: string[];
  }>({
    role_name_bn: '',
    role_name_en: '',
    description: '',
    permissions: [],
  });

  const isAdmin = hasRole('admin');

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">এই পেজ দেখার অনুমতি নেই</p>
      </div>
    );
  }

  const filteredRoles = roles.filter(role =>
    role.role_name_bn.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (role.role_name_en && role.role_name_en.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const resetForm = () => {
    setFormData({
      role_name_bn: '',
      role_name_en: '',
      description: '',
      permissions: [],
    });
  };

  const togglePermission = (permissionId: string) => {
    setFormData(prev => {
      if (prev.permissions.includes(permissionId)) {
        return { ...prev, permissions: prev.permissions.filter(p => p !== permissionId) };
      }
      return { ...prev, permissions: [...prev.permissions, permissionId] };
    });
  };

  const handleAddRole = async () => {
    if (!formData.role_name_bn.trim()) return;
    
    const input: CreateRoleInput = {
      role_name_bn: formData.role_name_bn.trim(),
      role_name_en: formData.role_name_en.trim() || undefined,
      description: formData.description.trim() || undefined,
      permissions: formData.permissions,
    };
    
    await addRole(input);
    setIsAddModalOpen(false);
    resetForm();
  };

  const handleEditRole = async () => {
    if (!selectedRole || !formData.role_name_bn.trim()) return;
    
    const input: UpdateRoleInput = {
      id: selectedRole.id,
      role_name_bn: formData.role_name_bn.trim(),
      role_name_en: formData.role_name_en.trim() || undefined,
      description: formData.description.trim() || undefined,
      permissions: formData.permissions,
    };
    
    await updateRole(input);
    setIsEditModalOpen(false);
    setSelectedRole(null);
    resetForm();
  };

  const handleDeleteRole = async () => {
    if (!selectedRole) return;
    try {
      await deleteRole(selectedRole.id);
      setIsDeleteDialogOpen(false);
      setSelectedRole(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const openEditModal = (role: CustomRole) => {
    setSelectedRole(role);
    setFormData({
      role_name_bn: role.role_name_bn,
      role_name_en: role.role_name_en || '',
      description: role.description || '',
      permissions: role.permissions || [],
    });
    setIsEditModalOpen(true);
  };

  const openViewModal = (role: CustomRole) => {
    setSelectedRole(role);
    setIsViewModalOpen(true);
  };

  const openDeleteDialog = (role: CustomRole) => {
    setSelectedRole(role);
    setIsDeleteDialogOpen(true);
  };

  const getPermissionLabel = (permissionId: string) => {
    return AVAILABLE_PERMISSIONS.find(p => p.id === permissionId)?.label || permissionId;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">রোল ম্যানেজমেন্ট</h1>
          <p className="text-muted-foreground">মোট {roles.length} টি রোল</p>
        </div>
        <Button onClick={() => { resetForm(); setIsAddModalOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" />
          রোল তৈরি করুন
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="রোল নাম দিয়ে খুঁজুন..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Roles Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredRoles.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">কোনো রোল পাওয়া যায়নি</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredRoles.map((role) => (
            <Card key={role.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{role.role_name_bn}</CardTitle>
                      {role.role_name_en && (
                        <p className="text-sm text-muted-foreground">{role.role_name_en}</p>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openViewModal(role)}>
                        <Eye className="w-4 h-4 mr-2" />
                        দেখুন
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEditModal(role)}>
                        <Edit className="w-4 h-4 mr-2" />
                        এডিট করুন
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => openDeleteDialog(role)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        মুছে ফেলুন
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {role.description && (
                  <p className="text-sm text-muted-foreground">{role.description}</p>
                )}
                <div className="flex flex-wrap gap-1">
                  {role.permissions.slice(0, 3).map((permission) => (
                    <Badge key={permission} variant="secondary" className="text-xs">
                      {getPermissionLabel(permission)}
                    </Badge>
                  ))}
                  {role.permissions.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{role.permissions.length - 3} আরো
                    </Badge>
                  )}
                </div>
                <div className="pt-2 border-t">
                  <span className="text-xs text-muted-foreground">
                    তৈরি: {format(new Date(role.created_at), 'dd/MM/yyyy')}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Role Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-lg" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>নতুন রোল তৈরি করুন</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <div className="space-y-4 p-1">
              <div className="space-y-2">
                <Label>রোলের নাম (বাংলা) *</Label>
                <Input
                  value={formData.role_name_bn}
                  onChange={(e) => setFormData(prev => ({ ...prev, role_name_bn: e.target.value }))}
                  placeholder="যেমন: গ্রাফিক্স ডিজাইনার"
                />
              </div>
              <div className="space-y-2">
                <Label>রোলের নাম (ইংরেজি)</Label>
                <Input
                  value={formData.role_name_en}
                  onChange={(e) => setFormData(prev => ({ ...prev, role_name_en: e.target.value }))}
                  placeholder="e.g., graphics_designer"
                />
              </div>
              <div className="space-y-2">
                <Label>বিবরণ</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="এই রোলের কাজ কী..."
                  rows={2}
                />
              </div>
              <div className="space-y-3">
                <Label>পারমিশন নির্বাচন করুন</Label>
                <div className="grid gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                  {AVAILABLE_PERMISSIONS.map((permission) => (
                    <div key={permission.id} className="flex items-start gap-3">
                      <Checkbox
                        id={permission.id}
                        checked={formData.permissions.includes(permission.id)}
                        onCheckedChange={() => togglePermission(permission.id)}
                      />
                      <div className="grid gap-0.5">
                        <label htmlFor={permission.id} className="text-sm font-medium cursor-pointer">
                          {permission.label}
                        </label>
                        <p className="text-xs text-muted-foreground">{permission.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsAddModalOpen(false)} className="flex-1">
                  বাতিল
                </Button>
                <Button onClick={handleAddRole} disabled={isAdding} className="flex-1">
                  {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : 'সংরক্ষণ করুন'}
                </Button>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Edit Role Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-lg" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>রোল এডিট করুন</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <div className="space-y-4 p-1">
              <div className="space-y-2">
                <Label>রোলের নাম (বাংলা) *</Label>
                <Input
                  value={formData.role_name_bn}
                  onChange={(e) => setFormData(prev => ({ ...prev, role_name_bn: e.target.value }))}
                  placeholder="যেমন: গ্রাফিক্স ডিজাইনার"
                />
              </div>
              <div className="space-y-2">
                <Label>রোলের নাম (ইংরেজি)</Label>
                <Input
                  value={formData.role_name_en}
                  onChange={(e) => setFormData(prev => ({ ...prev, role_name_en: e.target.value }))}
                  placeholder="e.g., graphics_designer"
                />
              </div>
              <div className="space-y-2">
                <Label>বিবরণ</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="এই রোলের কাজ কী..."
                  rows={2}
                />
              </div>
              <div className="space-y-3">
                <Label>পারমিশন নির্বাচন করুন</Label>
                <div className="grid gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                  {AVAILABLE_PERMISSIONS.map((permission) => (
                    <div key={permission.id} className="flex items-start gap-3">
                      <Checkbox
                        id={`edit-${permission.id}`}
                        checked={formData.permissions.includes(permission.id)}
                        onCheckedChange={() => togglePermission(permission.id)}
                      />
                      <div className="grid gap-0.5">
                        <label htmlFor={`edit-${permission.id}`} className="text-sm font-medium cursor-pointer">
                          {permission.label}
                        </label>
                        <p className="text-xs text-muted-foreground">{permission.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)} className="flex-1">
                  বাতিল
                </Button>
                <Button onClick={handleEditRole} disabled={isUpdating} className="flex-1">
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'আপডেট করুন'}
                </Button>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* View Role Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>রোল বিস্তারিত</DialogTitle>
          </DialogHeader>
          {selectedRole && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{selectedRole.role_name_bn}</h3>
                  {selectedRole.role_name_en && (
                    <p className="text-muted-foreground">{selectedRole.role_name_en}</p>
                  )}
                </div>
              </div>
              {selectedRole.description && (
                <p className="text-sm text-muted-foreground">{selectedRole.description}</p>
              )}
              <div className="space-y-2 pt-4 border-t">
                <h4 className="font-medium">পারমিশন সমূহ:</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedRole.permissions.map((permission) => (
                    <Badge key={permission} variant="secondary">
                      {getPermissionLabel(permission)}
                    </Badge>
                  ))}
                  {selectedRole.permissions.length === 0 && (
                    <p className="text-sm text-muted-foreground">কোনো পারমিশন নেই</p>
                  )}
                </div>
              </div>
              <div className="pt-4 border-t text-sm text-muted-foreground">
                তৈরি: {format(new Date(selectedRole.created_at), 'dd/MM/yyyy')}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>রোল মুছে ফেলুন</AlertDialogTitle>
            <AlertDialogDescription>
              আপনি কি নিশ্চিত "{selectedRole?.role_name_bn}" রোলটি মুছে ফেলতে চান? এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>বাতিল</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRole} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'মুছে ফেলুন'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
