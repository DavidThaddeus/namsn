-- Public receipt verification: the QR code on a printed/downloaded receipt
-- points at /verify/<reference>, a page anyone can open with no login. That
-- page must never expose email/phone or any other row from dues_requests
-- directly (RLS on the table stays exactly as restrictive as before) — this
-- function is the only public-facing surface, and it hands back only the
-- minimal fields needed to confirm a receipt is real, and only for rows
-- that are actually paid.
create or replace function public.verify_receipt(p_reference text)
returns table (
  reference text,
  full_name text,
  level text,
  status text,
  amount integer,
  fee_amount integer,
  total_amount integer,
  paid_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select reference, full_name, level, status, amount, fee_amount, total_amount, paid_at
  from public.dues_requests
  where dues_requests.reference = p_reference
    and payment_status = 'paid';
$$;

grant execute on function public.verify_receipt(text) to anon, authenticated;
