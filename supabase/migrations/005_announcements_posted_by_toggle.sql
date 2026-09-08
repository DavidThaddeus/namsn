-- Adds a per-announcement toggle for whether the poster's name is shown
-- publicly. Run this in the SQL Editor whenever you're back.
alter table public.announcements
  add column show_posted_by boolean not null default true;
