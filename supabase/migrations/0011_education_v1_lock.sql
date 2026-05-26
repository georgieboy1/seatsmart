-- 0011_education_v1_lock.sql
-- Reconcile the earlier events/attendees pivot back to the education v1 app.
--
-- App terminology is Student/Class. The database keeps `cohorts` as the
-- physical table for classes to avoid a risky FK migration, but the student
-- table and layouts columns are restored to the names the v1 code expects.

do $$
begin
  if to_regclass('public.attendees') is not null
     and to_regclass('public.students') is null then
    alter table public.attendees rename to students;
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from pg_class where relname = 'attendees_user_id_idx'
  ) and not exists (
    select 1 from pg_class where relname = 'students_user_id_idx'
  ) then
    alter index public.attendees_user_id_idx rename to students_user_id_idx;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from pg_trigger
    where tgname = 'attendees_set_updated_at'
  ) then
    alter trigger attendees_set_updated_at
      on public.students
      rename to students_set_updated_at;
  end if;
end $$;

drop policy if exists "Users can view their own attendees" on public.students;
drop policy if exists "Users can insert their own attendees" on public.students;
drop policy if exists "Users can update their own attendees" on public.students;
drop policy if exists "Users can delete their own attendees" on public.students;
drop policy if exists "Users can view their own students" on public.students;
drop policy if exists "Users can insert their own students" on public.students;
drop policy if exists "Users can update their own students" on public.students;
drop policy if exists "Users can delete their own students" on public.students;

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

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'layouts'
      and column_name = 'attendees_per_group'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'layouts'
      and column_name = 'students_per_group'
  ) then
    alter table public.layouts
      rename column attendees_per_group to students_per_group;
  end if;
end $$;

-- Education v1 does not surface the marketplace/venue experiment. Keep this
-- non-destructive: detach layouts from venues if that legacy column exists,
-- but do not drop marketplace tables that may already contain local test data.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'layouts'
      and column_name = 'venue_id'
  ) then
    alter table public.layouts
      drop column venue_id;
  end if;
end $$;

notify pgrst, 'reload schema';
