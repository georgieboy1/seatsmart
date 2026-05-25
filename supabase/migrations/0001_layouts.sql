-- 0001_layouts.sql
-- Classroom layouts: grid + metadata for each user.
--
-- To apply: paste this file into Supabase Dashboard → SQL Editor → Run,
-- or run `supabase db push` if you have the Supabase CLI installed.

create table public.layouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('traditional', 'groups')),
  rows integer,
  columns integer,
  num_groups integer,
  students_per_group integer,
  grid jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index layouts_user_id_idx on public.layouts (user_id);

-- Row Level Security: each user can only see and modify their own layouts.
alter table public.layouts enable row level security;

create policy "Users can view their own layouts"
  on public.layouts for select
  using (auth.uid() = user_id);

create policy "Users can insert their own layouts"
  on public.layouts for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own layouts"
  on public.layouts for update
  using (auth.uid() = user_id);

create policy "Users can delete their own layouts"
  on public.layouts for delete
  using (auth.uid() = user_id);

-- Keep updated_at fresh on every UPDATE.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger layouts_set_updated_at
  before update on public.layouts
  for each row
  execute function public.set_updated_at();
