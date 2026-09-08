'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, BellRing, BookOpen, CalendarDays, Clock, MapPin, ReceiptText } from 'lucide-react';
import { format } from 'date-fns';
import { SiteHeader } from '@/components/site/SiteHeader';
import { SiteFooter } from '@/components/site/SiteFooter';
import { ExecutiveCard } from '@/components/site/ExecutiveCard';
import { ValuesList } from '@/components/site/ValuesList';
import { AnnouncementCard } from '@/components/site/AnnouncementCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getAnnouncements } from '@/lib/supabase/announcementService';
import { Announcement } from '@/types/announcement';
import { getExecutives } from '@/lib/supabase/executiveService';
import { Executive } from '@/types/executive';
import { getEvents } from '@/lib/supabase/eventService';
import { DepartmentEvent } from '@/types/event';

const offerings = [
  {
    icon: BookOpen,
    title: 'Course Materials',
    description: 'Browse and download lecture materials organized by level and course.',
    href: '/auth/login',
  },
  {
    icon: BellRing,
    title: 'Announcements',
    description: 'Stay current with departmental notices, deadlines, and updates.',
    href: '/announcements',
  },
  {
    icon: ReceiptText,
    title: 'Dues & Receipts',
    description: 'Pay departmental dues and keep verifiable digital receipts on record.',
    href: '/auth/login',
  },
  {
    icon: CalendarDays,
    title: 'Events',
    description: 'Track orientation programs, symposiums, and departmental activities.',
    href: '/events',
  },
];

export default function Home() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [events, setEvents] = useState<DepartmentEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [executives, setExecutives] = useState<Executive[]>([]);

  useEffect(() => {
    let cancelled = false;
    getAnnouncements(3)
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

  useEffect(() => {
    let cancelled = false;
    getEvents()
      .then((data) => {
        if (!cancelled) setEvents(data.slice(0, 4));
      })
      .catch((err) => console.error('Error loading events:', err))
      .finally(() => {
        if (!cancelled) setEventsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    getExecutives()
      .then((data) => {
        if (!cancelled) setExecutives(data);
      })
      .catch((err) => console.error('Error loading executives:', err));
    return () => {
      cancelled = true;
    };
  }, []);

  // Arriving here from another page with a #hash (e.g. the "Executives" nav
  // link) loads the page and then jumps to the anchor instantly — browsers
  // don't apply `scroll-behavior: smooth` to that initial fragment scroll.
  // Do it manually so it's smooth from any entry point, not just in-page clicks.
  useEffect(() => {
    if (!window.location.hash) return;
    const id = window.location.hash.slice(1);
    const timer = setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative flex min-h-[600px] items-center overflow-hidden sm:min-h-[680px] lg:min-h-[760px]">
          <Image
            src="/mtsimage1.jpg"
            alt="NAMSN students gathered at the FUNAAB campus gate"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/30" />

          <div className="relative mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 lg:px-8">
            <p className="font-display text-sm font-semibold uppercase tracking-widest text-white">
              Department of Mathematics, FUNAAB
            </p>
            <h1 className="font-display mt-4 text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
              The Home <span className="text-accent">Of Future</span>
              <br />
              Mathematicians
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/85">
              Mathematics is not just about numbers and theorems. Mathematicians are the bridge
              between theory and breakthrough.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                asChild
                className="relative overflow-hidden bg-accent text-accent-foreground before:absolute before:inset-0 before:origin-right before:scale-x-0 before:bg-white before:transition-transform before:duration-300 before:ease-out hover:bg-accent hover:before:scale-x-100"
              >
                <Link href="/auth/login">
                  <span className="relative z-10 flex items-center gap-2">
                    Student Login <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="rounded-none border-white bg-white/10 text-white backdrop-blur-sm transition-transform duration-200 hover:scale-105 hover:bg-white/10 hover:text-white"
              >
                <Link href="/auth/login">Get Course Materials</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* About */}
        <section id="about" className="scroll-mt-20 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-12 md:grid-cols-2">
              <div>
                <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
                  About Our Department
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                  Mathematics is a subject of varied features ranging from intrinsic beauty to its
                  usefulness with wide-scope of applications in Science, Engineering, Technology
                  and Social Sciences. This Mathematics programme is designed for students who are
                  interested in these features. The curriculum has been carefully planned to
                  equip students with a broad knowledge from various aspects of Mathematics.
                </p>
                <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                  The curriculum has been carefully planned to assist the students to specialize
                  according to their own aptitude in Pure Mathematics or in any area of Applied
                  Mathematics.
                </p>
              </div>
              <div className="rounded-3xl bg-muted p-8">
                <div className="relative h-80 w-full overflow-hidden rounded-2xl shadow-xl">
                  <Image
                    src="/mtsimage2.jpg"
                    alt="NAMSN students on a department excursion at Olumo Rock"
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
              </div>
            </div>

            <div className="mt-16">
              <h3 className="font-display text-center text-2xl font-bold text-foreground">
                Mission, Vision &amp; Values
              </h3>
              <div className="mt-6">
                <ValuesList />
              </div>
            </div>
          </div>
        </section>

        {/* Offerings */}
        <section className="bg-muted/40 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-3xl font-bold text-foreground">
                Everything the department runs on
              </h2>
              <p className="mt-3 text-muted-foreground">
                One platform for the day-to-day of departmental life.
              </p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {offerings.map((item) => {
                const content = (
                  <>
                    <div className="flex h-11 w-11 items-center justify-center bg-primary text-primary-foreground">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-display mt-4 text-lg font-semibold text-foreground">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  </>
                );

                if (!item.href) {
                  return (
                    <div key={item.title} className="rounded-xl border border-border bg-card p-6 shadow-sm">
                      {content}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="cursor-pointer rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
                  >
                    {content}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Events */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="font-display text-3xl font-bold text-foreground">Upcoming Events</h2>
                <p className="mt-2 text-muted-foreground">
                  Symposiums, orientation programs, and departmental activities.
                </p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/events">
                  View all events <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {eventsLoading &&
                [0, 1].map((i) => (
                  <div key={i} className="h-32 animate-pulse rounded-xl border border-border bg-muted/50" />
                ))}

              {!eventsLoading && events.length === 0 && (
                <p className="col-span-2 text-sm text-muted-foreground">
                  No upcoming events — check back soon.
                </p>
              )}

              {!eventsLoading &&
                events.map((event) => (
                <div
                  key={event.id}
                  className="group flex cursor-pointer gap-4 rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex h-16 w-16 flex-shrink-0 flex-col items-center justify-center bg-primary text-primary-foreground transition-colors duration-200 group-hover:bg-accent group-hover:text-accent-foreground">
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
          </div>
        </section>

        {/* Executives */}
        <section id="executives" className="scroll-mt-20 bg-muted/40 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-3xl font-bold text-foreground">Executive Council</h2>
              <p className="mt-3 text-muted-foreground">
                The current NAMSN FUNAAB executive council.
              </p>
            </div>
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {executives.map((member) => (
                <ExecutiveCard key={member.id} name={member.name} role={member.role} bio={member.bio} image={member.imageUrl} />
              ))}
            </div>
            <div className="mt-12 text-center">
              <Button
                size="lg"
                asChild
                className="relative overflow-hidden bg-accent text-accent-foreground before:absolute before:inset-0 before:origin-right before:scale-x-0 before:bg-white before:transition-transform before:duration-300 before:ease-out hover:bg-accent hover:before:scale-x-100"
              >
                <Link href="/staff">
                  <span className="relative z-10 flex items-center gap-2">
                    Meet the Lecturers <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Announcements */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="font-display text-3xl font-bold text-foreground">
                  Latest Announcements
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Recent notices from the department and executive council.
                </p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/announcements">
                  View all <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {loading &&
                [0, 1, 2].map((i) => (
                  <div key={i} className="h-40 animate-pulse rounded-xl border border-border bg-muted/50" />
                ))}

              {!loading && error && (
                <p className="col-span-3 text-sm text-muted-foreground">
                  Announcements are temporarily unavailable. Please check back shortly.
                </p>
              )}

              {!loading && !error && announcements.length === 0 && (
                <p className="col-span-3 text-sm text-muted-foreground">
                  No announcements have been posted yet.
                </p>
              )}

              {!loading &&
                !error &&
                announcements.map((a) => <AnnouncementCard key={a.id} announcement={a} />)}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
