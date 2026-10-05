-- Migration: Create applications table for recruitment registration
CREATE TABLE IF NOT EXISTS public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_no text NOT NULL UNIQUE,
  full_name text NOT NULL,
  scholar_number text NOT NULL UNIQUE,
  institute_email text NOT NULL UNIQUE,
  phone_number text NOT NULL,
  primary_track text NOT NULL,
  secondary_track text,
  portfolio_url text,
  motivation text NOT NULL,
  first_year_confirmed boolean NOT NULL DEFAULT true CHECK (first_year_confirmed = true),
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Grant permissions to anon and authenticated roles
GRANT ALL ON public.applications TO service_role;
GRANT INSERT, SELECT, UPDATE ON public.applications TO anon;
GRANT INSERT, SELECT, UPDATE ON public.applications TO authenticated;

-- Policies for anon submission, read, and update
DROP POLICY IF EXISTS "Anyone can submit an application" ON public.applications;
CREATE POLICY "Anyone can submit an application"
ON public.applications
FOR INSERT
TO anon, authenticated
WITH CHECK (first_year_confirmed = true);

DROP POLICY IF EXISTS "Anyone can view submitted applications" ON public.applications;
CREATE POLICY "Anyone can view submitted applications"
ON public.applications
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Anyone can update their application" ON public.applications;
CREATE POLICY "Anyone can update their application"
ON public.applications
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Auto update timestamp trigger
CREATE OR REPLACE FUNCTION public.set_applications_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_applications_updated_at ON public.applications;
CREATE TRIGGER set_applications_updated_at
BEFORE UPDATE ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.set_applications_updated_at();

-- Indexes for quick lookups and duplicate checks
CREATE INDEX IF NOT EXISTS applications_scholar_number_idx ON public.applications (scholar_number);
CREATE INDEX IF NOT EXISTS applications_institute_email_idx ON public.applications (institute_email);
CREATE INDEX IF NOT EXISTS applications_created_at_idx ON public.applications (created_at DESC);
