-- A student can already pay dues on a friend's behalf (the form doesn't
-- restrict name/matric to the logged-in account — genuinely useful for
-- someone without a working phone or data). But visibility was tied only
-- to created_by, so the actual student it was paid FOR could never find
-- their own invoice/receipt afterward under their own login — only the
-- friend who submitted it could. Now a student can also see any dues
-- record whose matric_number matches their own profile, regardless of who
-- created it, alongside anything they personally submitted and (for
-- super_admin) everything.
drop policy if exists "dues_select_own_or_admin" on public.dues_requests;

create policy "dues_select_own_or_admin" on public.dues_requests
  for select using (
    created_by = auth.uid()
    or matric_number = (select matric_number from public.profiles where id = auth.uid())
    or public.current_user_role() = 'super_admin'
  );
