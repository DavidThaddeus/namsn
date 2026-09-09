-- Neither foreign key had an ON DELETE behavior, so Postgres defaulted to
-- blocking any delete of a dues_request that still had audit rows pointing
-- at it — which is every real one, since payment_events logs every webhook
-- delivery. That made cleaning out test data impossible via the table
-- editor. payment_events.dues_request_id is nullable, so a deleted invoice
-- just detaches from its audit trail (the raw payload still has everything,
-- including the id, if it's ever needed) rather than blocking the delete.
-- payment_splits.dues_request_id is not null and meaningless without its
-- invoice, so those rows are safe to cascade-delete along with it.
alter table public.payment_events
  drop constraint payment_events_dues_request_id_fkey,
  add constraint payment_events_dues_request_id_fkey
    foreign key (dues_request_id) references public.dues_requests(id) on delete set null;

alter table public.payment_splits
  drop constraint payment_splits_dues_request_id_fkey,
  add constraint payment_splits_dues_request_id_fkey
    foreign key (dues_request_id) references public.dues_requests(id) on delete cascade;
