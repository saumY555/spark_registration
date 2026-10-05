CREATE TABLE public.spark_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id text NOT NULL UNIQUE,
  full_name text NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 100),
  email text NOT NULL CHECK (char_length(email) <= 255),
  phone text NOT NULL CHECK (char_length(phone) BETWEEN 10 AND 15),
  scholar_number text NOT NULL CHECK (char_length(scholar_number) BETWEEN 3 AND 30),
  year text NOT NULL DEFAULT 'First year' CHECK (year = 'First year'),
  primary_track text NOT NULL,
  secondary_track text,
  portfolio_url text CHECK (portfolio_url IS NULL OR char_length(portfolio_url) <= 500),
  motivation text NOT NULL CHECK (char_length(motivation) BETWEEN 20 AND 800),
  consent boolean NOT NULL CHECK (consent = true),
  sheet_synced boolean NOT NULL DEFAULT false,
  sheet_sync_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.spark_registrations TO anon;
GRANT INSERT ON public.spark_registrations TO authenticated;
GRANT ALL ON public.spark_registrations TO service_role;
ALTER TABLE public.spark_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit a Spark registration"
ON public.spark_registrations
FOR INSERT
TO anon, authenticated
WITH CHECK (consent = true AND year = 'First year');
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER set_spark_registrations_updated_at
BEFORE UPDATE ON public.spark_registrations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX spark_registrations_created_at_idx ON public.spark_registrations (created_at DESC);