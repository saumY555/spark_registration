-- Migration: Change unique constraint from separate scholar/email to composite (scholar_number, institute_email)
-- This allows:
-- 1. Same scholar number with different emails (both records kept)
-- 2. Same email with different scholar numbers (both records kept)
-- 3. Blocks duplicate entries only when BOTH scholar_number AND institute_email are identical.

ALTER TABLE public.applications DROP CONSTRAINT IF EXISTS applications_scholar_number_key;
ALTER TABLE public.applications DROP CONSTRAINT IF EXISTS applications_institute_email_key;

DROP INDEX IF EXISTS public.applications_scholar_number_key;
DROP INDEX IF EXISTS public.applications_institute_email_key;

-- Add composite unique constraint
ALTER TABLE public.applications DROP CONSTRAINT IF EXISTS applications_scholar_email_unique;
ALTER TABLE public.applications ADD CONSTRAINT applications_scholar_email_unique UNIQUE (scholar_number, institute_email);

CREATE INDEX IF NOT EXISTS applications_scholar_email_composite_idx ON public.applications (scholar_number, institute_email);
