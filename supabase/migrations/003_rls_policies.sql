-- Stage 0, script 3: RLS policies. This is the real enforcement of the RBAC
-- model that hooks/useAdminRole.ts currently bypasses in the app — once
-- Slice 1 of the migration points that hook at profiles.role instead of a
-- hardcoded value, these policies are what actually stop a `student` from
-- writing to, say, courses, even if they somehow bypassed the UI entirely.
-- Run after 002_content_tables.sql.

-- Helper: current user's role, reusable in every policy below.
create function public.current_user_role()
returns user_role
language sql stable
security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- profiles ------------------------------------------------------------
-- Everyone can read their own row; super_admin can read everyone's (needed
-- for the Manage Admins list + email lookup on promote).
create policy "profiles_select" on public.profiles
  for select using (id = auth.uid() or public.current_user_role() = 'super_admin');

-- Anyone can update their own row (profile edits, photo URL, last-seen
-- timestamp); super_admin can update any row. Note: this alone would let a
-- student set their own `role` column — the protect_role_column trigger
-- from 001_profiles.sql is what actually blocks that, not this policy.
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

create policy "profiles_update_admin" on public.profiles
  for update using (public.current_user_role() = 'super_admin');

-- announcements ---------------------------------------------------------
-- Public read (home page, /announcements, and the dashboard are all
-- consumers, logged in or not) — matches current Firestore behavior.
create policy "announcements_select_public" on public.announcements
  for select using (true);

create policy "announcements_write_pro" on public.announcements
  for all using (public.current_user_role() in ('pro', 'super_admin'))
  with check (public.current_user_role() in ('pro', 'super_admin'));

-- events ------------------------------------------------------------------
create policy "events_select_public" on public.events
  for select using (true);

create policy "events_write_pro" on public.events
  for all using (public.current_user_role() in ('pro', 'super_admin'))
  with check (public.current_user_role() in ('pro', 'super_admin'));

-- courses -------------------------------------------------------------
-- Only ever displayed inside the authenticated dashboard now (the public
-- /courses page was removed), so read is authenticated-only.
create policy "courses_select_authenticated" on public.courses
  for select to authenticated using (true);

create policy "courses_write_librarian" on public.courses
  for all using (public.current_user_role() in ('librarian', 'super_admin'))
  with check (public.current_user_role() in ('librarian', 'super_admin'));

-- material_folders / materials ------------------------------------------
create policy "folders_select_authenticated" on public.material_folders
  for select to authenticated using (true);

create policy "folders_write_librarian" on public.material_folders
  for all using (public.current_user_role() in ('librarian', 'super_admin'))
  with check (public.current_user_role() in ('librarian', 'super_admin'));

create policy "materials_select_authenticated" on public.materials
  for select to authenticated using (true);

create policy "materials_write_librarian" on public.materials
  for all using (public.current_user_role() in ('librarian', 'super_admin'))
  with check (public.current_user_role() in ('librarian', 'super_admin'));

-- timetables ------------------------------------------------------------
create policy "timetables_select_authenticated" on public.timetables
  for select to authenticated using (true);

create policy "timetables_write_super_admin" on public.timetables
  for all using (public.current_user_role() = 'super_admin')
  with check (public.current_user_role() = 'super_admin');

-- quiz_registrations ------------------------------------------------------
-- Public submission form (no login required), admin-only read/review.
create policy "quiz_registrations_insert_public" on public.quiz_registrations
  for insert with check (true);

create policy "quiz_registrations_select_admin" on public.quiz_registrations
  for select using (public.current_user_role() = 'super_admin');

create policy "quiz_registrations_update_admin" on public.quiz_registrations
  for update using (public.current_user_role() = 'super_admin');
