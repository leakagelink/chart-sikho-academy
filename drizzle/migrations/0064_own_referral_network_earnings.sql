DROP FUNCTION IF EXISTS public.my_referral_network(integer);
CREATE FUNCTION public.my_referral_network(_offset integer DEFAULT 0)
 RETURNS TABLE(id uuid, referred_id uuid, referrer_id uuid, level integer, created_at timestamp with time zone, full_name text, member_code text, earned numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH RECURSIVE tree AS (
    SELECT r.id, r.referred_id, r.referrer_id, 1 AS level, r.created_at, ARRAY[auth.uid(), r.referred_id] AS path
    FROM public.referral_relationships r
    WHERE auth.uid() IS NOT NULL AND r.referrer_id = auth.uid() AND r.referred_id <> auth.uid()
    UNION ALL
    SELECT r.id, r.referred_id, r.referrer_id, t.level + 1, r.created_at, t.path || r.referred_id
    FROM public.referral_relationships r
    JOIN tree t ON r.referrer_id = t.referred_id
    WHERE NOT (r.referred_id = ANY(t.path)) AND t.level < 1000
  ), uniq AS (
    SELECT DISTINCT ON (tree.referred_id) tree.id, tree.referred_id, tree.referrer_id, tree.level, tree.created_at
    FROM tree ORDER BY tree.referred_id, tree.level, tree.created_at
  )
  SELECT u.id, u.referred_id, u.referrer_id, u.level, u.created_at, p.full_name, p.short_referral_code,
    coalesce((SELECT sum(c.amount - c.tds_amount) FROM public.commission_entries c WHERE c.user_id = u.referred_id AND c.status IN ('approved','paid')), 0) AS earned
  FROM uniq u LEFT JOIN public.profiles p ON p.id = u.referred_id
  ORDER BY u.level, u.created_at DESC, u.id
  LIMIT 500 OFFSET greatest(coalesce(_offset, 0), 0)
$function$;
REVOKE ALL ON FUNCTION public.my_referral_network(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_referral_network(integer) TO authenticated, service_role;