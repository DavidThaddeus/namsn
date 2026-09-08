import Image from 'next/image';
import { SiteHeader } from '@/components/site/SiteHeader';
import { SiteFooter } from '@/components/site/SiteFooter';
import { getLecturers } from '@/lib/supabase/lecturerService';

// Without this, Next statically freezes this page's data at build time —
// an admin adding/editing a lecturer afterwards wouldn't show up until the
// next rebuild. This also means `next build` no longer needs the Supabase
// table to exist yet, since it stops trying to prerender the data.
export const dynamic = 'force-dynamic';

export default async function StaffPage() {
  const lecturers = await getLecturers();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <section className="border-b border-border bg-muted/40 py-16">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <h1 className="font-display text-4xl font-bold text-foreground">Department Lecturers</h1>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              Meet the faculty of the Department of Mathematics, FUNAAB.
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {lecturers.map((lecturer) => (
                <div
                  key={lecturer.id}
                  className="overflow-hidden rounded-xl border border-border bg-card text-center shadow-sm"
                >
                  <div className="flex h-56 items-center justify-center bg-muted">
                    <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-card shadow-md">
                      <Image src={lecturer.imageUrl} alt={lecturer.name} fill className="object-cover" sizes="128px" unoptimized />
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-display text-base font-semibold text-foreground">{lecturer.name}</h3>
                    <p className="mt-1 text-sm font-medium text-secondary">{lecturer.title}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{lecturer.specialization}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
