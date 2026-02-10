import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, User, Save, Loader2, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions, PERMISSION_LABELS, PermissionKey, UserPermissions } from '@/hooks/usePermissions';
import { useUsers } from '@/hooks/useUsers';
import { useActivityLog } from '@/hooks/useActivityLog';
import { Navigate } from 'react-router-dom';

interface PermissionEditorProps {
  userId: string;
  userName: string;
  userEmail: string;
  currentPermissions: UserPermissions | null;
  onSave: (userId: string, permissions: Partial<Record<PermissionKey, boolean>>) => Promise<boolean>;
  onClose: () => void;
}

function PermissionEditor({ userId, userName, userEmail, currentPermissions, onSave, onClose }: PermissionEditorProps) {
  const [permissions, setPermissions] = useState<Record<PermissionKey, boolean>>({
    can_view_dashboard: currentPermissions?.can_view_dashboard ?? true,
    can_manage_leads: currentPermissions?.can_manage_leads ?? false,
    can_manage_clients: currentPermissions?.can_manage_clients ?? false,
    can_manage_projects: currentPermissions?.can_manage_projects ?? false,
    can_manage_tasks: currentPermissions?.can_manage_tasks ?? false,
    can_manage_services: currentPermissions?.can_manage_services ?? false,
    can_manage_invoices: currentPermissions?.can_manage_invoices ?? false,
    can_manage_payments: currentPermissions?.can_manage_payments ?? false,
    can_manage_users: currentPermissions?.can_manage_users ?? false,
    can_manage_roles: currentPermissions?.can_manage_roles ?? false,
    can_delete_records: currentPermissions?.can_delete_records ?? false,
  });
  const [saving, setSaving] = useState(false);
  const { logActivity } = useActivityLog();

  const handleSave = async () => {
    setSaving(true);
    const success = await onSave(userId, permissions);
    if (success) {
      await logActivity({
        action: 'update',
        module: 'permissions',
        recordId: userId,
        recordTitle: userName,
        details: `${userName} এর পারমিশন আপডেট করা হয়েছে`,
      });
      onClose();
    }
    setSaving(false);
  };

  const togglePermission = (key: PermissionKey) => {
    setPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            পারমিশন সম্পাদনা
          </CardTitle>
          <div className="mt-2">
            <p className="font-medium">{userName}</p>
            <p className="text-sm text-muted-foreground">{userEmail}</p>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {(Object.keys(PERMISSION_LABELS) as PermissionKey[]).map((key) => (
            <div key={key} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <span className="text-sm font-medium">{PERMISSION_LABELS[key]}</span>
              <Switch
                checked={permissions[key]}
                onCheckedChange={() => togglePermission(key)}
              />
            </div>
          ))}
          
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              বাতিল
            </Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  সংরক্ষণ হচ্ছে...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  সংরক্ষণ করুন
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Permissions() {
  const { hasRole } = useAuth();
  const { allPermissions, updatePermissions, fetchAllPermissions } = usePermissions();
  const { users, isLoading: usersLoading } = useUsers();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<{
    userId: string;
    userName: string;
    userEmail: string;
    permissions: UserPermissions | null;
  } | null>(null);

  // Check if user is admin
  if (!hasRole('admin')) {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    fetchAllPermissions();
  }, []);

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getUserPermissions = (userId: string): UserPermissions | null => {
    return allPermissions.find(p => p.user_id === userId) || null;
  };

  const getPermissionCount = (userId: string): number => {
    const perms = getUserPermissions(userId);
    if (!perms) return 0;
    
    const keys: PermissionKey[] = [
      'can_manage_leads', 'can_manage_clients', 'can_manage_projects',
      'can_manage_tasks', 'can_manage_services', 'can_manage_invoices',
      'can_manage_payments', 'can_manage_users', 'can_manage_roles', 'can_delete_records'
    ];
    
    return keys.filter(key => perms[key]).length;
  };

  const handleEditClick = (user: { id: string; user_id: string; name: string; email: string }) => {
    setEditingUser({
      userId: user.user_id,
      userName: user.name,
      userEmail: user.email,
      permissions: getUserPermissions(user.user_id),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">পারমিশন ম্যানেজমেন্ট</h1>
          <p className="text-muted-foreground mt-1">ব্যবহারকারীদের অনুমতি নিয়ন্ত্রণ করুন</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="নাম বা ইমেইল দিয়ে খুঁজুন..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {usersLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredUsers.map((user) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card 
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => handleEditClick(user)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getPermissionCount(user.user_id) > 0 ? "default" : "secondary"}>
                        {getPermissionCount(user.user_id)} অনুমতি
                      </Badge>
                      <Badge variant={user.active ? "outline" : "destructive"}>
                        {user.active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {filteredUsers.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              কোনো ব্যবহারকারী পাওয়া যায়নি
            </div>
          )}
        </div>
      )}

      {editingUser && (
        <PermissionEditor
          userId={editingUser.userId}
          userName={editingUser.userName}
          userEmail={editingUser.userEmail}
          currentPermissions={editingUser.permissions}
          onSave={updatePermissions}
          onClose={() => setEditingUser(null)}
        />
      )}
    </div>
  );
}
