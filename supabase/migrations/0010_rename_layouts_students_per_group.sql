-- 0010_rename_layouts_students_per_group.sql
-- The TypeScript layer was renamed students_per_group -> attendees_per_group
-- during the events/education pivot, but the layouts table wasn't.
-- This catches the column up.
--
-- Idempotent: safe to re-run, handles any combination of existing columns.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'layouts'
      AND column_name = 'students_per_group'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'layouts'
      AND column_name = 'attendees_per_group'
  ) THEN
    ALTER TABLE public.layouts
      RENAME COLUMN students_per_group TO attendees_per_group;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
