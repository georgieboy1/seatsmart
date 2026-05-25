-- 0004_fix_charts_schema.sql
-- Add seed and fix locked_seats default

ALTER TABLE public.seating_charts 
ADD COLUMN seed integer NOT NULL DEFAULT 0;

ALTER TABLE public.seating_charts 
ALTER COLUMN locked_seats SET DEFAULT '{}'::jsonb;

-- If there are existing rows with array-style locked_seats, we should ideally migrate them.
-- Since this is early development, we'll just ensure the default is correct.
-- If we wanted to migrate:
-- UPDATE public.seating_charts SET locked_seats = '{}'::jsonb WHERE jsonb_typeof(locked_seats) = 'array';
