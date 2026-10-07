-- Migration: Allow DELETE operations on public.applications table
GRANT DELETE ON public.applications TO anon;
GRANT DELETE ON public.applications TO authenticated;

DROP POLICY IF EXISTS "Anyone can delete applications" ON public.applications;
CREATE POLICY "Anyone can delete applications"
ON public.applications
FOR DELETE
TO anon, authenticated
USING (true);
