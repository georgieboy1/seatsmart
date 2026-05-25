-- 0003_seating_charts.sql
-- Seating charts: generated/manual student-to-seat assignments for layouts.
--
-- To apply: paste this file into Supabase Dashboard → SQL Editor → Run,
-- or run `supabase db push` if you have the Supabase CLI installed.
--
-- Depends on 0001_layouts.sql for layouts and the set_updated_at trigger
-- function.

create table public.seating_charts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  layout_id uuid not null references public.layouts(id),
  name text not null,
  assignments jsonb not null default '{}',
  locked_seats jsonb not null default '[]',
  score numeric,
  stale boolean not null default false,
  stale_reasons text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index seating_charts_user_id_idx on public.seating_charts (user_id);
create index seating_charts_layout_id_idx on public.seating_charts (layout_id);

-- Row Level Security: each user can only see and modify their own charts.
alter table public.seating_charts enable row level security;

create policy "Users can view their own seating charts"
  on public.seating_charts for select
  using (auth.uid() = user_id);

create policy "Users can insert their own seating charts"
  on public.seating_charts for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own seating charts"
  on public.seating_charts for update
  using (auth.uid() = user_id);

create policy "Users can delete their own seating charts"
  on public.seating_charts for delete
  using (auth.uid() = user_id);

create trigger seating_charts_set_updated_at
  before update on public.seating_charts
  for each row
  execute function public.set_updated_at();
