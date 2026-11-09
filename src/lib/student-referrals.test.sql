-- Read-only assertions under simulated caller claims; all session changes roll back.
BEGIN;
DO $$
DECLARE caller uuid; expected integer; actual integer;
BEGIN
 SELECT referrer_id INTO caller FROM public.referral_relationships LIMIT 1;
 IF caller IS NULL THEN RAISE EXCEPTION 'Populated referral fixture required'; END IF;
 PERFORM set_config('request.jwt.claim.sub',caller::text,true);
 SELECT count(*) INTO expected FROM public.referral_relationships WHERE referrer_id=caller;
 SET LOCAL ROLE authenticated;
 SELECT count(*) INTO actual FROM public.my_referral_members(0);
 IF actual<>least(expected,500) THEN RAISE EXCEPTION 'Own referral rows missing'; END IF;
 IF EXISTS(SELECT 1 FROM public.my_referral_members(0) m LEFT JOIN public.referral_relationships r ON r.id=m.id WHERE r.referrer_id IS DISTINCT FROM caller) THEN RAISE EXCEPTION 'Other team exposed'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.my_referral_members(0) WHERE nullif(trim(full_name),'') IS NOT NULL) THEN RAISE EXCEPTION 'Saved member name missing'; END IF;
 PERFORM set_config('request.jwt.claim.sub','',true);
 IF EXISTS(SELECT 1 FROM public.my_referral_members(0)) THEN RAISE EXCEPTION 'Anonymous referral data exposed'; END IF;
 IF has_function_privilege('anon','public.my_referral_members(integer)','EXECUTE') THEN RAISE EXCEPTION 'Anonymous execution allowed'; END IF;
END $$;
ROLLBACK;