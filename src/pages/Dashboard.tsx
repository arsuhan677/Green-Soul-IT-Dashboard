import { motion, Variants } from 'framer-motion';
import {
  Users,
  Phone,
  FolderKanban,
  Banknote,
  TrendingUp,
  Clock,
  ArrowRight,
  Calendar,
  AlertCircle,
  FileText,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useLeads } from '@/hooks/useLeads';
import { useProjects } from '@/hooks/useProjects';
import { useClients } from '@/hooks/useClients';
import { useInvoices } from '@/hooks/useInvoices';
import { useServices } from '@/hooks/useServices';
import { useAuth } from '@/contexts/AuthContext';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
      damping: 15,
    },
  },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { leads, loading: leadsLoading } = useLeads();
  const { projects, loading: projectsLoading } = useProjects();
  const { clients, loading: clientsLoading } = useClients();
  const { invoices, loading: invoicesLoading } = useInvoices();
  const { services } = useServices();

  const isLoading = leadsLoading || projectsLoading || clientsLoading || invoicesLoading;

  // Calculate KPIs from real data
  const totalLeads = leads.length;
  const todayFollowUps = leads.filter(
    (lead) => lead.next_follow_up_at && new Date(lead.next_follow_up_at).toDateString() === new Date().toDateString()
  ).length;
  const ongoingProjects = projects.filter((p) => p.status === 'চলমান').length;
  const monthlyRevenue = invoices
    .filter((inv) => inv.status === 'পরিশোধিত')
    .reduce((sum, inv) => sum + Number(inv.total), 0);

  const overdueFollowUps = leads.filter(
    (lead) => lead.next_follow_up_at && new Date(lead.next_follow_up_at) < new Date()
  );

  const kpiCards = [
    {
      title: 'মোট লিড',
      value: totalLeads.toString(),
      icon: Users,
      gradient: 'kpi-card-primary',
    },
    {
      title: 'আজকের ফলোআপ',
      value: todayFollowUps.toString(),
      subtitle: 'নির্ধারিত',
      icon: Phone,
      gradient: 'kpi-card-accent',
    },
    {
      title: 'চলমান প্রজেক্ট',
      value: ongoingProjects.toString(),
      icon: FolderKanban,
      gradient: 'kpi-card-success',
    },
    {
      title: 'মাসিক আয়',
      value: `৳${monthlyRevenue.toLocaleString('bn-BD')}`,
      icon: Banknote,
      gradient: 'kpi-card-warning',
    },
  ];

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
    if (!serviceId) return 'নির্ধারিত নয়';
    return services.find((s) => s.id === serviceId)?.name || 'অজানা সার্ভিস';
  };

  const getClientName = (clientId: string | null) => {
    if (!clientId) return 'নির্ধারিত নয়';
    return clients.find((c) => c.id === clientId)?.name || 'অজানা ক্লায়েন্ট';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Welcome Section */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            স্বাগতম, {profile?.name || 'ব্যবহারকারী'}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            আজকের কার্যক্রম এক নজরে দেখুন
          </p>
        </div>
        <Button onClick={() => navigate('/leads')} className="btn-primary">
          নতুন লিড যোগ করুন
          <ArrowRight className="w-4 h-4" />
        </Button>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => (
          <motion.div
            key={kpi.title}
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            className={kpi.gradient}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm opacity-90">{kpi.title}</p>
                <p className="text-3xl font-bold mt-2">{kpi.value}</p>
                {kpi.subtitle && (
                  <p className="text-sm mt-2 opacity-90">{kpi.subtitle}</p>
                )}
              </div>
              <div className="p-3 rounded-xl bg-white/20">
                <kpi.icon className="w-6 h-6" />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Leads */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">সাম্প্রতিক লিড</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/leads')}>
                সব দেখুন
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              {leads.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>কোনো লিড নেই</p>
                  <Button variant="link" onClick={() => navigate('/leads')} className="mt-2">
                    নতুন লিড যোগ করুন
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>নাম</th>
                        <th>সার্ভিস</th>
                        <th>সোর্স</th>
                        <th>স্ট্যাটাস</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leads.slice(0, 5).map((lead) => (
                        <tr key={lead.id} className="cursor-pointer" onClick={() => navigate('/leads')}>
                          <td>
                            <div>
                              <p className="font-medium text-foreground">{lead.name}</p>
                              <p className="text-xs text-muted-foreground">{lead.phone}</p>
                            </div>
                          </td>
                          <td className="text-muted-foreground">{getServiceName(lead.service_id)}</td>
                          <td className="text-muted-foreground">{lead.source}</td>
                          <td>
                            <span className={getStatusBadgeClass(lead.status)}>{lead.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Today's Follow-ups */}
        <motion.div variants={itemVariants}>
          <Card className="card-hover h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                আজকের ফলোআপ
              </CardTitle>
              {overdueFollowUps.length > 0 && (
                <span className="flex items-center gap-1 text-xs text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  {overdueFollowUps.length} বিলম্বিত
                </span>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {leads.filter((lead) => lead.next_follow_up_at).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>আজকে কোনো ফলোআপ নেই</p>
                </div>
              ) : (
                leads
                  .filter((lead) => lead.next_follow_up_at)
                  .slice(0, 4)
                  .map((lead) => {
                    const isOverdue = lead.next_follow_up_at && new Date(lead.next_follow_up_at) < new Date();
                    return (
                      <div
                        key={lead.id}
                        className={`p-3 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50 ${
                          isOverdue ? 'border-destructive/30 bg-destructive/5' : 'border-border'
                        }`}
                        onClick={() => navigate('/leads')}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-foreground">{lead.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">{lead.phone}</p>
                          </div>
                          <span className={getStatusBadgeClass(lead.status)}>{lead.status}</span>
                        </div>
                        {lead.next_follow_up_at && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {new Date(lead.next_follow_up_at).toLocaleDateString('bn-BD')}
                          </div>
                        )}
                      </div>
                    );
                  })
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Projects and Revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ongoing Projects */}
        <motion.div variants={itemVariants}>
          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">চলমান প্রজেক্ট</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/projects')}>
                সব দেখুন
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {projects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FolderKanban className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>কোনো প্রজেক্ট নেই</p>
                  <Button variant="link" onClick={() => navigate('/projects')} className="mt-2">
                    নতুন প্রজেক্ট যোগ করুন
                  </Button>
                </div>
              ) : (
                projects.slice(0, 3).map((project) => (
                  <div
                    key={project.id}
                    className="p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => navigate('/projects')}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium text-foreground">{project.title}</p>
                        <p className="text-sm text-muted-foreground">{getClientName(project.client_id)}</p>
                      </div>
                      <span
                        className={`status-badge ${
                          project.status === 'চলমান'
                            ? 'bg-info/15 text-info'
                            : project.status === 'রিভিউ'
                            ? 'bg-warning/15 text-warning'
                            : project.status === 'সম্পন্ন'
                            ? 'bg-success/15 text-success'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {project.status}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">অগ্রগতি</span>
                        <span className="font-medium text-foreground">{project.progress}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${project.progress}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Invoices */}
        <motion.div variants={itemVariants}>
          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">সাম্প্রতিক ইনভয়েস</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/invoices')}>
                সব দেখুন
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {invoices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>কোনো ইনভয়েস নেই</p>
                  <Button variant="link" onClick={() => navigate('/invoices')} className="mt-2">
                    নতুন ইনভয়েস তৈরি করুন
                  </Button>
                </div>
              ) : (
                invoices.slice(0, 4).map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => navigate('/invoices')}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{invoice.invoice_number}</p>
                        <p className="text-sm text-muted-foreground">{getClientName(invoice.client_id)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">৳{Number(invoice.total).toLocaleString('bn-BD')}</p>
                      <span
                        className={`status-badge mt-1 ${
                          invoice.status === 'পরিশোধিত'
                            ? 'bg-success/15 text-success'
                            : invoice.status === 'বকেয়া'
                            ? 'bg-destructive/15 text-destructive'
                            : 'bg-warning/15 text-warning'
                        }`}
                      >
                        {invoice.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
