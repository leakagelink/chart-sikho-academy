ALTER TABLE public.class_sessions
  ADD COLUMN IF NOT EXISTS venue text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS address text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS city text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS state text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS country text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS pin_code text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS support_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS support_phone text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS support_email text NOT NULL DEFAULT '';

ALTER TABLE public.class_sessions
  ADD CONSTRAINT class_sessions_venue_len CHECK (char_length(venue)<=160 AND char_length(address)<=400 AND char_length(city)<=80 AND char_length(state)<=80 AND char_length(country)<=80 AND char_length(pin_code)<=12 AND char_length(support_name)<=120 AND char_length(support_phone)<=20 AND char_length(support_email)<=160);

DROP FUNCTION IF EXISTS public.session_catalog();
CREATE FUNCTION public.session_catalog()
 RETURNS TABLE(id uuid, title text, kind text, starts_at timestamp with time zone, thumbnail_url text, category_slug text, access_mode text, price integer, venue text, address text, city text, state text, country text, pin_code text, support_name text, support_phone text, support_email text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ SELECT id,title,kind,starts_at,thumbnail_url,category_slug,access_mode,price,venue,address,city,state,country,pin_code,support_name,support_phone,support_email FROM public.class_sessions WHERE status='scheduled' ORDER BY starts_at $function$;

REVOKE ALL ON FUNCTION public.session_catalog() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.session_catalog() TO anon, authenticated, service_role;