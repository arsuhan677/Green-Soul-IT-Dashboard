import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { History, Filter, Search, User, Calendar, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useActivityLog, MODULE_LABELS, ACTION_LABELS, ModuleType, ActivityLog } from '@/hooks/useActivityLog';
import { useUsers } from '@/hooks/useUsers';
import { Navigate } from 'react-router-dom';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';

export default function ActivityLogs() {
  const { hasRole } = useAuth();
  const { logs, loading, fetchLogs } = useActivityLog();
  const { users } = useUsers();
  const [moduleFilter, setModuleFilter] = useState<ModuleType | 'all'>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Check if user is admin
  if (!hasRole('admin')) {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    const filters: any = {};
    if (moduleFilter !== 'all') {
      filters.module = moduleFilter;
    }
    if (userFilter !== 'all') {
      filters.userId = userFilter;
    }
    fetchLogs(filters);
  }, [moduleFilter, userFilter]);

  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      log.record_title?.toLowerCase().includes(searchLower) ||
      log.performed_by_name?.toLowerCase().includes(searchLower) ||
      log.details?.toLowerCase().includes(searchLower)
    );
  });

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'update': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'delete': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getModuleColor = (module: string) => {
    const colors: Record<string, string> = {
      leads: 'bg-purple-500/10 text-purple-500',
      clients: 'bg-blue-500/10 text-blue-500',
      projects: 'bg-orange-500/10 text-orange-500',
      tasks: 'bg-yellow-500/10 text-yellow-500',
      services: 'bg-teal-500/10 text-teal-500',
      invoices: 'bg-green-500/10 text-green-500',
      payments: 'bg-emerald-500/10 text-emerald-500',
      users: 'bg-indigo-500/10 text-indigo-500',
      roles: 'bg-pink-500/10 text-pink-500',
      permissions: 'bg-cyan-500/10 text-cyan-500',
    };
    return colors[module] || 'bg-gray-500/10 text-gray-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <History className="w-6 h-6 text-primary" />
            কার্যকলাপ লগ
          </h1>
          <p className="text-muted-foreground mt-1">সকল ব্যবহারকারীর কার্যকলাপের রেকর্ড</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-4 h-4" />
            ফিল্টার
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="খুঁজুন..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={moduleFilter} onValueChange={(v) => setModuleFilter(v as ModuleType | 'all')}>
              <SelectTrigger>
                <SelectValue placeholder="মডিউল নির্বাচন করুন" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সকল মডিউল</SelectItem>
                {(Object.keys(MODULE_LABELS) as ModuleType[]).map((module) => (
                  <SelectItem key={module} value={module}>
                    {MODULE_LABELS[module]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger>
                <SelectValue placeholder="ব্যবহারকারী নির্বাচন করুন" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সকল ব্যবহারকারী</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.user_id} value={user.user_id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Activity List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log, index) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <Card className="hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-foreground">
                            {log.performed_by_name || 'অজানা'}
                          </span>
                          <Badge className={getActionColor(log.action)} variant="outline">
                            {ACTION_LABELS[log.action as keyof typeof ACTION_LABELS]}
                          </Badge>
                          <Badge className={getModuleColor(log.module)}>
                            {MODULE_LABELS[log.module as keyof typeof MODULE_LABELS]}
                          </Badge>
                        </div>
                        {log.record_title && (
                          <p className="text-sm text-muted-foreground mt-1">
                            রেকর্ড: <span className="font-medium">{log.record_title}</span>
                          </p>
                        )}
                        {log.details && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {log.details}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {format(new Date(log.performed_at), "d MMMM yyyy, h:mm a", { locale: bn })}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {filteredLogs.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              কোনো কার্যকলাপ পাওয়া যায়নি
            </div>
          )}
        </div>
      )}
    </div>
  );
}
