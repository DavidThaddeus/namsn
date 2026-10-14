-- Direct Entry (DE) freshers pay dues as their own level but at the FRESHERS
-- rate, so 'DE' is added to the allowed levels (status stays FRESHERS/STAYLITES).
alter table public.dues_requests
  drop constraint dues_requests_level_check,
  add constraint dues_requests_level_check
    check (level in ('100', 'DE', '200', '300', '400'));
