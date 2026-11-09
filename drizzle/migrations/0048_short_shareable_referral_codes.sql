ALTER TABLE public.profiles ADD COLUMN short_referral_code text;
CREATE UNIQUE INDEX profiles_short_referral_code_unique ON public.profiles(short_referral_code);
CREATE OR REPLACE FUNCTION public.make_short_referral_code() RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE code text; BEGIN
PERFORM pg_advisory_xact_lock(74839215);
LOOP
code:=upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
EXIT WHEN NOT EXISTS(SELECT 1 FROM public.profiles WHERE short_referral_code=code OR referral_code=code);
END LOOP;
RETURN code;
END $$;
REVOKE ALL ON FUNCTION public.make_short_referral_code() FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION public.assign_short_referral_code() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
IF TG_OP='INSERT' THEN NEW.short_referral_code:=public.make_short_referral_code();
ELSIF NEW.short_referral_code IS DISTINCT FROM OLD.short_referral_code AND auth.uid() IS NOT NULL THEN RAISE EXCEPTION 'Referral code is managed automatically'; END IF;
RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.assign_short_referral_code() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER assign_short_referral_code BEFORE INSERT OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.assign_short_referral_code();
UPDATE public.profiles SET short_referral_code=public.make_short_referral_code() WHERE short_referral_code IS NULL;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_short_referral_code_format CHECK(short_referral_code ~ '^[A-F0-9]{6}$');
CREATE OR REPLACE FUNCTION public.signup_referrer(_code text) RETURNS uuid LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$ DECLARE code text:=upper(btrim(coalesce(_code,''))); parent uuid; BEGIN
IF code='' THEN
SELECT p.id INTO parent FROM public.profiles p JOIN public.user_roles r ON r.user_id=p.id AND r.role='admin' WHERE p.id='ad62e080-543e-45c3-ba44-f3002ed9df9b' AND p.account_status='active';
ELSE
IF code !~ '^[A-Z0-9]{4,40}$' THEN RAISE EXCEPTION 'Invalid referral code'; END IF;
SELECT id INTO parent FROM public.profiles WHERE (short_referral_code=code OR referral_code=code) AND account_status='active';
END IF;
IF parent IS NULL THEN RAISE EXCEPTION 'Invalid or unavailable referral code'; END IF;
RETURN parent;
END $$;
REVOKE ALL ON FUNCTION public.signup_referrer(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.signup_referrer(text) TO service_role;
COMMENT ON COLUMN public.profiles.short_referral_code IS 'Public six-character referral code; generated atomically and protected from user edits.';
COMMENT ON COLUMN public.profiles.referral_code IS 'DEPRECATED for display: legacy referral code retained for previously shared links; use short_referral_code.';