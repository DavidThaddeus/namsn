-- Lets the super admin flag a ledger row as paid out (or failed) from the
-- Payouts page. Read access already exists from 009; inserts only ever come
-- from the service-role client in the webhook/confirm paths.
create policy "payment_splits_update_admin" on public.payment_splits
  for update
  using (public.current_user_role() = 'super_admin')
  with check (public.current_user_role() = 'super_admin');
