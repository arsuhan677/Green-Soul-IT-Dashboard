import { useState, useEffect } from 'react';
import { Loader2, Calendar, Clock, FileText, Tag } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ProjectNote, ProjectNoteInput } from '@/hooks/useProjectNotes';

interface ProjectNoteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProjectNoteInput) => Promise<boolean>;
  projectId: string;
  note?: ProjectNote | null;
  isEdit?: boolean;
}

const noteTypes = ['আপডেট', 'সমস্যা', 'সমাধান', 'ক্লায়েন্ট ফিডব্যাক'];

export function ProjectNoteFormModal({
  isOpen,
  onClose,
  onSubmit,
  projectId,
  note,
  isEdit = false,
}: ProjectNoteFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    note_date: new Date().toISOString().split('T')[0],
    note_time: '',
    note_type: 'আপডেট',
    note_text: '',
  });

  // Reset form when modal opens/closes or note changes
  useEffect(() => {
    if (isOpen) {
      if (note && isEdit) {
        setFormData({
          note_date: note.note_date,
          note_time: note.note_time || '',
          note_type: note.note_type || 'আপডেট',
          note_text: note.note_text,
        });
      } else {
        setFormData({
          note_date: new Date().toISOString().split('T')[0],
          note_time: '',
          note_type: 'আপডেট',
          note_text: '',
        });
      }
    }
  }, [isOpen, note, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.note_date || !formData.note_text.trim()) {
      return;
    }

    setIsSubmitting(true);
    const success = await onSubmit({
      project_id: projectId,
      note_date: formData.note_date,
      note_time: formData.note_time || undefined,
      note_type: formData.note_type,
      note_text: formData.note_text.trim(),
    });

    if (success) {
      onClose();
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {isEdit ? 'নোট এডিট করুন' : 'নতুন নোট যোগ করুন'}
          </DialogTitle>
          <DialogDescription>
            প্রজেক্টের আপডেট বা নোট যোগ করুন টাইমলাইনে
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <form onSubmit={handleSubmit} className="space-y-4 px-1">
            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="note_date" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                তারিখ *
              </Label>
              <Input
                id="note_date"
                type="date"
                value={formData.note_date}
                onChange={(e) => setFormData({ ...formData, note_date: e.target.value })}
                required
                className="form-input"
              />
            </div>

            {/* Time (optional) */}
            <div className="space-y-2">
              <Label htmlFor="note_time" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                সময় (ঐচ্ছিক)
              </Label>
              <Input
                id="note_time"
                type="time"
                value={formData.note_time}
                onChange={(e) => setFormData({ ...formData, note_time: e.target.value })}
                className="form-input"
              />
            </div>

            {/* Note Type */}
            <div className="space-y-2">
              <Label htmlFor="note_type" className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                নোট টাইপ
              </Label>
              <Select
                value={formData.note_type}
                onValueChange={(value) => setFormData({ ...formData, note_type: value })}
              >
                <SelectTrigger className="form-input">
                  <SelectValue placeholder="নোট টাইপ নির্বাচন করুন" />
                </SelectTrigger>
                <SelectContent>
                  {noteTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Note Text */}
            <div className="space-y-2">
              <Label htmlFor="note_text" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                নোট/আপডেট লিখুন *
              </Label>
              <Textarea
                id="note_text"
                value={formData.note_text}
                onChange={(e) => setFormData({ ...formData, note_text: e.target.value })}
                placeholder="আপনার নোট এখানে লিখুন..."
                required
                rows={4}
                className="resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                বাতিল করুন
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                সংরক্ষণ করুন
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
