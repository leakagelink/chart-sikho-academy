CREATE OR REPLACE FUNCTION public.my_membership()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ SELECT jsonb_build_object(
  'active',public.has_active_membership(auth.uid()),
  'plan_name',(SELECT m.plan_name FROM public.memberships m WHERE m.user_id=auth.uid() AND m.starts_at<=now() AND (m.expires_at IS NULL OR m.expires_at>now()) ORDER BY m.expires_at DESC NULLS FIRST LIMIT 1),
  'expires_at',(SELECT m.expires_at FROM public.memberships m WHERE m.user_id=auth.uid() AND m.starts_at<=now() AND (m.expires_at IS NULL OR m.expires_at>now()) ORDER BY m.expires_at DESC NULLS FIRST LIMIT 1),
  'access_categories',coalesce((SELECT jsonb_agg(DISTINCT c.category) FROM public.memberships m CROSS JOIN LATERAL unnest(m.access_categories) c(category) WHERE m.user_id=auth.uid() AND m.starts_at<=now() AND (m.expires_at IS NULL OR m.expires_at>now()) AND public.has_active_membership(auth.uid())),'[]'::jsonb),
  'plan_ids',coalesce((SELECT jsonb_agg(DISTINCT m.plan_id) FROM public.memberships m WHERE m.user_id=auth.uid() AND m.plan_id IS NOT NULL AND m.starts_at<=now() AND (m.expires_at IS NULL OR m.expires_at>now())),'[]'::jsonb)
) $function$;