-- 0005_add_cohorts.sql
-- Cohorts: groupings of students for multi-class / multi-period support.
-- Adds the cohorts table plus an optional cohort_id on students and
-- seating_charts.
--
-- To apply: paste this file into Supabase Dashboard → SQL Editor → Run.
--
-- Depends on 0001_layouts.sql for the public.set_updated_at trigger function.

-- 1. cohorts table
create table public.cohorts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index cohorts_user_id_idx on public.cohorts (user_id);

-- 2. Row Level Security: each user can only see and modify their own cohorts.
alter table public.cohorts enable row level security;

create policy "Users can view their own cohorts"
  on public.cohorts for select
  using (auth.uid() = user_id);

create policy "Users can insert their own cohorts"
  on public.cohorts for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own cohorts"
  on public.cohorts for update
  using (auth.uid() = user_id);

create policy "Users can delete their own cohorts"
  on public.cohorts for delete
  using (auth.uid() = user_id);

-- 3. updated_at trigger, reusing the function from 0001_layouts.sql.
create trigger cohorts_set_updated_at
  before update on public.cohorts
  for each row
  execute function public.set_updated_at();

-- 4. Link students to cohorts.
-- ON DELETE SET NULL: deleting a cohort orphans its students rather than
-- destroying them. The student remains in the roster; the teacher can
-- re-assign them.
alter table public.students
  add column cohort_id uuid references public.cohorts(id) on delete set null;

create index students_cohort_id_idx on public.students (cohort_id);

-- 5. Link seating_charts to cohorts.
-- ON DELETE SET NULL (not CASCADE) per CLAUDE.md "never silently drop
-- data": deleting a cohort must not silently destroy the charts that
-- were generated for it. The chart stays; the cohort_id goes null,
-- the chart's stale flag should be set by the deleteCohort action.
alter table public.seating_charts
  add column cohort_id uuid references public.cohorts(id) on delete set null;

create index seating_charts_cohort_id_idx on public.seating_charts (cohort_id);

-- 6. Tell PostgREST to refresh its schema cache so the new table/columns
-- are immediately queryable (otherwise it polls every ~10 minutes).
notify pgrst, 'reload schema';
