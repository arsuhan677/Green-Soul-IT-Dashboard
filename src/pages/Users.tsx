import { useState } from 'react';
import { Plus, Search, MoreHorizontal, Edit, Trash2, Eye, UserCheck, UserX, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUsers, UserProfile, CreateUserInput, UpdateUserInput } from '@/hooks/useUsers';
import { useCustomRoles } from '@/hooks/useCustomRoles';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

export default function Users() {
  const { users, isLoading, createUser, updateUser, deleteUser, toggleUserActive, isCreating, isUpdating, isDeleting } = useUsers();
  const { roles } = useCustomRoles();
  const { hasRole } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    password: string;
    phone: string;
    custom_role_id: string;
    active: boolean;
  }>({
    name: '',
    email: '',
    password: '',
    phone: '',
    custom_role_id: '',
    active: true,
  });

  const isAdmin = hasRole('admin');

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">এই পেজ দেখার অনুমতি নেই</p>
      </div>
    );
  }

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      custom_role_id: '',
      active: true,
    });
  };

  const handleAddUser = async () => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) return;
    
    const input: CreateUserInput = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      password: formData.password,
      phone: formData.phone.trim() || undefined,
      custom_role_id: formData.custom_role_id || undefined,
      active: formData.active,
    };
    
    await createUser(input);
    setIsAddModalOpen(false);
    resetForm();
  };

  const handleEditUser = async () => {
    if (!selectedUser || !formData.name.trim()) return;
    
    const input: UpdateUserInput = {
      id: selectedUser.id,
      name: formData.name.trim(),
      phone: formData.phone.trim() || undefined,
      custom_role_id: formData.custom_role_id || undefined,
      active: formData.active,
    };
    
    await updateUser(input);
    setIsEditModalOpen(false);
    setSelectedUser(null);
    resetForm();
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    await deleteUser(selectedUser.id);
    setIsDeleteDialogOpen(false);
    setSelectedUser(null);
  };

  const openEditModal = (user: UserProfile) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      phone: user.phone || '',
      custom_role_id: user.custom_role_id || '',
      active: user.active,
    });
    setIsEditModalOpen(true);
  };

  const openViewModal = (user: UserProfile) => {
    setSelectedUser(user);
    setIsViewModalOpen(true);
  };

  const openDeleteDialog = (user: UserProfile) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">ইউজার ম্যানেজমেন্ট</h1>
          <p className="text-muted-foreground">মোট {users.length} জন ইউজার</p>
        </div>
        <Button onClick={() => { resetForm(); setIsAddModalOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" />
          ইউজার যোগ করুন
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="নাম বা ইমেইল দিয়ে খুঁজুন..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Users Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">কোনো ইউজার পাওয়া যায়নি</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <CardTitle className="text-base">{user.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openViewModal(user)}>
                        <Eye className="w-4 h-4 mr-2" />
                        দেখুন
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEditModal(user)}>
                        <Edit className="w-4 h-4 mr-2" />
                        এডিট করুন
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => openDeleteDialog(user)}
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
                <div className="flex items-center justify-between">
                  <Badge variant={user.active ? "default" : "secondary"}>
                    {user.active ? (
                      <><UserCheck className="w-3 h-3 mr-1" /> সক্রিয়</>
                    ) : (
                      <><UserX className="w-3 h-3 mr-1" /> নিষ্ক্রিয়</>
                    )}
                  </Badge>
                  {user.custom_roles && (
                    <Badge variant="outline">{user.custom_roles.role_name_bn}</Badge>
                  )}
                </div>
                {user.phone && (
                  <p className="text-sm text-muted-foreground">📞 {user.phone}</p>
                )}
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-xs text-muted-foreground">
                    যোগদান: {format(new Date(user.created_at), 'dd/MM/yyyy')}
                  </span>
                  <Switch
                    checked={user.active}
                    onCheckedChange={(checked) => toggleUserActive({ id: user.id, active: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add User Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>নতুন ইউজার যোগ করুন</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <div className="space-y-4 p-1">
              <div className="space-y-2">
                <Label>নাম *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="পুরো নাম লিখুন"
                />
              </div>
              <div className="space-y-2">
                <Label>ইমেইল *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="ইমেইল এড্রেস"
                />
              </div>
              <div className="space-y-2">
                <Label>পাসওয়ার্ড *</Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)"
                />
              </div>
              <div className="space-y-2">
                <Label>ফোন নম্বর</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="ফোন নম্বর (ঐচ্ছিক)"
                />
              </div>
              <div className="space-y-2">
                <Label>রোল নির্বাচন করুন</Label>
                <Select
                  value={formData.custom_role_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, custom_role_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="রোল নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.role_name_bn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label>সক্রিয় স্ট্যাটাস</Label>
                <Switch
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsAddModalOpen(false)} className="flex-1">
                  বাতিল
                </Button>
                <Button onClick={handleAddUser} disabled={isCreating} className="flex-1">
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'সংরক্ষণ করুন'}
                </Button>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>ইউজার এডিট করুন</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <div className="space-y-4 p-1">
              <div className="space-y-2">
                <Label>নাম *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="পুরো নাম লিখুন"
                />
              </div>
              <div className="space-y-2">
                <Label>ইমেইল</Label>
                <Input
                  type="email"
                  value={formData.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">ইমেইল পরিবর্তন করা যায় না</p>
              </div>
              <div className="space-y-2">
                <Label>ফোন নম্বর</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="ফোন নম্বর (ঐচ্ছিক)"
                />
              </div>
              <div className="space-y-2">
                <Label>রোল নির্বাচন করুন</Label>
                <Select
                  value={formData.custom_role_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, custom_role_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="রোল নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.role_name_bn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label>সক্রিয় স্ট্যাটাস</Label>
                <Switch
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)} className="flex-1">
                  বাতিল
                </Button>
                <Button onClick={handleEditUser} disabled={isUpdating} className="flex-1">
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'আপডেট করুন'}
                </Button>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* View User Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>ইউজার বিস্তারিত</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-2xl">
                  {selectedUser.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{selectedUser.name}</h3>
                  <p className="text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>
              <div className="grid gap-3 pt-4 border-t">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ফোন:</span>
                  <span>{selectedUser.phone || 'নেই'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">রোল:</span>
                  <span>{selectedUser.custom_roles?.role_name_bn || 'নির্ধারিত নয়'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">স্ট্যাটাস:</span>
                  <Badge variant={selectedUser.active ? "default" : "secondary"}>
                    {selectedUser.active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">যোগদান:</span>
                  <span>{format(new Date(selectedUser.created_at), 'dd/MM/yyyy')}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ইউজার মুছে ফেলুন</AlertDialogTitle>
            <AlertDialogDescription>
              আপনি কি নিশ্চিত "{selectedUser?.name}" ইউজারকে মুছে ফেলতে চান? এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>বাতিল</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'মুছে ফেলুন'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
