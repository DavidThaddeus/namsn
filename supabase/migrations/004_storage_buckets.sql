-- Stage 0, script 4: storage buckets, replacing Firebase Storage.
-- Run after 003_rls_policies.sql.
--
-- Current upload paths in the app (for reference, so the object-name checks
-- below line up once Slice 1+ rewires them to Supabase Storage):
--   profile photo -> bucket "profile-photos", object name = the user's uid
--   materials      -> bucket "materials",      object name = "<timestamp>-<filename>"
--   timetable image-> bucket "timetables",     object name = "<level>-<timestamp>-<filename>"

insert into storage.buckets (id, name, public)
values
  ('profile-photos', 'profile-photos', true),
  ('materials', 'materials', true),
  ('timetables', 'timetables', true);

-- profile-photos: anyone can view; a user can only write to the object
-- named exactly after their own uid.
create policy "profile_photos_read" on storage.objects
  for select using (bucket_id = 'profile-photos');

create policy "profile_photos_write_own" on storage.objects
  for insert with check (bucket_id = 'profile-photos' and name = auth.uid()::text);

create policy "profile_photos_update_own" on storage.objects
  for update using (bucket_id = 'profile-photos' and name = auth.uid()::text);

-- materials: readable by any logged-in student; write restricted to
-- librarian/super_admin, same rule as the `materials` table itself.
create policy "materials_bucket_read" on storage.objects
  for select to authenticated using (bucket_id = 'materials');

create policy "materials_bucket_write" on storage.objects
  for insert with check (
    bucket_id = 'materials'
    and public.current_user_role() in ('librarian', 'super_admin')
  );

create policy "materials_bucket_delete" on storage.objects
  for delete using (
    bucket_id = 'materials'
    and public.current_user_role() in ('librarian', 'super_admin')
  );

-- timetables: readable by any logged-in student; write restricted to
-- super_admin, same rule as the `timetables` table itself.
create policy "timetables_bucket_read" on storage.objects
  for select to authenticated using (bucket_id = 'timetables');

create policy "timetables_bucket_write" on storage.objects
  for insert with check (
    bucket_id = 'timetables'
    and public.current_user_role() = 'super_admin'
  );

create policy "timetables_bucket_update" on storage.objects
  for update using (
    bucket_id = 'timetables'
    and public.current_user_role() = 'super_admin'
  );
