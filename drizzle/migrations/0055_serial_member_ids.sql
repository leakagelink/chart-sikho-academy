ALTER TABLE public.profiles DROP CONSTRAINT profiles_short_referral_code_format;
CREATE SEQUENCE IF NOT EXISTS public.member_code_seq START 1;
CREATE OR REPLACE FUNCTION public.make_short_referral_code()
 RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$ DECLARE code text; BEGIN
PERFORM pg_advisory_xact_lock(74839215);
LOOP
code:='CS'||lpad(nextval('public.member_code_seq')::text,6,'0');
EXIT WHEN NOT EXISTS(SELECT 1 FROM public.profiles WHERE short_referral_code=code OR referral_code=code);
END LOOP;
RETURN code;
END $function$;
REVOKE ALL ON FUNCTION public.make_short_referral_code() FROM PUBLIC, anon, authenticated;
UPDATE public.profiles SET short_referral_code='CS000001' WHERE id='ad62e080-543e-45c3-ba44-f3002ed9df9b';
ALTER TABLE public.profiles ADD CONSTRAINT profiles_short_referral_code_format CHECK (short_referral_code IS NULL OR short_referral_code ~ '^(CS[0-9]{6}|[A-Z0-9]{6})$');
SELECT setval('public.member_code_seq', 1, true);
DROP FUNCTION IF EXISTS public.my_referral_members(integer);
CREATE FUNCTION public.my_referral_members(_offset integer DEFAULT 0)
RETURNS TABLE(id uuid,referred_id uuid,created_at timestamptz,full_name text,member_code text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
 SELECT r.id,r.referred_id,r.created_at,p.full_name,p.short_referral_code
 FROM public.referral_relationships r LEFT JOIN public.profiles p ON p.id=r.referred_id
 WHERE r.referrer_id=auth.uid() AND auth.uid() IS NOT NULL
 ORDER BY r.created_at DESC,r.id LIMIT 500 OFFSET greatest(coalesce(_offset,0),0)
$$;
REVOKE ALL ON FUNCTION public.my_referral_members(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_referral_members(integer) TO authenticated, service_role;