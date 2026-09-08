-- Lets super_admin manage the Executive Council and Lecturers rosters
-- (add/edit/remove, including photos and brand-new positions) instead of
-- them being hardcoded in lib/data/*.ts. Public read (shown on the home page
-- and /staff with no login required); write restricted to super_admin only.

create table public.executives (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  image_url text not null,
  bio text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.executives enable row level security;
create trigger executives_set_updated_at
  before update on public.executives
  for each row execute procedure public.set_updated_at();

create policy "executives_select_public" on public.executives
  for select using (true);

create policy "executives_write_super_admin" on public.executives
  for all using (public.current_user_role() = 'super_admin')
  with check (public.current_user_role() = 'super_admin');

create table public.lecturers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  title text not null,
  specialization text not null default '',
  image_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.lecturers enable row level security;
create trigger lecturers_set_updated_at
  before update on public.lecturers
  for each row execute procedure public.set_updated_at();

create policy "lecturers_select_public" on public.lecturers
  for select using (true);

create policy "lecturers_write_super_admin" on public.lecturers
  for all using (public.current_user_role() = 'super_admin')
  with check (public.current_user_role() = 'super_admin');

-- people-photos: uploaded executive/lecturer photos. Public read (shown on
-- public pages); write restricted to super_admin, same rule as the tables.
insert into storage.buckets (id, name, public)
values ('people-photos', 'people-photos', true);

create policy "people_photos_read" on storage.objects
  for select using (bucket_id = 'people-photos');

create policy "people_photos_write_super_admin" on storage.objects
  for insert with check (
    bucket_id = 'people-photos'
    and public.current_user_role() = 'super_admin'
  );

create policy "people_photos_delete_super_admin" on storage.objects
  for delete using (
    bucket_id = 'people-photos'
    and public.current_user_role() = 'super_admin'
  );

-- Seed with the current roster (previously hardcoded in lib/data/executives.ts
-- and lib/data/lecturers.ts) so nothing disappears from the site. Photo paths
-- point at the existing files already in /public — next/image renders a
-- relative path just as well as a full Supabase Storage URL.
insert into public.executives (name, role, image_url, bio, sort_order) values
  ('Olojede Abisola', 'President', '/prof.jpg', 'Leads the department, oversees activities, and represents students in official matters.', 0),
  ('Olutade Akorede', 'Vice President', '/korede.jpg', 'Assists the president and takes charge in their absence.', 1),
  ('Abdulazeez Ridwan', 'General Secretary', '/arridoh.jpg', 'Coordinates department activities, manages records, and ensures smooth operations.', 2),
  ('Adegbenro Mustapha', 'Asst. General Secretary', '/kudus.jpg', 'Supports the secretary and fills in when needed.', 3),
  ('Mercy Osatofo', 'Welfare Director', '/mercy.jpg', 'Coordinates welfare activities and ensures student well-being.', 4),
  ('Oyenola Philip', 'Financial Secretary', '/philip.jpg', 'Coordinates financial activities and ensures proper management of funds.', 5),
  ('Ajayi Alice', 'Treasurer', '/alice.jpg', 'Coordinates financial activities and ensures proper management of funds.', 6),
  ('Olabode Goodness', 'P.R.O 1', '/ogd.jpg', 'Handles communication, publicity, and external relations.', 7),
  ('Lelile Oriade', 'Sport Director', '/kendo.jpg', 'Coordinates sporting activities and competitions.', 8),
  ('Onadairo Johnson', 'Librarian', '/hammed.jpg', 'Manages academic materials, books, and resources.', 9),
  ('Adetoye Martins', 'Social Director', '/fawas.jpg', 'Organizes social events and programs.', 10),
  ('Bankole Isreal', 'P.R.O 2', '/samod.jpg', 'Assists P.R.O. 1 in publicity and student communication.', 11);

insert into public.lecturers (name, title, specialization, image_url, sort_order) values
  ('Prof. Olajuwon Bakai', 'Professor', 'Applied Mathematics', '/olajuwon.jpg', 0),
  ('Prof. Adeniran Olushola', 'Professor', 'Algebra', '/adeniran.jpg', 1),
  ('Dr. Ilojide Emmanuel', 'Head Of Department', 'Mathematical Statistics', '/ilojide.jpg', 2),
  ('Prof. A.A.A Agboola', 'Professor', 'Fuzzy Algebra', '/avatar.png', 3),
  ('Prof. Oguntuase James', 'Professor', 'Analysis', '/avatar.png', 4),
  ('Prof. Osinuga Idowu', 'Professor', 'Optimization', '/avatar.png', 5),
  ('Dr. Adeleke Emmanuel', 'Senior Lecturer', 'Mathematical Modelling', '/avatar.png', 6),
  ('Dr. Ogunsola Olufemi', 'Lecturer I', 'Applied Mathematics', '/ogunsola.jpg', 7),
  ('Dr. Raji Tayo', 'Senior Lecturer', 'Numerical Analysis', '/avatar.png', 8),
  ('Dr. Fagbemiro Olalekan', 'Senior Lecturer', 'Applied Mathematics', '/avatar.png', 9),
  ('Dr. Adeyanju Adedotun', 'Lecturer I', 'O.D.E', '/avatar.png', 10),
  ('Dr. Yusuf Abdullahi', 'Senior Lecturer', 'Complex Analysis', '/yusuf.jpg', 11),
  ('Dr. Adams Oluwasegun', 'Senior Lecturer', 'O.D.E', '/adams.jpg', 12),
  ('Dr. Francis Nkwuda', 'Lecturer II', 'Mathematical Analysis', '/francis.jpg', 13);
