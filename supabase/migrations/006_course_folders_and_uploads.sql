-- Adds folders for courses (mirrors material_folders), and lets a course be
-- either a YouTube link (auto-fetched thumbnail) or a directly uploaded file
-- (e.g. a downloaded skill course video) instead of only YouTube.
-- Run this after 001-005 in the SQL Editor.

create table public.course_folders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
alter table public.course_folders enable row level security;

create policy "course_folders_select_authenticated" on public.course_folders
  for select to authenticated using (true);

create policy "course_folders_write_librarian" on public.course_folders
  for all using (public.current_user_role() in ('librarian', 'super_admin'))
  with check (public.current_user_role() in ('librarian', 'super_admin'));

alter table public.courses
  add column folder_id uuid references public.course_folders(id) on delete set null,
  add column source_type text not null default 'youtube' check (source_type in ('youtube', 'upload')),
  add column file_url text,
  alter column youtube_url drop not null;

alter table public.courses
  add constraint courses_source_url_check check (
    (source_type = 'youtube' and youtube_url is not null)
    or (source_type = 'upload' and file_url is not null)
  );

-- course-files: uploaded course videos/files. Readable by any logged-in
-- student; write restricted to librarian/super_admin, same rule as the
-- `courses` table itself. Supabase's project-wide upload size limit (Settings
-- -> Storage in the dashboard) still applies on top of this bucket limit —
-- raise that too if uploads of large course videos get rejected.
insert into storage.buckets (id, name, public, file_size_limit)
values ('course-files', 'course-files', true, 524288000);

create policy "course_files_bucket_read" on storage.objects
  for select to authenticated using (bucket_id = 'course-files');

create policy "course_files_bucket_write" on storage.objects
  for insert with check (
    bucket_id = 'course-files'
    and public.current_user_role() in ('librarian', 'super_admin')
  );

create policy "course_files_bucket_delete" on storage.objects
  for delete using (
    bucket_id = 'course-files'
    and public.current_user_role() in ('librarian', 'super_admin')
  );
