CREATE OR REPLACE FUNCTION public.my_referral_members(_offset integer DEFAULT 0)
RETURNS TABLE(id uuid,referred_id uuid,created_at timestamptz,full_name text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
 SELECT r.id,r.referred_id,r.created_at,p.full_name
 FROM public.referral_relationships r LEFT JOIN public.profiles p ON p.id=r.referred_id
 WHERE r.referrer_id=auth.uid() AND auth.uid() IS NOT NULL
 ORDER BY r.created_at DESC,r.id LIMIT 500 OFFSET greatest(coalesce(_offset,0),0)
$$;
REVOKE ALL ON FUNCTION public.my_referral_members(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_referral_members(integer) TO authenticated;
COMMENT ON FUNCTION public.my_referral_members(integer) IS 'Own direct referrals only: member name and existing relationship metadata; no private profile columns or deeper team access.';