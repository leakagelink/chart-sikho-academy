CREATE OR REPLACE FUNCTION public.assign_short_referral_code() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
IF TG_OP='INSERT' THEN NEW.short_referral_code:=public.make_short_referral_code();
ELSIF (NEW.short_referral_code IS DISTINCT FROM OLD.short_referral_code OR NEW.referral_code IS DISTINCT FROM OLD.referral_code) AND auth.uid() IS NOT NULL THEN RAISE EXCEPTION 'Referral code is managed automatically'; END IF;
RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.assign_short_referral_code() FROM PUBLIC,anon,authenticated;