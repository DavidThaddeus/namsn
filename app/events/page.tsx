'use client';

import { useEffect, useState } from 'react';
import { Clock, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { SiteHeader } from '@/components/site/SiteHeader';
import { SiteFooter } from '@/components/site/SiteFooter';
import { Badge } from '@/components/ui/badge';
import { getEvents } from '@/lib/supabase/eventService';
import { DepartmentEvent } from '@/types/event';

export default function EventsPage() {
  const [events, setEvents] = useState<DepartmentEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getEvents()
      .then((data) => {
        if (!cancelled) setEvents(data);
      })
      .catch((err) => console.error('Error loading events:', err))
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
            <h1 className="font-display text-4xl font-bold text-foreground">Events</h1>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              Orientation programs, symposiums, and departmental activities.
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            {!loading && events.length === 0 && (
              <p className="text-center text-muted-foreground">
                No upcoming events — check back soon, or follow Announcements for updates.
              </p>
            )}

            {loading ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {[0, 1].map((i) => (
                  <div key={i} className="h-32 animate-pulse rounded-xl border border-border bg-muted/50" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="group flex gap-4 rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="flex h-16 w-16 flex-shrink-0 flex-col items-center justify-center bg-primary text-primary-foreground transition-colors duration-300 group-hover:bg-accent group-hover:text-accent-foreground">
                      <span className="text-xs font-medium">{format(event.date.toDate(), 'MMM')}</span>
                      <span className="text-lg font-bold">{format(event.date.toDate(), 'd')}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <Badge variant="secondary" className="mb-2">
                        {event.tag}
                      </Badge>
                      <h3 className="font-display text-lg font-semibold text-foreground">{event.title}</h3>
                      <div className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 flex-shrink-0" />
                          <span>{event.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 flex-shrink-0" />
                          <span>{event.venue}</span>
                        </div>
                      </div>
                    </div>
                  </div>
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
