-- Stage 0, script 2: content tables, matching the current Firestore shapes
-- (see types/announcement.ts, types/event.ts, types/course.ts, types/material.ts,
-- types/materialFolder.ts, types/timetable.ts, lib/firebase/quizService.ts).
-- Run after 001_profiles.sql.

-- Announcements ---------------------------------------------------------
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  is_important boolean not null default false,
  created_by uuid references public.profiles(id),
  created_by_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.announcements enable row level security;
create trigger announcements_set_updated_at
  before update on public.announcements
  for each row execute procedure public.set_updated_at();

-- Events ------------------------------------------------------------------
-- ("date"/"time" avoided as column names — they collide with Postgres type
-- names and read ambiguously in queries)
create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  tag text not null default 'Conference',
  event_date date not null,
  time_range text not null,
  venue text not null,
  is_important boolean not null default false,
  created_by uuid references public.profiles(id),
  created_by_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.events enable row level security;
create trigger events_set_updated_at
  before update on public.events
  for each row execute procedure public.set_updated_at();

-- Courses (learning videos) ------------------------------------------------
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  youtube_url text not null,
  thumbnail_url text,
  duration text default '0:00',
  category text not null,
  level text not null check (level in ('Beginner', 'Intermediate', 'Advanced')),
  is_published boolean not null default true,
  created_by uuid references public.profiles(id),
  created_by_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.courses enable row level security;
create trigger courses_set_updated_at
  before update on public.courses
  for each row execute procedure public.set_updated_at();

-- Material folders (course folders, or a "Past Questions" folder) ---------
create table public.material_folders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  level text not null check (level in ('100', '200', '300', '400')),
  type text not null default 'material' check (type in ('material', 'past_question')),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
alter table public.material_folders enable row level security;

-- Materials (files inside a folder) ---------------------------------------
create table public.materials (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  course_code text,
  course_name text,
  file_url text not null,
  file_type text not null default 'PDF',
  file_size text,
  level text check (level in ('100', '200', '300', '400')),
  type text default 'material' check (type in ('material', 'past_question')),
  folder_id uuid references public.material_folders(id) on delete set null,
  uploaded_by uuid references public.profiles(id),
  uploaded_by_name text,
  uploaded_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.materials enable row level security;
create trigger materials_set_updated_at
  before update on public.materials
  for each row execute procedure public.set_updated_at();

-- Timetables (one row per level) ------------------------------------------
create table public.timetables (
  level text primary key check (level in ('100', '200', '300', '400')),
  mode text not null default 'rows' check (mode in ('rows', 'image')),
  rows jsonb not null default '[]'::jsonb,
  image_url text,
  updated_at timestamptz not null default now()
);
alter table public.timetables enable row level security;
create trigger timetables_set_updated_at
  before update on public.timetables
  for each row execute procedure public.set_updated_at();

-- Quiz registrations (legacy feature, not in the PRD — migrated for parity,
-- confirm it's still wanted before building it into the app's Supabase layer) --
create table public.quiz_registrations (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  level_of_study text,
  statement_of_interest text,
  enthusiasm_rating int,
  status text not null default 'pending' check (status in ('pending', 'selected', 'rejected')),
  submitted_at timestamptz not null default now()
);
alter table public.quiz_registrations enable row level security;
