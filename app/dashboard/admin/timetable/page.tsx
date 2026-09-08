'use client';

import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { ImageIcon, Loader2, Plus, Save, Table2, Trash2, Upload } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getTimetable, saveTimetableImage, saveTimetableRows } from '@/lib/supabase/timetableService';
import { TimetableLevel, TimetableMode, TimetableRow } from '@/types/timetable';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const LEVELS: TimetableLevel[] = ['100', '200', '300', '400'];

const newRow = (): TimetableRow => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  day: '',
  time: '',
  course: '',
  tutor: '',
  venue: '',
});

const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> =>
  Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);

export default function AdminTimetablePage() {
  const { currentUser } = useAuth();
  const [level, setLevel] = useState<TimetableLevel>('100');
  const [mode, setMode] = useState<TimetableMode>('rows');
  const [rows, setRows] = useState<TimetableRow[]>([]);
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deletingImage, setDeletingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getTimetable(level)
      .then((data) => {
        if (cancelled) return;
        setMode(data?.mode || 'rows');
        setRows(data?.rows || []);
        setImageUrl(data?.imageUrl);
      })
      .catch((err) => console.error('Error loading timetable:', err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [level]);

  const updateRow = (id: string, field: keyof TimetableRow, value: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const removeRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleSaveRows = async () => {
    setSaving(true);
    try {
      await saveTimetableRows(level, rows);
      toast.success('Timetable saved');
    } catch (error) {
      console.error('Error saving timetable:', error);
      toast.error('Failed to save timetable');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!currentUser) return;
    setUploadingImage(true);
    const toastId = toast.loading('Uploading image...');
    try {
      const objectName = `${level}-${Date.now()}-${file.name}`;
      const { error: uploadError } = await withTimeout(
        supabase.storage.from('timetables').upload(objectName, file),
        30000
      );
      if (uploadError) throw uploadError;
      const { data: publicUrlData } = supabase.storage.from('timetables').getPublicUrl(objectName);
      const url = publicUrlData.publicUrl;
      await saveTimetableImage(level, url);
      setImageUrl(url);
      toast.success('Timetable image saved', { id: toastId });
    } catch (error) {
      const err = error as { message?: string };
      console.error('Error uploading timetable image:', error);
      if (err.message === 'timeout') {
        toast.error('Upload timed out. Check your Supabase Storage setup.', { id: toastId, duration: 6000 });
      } else {
        toast.error('Failed to upload image', { id: toastId });
      }
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteImage = async () => {
    setDeletingImage(true);
    try {
      await saveTimetableRows(level, []);
      setImageUrl(undefined);
      toast.success('Timetable image deleted');
    } catch (error) {
      console.error('Error deleting timetable image:', error);
      toast.error('Failed to delete image');
    } finally {
      setDeletingImage(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-5">
        <h1 className="font-display text-2xl font-bold text-foreground">Tutorial Timetable</h1>
        <p className="mt-2 text-sm text-muted-foreground">Edit the tutorial timetable for each level.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {LEVELS.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLevel(l)}
            className={cn(
              'px-4 py-1.5 text-sm font-medium transition-colors',
              level === l ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            {l} Level
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <Button variant={mode === 'rows' ? 'default' : 'outline'} onClick={() => setMode('rows')}>
          <Table2 className="h-4 w-4" /> Table Editor
        </Button>
        <Button variant={mode === 'image' ? 'default' : 'outline'} onClick={() => setMode('image')}>
          <ImageIcon className="h-4 w-4" /> Upload as Image
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : mode === 'image' ? (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          {imageUrl && (
            <div className="relative mb-4 aspect-[4/3] w-full overflow-hidden bg-muted">
              <Image src={imageUrl} alt={`${level} Level timetable`} fill className="object-contain" unoptimized />
            </div>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage || deletingImage}
              className="flex flex-1 items-center justify-center gap-2 border border-dashed border-border/40 px-4 py-6 text-sm text-muted-foreground hover:bg-muted/40 disabled:opacity-50"
            >
              {uploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {imageUrl ? 'Replace image' : 'Upload timetable image'}
            </button>
            {imageUrl && (
              <Button
                type="button"
                variant="outline"
                onClick={handleDeleteImage}
                disabled={uploadingImage || deletingImage}
                className="text-destructive hover:bg-destructive/10"
              >
                {deletingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete
              </Button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (file) handleImageUpload(file);
            }}
          />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button onClick={handleSaveRows} disabled={saving} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </Button>
          </div>
          {rows.map((row) => (
            <div key={row.id} className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-card p-4 shadow-sm sm:grid-cols-[1fr_1fr_1.3fr_1fr_1fr_auto]">
              <Input placeholder="Day (e.g. Monday)" value={row.day} onChange={(e) => updateRow(row.id, 'day', e.target.value)} />
              <Input placeholder="Time (e.g. 9:00 - 10:00 AM)" value={row.time} onChange={(e) => updateRow(row.id, 'time', e.target.value)} />
              <Input placeholder="Course" value={row.course} onChange={(e) => updateRow(row.id, 'course', e.target.value)} />
              <Input placeholder="Tutor" value={row.tutor} onChange={(e) => updateRow(row.id, 'tutor', e.target.value)} />
              <Input placeholder="Venue" value={row.venue} onChange={(e) => updateRow(row.id, 'venue', e.target.value)} />
              <Button type="button" variant="outline" onClick={() => removeRow(row.id)} className="text-destructive hover:bg-destructive/10">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}

          <Button type="button" variant="outline" onClick={() => setRows((prev) => [...prev, newRow()])}>
            <Plus className="h-4 w-4" /> Add Row
          </Button>
        </div>
      )}
    </div>
  );
}
