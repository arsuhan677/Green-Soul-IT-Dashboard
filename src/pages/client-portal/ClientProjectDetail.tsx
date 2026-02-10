import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useClientPortal } from '@/hooks/useClientPortal';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Loader2, ArrowLeft, Calendar, Plus, Trash2, LogOut, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

const statusColors: Record<string, string> = {
  'চলমান': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  'সম্পন্ন': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  'বিলম্বিত': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  'স্থগিত': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
};

export default function ClientProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const { client, logout } = useClientAuth();
  const { projectDetail, loading, error, fetchProjectDetail, addNote, deleteNote } = useClientPortal();
  const { toast } = useToast();

  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteDate, setNoteDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (projectId) {
      fetchProjectDetail(projectId);
    }
  }, [projectId, fetchProjectDetail]);

  const handleAddNote = async () => {
    if (!noteText.trim()) {
      toast({
        variant: 'destructive',
        title: 'ত্রুটি',
        description: 'নোট লিখুন',
      });
      return;
    }

    setSubmitting(true);
    const result = await addNote(projectId!, noteText, noteDate);
    setSubmitting(false);

    if (result.success) {
      toast({
        title: 'সফল',
        description: 'নোট যোগ হয়েছে',
      });
      setIsAddNoteOpen(false);
      setNoteText('');
      setNoteDate(new Date().toISOString().split('T')[0]);
    } else {
      toast({
        variant: 'destructive',
        title: 'ত্রুটি',
        description: result.error || 'নোট যোগ করতে সমস্যা হয়েছে',
      });
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    const result = await deleteNote(noteId);
    if (result.success) {
      toast({
        title: 'সফল',
        description: 'নোট মুছে ফেলা হয়েছে',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'ত্রুটি',
        description: result.error || 'নোট মুছতে সমস্যা হয়েছে',
      });
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  if (loading && !projectDetail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">লোড হচ্ছে...</span>
      </div>
    );
  }

  if (error && !projectDetail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Link to="/client-portal">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              ফিরে যান
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const project = projectDetail?.project;
  const notes = projectDetail?.notes || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/client-portal">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                ফিরে যান
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">প্রজেক্ট বিস্তারিত</h1>
              <p className="text-sm text-muted-foreground">{client?.client_code}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            লগআউট
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        {project && (
          <>
            {/* Project Info Card */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-xl">{project.title}</CardTitle>
                  <Badge 
                    variant="secondary" 
                    className={statusColors[project.status] || 'bg-gray-100 text-gray-800'}
                  >
                    {project.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {project.services && (
                  <div>
                    <span className="text-sm text-muted-foreground">সার্ভিস:</span>
                    <p className="font-medium">{project.services.name}</p>
                    {project.services.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {project.services.description}
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>অগ্রগতি</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-3" />
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  {project.start_date && (
                    <div>
                      <span className="text-muted-foreground">শুরুর তারিখ:</span>
                      <p className="flex items-center font-medium">
                        <Calendar className="h-4 w-4 mr-1" />
                        {format(new Date(project.start_date), 'dd MMMM, yyyy', { locale: bn })}
                      </p>
                    </div>
                  )}
                  {project.deadline && (
                    <div>
                      <span className="text-muted-foreground">ডেডলাইন:</span>
                      <p className="flex items-center font-medium">
                        <Calendar className="h-4 w-4 mr-1" />
                        {format(new Date(project.deadline), 'dd MMMM, yyyy', { locale: bn })}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Client Notes Section */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  ক্লায়েন্ট নোট
                </CardTitle>
                <Dialog open={isAddNoteOpen} onOpenChange={setIsAddNoteOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      নোট যোগ করুন
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>নতুন নোট যোগ করুন</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="noteDate">তারিখ</Label>
                        <Input
                          id="noteDate"
                          type="date"
                          value={noteDate}
                          onChange={(e) => setNoteDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="noteText">নোট</Label>
                        <Textarea
                          id="noteText"
                          placeholder="আপনার নোট লিখুন..."
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          rows={4}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setIsAddNoteOpen(false)}
                          disabled={submitting}
                        >
                          বাতিল
                        </Button>
                        <Button onClick={handleAddNote} disabled={submitting}>
                          {submitting ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              সংরক্ষণ হচ্ছে...
                            </>
                          ) : (
                            'সংরক্ষণ করুন'
                          )}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {notes.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    এখনো কোনো নোট নেই
                  </p>
                ) : (
                  <div className="space-y-4">
                    {notes.map((note) => (
                      <div
                        key={note.id}
                        className="border rounded-lg p-4 bg-muted/30"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm text-muted-foreground mb-1">
                              {format(new Date(note.note_date), 'dd MMMM, yyyy', { locale: bn })}
                            </p>
                            <p className="whitespace-pre-wrap">{note.note_text}</p>
                          </div>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>নোট মুছে ফেলুন?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  এই নোটটি স্থায়ীভাবে মুছে যাবে।
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>বাতিল</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteNote(note.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  মুছে ফেলুন
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
