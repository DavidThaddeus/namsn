'use client';

import { useEffect, useState } from 'react';
import { Announcement } from '@/types/announcement';
import { getAnnouncements, getImportantAnnouncements } from '@/lib/supabase/announcementService';
import { updateProfile } from '@/lib/supabase/profileService';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Loader2, Search } from 'lucide-react';
import { AnnouncementCard } from '@/components/site/AnnouncementCard';

export default function AnnouncementsPage() {
  const { currentUser } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [importantAnnouncements, setImportantAnnouncements] = useState<Announcement[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    Promise.all([getAnnouncements(50), getImportantAnnouncements(10)])
      .then(([all, important]) => {
        if (cancelled) return;
        setAnnouncements(all.filter((a) => !a.isImportant));
        setImportantAnnouncements(important);
      })
      .catch((err) => {
        console.error('Error loading announcements:', err);
        if (!cancelled) setError('Failed to load announcements');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Clears the sidebar's unread indicator — records that this student has
  // seen announcements as of now (per-user, unlike the old shared isRead flag).
  useEffect(() => {
    if (!currentUser) return;
    updateProfile(currentUser.uid, { lastSeenAnnouncementsAt: new Date().toISOString() }).catch(
      (err) => console.error('Error updating last seen announcements:', err)
    );
  }, [currentUser]);

  const filteredAnnouncements = announcements.filter(
    (a) =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.content.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredImportant = importantAnnouncements.filter(
    (a) =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-5">
        <h1 className="font-display text-2xl font-bold text-foreground">Announcements</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Stay updated with the latest news and announcements.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          className="pl-10"
          placeholder="Search announcements..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {error && (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {filteredImportant.length > 0 && (
        <div>
          <h2 className="font-display mb-3 text-lg font-semibold text-foreground">Important</h2>
          <div className="space-y-3">
            {filteredImportant.map((a) => (
              <AnnouncementCard key={a.id} announcement={a} />
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="font-display mb-3 text-lg font-semibold text-foreground">All Announcements</h2>
        {filteredAnnouncements.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground shadow-sm">
            No announcements found
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAnnouncements.map((a) => (
              <AnnouncementCard key={a.id} announcement={a} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
