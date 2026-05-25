-- 0008_multi_industry_support.sql
-- Rename guests to attendees and add workspace profiles.

ALTER TABLE public.guests RENAME TO attendees;
ALTER TABLE public.attendees RENAME COLUMN must_sit_together TO together_ids;
ALTER TABLE public.attendees RENAME COLUMN strictly_separate TO separate_ids;
ALTER TABLE public.attendees RENAME COLUMN dietary_and_accessibility TO constraints;
ALTER TABLE public.attendees RENAME COLUMN student_id TO external_id;

ALTER INDEX guests_user_id_idx RENAME TO attendees_user_id_idx;

ALTER POLICY "Users can view their own guests"
  ON public.attendees
  RENAME TO "Users can view their own attendees";
ALTER POLICY "Users can insert their own guests"
  ON public.attendees
  RENAME TO "Users can insert their own attendees";
ALTER POLICY "Users can update their own guests"
  ON public.attendees
  RENAME TO "Users can update their own attendees";
ALTER POLICY "Users can delete their own guests"
  ON public.attendees
  RENAME TO "Users can delete their own attendees";

ALTER TRIGGER guests_set_updated_at
  ON public.attendees
  RENAME TO attendees_set_updated_at;

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_type TEXT NOT NULL DEFAULT 'education'
    CHECK (workspace_type IN ('education', 'events')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, workspace_type)
  VALUES (new.id, 'education')
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

INSERT INTO public.profiles (id, workspace_type)
SELECT id, 'education' FROM auth.users
ON CONFLICT (id) DO NOTHING;

NOTIFY pgrst, 'reload schema';
