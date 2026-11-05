ALTER TABLE public.ebooks ADD COLUMN IF NOT EXISTS cover_url text NOT NULL DEFAULT '';
ALTER TABLE public.ebooks ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '';
GRANT SELECT ON public.ebooks TO anon;
CREATE POLICY "Public read published ebooks" ON public.ebooks FOR SELECT TO anon, authenticated USING (status = 'published');