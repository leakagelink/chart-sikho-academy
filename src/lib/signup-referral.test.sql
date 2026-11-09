-- Transactional lifecycle regression: every fixture is rolled back; no email is sent.
BEGIN;
DO $$
DECLARE a uuid:=gen_random_uuid(); b uuid:=gen_random_uuid(); bad uuid:=gen_random_uuid(); sponsor uuid:='207e6a42-ea41-4dc2-a27a-d24bc8e71ae9'; rejected boolean:=false; before_count bigint;
BEGIN
 SELECT count(*) INTO before_count FROM public.commission_entries;
 INSERT INTO auth.users(id,aud,role,email,raw_user_meta_data) VALUES(a,'authenticated','authenticated',a::text||'@example.invalid',jsonb_build_object('full_name','Transactional blank referral'));
 IF NOT EXISTS(SELECT 1 FROM public.referral_relationships WHERE referred_id=a AND referrer_id='ad62e080-543e-45c3-ba44-f3002ed9df9b') THEN RAISE EXCEPTION 'Blank signup must belong to Admin'; END IF;
 INSERT INTO auth.users(id,aud,role,email,raw_user_meta_data) VALUES(b,'authenticated','authenticated',b::text||'@example.invalid',jsonb_build_object('full_name','Transactional valid referral','referral_code',' cs207e6a42ea414dc2a27ad24bc8e71ae9 '));
 IF NOT EXISTS(SELECT 1 FROM public.referral_relationships WHERE referred_id=b AND referrer_id=sponsor) THEN RAISE EXCEPTION 'Valid signup must belong to code owner'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=b AND short_referral_code ~ '^[A-F0-9]{6}$') THEN RAISE EXCEPTION 'New signup must have own unique code'; END IF;
 IF public.signup_referrer((SELECT short_referral_code FROM public.profiles WHERE id=sponsor))<>sponsor THEN RAISE EXCEPTION 'Short code must resolve same sponsor'; END IF;
 IF (SELECT count(*) FROM public.profiles WHERE id IN(a,b) AND length(short_referral_code)=6)<>2 THEN RAISE EXCEPTION 'New signups need six character codes'; END IF;
 IF (SELECT count(DISTINCT short_referral_code) FROM public.profiles WHERE id IN(a,b))<>2 THEN RAISE EXCEPTION 'Short codes must be unique'; END IF;
 BEGIN
  INSERT INTO auth.users(id,aud,role,email,raw_user_meta_data) VALUES(bad,'authenticated','authenticated',bad::text||'@example.invalid',jsonb_build_object('referral_code','INVALID999'));
 EXCEPTION WHEN raise_exception THEN rejected:=true;
 END;
 IF NOT rejected OR EXISTS(SELECT 1 FROM public.profiles WHERE id=bad) THEN RAISE EXCEPTION 'Invalid code must reject atomically'; END IF;
 UPDATE auth.users SET raw_user_meta_data=jsonb_build_object('referral_code','CSAD62E080') WHERE id=b;
 IF NOT EXISTS(SELECT 1 FROM public.referral_relationships WHERE referred_id=b AND referrer_id=sponsor) THEN RAISE EXCEPTION 'Metadata edits cannot change parent'; END IF;
 IF (SELECT count(*) FROM public.commission_entries)<>before_count THEN RAISE EXCEPTION 'Signup must not create earnings'; END IF;
 IF EXISTS(SELECT 1 FROM public.enrollments WHERE user_id IN(a,b)) THEN RAISE EXCEPTION 'Signup must not create sample enrollment'; END IF;
END $$;
ROLLBACK;