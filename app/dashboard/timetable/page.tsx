'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getProfile } from '@/lib/supabase/profileService';
import { getTimetable } from '@/lib/supabase/timetableService';
import { Timetable, TimetableLevel } from '@/types/timetable';
import { CalendarClock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const LEVELS: TimetableLevel[] = ['100', '200', '300', '400'];

export default function TimetablePage() {
  const { currentUser } = useAuth();
  const [level, setLevel] = useState<TimetableLevel>('100');
  const [timetable, setTimetable] = useState<Timetable | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserLevel = async () => {
      if (!currentUser) return;
      try {
        const profile = await getProfile(currentUser.uid);
        const userLevel = profile?.level as TimetableLevel;
        if (userLevel && LEVELS.includes(userLevel)) setLevel(userLevel);
      } catch (error) {
        console.error('Error fetching user level:', error);
      }
    };
    fetchUserLevel();
  }, [currentUser]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getTimetable(level)
      .then((data) => {
        if (!cancelled) setTimetable(data);
      })
      .catch((err) => console.error('Error loading timetable:', err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [level]);

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-5">
        <h1 className="font-display text-2xl font-bold text-foreground">Tutorial Timetable</h1>
        <p className="mt-2 text-sm text-muted-foreground">Weekly tutorial schedule by level.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {LEVELS.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLevel(l)}
            className={cn(
              'px-4 py-1.5 text-sm font-medium transition-colors',
              level === l
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            {l} Level
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !timetable || (timetable.mode === 'rows' && timetable.rows.length === 0) || (timetable.mode === 'image' && !timetable.imageUrl) ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center shadow-sm">
          <CalendarClock className="mx-auto h-10 w-10 text-muted-foreground" />
          <h3 className="mt-3 text-sm font-medium text-foreground">No timetable set for {level} Level yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">Check back once it&apos;s been published.</p>
        </div>
      ) : timetable.mode === 'image' && timetable.imageUrl ? (
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <Image src={timetable.imageUrl} alt={`${level} Level timetable`} fill className="object-contain" unoptimized />
        </div>
      ) : (
        <div className="overflow-hidden overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-5 py-3 font-medium text-muted-foreground">Day</th>
                <th className="px-5 py-3 font-medium text-muted-foreground">Time</th>
                <th className="px-5 py-3 font-medium text-muted-foreground">Course</th>
                <th className="px-5 py-3 font-medium text-muted-foreground">Tutor</th>
                <th className="px-5 py-3 font-medium text-muted-foreground">Venue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {timetable.rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-5 py-3 font-medium text-foreground">{row.day}</td>
                  <td className="px-5 py-3 text-muted-foreground">{row.time}</td>
                  <td className="px-5 py-3 text-muted-foreground">{row.course}</td>
                  <td className="px-5 py-3 text-muted-foreground">{row.tutor}</td>
                  <td className="px-5 py-3 text-muted-foreground">{row.venue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
