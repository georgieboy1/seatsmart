-- 0007_pivot_to_guests.sql
-- Pivot from Classroom Seating to Event & Wedding Seating.

-- 1. Rename the table
ALTER TABLE public.students RENAME TO guests;

-- 2. Rename columns to match new domain language
ALTER TABLE public.guests RENAME COLUMN peer_tutors TO must_sit_together;
ALTER TABLE public.guests RENAME COLUMN avoid TO strictly_separate;
ALTER TABLE public.guests RENAME COLUMN accommodations TO dietary_and_accessibility;

-- 3. Update indexes (optional but good for hygiene)
ALTER INDEX students_user_id_idx RENAME TO guests_user_id_idx;

-- 4. Update RLS policy names (Postgres policies are attached to the table)
-- Policies are usually renamed by dropping and recreating if needed, 
-- but renaming the table often keeps them. Let's ensure they are clean.
ALTER POLICY "Users can view their own students" ON public.guests RENAME TO "Users can view their own guests";
ALTER POLICY "Users can insert their own students" ON public.guests RENAME TO "Users can insert their own guests";
ALTER POLICY "Users can update their own students" ON public.guests RENAME TO "Users can update their own guests";
ALTER POLICY "Users can delete their own students" ON public.guests RENAME TO "Users can delete their own guests";

-- 5. Update the trigger name
ALTER TRIGGER students_set_updated_at ON public.guests RENAME TO guests_set_updated_at;
