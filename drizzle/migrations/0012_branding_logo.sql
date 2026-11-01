ALTER TABLE public.admin_settings ADD COLUMN logo_url TEXT NOT NULL DEFAULT '';

CREATE OR REPLACE FUNCTION public.app_branding()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(NULLIF(logo_url, ''), '') FROM public.admin_settings ORDER BY updated_at DESC LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.app_branding() TO anon, authenticated;

CREATE POLICY "Anyone can read branding"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'branding');

CREATE POLICY "Admins can upload branding"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'branding' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update branding"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'branding' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete branding"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'branding' AND public.has_role(auth.uid(), 'admin'));