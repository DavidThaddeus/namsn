'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/dashboard/ConfirmDialog';
import {
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncements,
  updateAnnouncement,
} from '@/lib/supabase/announcementService';
import { Announcement } from '@/types/announcement';

const EMPTY_FORM = { title: '', content: '', isImportant: false, showPostedBy: true, postedByName: '' };

export default function AdminAnnouncementsPage() {
  const { currentUser } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadAnnouncements = () => {
    setLoading(true);
    getAnnouncements(100)
      .then(setAnnouncements)
      .catch((err) => {
        console.error('Error loading announcements:', err);
        toast.error('Failed to load announcements');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const startCreate = () => {
    setForm({ ...EMPTY_FORM, postedByName: currentUser?.displayName || '' });
    setEditingId(null);
    setShowForm(true);
  };

  const startEdit = (a: Announcement) => {
    setForm({
      title: a.title,
      content: a.content,
      isImportant: a.isImportant,
      showPostedBy: a.showPostedBy,
      postedByName: a.createdByName || '',
    });
    setEditingId(a.id || null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!form.title || !form.content) {
      toast.error('Please fill in all fields');
      return;
    }

    setSaving(true);
    try {
      const { postedByName, ...dto } = form;
      if (editingId) {
        await updateAnnouncement(editingId, dto);
        toast.success('Announcement updated');
      } else {
        await createAnnouncement(dto, currentUser.uid, postedByName || currentUser.displayName || 'Admin');
        toast.success('Announcement published');
      }
      setShowForm(false);
      loadAnnouncements();
    } catch (error) {
      console.error('Error saving announcement:', error);
      toast.error('Failed to save announcement');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.id) return;
    setDeleting(true);
    try {
      await deleteAnnouncement(deleteTarget.id);
      toast.success('Announcement deleted');
      setDeleteTarget(null);
      loadAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast.error('Failed to delete announcement');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Announcements</h1>
          <p className="mt-2 text-sm text-muted-foreground">Publish and manage announcements.</p>
        </div>
        <Button onClick={startCreate} className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Plus className="h-4 w-4" /> New Announcement
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-foreground">
            {editingId ? 'Edit Announcement' : 'New Announcement'}
          </h2>
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Message</Label>
            <Textarea id="content" rows={4} value={form.content} onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="postedByName">Posted By</Label>
            <Input
              id="postedByName"
              value={form.postedByName}
              onChange={(e) => setForm((p) => ({ ...p, postedByName: e.target.value }))}
              placeholder="e.g. PRO Office, Olabode Goodness"
              disabled={!!editingId}
            />
            {editingId && (
              <p className="text-xs text-muted-foreground">The original poster&apos;s name can&apos;t be changed when editing.</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="isImportant"
              checked={form.isImportant}
              onCheckedChange={(checked) => setForm((p) => ({ ...p, isImportant: checked === true }))}
            />
            <Label htmlFor="isImportant" className="cursor-pointer">Mark as important</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="showPostedBy"
              checked={form.showPostedBy}
              onCheckedChange={(checked) => setForm((p) => ({ ...p, showPostedBy: checked === true }))}
            />
            <Label htmlFor="showPostedBy" className="cursor-pointer">
              Show &quot;Posted by {form.postedByName || '...'}&quot; publicly
            </Label>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingId ? 'Save Changes' : 'Publish'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : announcements.length === 0 ? (
          <div className="px-6 py-12 text-center text-muted-foreground">No announcements yet.</div>
        ) : (
          <ul className="divide-y divide-border">
            {announcements.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-4 px-6 py-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-foreground">{a.title}</p>
                    {a.isImportant && <Badge variant="secondary">Important</Badge>}
                  </div>
                  <p className="mt-1 truncate text-sm text-muted-foreground">{a.content}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Posted by {a.createdByName} · {format(a.createdAt.toDate(), 'MMM d, yyyy')}
                    {!a.showPostedBy && ' · hidden publicly'}
                  </p>
                </div>
                <div className="flex flex-shrink-0 gap-2">
                  <Button variant="outline" size="sm" onClick={() => startEdit(a)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setDeleteTarget(a)} className="text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title={`Delete "${deleteTarget?.title}"?`}
        description="This cannot be undone."
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
