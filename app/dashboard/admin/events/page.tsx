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
import { createEvent, deleteEvent, getEvents, updateEvent } from '@/lib/supabase/eventService';
import { DepartmentEvent } from '@/types/event';
import { ConfirmDialog } from '@/components/dashboard/ConfirmDialog';

const EMPTY_FORM = {
  title: '',
  description: '',
  tag: 'Conference',
  date: '',
  time: '',
  venue: '',
  isImportant: false,
};

export default function AdminEventsPage() {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState<DepartmentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const loadEvents = () => {
    setLoading(true);
    getEvents()
      .then(setEvents)
      .catch((err) => {
        console.error('Error loading events:', err);
        toast.error('Failed to load events');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const startCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
  };

  const startEdit = (event: DepartmentEvent) => {
    setForm({
      title: event.title,
      description: event.description,
      tag: event.tag,
      date: format(event.date.toDate(), 'yyyy-MM-dd'),
      time: event.time,
      venue: event.venue,
      isImportant: event.isImportant,
    });
    setEditingId(event.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!form.title || !form.date || !form.time || !form.venue) {
      toast.error('Please fill in all fields');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        tag: form.tag,
        date: new Date(form.date),
        time: form.time,
        venue: form.venue,
        isImportant: form.isImportant,
      };

      if (editingId) {
        await updateEvent(editingId, payload);
        toast.success('Event updated');
      } else {
        await createEvent(payload, currentUser.uid, currentUser.displayName || 'Admin');
        toast.success('Event created');
      }

      setShowForm(false);
      loadEvents();
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error('Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  const [deleteTarget, setDeleteTarget] = useState<DepartmentEvent | null>(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteEvent(deleteTarget.id);
      toast.success('Event deleted');
      setDeleteTarget(null);
      loadEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Events</h1>
          <p className="mt-2 text-sm text-muted-foreground">Create and manage departmental events.</p>
        </div>
        <Button onClick={startCreate} className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Plus className="h-4 w-4" /> New Event
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-foreground">
            {editingId ? 'Edit Event' : 'New Event'}
          </h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Message</Label>
              <Textarea
                id="description"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tag">Tag</Label>
              <Input id="tag" value={form.tag} onChange={(e) => setForm((p) => ({ ...p, tag: e.target.value }))} placeholder="Conference, Orientation, Workshop..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input id="time" value={form.time} onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))} placeholder="9:00 AM - 5:00 PM" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="venue">Venue</Label>
              <Input id="venue" value={form.venue} onChange={(e) => setForm((p) => ({ ...p, venue: e.target.value }))} required />
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <Checkbox
                id="isImportant"
                checked={form.isImportant}
                onCheckedChange={(checked) => setForm((p) => ({ ...p, isImportant: checked === true }))}
              />
              <Label htmlFor="isImportant" className="cursor-pointer">Mark as important</Label>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingId ? 'Save Changes' : 'Create Event'}
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
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center gap-4 px-6 py-12 text-center text-muted-foreground">
            <p>No events yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {events.map((event) => (
              <li key={event.id} className="flex items-center justify-between gap-4 px-6 py-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-foreground">{event.title}</p>
                    <Badge variant="secondary">{event.tag}</Badge>
                    {event.isImportant && <Badge variant="outline">Important</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {format(event.date.toDate(), 'MMM d, yyyy')} · {event.time} · {event.venue}
                  </p>
                </div>
                <div className="flex flex-shrink-0 gap-2">
                  <Button variant="outline" size="sm" onClick={() => startEdit(event)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setDeleteTarget(event)} className="text-destructive hover:bg-destructive/10">
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
