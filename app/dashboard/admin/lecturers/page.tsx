'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { Loader2, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase/config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createLecturer, deleteLecturer, getLecturers, updateLecturer } from '@/lib/supabase/lecturerService';
import { Lecturer } from '@/types/lecturer';
import { ConfirmDialog } from '@/components/dashboard/ConfirmDialog';

const EMPTY_FORM = { name: '', title: '', specialization: '' };

const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> =>
  Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);

export default function AdminLecturersPage() {
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = () => {
    setLoading(true);
    getLecturers()
      .then(setLecturers)
      .catch((err) => {
        console.error('Error loading lecturers:', err);
        toast.error('Failed to load lecturers');
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

  const startEdit = (lecturer: Lecturer) => {
    setForm({ name: lecturer.name, title: lecturer.title, specialization: lecturer.specialization });
    setPendingFile(null);
    setEditingId(lecturer.id);
    setShowForm(true);
  };

  const uploadPhoto = async (file: File): Promise<string> => {
    const objectName = `lecturers/${Date.now()}-${file.name}`;
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
    if (!form.name || !form.title) {
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
        await updateLecturer(editingId, {
          name: form.name,
          title: form.title,
          specialization: form.specialization,
          imageUrl,
        });
        toast.success('Lecturer updated');
      } else {
        await createLecturer({
          name: form.name,
          title: form.title,
          specialization: form.specialization,
          imageUrl: imageUrl!,
          sortOrder: lecturers.length,
        });
        toast.success('Lecturer added');
      }
      setShowForm(false);
      setPendingFile(null);
      load();
    } catch (error) {
      const err = error as { message?: string };
      console.error('Error saving lecturer:', error);
      toast.error(err.message === 'timeout' ? 'Upload timed out' : 'Failed to save lecturer');
    } finally {
      setSaving(false);
    }
  };

  const [deleteTarget, setDeleteTarget] = useState<Lecturer | null>(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteLecturer(deleteTarget.id);
      toast.success('Lecturer removed');
      setDeleteTarget(null);
      load();
    } catch (error) {
      console.error('Error deleting lecturer:', error);
      toast.error('Failed to remove lecturer');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Lecturers</h1>
          <p className="mt-2 text-sm text-muted-foreground">Add, edit, or remove lecturers shown on the Staff page.</p>
        </div>
        <Button onClick={startCreate} className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Plus className="h-4 w-4" /> New Lecturer
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-foreground">
            {editingId ? 'Edit Lecturer' : 'New Lecturer'}
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Dr. / Prof. ..." required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="Professor, Senior Lecturer, Head Of Department..."
                required
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="specialization">Specialization</Label>
              <Input
                id="specialization"
                value={form.specialization}
                onChange={(e) => setForm((p) => ({ ...p, specialization: e.target.value }))}
                placeholder="Applied Mathematics, Algebra..."
              />
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
              {editingId ? 'Save Changes' : 'Add Lecturer'}
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
        ) : lecturers.length === 0 ? (
          <div className="px-6 py-12 text-center text-muted-foreground">No lecturers yet.</div>
        ) : (
          <ul className="divide-y divide-border">
            {lecturers.map((lecturer) => (
              <li key={lecturer.id} className="flex items-center justify-between gap-4 px-6 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-muted">
                    <Image src={lecturer.imageUrl} alt={lecturer.name} fill className="object-cover" sizes="48px" unoptimized />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{lecturer.name}</p>
                    <p className="truncate text-sm text-muted-foreground">{lecturer.title} · {lecturer.specialization}</p>
                  </div>
                </div>
                <div className="flex flex-shrink-0 gap-2">
                  <Button variant="outline" size="sm" onClick={() => startEdit(lecturer)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setDeleteTarget(lecturer)} className="text-destructive hover:bg-destructive/10">
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
