ALTER TABLE public.notification_campaigns ADD COLUMN IF NOT EXISTS link_url text NOT NULL DEFAULT '';
ALTER TABLE public.notification_campaigns ADD CONSTRAINT notification_campaigns_link_url_check
  CHECK (link_url = '' OR (char_length(link_url) <= 500 AND (link_url ~ '^/[^/\\]' OR link_url = '/' OR link_url ~* '^https://[^\s/@]+(/\S*)?$')));

CREATE OR REPLACE FUNCTION public.site_file_is_public(_name text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT _name ~ '^(courses|categories|classes|webinars|seminars|ebooks|notifications|settings|banners)/[0-9a-f-]{36}\.(png|jpg|webp|svg)$'
    AND (
      EXISTS (SELECT 1 FROM public.courses WHERE status = 'published' AND thumbnail_url LIKE '%/api/public/site-file/' || _name)
      OR EXISTS (SELECT 1 FROM public.ebooks WHERE status = 'published' AND cover_url LIKE '%/api/public/site-file/' || _name)
      OR EXISTS (SELECT 1 FROM public.class_sessions WHERE status = 'scheduled' AND thumbnail_url LIKE '%/api/public/site-file/' || _name)
      OR EXISTS (SELECT 1 FROM public.course_categories WHERE is_visible AND icon_url LIKE '%/api/public/site-file/' || _name)
      OR EXISTS (SELECT 1 FROM public.banners WHERE active AND image_url LIKE '%/api/public/site-file/' || _name)
      OR EXISTS (SELECT 1 FROM public.notification_campaigns WHERE status = 'published' AND image_url LIKE '%/api/public/site-file/' || _name)
      OR COALESCE(public.app_branding(), '') LIKE '%/api/public/site-file/' || _name
    )
$function$;