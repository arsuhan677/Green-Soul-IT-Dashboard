import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useClientPortal } from '@/hooks/useClientPortal';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Loader2, FolderKanban, Calendar, LogOut, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';

const statusColors: Record<string, string> = {
  'চলমান': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  'সম্পন্ন': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  'বিলম্বিত': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  'স্থগিত': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
};

export default function ClientProjects() {
  const { client, logout } = useClientAuth();
  const { projects, loading, error, fetchProjects } = useClientPortal();

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">আমার প্রজেক্ট</h1>
            <p className="text-sm text-muted-foreground">
              স্বাগতম, {client?.name} ({client?.client_code})
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            লগআউট
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">লোড হচ্ছে...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive">{error}</p>
            <Button variant="outline" className="mt-4" onClick={fetchProjects}>
              আবার চেষ্টা করুন
            </Button>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12">
            <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">কোনো প্রজেক্ট নেই</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Link key={project.id} to={`/client-portal/project/${project.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg line-clamp-2">{project.title}</CardTitle>
                      <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={statusColors[project.status] || 'bg-gray-100 text-gray-800'}
                    >
                      {project.status}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    {project.services && (
                      <p className="text-sm text-muted-foreground mb-3">
                        সার্ভিস: {project.services.name}
                      </p>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>অগ্রগতি</span>
                        <span className="font-medium">{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} className="h-2" />
                    </div>

                    {project.deadline && (
                      <div className="flex items-center mt-3 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-1" />
                        ডেডলাইন: {format(new Date(project.deadline), 'dd MMMM, yyyy', { locale: bn })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
