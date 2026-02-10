import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Loader2,
  Building,
  Package,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useProjects, Project } from '@/hooks/useProjects';
import { useClients } from '@/hooks/useClients';
import { useServices } from '@/hooks/useServices';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { ProjectNotesTimeline } from '@/components/projects/ProjectNotesTimeline';
import { ProjectFormModal } from '@/components/projects/ProjectFormModal';

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const { isAdmin } = usePermissions();
  const { projects, loading, updateProject } = useProjects();
  const { clients } = useClients();
  const { services } = useServices();

  const [project, setProject] = useState<Project | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const isAdminUser = hasRole('admin');

  useEffect(() => {
    if (!loading && projects.length > 0 && projectId) {
      const found = projects.find((p) => p.id === projectId);
      setProject(found || null);
    }
  }, [loading, projects, projectId]);

  const getClientName = (clientId: string | null) => {
    if (!clientId) return 'অজানা ক্লায়েন্ট';
    return clients.find((c) => c.id === clientId)?.name || 'অজানা ক্লায়েন্ট';
  };

  const getServiceName = (serviceId: string | null) => {
    if (!serviceId) return 'সার্ভিস নির্বাচিত হয়নি';
    const service = services.find((s) => s.id === serviceId);
    return service?.name || 'সার্ভিস পাওয়া যায়নি';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'চলমান':
        return 'bg-info/15 text-info';
      case 'রিভিউ':
        return 'bg-warning/15 text-warning';
      case 'সম্পন্ন':
        return 'bg-success/15 text-success';
      case 'হোল্ড':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'চলমান':
        return <Clock className="w-4 h-4" />;
      case 'রিভিউ':
        return <AlertCircle className="w-4 h-4" />;
      case 'সম্পন্ন':
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const handleEditProject = async (data: {
    title: string;
    client_id: string;
    service_id?: string;
    budget: number;
    start_date?: string;
    deadline?: string;
    status: string;
    progress: number;
  }) => {
    if (!project) return false;
    const success = await updateProject(project.id, data);
    return success;
  };

  // Check if user can add notes (admin or assigned to project)
  const canAddNotes = () => {
    if (isAdminUser) return true;
    if (!project || !user) return false;
    if (project.user_id === user.id) return true;
    if (project.assigned_team?.includes(user.id)) return true;
    return false;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-xl font-semibold mb-2">প্রজেক্ট পাওয়া যায়নি</h2>
        <p className="text-muted-foreground mb-4">এই প্রজেক্টটি হয়তো মুছে ফেলা হয়েছে বা আপনার অ্যাক্সেস নেই।</p>
        <Button onClick={() => navigate('/projects')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          প্রজেক্ট লিস্টে ফিরে যান
        </Button>
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
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/projects')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{project.title}</h1>
            <p className="text-muted-foreground">{getClientName(project.client_id)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`status-badge flex items-center gap-1 ${getStatusColor(project.status)}`}>
            {getStatusIcon(project.status)}
            {project.status}
          </span>
          {(isAdmin || isAdminUser) && (
            <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)}>
              <Edit2 className="w-4 h-4 mr-1" />
              এডিট করুন
            </Button>
          )}
        </div>
      </div>

      {/* Project Info */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>প্রজেক্ট বিবরণ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  ক্লায়েন্ট
                </p>
                <p className="font-medium">{getClientName(project.client_id)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  সার্ভিস
                </p>
                <p className="font-medium">{getServiceName(project.service_id)}</p>
              </div>
              {(isAdmin || isAdminUser) && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">বাজেট</p>
                  <p className="font-medium">৳{project.budget.toLocaleString('bn-BD')}</p>
                </div>
              )}
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  শুরুর তারিখ
                </p>
                <p className="font-medium">
                  {project.start_date
                    ? new Date(project.start_date).toLocaleDateString('bn-BD')
                    : 'সেট করা হয়নি'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  ডেডলাইন
                </p>
                <p className="font-medium">
                  {project.deadline
                    ? new Date(project.deadline).toLocaleDateString('bn-BD')
                    : 'সেট করা হয়নি'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  টিম মেম্বার
                </p>
                <p className="font-medium">
                  {project.assigned_team?.length || 0} জন
                </p>
              </div>
            </div>

            {/* Progress */}
            <div className="mt-6 pt-4 border-t">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">অগ্রগতি</p>
                <p className="text-sm font-medium">{project.progress}%</p>
              </div>
              <Progress value={project.progress} className="h-3" />
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>স্ট্যাটাস</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={`p-4 rounded-lg text-center ${getStatusColor(project.status)}`}
            >
              <div className="flex items-center justify-center gap-2 text-lg font-semibold">
                {getStatusIcon(project.status)}
                {project.status}
              </div>
            </div>
            {project.deadline && (
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">বাকি সময়</p>
                <p className="text-lg font-semibold">
                  {(() => {
                    const days = Math.ceil(
                      (new Date(project.deadline).getTime() - new Date().getTime()) /
                        (1000 * 60 * 60 * 24)
                    );
                    if (days < 0) return 'ডেডলাইন পার হয়ে গেছে';
                    if (days === 0) return 'আজই ডেডলাইন';
                    return `${days} দিন`;
                  })()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Project Notes Timeline */}
      <ProjectNotesTimeline projectId={project.id} canAddNotes={canAddNotes()} />

      {/* Edit Modal */}
      <ProjectFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditProject}
        clients={clients}
        project={project}
        isEdit
      />
    </motion.div>
  );
}
