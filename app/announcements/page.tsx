'use client';

import { useEffect, useState } from 'react';
import { SiteHeader } from '@/components/site/SiteHeader';
import { SiteFooter } from '@/components/site/SiteFooter';
import { AnnouncementCard } from '@/components/site/AnnouncementCard';
import { getAnnouncements } from '@/lib/supabase/announcementService';
import { Announcement } from '@/types/announcement';

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getAnnouncements(50)
      .then((data) => {
        if (!cancelled) setAnnouncements(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <section className="border-b border-border bg-muted/40 py-16">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <h1 className="font-display text-4xl font-bold text-foreground">Announcements</h1>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              News and notices from the department and executive council.
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            {loading && (
              <div className="space-y-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-28 animate-pulse rounded-xl border border-border bg-muted/50" />
                ))}
              </div>
            )}

            {!loading && error && (
              <p className="text-center text-muted-foreground">
                Announcements are temporarily unavailable. Please check back shortly.
              </p>
            )}

            {!loading && !error && announcements.length === 0 && (
              <p className="text-center text-muted-foreground">No announcements have been posted yet.</p>
            )}

            {!loading && !error && announcements.length > 0 && (
              <div className="space-y-4">
                {announcements.map((a) => (
                  <AnnouncementCard key={a.id} announcement={a} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
