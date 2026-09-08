-- Stage 0, script 1: roles + profiles table + auto-create-on-signup trigger.
-- Run this first in the Supabase SQL Editor.

create type user_role as enum ('student', 'super_admin', 'pro', 'librarian');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  first_name text,
  last_name text,
  matric_number text,
  department text default 'Mathematics',
  level text check (level in ('100', '200', '300', '400')),
  phone text,
  address text,
  photo_url text,
  role user_role not null default 'student',
  last_seen_announcements_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Auto-create a profile row whenever someone signs up via Supabase Auth,
-- mirroring what AuthContext.tsx's signup() currently does by hand for the
-- Firestore `users` collection.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Keep updated_at current on every UPDATE. Reused by later migration scripts
-- for every other table that has an updated_at column.
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- Defense in depth: block a non-super_admin from changing their own (or
-- anyone else's) role even if an RLS policy bug ever let the UPDATE through.
create function public.prevent_self_role_escalation()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    if (select role from public.profiles where id = auth.uid()) <> 'super_admin' then
      raise exception 'Only a super_admin can change roles';
    end if;
  end if;
  return new;
end;
$$;

create trigger protect_role_column
  before update on public.profiles
  for each row execute procedure public.prevent_self_role_escalation();
