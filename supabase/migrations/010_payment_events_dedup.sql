-- 009 gave payment_events an `event_type` column meant for the event's TYPE
-- (e.g. "collection.succeeded") but the webhook handler also needs Bachs'
-- own unique event id (e.g. "evt_...") to deduplicate at-least-once
-- deliveries — those are two different things and got conflated. Split them.
alter table public.payment_events
  add column bachs_event_id text unique;
