-- 0002_students.sql
-- Students: roster entries owned by each user.
--
-- To apply: paste this file into Supabase Dashboard → SQL Editor → Run,
-- or run `supabase db push` if you have the Supabase CLI installed.
--
-- Depends on 0001_layouts.sql for the set_updated_at trigger function.

create table public.students (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  prosocial_traits text[] not null default '{}',
  antisocial_traits text[] not null default '{}',
  accommodations text[] not null default '{}',
  peer_tutors uuid[] not null default '{}',
  avoid uuid[] not null default '{}',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index students_user_id_idx on public.students (user_id);

-- Row Level Security: each user can only see and modify their own students.
alter table public.students enable row level security;

create policy "Users can view their own students"
  on public.students for select
  using (auth.uid() = user_id);

create policy "Users can insert their own students"
  on public.students for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own students"
  on public.students for update
  using (auth.uid() = user_id);

create policy "Users can delete their own students"
  on public.students for delete
  using (auth.uid() = user_id);

create trigger students_set_updated_at
  before update on public.students
  for each row
  execute function public.set_updated_at();
