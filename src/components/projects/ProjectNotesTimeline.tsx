import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Calendar,
  Clock,
  User,
  Tag,
  Edit2,
  Trash2,
  Loader2,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  MessageCircle,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { useProjectNotes, ProjectNote, ProjectNoteInput } from '@/hooks/useProjectNotes';
import { ProjectNoteFormModal } from './ProjectNoteFormModal';
import { useAuth } from '@/contexts/AuthContext';

interface ProjectNotesTimelineProps {
  projectId: string;
  canAddNotes: boolean;
}

const getNoteTypeIcon = (type: string | null) => {
  switch (type) {
    case 'আপডেট':
      return <MessageSquare className="w-4 h-4" />;
    case 'সমস্যা':
      return <AlertCircle className="w-4 h-4" />;
    case 'সমাধান':
      return <CheckCircle2 className="w-4 h-4" />;
    case 'ক্লায়েন্ট ফিডব্যাক':
      return <MessageCircle className="w-4 h-4" />;
    default:
      return <FileText className="w-4 h-4" />;
  }
};

const getNoteTypeColor = (type: string | null) => {
  switch (type) {
    case 'আপডেট':
      return 'bg-info/15 text-info border-info/30';
    case 'সমস্যা':
      return 'bg-destructive/15 text-destructive border-destructive/30';
    case 'সমাধান':
      return 'bg-success/15 text-success border-success/30';
    case 'ক্লায়েন্ট ফিডব্যাক':
      return 'bg-warning/15 text-warning border-warning/30';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};

export function ProjectNotesTimeline({ projectId, canAddNotes }: ProjectNotesTimelineProps) {
  const { user } = useAuth();
  const { notes, loading, addNote, updateNote, deleteNote, isAdmin } = useProjectNotes(projectId);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<ProjectNote | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleAddNote = async (data: ProjectNoteInput): Promise<boolean> => {
    return await addNote(data);
  };

  const handleEditNote = async (data: ProjectNoteInput): Promise<boolean> => {
    if (!selectedNote) return false;
    return await updateNote(selectedNote.id, data);
  };

  const handleOpenEdit = (note: ProjectNote) => {
    setSelectedNote(note);
    setIsEditModalOpen(true);
  };

  const handleOpenDelete = (note: ProjectNote) => {
    setSelectedNote(note);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteNote = async () => {
    if (!selectedNote) return;
    setIsDeleting(true);
    await deleteNote(selectedNote.id);
    setIsDeleting(false);
    setIsDeleteModalOpen(false);
    setSelectedNote(null);
  };

  const canEditNote = (note: ProjectNote) => {
    return isAdmin || note.created_by === user?.id;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('bn-BD', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return null;
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="w-5 h-5" />
          প্রজেক্ট নোট / আপডেট
        </CardTitle>
        {canAddNotes && (
          <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            নতুন নোট যোগ করুন
          </Button>
        )}
      </CardHeader>

      <CardContent>
        {!canAddNotes && notes.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>আপনার এই প্রজেক্টে নোট দেওয়ার অনুমতি নেই।</p>
          </div>
        )}

        {canAddNotes && notes.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>এখনো কোনো নোট নেই</p>
            <p className="text-sm mt-1">প্রজেক্টের আপডেট রাখতে নোট যোগ করুন</p>
          </div>
        )}

        {notes.length > 0 && (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

            <AnimatePresence>
              <div className="space-y-4">
                {notes.map((note, index) => (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative pl-10"
                  >
                    {/* Timeline dot */}
                    <div
                      className={`absolute left-2 top-3 w-5 h-5 rounded-full border-2 flex items-center justify-center ${getNoteTypeColor(
                        note.note_type
                      )}`}
                    >
                      {getNoteTypeIcon(note.note_type)}
                    </div>

                    <div className="bg-muted/30 rounded-lg p-4 border border-border hover:border-primary/30 transition-colors">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(note.note_date)}
                          </span>
                          {note.note_time && (
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="w-3.5 h-3.5" />
                              {formatTime(note.note_time)}
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <User className="w-3.5 h-3.5" />
                            {note.created_by_name || 'অজানা'}
                          </span>
                          {note.note_type && (
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 border ${getNoteTypeColor(
                                note.note_type
                              )}`}
                            >
                              <Tag className="w-3 h-3" />
                              {note.note_type}
                            </span>
                          )}
                        </div>

                        {canEditNote(note) && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleOpenEdit(note)}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => handleOpenDelete(note)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Note content */}
                      <p className="text-foreground whitespace-pre-wrap">{note.note_text}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          </div>
        )}
      </CardContent>

      {/* Add Note Modal */}
      <ProjectNoteFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddNote}
        projectId={projectId}
      />

      {/* Edit Note Modal */}
      <ProjectNoteFormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedNote(null);
        }}
        onSubmit={handleEditNote}
        projectId={projectId}
        note={selectedNote}
        isEdit
      />

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>নোট মুছে ফেলবেন?</AlertDialogTitle>
            <AlertDialogDescription>
              এই নোটটি মুছে ফেলতে চান? এটি পুনরুদ্ধার করা যাবে না।
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>বাতিল করুন</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteNote}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Trash2 className="w-4 h-4 mr-1" />
              হ্যাঁ, মুছে ফেলুন
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
