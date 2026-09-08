-- Phase 4: Bachs payment integration. Extends dues_requests with the fee
-- breakdown and Bachs' own collection reference, and adds two new tables:
-- payment_events (a raw audit log of every webhook Bachs sends us — also
-- what makes idempotency possible, since a webhook can be delivered more
-- than once) and payment_splits (the department/developer transfer split
-- triggered once a payment is confirmed).
--
-- Both new tables are written to ONLY by the server-side webhook handler,
-- which uses the Supabase service-role key (bypasses RLS entirely) — never
-- by the browser. RLS below still restricts reads to super_admin, as
-- defense-in-depth in case that assumption is ever wrong.

alter table public.dues_requests
  add column fee_amount integer not null default 0,
  add column total_amount integer,
  add column bachs_collection_id text,
  add column paid_at timestamptz;

-- Backfill: existing pre-Bachs rows had no fee, so total = base amount.
update public.dues_requests set total_amount = amount where total_amount is null;
alter table public.dues_requests alter column total_amount set not null;

create table public.payment_events (
  id uuid primary key default gen_random_uuid(),
  dues_request_id uuid references public.dues_requests(id),
  event_type text not null,
  bachs_collection_id text,
  payload jsonb not null,
  received_at timestamptz not null default now()
);
alter table public.payment_events enable row level security;

create policy "payment_events_select_admin" on public.payment_events
  for select using (public.current_user_role() = 'super_admin');

create table public.payment_splits (
  id uuid primary key default gen_random_uuid(),
  dues_request_id uuid not null references public.dues_requests(id),
  recipient text not null check (recipient in ('department', 'developer')),
  amount integer not null,
  bachs_transfer_id text,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  created_at timestamptz not null default now()
);
alter table public.payment_splits enable row level security;

create policy "payment_splits_select_admin" on public.payment_splits
  for select using (public.current_user_role() = 'super_admin');
