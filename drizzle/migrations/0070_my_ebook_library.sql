CREATE OR REPLACE FUNCTION public.my_ebook_library()
RETURNS TABLE(id uuid, title text, cover_url text, price integer, has_file boolean, access text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT b.id, b.title, b.cover_url, b.price, coalesce(b.has_file, b.resource_path <> ''),
    CASE WHEN EXISTS(SELECT 1 FROM public.orders o WHERE o.user_id=auth.uid() AND o.ebook_id=b.id AND o.status='paid') THEN 'purchased'
         WHEN b.price=0 THEN 'free' ELSE 'membership' END
  FROM public.ebooks b
  WHERE auth.uid() IS NOT NULL
    AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.account_status='active')
    AND (
      EXISTS(SELECT 1 FROM public.orders o WHERE o.user_id=auth.uid() AND o.ebook_id=b.id AND o.status='paid')
      OR (b.status='published' AND (b.price=0 OR public.has_membership_category('ebooks')))
    )
  ORDER BY b.created_at DESC
$$;
REVOKE ALL ON FUNCTION public.my_ebook_library() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_ebook_library() TO authenticated;