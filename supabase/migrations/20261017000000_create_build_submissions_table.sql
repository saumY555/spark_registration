-- Migration: Create build_submissions table for Drop Your Build feature
CREATE TABLE IF NOT EXISTS public.build_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scholar_number text NOT NULL,
  student_name text NOT NULL,
  website_url text NOT NULL,
  github_url text,
  screenshot_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.build_submissions ENABLE ROW LEVEL SECURITY;

-- Grant permissions to anon, authenticated, and service_role
GRANT ALL ON public.build_submissions TO service_role;
GRANT INSERT, SELECT ON public.build_submissions TO anon, authenticated;

-- Policies for public build submission and reading
DROP POLICY IF EXISTS "Anyone can submit a build" ON public.build_submissions;
CREATE POLICY "Anyone can submit a build"
ON public.build_submissions
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view build submissions" ON public.build_submissions;
CREATE POLICY "Anyone can view build submissions"
ON public.build_submissions
FOR SELECT
TO anon, authenticated
USING (true);

-- Auto update timestamp trigger
CREATE OR REPLACE FUNCTION public.set_build_submissions_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_build_submissions_updated_at ON public.build_submissions;
CREATE TRIGGER set_build_submissions_updated_at
BEFORE UPDATE ON public.build_submissions
FOR EACH ROW EXECUTE FUNCTION public.set_build_submissions_updated_at();

-- Indexes for quick lookups
CREATE INDEX IF NOT EXISTS build_submissions_scholar_number_idx ON public.build_submissions (scholar_number);
CREATE INDEX IF NOT EXISTS build_submissions_created_at_idx ON public.build_submissions (created_at DESC);
