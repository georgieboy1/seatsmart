-- Expand students table with logistical and health identifiers
ALTER TABLE public.students 
ADD COLUMN student_id TEXT,
ADD COLUMN age INTEGER,
ADD COLUMN family_name TEXT,
ADD COLUMN allergies TEXT[] NOT NULL DEFAULT '{}',
ADD COLUMN health_flags TEXT[] NOT NULL DEFAULT '{}';
