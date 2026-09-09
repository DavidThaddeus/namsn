'use client';

import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowLeft, Folder, Link2, Loader2, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createCourse, deleteCourse, getAllCourses, updateCourse } from '@/lib/supabase/courseService';
import { createCourseFolder, deleteCourseFolder, getCourseFolders } from '@/lib/supabase/courseFolderService';
import { Course, CourseSourceType } from '@/types/course';
import { CourseFolder } from '@/types/courseFolder';
import { ConfirmDialog } from '@/components/dashboard/ConfirmDialog';
import { cn } from '@/lib/utils';

const MAX_FILE_BYTES = 500 * 1024 * 1024; // 500MB, matches the course-files bucket limit

const EMPTY_FORM = {
  title: '',
  description: '',
  sourceType: 'youtube' as CourseSourceType,
  youtubeUrl: '',
  category: '',
  level: 'Beginner' as 'Beginner' | 'Intermediate' | 'Advanced',
  isPublished: true,
  folderId: '',
};

const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> =>
  Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);

const formatFileSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function AdminCoursesPage() {
  const { currentUser } = useAuth();

  const [folders, setFolders] = useState<CourseFolder[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(true);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [folderDeleteTarget, setFolderDeleteTarget] = useState<CourseFolder | null>(null);
  const [deletingFolder, setDeletingFolder] = useState(false);

  const [selectedFolder, setSelectedFolder] = useState<CourseFolder | null>(null);

  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFolders = () => {
    setLoadingFolders(true);
    getCourseFolders()
      .then(setFolders)
      .catch((err) => {
        console.error('Error loading course folders:', err);
        toast.error('Failed to load folders');
      })
      .finally(() => setLoadingFolders(false));
  };

  const loadCourses = () => {
    setLoadingCourses(true);
    getAllCourses(500)
      .then(setCourses)
      .catch((err) => {
        console.error('Error loading courses:', err);
        toast.error('Failed to load courses');
      })
      .finally(() => setLoadingCourses(false));
  };

  useEffect(() => {
    loadFolders();
    loadCourses();
  }, []);

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newFolderName.trim()) return;
    setCreatingFolder(true);
    try {
      await createCourseFolder({ name: newFolderName.trim() }, currentUser.uid);
      toast.success('Folder created');
      setNewFolderName('');
      setShowNewFolder(false);
      loadFolders();
    } catch (error) {
      console.error('Error creating course folder:', error);
      toast.error('Failed to create folder');
    } finally {
      setCreatingFolder(false);
    }
  };

  const confirmDeleteFolder = async () => {
    if (!folderDeleteTarget) return;
    setDeletingFolder(true);
    try {
      await deleteCourseFolder(folderDeleteTarget.id);
      toast.success('Folder deleted');
      setFolderDeleteTarget(null);
      if (selectedFolder?.id === folderDeleteTarget.id) setSelectedFolder(null);
      loadFolders();
      loadCourses();
    } catch (error) {
      console.error('Error deleting course folder:', error);
      toast.error('Failed to delete folder');
    } finally {
      setDeletingFolder(false);
    }
  };

  const startCreate = () => {
    setForm({ ...EMPTY_FORM, folderId: selectedFolder?.id || '' });
    setPendingFile(null);
    setEditingId(null);
    setShowForm(true);
  };

  const startEdit = (course: Course) => {
    setForm({
      title: course.title,
      description: course.description,
      sourceType: course.sourceType,
      youtubeUrl: course.youtubeUrl || '',
      category: course.category,
      level: course.level,
      isPublished: course.isPublished,
      folderId: course.folderId || '',
    });
    setPendingFile(null);
    setEditingId(course.id);
    setShowForm(true);
  };

  const uploadCourseFile = async (file: File): Promise<string> => {
    const objectName = `${Date.now()}-${file.name}`;
    const { error: uploadError } = await withTimeout(
      supabase.storage.from('course-files').upload(objectName, file),
      300000
    );
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('course-files').getPublicUrl(objectName);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!form.title || !form.category) {
      toast.error('Please fill in all fields');
      return;
    }
    if (form.sourceType === 'youtube' && !form.youtubeUrl) {
      toast.error('Please add a YouTube link');
      return;
    }
    if (form.sourceType === 'upload' && !editingId && !pendingFile) {
      toast.error('Please choose a file to upload');
      return;
    }
    if (pendingFile && pendingFile.size > MAX_FILE_BYTES) {
      toast.error('File is too large (max 500MB). Use a YouTube link for larger videos.');
      return;
    }

    setSaving(true);
    const toastId = pendingFile ? toast.loading('Uploading file...') : undefined;
    try {
      const base = {
        title: form.title,
        description: form.description,
        category: form.category,
        level: form.level,
        isPublished: form.isPublished,
        folderId: form.folderId || undefined,
        sourceType: form.sourceType,
      };

      if (editingId) {
        const payload = { ...base } as Parameters<typeof updateCourse>[1];
        if (form.sourceType === 'youtube') {
          payload.youtubeUrl = form.youtubeUrl;
          payload.fileUrl = '';
        } else {
          payload.youtubeUrl = '';
          if (pendingFile) payload.fileUrl = await uploadCourseFile(pendingFile);
        }
        await updateCourse(editingId, payload);
        toast.success('Course updated', { id: toastId });
      } else {
        const fileUrl = form.sourceType === 'upload' && pendingFile ? await uploadCourseFile(pendingFile) : undefined;
        await createCourse(
          { ...base, youtubeUrl: form.youtubeUrl, fileUrl },
          currentUser.uid,
          currentUser.displayName || 'Admin'
        );
        toast.success('Course created', { id: toastId });
      }
      setShowForm(false);
      setPendingFile(null);
      loadCourses();
    } catch (error) {
      const err = error as { message?: string };
      console.error('Error saving course:', error);
      toast.error(
        err.message === 'timeout'
          ? 'Upload timed out — try a smaller file or a YouTube link instead.'
          : 'Failed to save course',
        { id: toastId }
      );
    } finally {
      setSaving(false);
    }
  };

  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCourse(deleteTarget.id);
      toast.success('Course deleted');
      setDeleteTarget(null);
      loadCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error('Failed to delete course');
    } finally {
      setDeleting(false);
    }
  };

  const visibleCourses = selectedFolder
    ? courses.filter((c) => c.folderId === selectedFolder.id)
    : courses.filter((c) => !c.folderId);

  const courseForm = (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-sm">
      <h2 className="font-display text-lg font-semibold text-foreground">
        {editingId ? 'Edit Course' : 'New Course'}
      </h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" rows={3} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label>Source</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={form.sourceType === 'youtube' ? 'default' : 'outline'}
              onClick={() => setForm((p) => ({ ...p, sourceType: 'youtube' }))}
            >
              <Link2 className="h-4 w-4" /> YouTube Link
            </Button>
            <Button
              type="button"
              variant={form.sourceType === 'upload' ? 'default' : 'outline'}
              onClick={() => setForm((p) => ({ ...p, sourceType: 'upload' }))}
            >
              <Upload className="h-4 w-4" /> Upload File
            </Button>
          </div>
        </div>

        {form.sourceType === 'youtube' ? (
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="youtubeUrl">YouTube URL</Label>
            <Input
              id="youtubeUrl"
              value={form.youtubeUrl}
              onChange={(e) => setForm((p) => ({ ...p, youtubeUrl: e.target.value }))}
              placeholder="https://www.youtube.com/watch?v=..."
            />
            <p className="text-xs text-muted-foreground">The thumbnail is fetched automatically from the link.</p>
          </div>
        ) : (
          <div className="space-y-2 sm:col-span-2">
            <Label>Course File</Label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 border border-dashed border-border/40 px-4 py-6 text-sm text-muted-foreground hover:bg-muted/40"
            >
              <Upload className="h-4 w-4" />
              {pendingFile ? pendingFile.name : editingId ? 'Replace file (optional)' : 'Choose file'}
            </button>
            {pendingFile && (
              <p className="text-xs text-muted-foreground">{formatFileSize(pendingFile.size)}</p>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*,application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (file) setPendingFile(file);
              }}
            />
            <p className="text-xs text-muted-foreground">Max 500MB. For larger videos, use a YouTube link instead.</p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Input id="category" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} placeholder="Cybersecurity, Frontend..." required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="level">Level</Label>
          <Select value={form.level} onValueChange={(v) => setForm((p) => ({ ...p, level: v as typeof form.level }))}>
            <SelectTrigger id="level" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Beginner">Beginner</SelectItem>
              <SelectItem value="Intermediate">Intermediate</SelectItem>
              <SelectItem value="Advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="folder">Folder</Label>
          <Select value={form.folderId || 'none'} onValueChange={(v) => setForm((p) => ({ ...p, folderId: v === 'none' ? '' : v }))}>
            <SelectTrigger id="folder" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No folder</SelectItem>
              {folders.map((f) => (
                <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 sm:col-span-2">
          <Checkbox
            id="isPublished"
            checked={form.isPublished}
            onCheckedChange={(checked) => setForm((p) => ({ ...p, isPublished: checked === true }))}
          />
          <Label htmlFor="isPublished" className="cursor-pointer">Published (visible to students)</Label>
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={saving} className="bg-accent text-accent-foreground hover:bg-accent/90">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {editingId ? 'Save Changes' : 'Create Course'}
        </Button>
        <Button type="button" variant="outline" onClick={() => { setShowForm(false); setPendingFile(null); }}>
          Cancel
        </Button>
      </div>
    </form>
  );

  const courseList = (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      {loadingCourses ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : visibleCourses.length === 0 ? (
        <div className="px-6 py-12 text-center text-muted-foreground">
          {selectedFolder ? 'No courses in this folder yet.' : 'No uncategorized courses.'}
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {visibleCourses.map((course) => (
            <li key={course.id} className="flex items-center justify-between gap-4 px-6 py-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-foreground">{course.title}</p>
                  <Badge variant="secondary">{course.category}</Badge>
                  <Badge variant="outline">{course.level}</Badge>
                  <Badge variant="outline">{course.sourceType === 'youtube' ? 'YouTube' : 'Uploaded'}</Badge>
                  {!course.isPublished && <Badge variant="outline">Draft</Badge>}
                </div>
                <p className="mt-1 truncate text-sm text-muted-foreground">{course.description}</p>
              </div>
              <div className="flex flex-shrink-0 gap-2">
                <Button variant="outline" size="sm" onClick={() => startEdit(course)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setDeleteTarget(course)} className="text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {selectedFolder ? (
        <button
          type="button"
          onClick={() => setSelectedFolder(null)}
          className="flex items-center gap-1 text-sm font-medium text-secondary hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Back to all courses
        </button>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            {selectedFolder ? selectedFolder.name : 'Courses'}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {selectedFolder ? 'Courses in this folder.' : 'Add and manage learning courses, grouped into folders.'}
          </p>
        </div>
        <div className="flex gap-2">
          {!selectedFolder && (
            <Button variant="outline" onClick={() => setShowNewFolder((v) => !v)}>
              <Plus className="h-4 w-4" /> New Folder
            </Button>
          )}
          <Button onClick={startCreate} className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Plus className="h-4 w-4" /> New Course
          </Button>
        </div>
      </div>

      {showNewFolder && !selectedFolder && (
        <form onSubmit={handleCreateFolder} className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex-1 space-y-2">
            <Label htmlFor="folderName">Folder Name</Label>
            <Input
              id="folderName"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="e.g. Cybersecurity"
              required
            />
          </div>
          <Button type="submit" disabled={creatingFolder} className="bg-accent text-accent-foreground hover:bg-accent/90">
            {creatingFolder && <Loader2 className="h-4 w-4 animate-spin" />}
            Create
          </Button>
          <Button type="button" variant="outline" onClick={() => setShowNewFolder(false)}>
            Cancel
          </Button>
        </form>
      )}

      {showForm && courseForm}

      {!selectedFolder && (
        <>
          {loadingFolders ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : folders.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {folders.map((folder) => {
                const count = courses.filter((c) => c.folderId === folder.id).length;
                return (
                  <div key={folder.id} className={cn('rounded-xl border border-border bg-card p-5 shadow-sm')}>
                    <button
                      type="button"
                      onClick={() => setSelectedFolder(folder)}
                      className="flex w-full flex-col items-start gap-3 text-left"
                    >
                      <div className="flex h-11 w-11 items-center justify-center bg-primary text-primary-foreground">
                        <Folder className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{folder.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{count} course{count === 1 ? '' : 's'}</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFolderDeleteTarget(folder)}
                      className="mt-3 flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" /> Delete folder
                    </button>
                  </div>
                );
              })}
            </div>
          ) : null}

          <h2 className="font-display text-lg font-semibold text-foreground">Uncategorized</h2>
        </>
      )}

      {courseList}

      <ConfirmDialog
        open={!!deleteTarget}
        title={`Delete "${deleteTarget?.title}"?`}
        description="This cannot be undone."
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={!!folderDeleteTarget}
        title={`Delete "${folderDeleteTarget?.name}"?`}
        description="Courses inside will be moved to Uncategorized, not deleted."
        loading={deletingFolder}
        onConfirm={confirmDeleteFolder}
        onCancel={() => setFolderDeleteTarget(null)}
      />
    </div>
  );
}
