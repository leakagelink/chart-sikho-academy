CREATE TABLE public.payout_preferences (user_id uuid PRIMARY KEY REFERENCES public.profiles(id), account_holder text NOT NULL DEFAULT '', bank_name text NOT NULL DEFAULT '', account_number text NOT NULL DEFAULT '', ifsc text NOT NULL DEFAULT '', upi_id text NOT NULL DEFAULT '', preferred_method text NOT NULL DEFAULT 'none' CHECK (preferred_method IN ('none','bank','upi')), updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.payout_preferences TO authenticated;
GRANT ALL ON public.payout_preferences TO service_role;
ALTER TABLE public.payout_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own payout preferences read" ON public.payout_preferences FOR SELECT TO authenticated USING (user_id=auth.uid());
ALTER TABLE public.payout_requests ADD COLUMN IF NOT EXISTS destination_snapshot jsonb;
CREATE OR REPLACE FUNCTION public.save_payout_preferences(_account_holder text, _bank_name text, _account_number text, _ifsc text, _upi_id text, _preferred_method text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
IF _preferred_method NOT IN ('none','bank','upi') OR length(trim(_account_holder))>120 OR length(trim(_bank_name))>120 THEN RAISE EXCEPTION 'Invalid withdrawal details'; END IF;
IF (_account_number<>'' AND _account_number !~ '^[0-9]{9,18}$') OR (_ifsc<>'' AND upper(_ifsc) !~ '^[A-Z]{4}0[A-Z0-9]{6}$') OR (_upi_id<>'' AND _upi_id !~ '^[A-Za-z0-9._-]{2,100}@[A-Za-z0-9.-]{2,64}$') THEN RAISE EXCEPTION 'Invalid bank or UPI details'; END IF;
IF _preferred_method='bank' AND (trim(_account_holder)='' OR trim(_bank_name)='' OR _account_number='' OR _ifsc='') THEN RAISE EXCEPTION 'Complete bank details'; END IF;
IF _preferred_method='upi' AND _upi_id='' THEN RAISE EXCEPTION 'Add UPI ID'; END IF;
INSERT INTO public.payout_preferences(user_id,account_holder,bank_name,account_number,ifsc,upi_id,preferred_method) VALUES(auth.uid(),trim(_account_holder),trim(_bank_name),_account_number,upper(_ifsc),_upi_id,_preferred_method) ON CONFLICT(user_id) DO UPDATE SET account_holder=excluded.account_holder,bank_name=excluded.bank_name,account_number=excluded.account_number,ifsc=excluded.ifsc,upi_id=excluded.upi_id,preferred_method=excluded.preferred_method,updated_at=now();
END; $$;
REVOKE ALL ON FUNCTION public.save_payout_preferences(text,text,text,text,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_payout_preferences(text,text,text,text,text,text) TO authenticated;
CREATE OR REPLACE FUNCTION public.snapshot_payout_destination() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE pref public.payout_preferences;
BEGIN
IF TG_OP='UPDATE' THEN
IF NEW.destination_snapshot IS DISTINCT FROM OLD.destination_snapshot THEN RAISE EXCEPTION 'Withdrawal destination cannot change after submission'; END IF;
RETURN NEW;
END IF;
IF auth.uid() IS NULL OR NEW.user_id<>auth.uid() THEN RAISE EXCEPTION 'Sign in required'; END IF;
SELECT * INTO pref FROM public.payout_preferences WHERE user_id=NEW.user_id FOR UPDATE;
IF pref.user_id IS NULL OR pref.preferred_method='none' THEN RAISE EXCEPTION 'Save a withdrawal destination first'; END IF;
IF pref.preferred_method='upi' THEN NEW.destination_snapshot=jsonb_build_object('method','upi','upi_id',pref.upi_id); ELSE NEW.destination_snapshot=jsonb_build_object('method','bank','account_holder',pref.account_holder,'bank_name',pref.bank_name,'account_number',pref.account_number,'ifsc',pref.ifsc); END IF;
RETURN NEW;
END; $$;
CREATE TRIGGER payout_destination_snapshot BEFORE INSERT OR UPDATE ON public.payout_requests FOR EACH ROW EXECUTE FUNCTION public.snapshot_payout_destination();