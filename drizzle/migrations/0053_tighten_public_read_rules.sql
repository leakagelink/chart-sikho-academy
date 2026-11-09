-- Categories: public sees only visible categories (admins/delegates keep their own policies)
DROP POLICY IF EXISTS "categories read" ON public.course_categories;
CREATE POLICY "Visible categories are public" ON public.course_categories
  FOR SELECT TO anon, authenticated USING (is_visible);

-- Ranks: only admins / delegated panel users (existing "Delegated panel read") may read
DROP POLICY IF EXISTS "ranks read" ON public.ranks;

-- SEO metadata: only admins / delegated panel users (existing policies) may read
DROP POLICY IF EXISTS "Anyone reads seo" ON public.seo_pages;

-- Demo bookings: validate submitted content instead of accepting anything
DROP POLICY IF EXISTS "Anyone can book a demo class" ON public.demo_bookings;
CREATE POLICY "Anyone can book a valid demo class" ON public.demo_bookings
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    status = 'pending'
    AND char_length(btrim(full_name)) BETWEEN 2 AND 100
    AND phone ~ '^[0-9+() -]{7,20}$'
    AND char_length(email) <= 255
    AND (email = '' OR email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')
    AND char_length(preferred_slot) <= 100
  );

-- Branding bucket no longer exists; remove the open read rule
DROP POLICY IF EXISTS "Anyone can read branding" ON storage.objects;

-- Payment QR: signed-in users may read only the currently configured QR; payment managers read all
DROP POLICY IF EXISTS "payment qr signed-in read" ON storage.objects;
CREATE POLICY "payment qr current read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'payment-qr'
    AND auth.uid() IS NOT NULL
    AND (
      name = NULLIF(public.payment_upi()->>'qr_path', '')
      OR public.has_panel_permission('payments', 'view')
      OR public.has_panel_permission('payments', 'edit')
    )
  );

-- Website images: public delivery is decided server-side by this check, not by an open storage rule
CREATE OR REPLACE FUNCTION public.site_file_is_public(_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _name ~ '^(courses|categories|classes|webinars|seminars|ebooks|notifications|settings|banners)/[0-9a-f-]{36}\.(png|jpg|webp|svg)$'
    AND (
      EXISTS (SELECT 1 FROM public.courses WHERE status = 'published' AND thumbnail_url LIKE '%/api/public/site-file/' || _name)
      OR EXISTS (SELECT 1 FROM public.ebooks WHERE status = 'published' AND cover_url LIKE '%/api/public/site-file/' || _name)
      OR EXISTS (SELECT 1 FROM public.class_sessions WHERE status = 'scheduled' AND thumbnail_url LIKE '%/api/public/site-file/' || _name)
      OR EXISTS (SELECT 1 FROM public.course_categories WHERE is_visible AND icon_url LIKE '%/api/public/site-file/' || _name)
      OR EXISTS (SELECT 1 FROM public.banners WHERE active AND image_url LIKE '%/api/public/site-file/' || _name)
      OR COALESCE(public.app_branding(), '') LIKE '%/api/public/site-file/' || _name
    )
$$;
REVOKE ALL ON FUNCTION public.site_file_is_public(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.site_file_is_public(text) TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "Public reads published website images" ON storage.objects;