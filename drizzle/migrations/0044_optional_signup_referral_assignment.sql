CREATE OR REPLACE FUNCTION public.signup_referrer(_code text)
RETURNS uuid LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE code text:=upper(btrim(coalesce(_code,''))); parent uuid;
BEGIN
 IF code='' THEN
  SELECT p.id INTO parent FROM public.profiles p JOIN public.user_roles r ON r.user_id=p.id AND r.role='admin' WHERE p.id='ad62e080-543e-45c3-ba44-f3002ed9df9b' AND p.account_status='active';
 ELSE
  IF code !~ '^[A-Z0-9]{4,40}$' THEN RAISE EXCEPTION 'Invalid referral code'; END IF;
  SELECT id INTO parent FROM public.profiles WHERE referral_code=code AND account_status='active';
 END IF;
 IF parent IS NULL THEN RAISE EXCEPTION 'Invalid or unavailable referral code'; END IF;
 RETURN parent;
END $$;
REVOKE ALL ON FUNCTION public.signup_referrer(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.signup_referrer(text) TO service_role;
CREATE OR REPLACE FUNCTION public.signup_referral_valid(_code text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
 PERFORM public.signup_referrer(_code); RETURN true;
EXCEPTION WHEN raise_exception THEN RETURN false;
END $$;
REVOKE ALL ON FUNCTION public.signup_referral_valid(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.signup_referral_valid(text) TO anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE parent uuid; own_code text;
BEGIN
 parent:=public.signup_referrer(NEW.raw_user_meta_data->>'referral_code');
 IF parent=NEW.id THEN RAISE EXCEPTION 'Self referral is not allowed'; END IF;
 own_code:='CS'||upper(replace(NEW.id::text,'-',''));
 INSERT INTO public.profiles(id,full_name,phone,referral_code)
 VALUES(NEW.id,COALESCE(NEW.raw_user_meta_data->>'full_name',NEW.raw_user_meta_data->>'name'),NEW.raw_user_meta_data->>'phone',own_code);
 INSERT INTO public.referral_relationships(referrer_id,referred_id) VALUES(parent,NEW.id) ON CONFLICT(referred_id) DO NOTHING;
 RETURN NEW;
END $$;
COMMENT ON FUNCTION public.handle_new_user() IS 'Creates profile, unique own referral code and signup relationship only. No sample enrollment, roles, purchases or commissions. Referral metadata is consumed only at account creation.';