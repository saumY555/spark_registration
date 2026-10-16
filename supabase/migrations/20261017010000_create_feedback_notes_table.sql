-- Migration: Create feedback_notes table for interactive student feedback wall
CREATE TABLE IF NOT EXISTS public.feedback_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL,
  author_name text,
  color text NOT NULL DEFAULT 'yellow',
  rotation numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'approved',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.feedback_notes ENABLE ROW LEVEL SECURITY;

-- Grant permissions to service_role, authenticated, and anon
GRANT ALL ON public.feedback_notes TO service_role;
GRANT INSERT, SELECT ON public.feedback_notes TO anon, authenticated;

-- Public can read approved feedback notes
DROP POLICY IF EXISTS "Anyone can view approved feedback" ON public.feedback_notes;
CREATE POLICY "Anyone can view approved feedback"
ON public.feedback_notes
FOR SELECT
TO anon, authenticated
USING (status = 'approved');

-- Public can insert feedback notes with length validation
DROP POLICY IF EXISTS "Anyone can insert feedback" ON public.feedback_notes;
CREATE POLICY "Anyone can insert feedback"
ON public.feedback_notes
FOR INSERT
TO anon, authenticated
WITH CHECK (
  status = 'approved' AND
  length(trim(message)) >= 2 AND
  length(message) <= 300
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS feedback_notes_created_at_idx ON public.feedback_notes (created_at DESC);
CREATE INDEX IF NOT EXISTS feedback_notes_status_idx ON public.feedback_notes (status);

-- Enable Supabase Realtime for live updates
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.feedback_notes;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    -- Table already added to publication
    NULL;
END $$;
