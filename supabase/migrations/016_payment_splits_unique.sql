-- One ledger row per recipient per invoice, so recording splits twice (webhook
-- and return-page confirm can both fire) can't double-count. amount becomes
-- numeric because the developer's share can include kobo.
alter table public.payment_splits
  alter column amount type numeric(12, 2);

create unique index payment_splits_dues_recipient_key
  on public.payment_splits (dues_request_id, recipient);
