-- Super admin should only ever be able to view dues records and their
-- receipts/invoices — payment status must only ever change through the
-- signature-verified Bachs webhook (which uses the service-role key and
-- bypasses RLS entirely, so it's unaffected by this). Dropping this policy
-- is the real enforcement; the "Mark as Paid" button was already removed
-- from the UI, but a client could otherwise still call the update directly.
drop policy if exists "dues_update_admin" on public.dues_requests;
