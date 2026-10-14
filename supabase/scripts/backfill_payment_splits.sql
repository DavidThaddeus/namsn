-- One-off: create ledger rows for invoices that were paid before the
-- payment_splits ledger existed (or while the webhook was disabled).
-- Safe to run more than once — the unique (dues_request_id, recipient)
-- index from migration 016 skips anything already recorded.
-- Mirrors lib/bachs/split.ts: Bachs fee = 1.5% of total (rounded up to the
-- kobo, max 2000), developer gets fee_amount minus that, department the rest.
with paid as (
  select id, amount, fee_amount, total_amount,
         least(ceil(total_amount * 0.015 * 100) / 100, 2000) as bachs_fee
  from public.dues_requests
  where payment_status = 'paid'
)
insert into public.payment_splits (dues_request_id, recipient, amount)
select id, 'department', amount from paid
union all
select id, 'developer', greatest(0, fee_amount - bachs_fee) from paid
on conflict (dues_request_id, recipient) do nothing;

-- Then check what you are owed in total, split by the fee that was charged:
select d.fee_amount as fee_charged,
       count(*) as payments,
       sum(s.amount) as developer_total
from public.payment_splits s
join public.dues_requests d on d.id = s.dues_request_id
where s.recipient = 'developer'
group by d.fee_amount
order by d.fee_amount;
