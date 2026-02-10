import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  MoreVertical,
  Eye,
  Edit2,
  Trash2,
  Loader2,
  FileText,
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
  DialogDescription,
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
import { Progress } from '@/components/ui/progress';
import { useProjects, Project } from '@/hooks/useProjects';
import { useClients } from '@/hooks/useClients';
import { useServices } from '@/hooks/useServices';
import { ProjectFormModal } from '@/components/projects/ProjectFormModal';

const projectStatuses = ['চলমান', 'রিভিউ', 'সম্পন্ন', 'হোল্ড'] as const;

function ProjectsContent() {
  const navigate = useNavigate();
  const { canDelete, isAdmin } = usePermissions();
  const { 
    projects, 
    loading, 
    addProject, 
    updateProject, 
    deleteProject 
  } = useProjects();
  const { clients } = useClients();
  const { services } = useServices();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getClientName = (clientId: string | null) => {
    if (!clientId) return 'অজানা ক্লায়েন্ট';
    return clients.find((c) => c.id === clientId)?.name || 'অজানা ক্লায়েন্ট';
  };

  const getServiceName = (serviceId: string | null) => {
    if (!serviceId) return 'সার্ভিস নির্বাচিত হয়নি';
    const service = services.find((s) => s.id === serviceId);
    return service?.name || 'সার্ভিস পাওয়া যায়নি';
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

  const getDaysRemaining = (deadline: string | null) => {
    if (!deadline) return null;
    const today = new Date();
    const diff = new Date(deadline).getTime() - today.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  // Handle add project
  const handleAddProject = async (data: {
    title: string;
    client_id: string;
    service_id?: string;
    budget: number;
    start_date?: string;
    deadline?: string;
    status: string;
    progress: number;
  }) => {
    const success = await addProject({
      title: data.title,
      client_id: data.client_id,
      service_id: data.service_id,
      budget: data.budget,
      start_date: data.start_date,
      deadline: data.deadline,
      status: data.status,
      progress: data.progress,
    });
    return success;
  };

  // Handle view project
  const handleViewProject = (project: Project) => {
    setSelectedProject(project);
    setIsViewModalOpen(true);
  };

  // Handle edit project
  const handleOpenEdit = (project: Project) => {
    setSelectedProject(project);
    setIsEditModalOpen(true);
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
    if (!selectedProject) return false;
    const success = await updateProject(selectedProject.id, data);
    if (success) {
      setSelectedProject(null);
    }
    return success;
  };

  // Handle delete project (soft delete)
  const handleOpenDelete = (project: Project) => {
    setSelectedProject(project);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteProject = async () => {
    if (!selectedProject) return;

    setIsSubmitting(true);
    const success = await deleteProject(selectedProject.id);
    
    if (success) {
      setIsDeleteModalOpen(false);
      setSelectedProject(null);
    }
    setIsSubmitting(false);
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
          <h1 className="page-title">প্রজেক্ট ম্যানেজমেন্ট</h1>
          <p className="text-muted-foreground mt-1">সকল প্রজেক্ট ও টাস্ক পরিচালনা করুন</p>
        </div>
        <Button className="btn-primary" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="w-4 h-4" />
          নতুন প্রজেক্ট তৈরি করুন
        </Button>
      </div>

      {/* Add Project Modal */}
      <ProjectFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddProject}
        clients={clients}
      />

      {/* Edit Project Modal */}
      <ProjectFormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedProject(null);
        }}
        onSubmit={handleEditProject}
        clients={clients}
        project={selectedProject}
        isEdit
      />

      {/* View Project Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-lg">
          {selectedProject && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedProject.title}</DialogTitle>
                <DialogDescription>প্রজেক্টের বিস্তারিত তথ্য</DialogDescription>
              </DialogHeader>
              <div className="mt-4 space-y-4">
                <div className={`grid gap-4 p-4 bg-muted/30 rounded-lg ${isAdmin ? 'grid-cols-2' : 'grid-cols-2'}`}>
                  <div>
                    <p className="text-sm text-muted-foreground">ক্লায়েন্ট</p>
                    <p className="font-medium">{getClientName(selectedProject.client_id)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">সার্ভিস</p>
                    <p className="font-medium">{getServiceName(selectedProject.service_id)}</p>
                  </div>
                  {isAdmin && (
                    <div>
                      <p className="text-sm text-muted-foreground">বাজেট</p>
                      <p className="font-medium">৳{selectedProject.budget.toLocaleString('bn-BD')}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">স্ট্যাটাস</p>
                    <span className={`status-badge ${getStatusColor(selectedProject.status)}`}>
                      {selectedProject.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">শুরুর তারিখ</p>
                    <p className="font-medium">
                      {selectedProject.start_date 
                        ? new Date(selectedProject.start_date).toLocaleDateString('bn-BD')
                        : 'সেট করা হয়নি'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ডেডলাইন</p>
                    <p className="font-medium">
                      {selectedProject.deadline 
                        ? new Date(selectedProject.deadline).toLocaleDateString('bn-BD')
                        : 'সেট করা হয়নি'}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">অগ্রগতি</p>
                  <Progress value={selectedProject.progress} className="h-3" />
                  <p className="text-right text-sm mt-1">{selectedProject.progress}%</p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Project Confirmation */}
      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>প্রজেক্ট আর্কাইভ করবেন?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedProject && (
                <>
                  <strong>{selectedProject.title}</strong> আর্কাইভ করতে চান?
                  <br />
                  প্রজেক্টের সাথে সম্পর্কিত টাস্ক ও ফাইল আর্কাইভ হিসেবে সংরক্ষিত থাকবে।
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>বাতিল করুন</AlertDialogCancel>
            <AlertDialogAction className="btn-danger" onClick={handleDeleteProject} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Trash2 className="w-4 h-4 mr-1" />
              হ্যাঁ, আর্কাইভ করুন
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="প্রজেক্ট নাম দিয়ে খুঁজুন..."
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
                {projectStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProjects.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            কোনো প্রজেক্ট পাওয়া যায়নি
          </div>
        ) : (
          filteredProjects.map((project, index) => {
            const daysRemaining = getDaysRemaining(project.deadline);
            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-foreground line-clamp-1">{project.title}</h3>
                        <p className="text-sm text-muted-foreground">{getClientName(project.client_id)}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewProject(project)}>
                            <Eye className="w-4 h-4 mr-2" />
                            বিস্তারিত দেখুন
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/projects/${project.id}`)}>
                            <FileText className="w-4 h-4 mr-2" />
                            নোট ও আপডেট
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenEdit(project)}>
                            <Edit2 className="w-4 h-4 mr-2" />
                            এডিট করুন
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleOpenDelete(project)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            আর্কাইভ করুন
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <span className={`status-badge flex items-center gap-1 ${getStatusColor(project.status)}`}>
                        {getStatusIcon(project.status)}
                        {project.status}
                      </span>
                      {daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 7 && (
                        <span className="text-xs text-warning">
                          {daysRemaining} দিন বাকি
                        </span>
                      )}
                    </div>

                    <div className="mb-3">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">অগ্রগতি</span>
                        <span className="font-medium">{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} className="h-2" />
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground pt-3 border-t border-border">
                      {isAdmin ? (
                        <span>বাজেট: ৳{project.budget.toLocaleString('bn-BD')}</span>
                      ) : (
                        <span></span>
                      )}
                      {project.deadline && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(project.deadline).toLocaleDateString('bn-BD')}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {projectStatuses.map((status) => {
          const count = projects.filter((p) => p.status === status).length;
          return (
            <Card key={status} className="p-4">
              <div className="flex items-center justify-between">
                <span className={`status-badge ${getStatusColor(status)}`}>{status}</span>
                <span className="text-2xl font-bold text-foreground">{count}</span>
              </div>
            </Card>
          );
        })}
      </div>
    </motion.div>
  );
}

export default function ProjectsPage() {
  return (
    <PermissionGate permission="can_manage_projects">
      <ProjectsContent />
    </PermissionGate>
  );
}
