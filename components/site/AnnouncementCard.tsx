import { Bell, Star } from 'lucide-react';
import { format } from 'date-fns';
import { Announcement } from '@/types/announcement';

export function AnnouncementCard({ announcement }: { announcement: Announcement }) {
  const { title, content, isImportant, showPostedBy, createdByName, createdAt } = announcement;

  const meta = (
    <>
      {showPostedBy && `Posted by ${createdByName} · `}
      {format(createdAt.toDate(), 'MMM d, yyyy')}
    </>
  );

  if (isImportant) {
    return (
      <div className="bg-secondary p-6 text-secondary-foreground shadow-sm">
        <span className="inline-flex items-center gap-1.5 bg-accent px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-accent-foreground">
          <Star className="h-3 w-3" /> Important
        </span>
        <h3 className="font-display mt-3 text-lg font-semibold text-white">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-secondary-foreground/85">{content}</p>
        <p className="mt-4 text-xs text-secondary-foreground/70">{meta}</p>
      </div>
    );
  }

  return (
    <div className="border border-border bg-card p-6 shadow-sm">
      <span className="inline-flex items-center gap-1.5 bg-primary/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
        <Bell className="h-3 w-3" /> Announcement
      </span>
      <h3 className="font-display mt-3 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{content}</p>
      <p className="mt-4 text-xs text-muted-foreground">{meta}</p>
    </div>
  );
}
