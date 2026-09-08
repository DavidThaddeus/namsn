'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { Loader2, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase/config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createExecutive, deleteExecutive, getExecutives, updateExecutive } from '@/lib/supabase/executiveService';
import { Executive } from '@/types/executive';
import { ConfirmDialog } from '@/components/dashboard/ConfirmDialog';

const EMPTY_FORM = { name: '', role: '', bio: '' };

const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> =>
  Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);

export default function AdminExecutivesPage() {
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = () => {
    setLoading(true);
    getExecutives()
      .then(setExecutives)
      .catch((err) => {
        console.error('Error loading executives:', err);
        toast.error('Failed to load executives');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const startCreate = () => {
    setForm(EMPTY_FORM);
    setPendingFile(null);
    setEditingId(null);
    setShowForm(true);
  };

  const startEdit = (executive: Executive) => {
    setForm({ name: executive.name, role: executive.role, bio: executive.bio });
    setPendingFile(null);
    setEditingId(executive.id);
    setShowForm(true);
  };

  const uploadPhoto = async (file: File): Promise<string> => {
    const objectName = `executives/${Date.now()}-${file.name}`;
    const { error: uploadError } = await withTimeout(
      supabase.storage.from('people-photos').upload(objectName, file),
      30000
    );
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('people-photos').getPublicUrl(objectName);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.role) {
      toast.error('Please fill in all fields');
      return;
    }
    if (!editingId && !pendingFile) {
      toast.error('Please choose a photo');
      return;
    }

    setSaving(true);
    try {
      const imageUrl = pendingFile ? await uploadPhoto(pendingFile) : undefined;
      if (editingId) {
        await updateExecutive(editingId, { name: form.name, role: form.role, bio: form.bio, imageUrl });
        toast.success('Executive updated');
      } else {
        await createExecutive({
          name: form.name,
          role: form.role,
          bio: form.bio,
          imageUrl: imageUrl!,
          sortOrder: executives.length,
        });
        toast.success('Executive added');
      }
      setShowForm(false);
      setPendingFile(null);
      load();
    } catch (error) {
      const err = error as { message?: string };
      console.error('Error saving executive:', error);
      toast.error(err.message === 'timeout' ? 'Upload timed out' : 'Failed to save executive');
    } finally {
      setSaving(false);
    }
  };

  const [deleteTarget, setDeleteTarget] = useState<Executive | null>(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteExecutive(deleteTarget.id);
      toast.success('Executive removed');
      setDeleteTarget(null);
      load();
    } catch (error) {
      console.error('Error deleting executive:', error);
      toast.error('Failed to remove executive');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Executive Council</h1>
          <p className="mt-2 text-sm text-muted-foreground">Add, edit, or remove executives shown on the home page.</p>
        </div>
        <Button onClick={startCreate} className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Plus className="h-4 w-4" /> New Executive
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-foreground">
            {editingId ? 'Edit Executive' : 'New Executive'}
          </h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Position</Label>
              <Input
                id="role"
                value={form.role}
                onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                placeholder="e.g. President, Sport Director, or a brand-new title"
                required
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" rows={3} value={form.bio} onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Photo</Label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 border border-dashed border-border/40 px-4 py-6 text-sm text-muted-foreground hover:bg-muted/40"
              >
                <Upload className="h-4 w-4" />
                {pendingFile ? pendingFile.name : editingId ? 'Replace photo (optional)' : 'Choose photo'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (file) setPendingFile(file);
                }}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingId ? 'Save Changes' : 'Add Executive'}
            </Button>
            <Button type="button" variant="outline" onClick={() => { setShowForm(false); setPendingFile(null); }}>
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
        ) : executives.length === 0 ? (
          <div className="px-6 py-12 text-center text-muted-foreground">No executives yet.</div>
        ) : (
          <ul className="divide-y divide-border">
            {executives.map((executive) => (
              <li key={executive.id} className="flex items-center justify-between gap-4 px-6 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-muted">
                    <Image src={executive.imageUrl} alt={executive.name} fill className="object-cover" sizes="48px" unoptimized />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{executive.name}</p>
                    <p className="truncate text-sm text-muted-foreground">{executive.role}</p>
                  </div>
                </div>
                <div className="flex flex-shrink-0 gap-2">
                  <Button variant="outline" size="sm" onClick={() => startEdit(executive)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setDeleteTarget(executive)} className="text-destructive hover:bg-destructive/10">
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
        title={`Remove "${deleteTarget?.name}"?`}
        description="This cannot be undone."
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
