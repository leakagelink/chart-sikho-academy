DROP TRIGGER IF EXISTS guard_delegated_settings ON public.admin_settings;
ALTER TABLE public.admin_settings
  ADD COLUMN min_withdrawal integer NOT NULL DEFAULT 500 CHECK (min_withdrawal >= 0),
  ADD COLUMN max_withdrawal integer NOT NULL DEFAULT 50000 CHECK (max_withdrawal >= 1),
  ADD COLUMN max_withdrawals_per_month integer NOT NULL DEFAULT 2 CHECK (max_withdrawals_per_month BETWEEN 1 AND 31),
  ADD COLUMN repurchase_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN commission_type text NOT NULL DEFAULT 'percent' CHECK (commission_type IN ('percent','fixed')),
  ADD COLUMN ref_fixed_levels jsonb NOT NULL DEFAULT '[100,50,20]'::jsonb,
  ADD COLUMN commission_base text NOT NULL DEFAULT 'net' CHECK (commission_base IN ('net','after_tax')),
  ADD COLUMN commission_currency text NOT NULL DEFAULT 'INR' CHECK (commission_currency IN ('INR','USD')),
  ADD COLUMN self_purchase_block boolean NOT NULL DEFAULT true,
  ADD COLUMN influencer_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN influencer_type text NOT NULL DEFAULT 'percent' CHECK (influencer_type IN ('percent','fixed')),
  ADD COLUMN influencer_value numeric NOT NULL DEFAULT 0 CHECK (influencer_value >= 0 AND influencer_value <= 1000000),
  ADD COLUMN approval_mode text NOT NULL DEFAULT 'auto' CHECK (approval_mode IN ('auto','manual')),
  ADD COLUMN holding_days integer NOT NULL DEFAULT 7 CHECK (holding_days BETWEEN 0 AND 365),
  ADD COLUMN payout_cycle text NOT NULL DEFAULT 'monthly' CHECK (payout_cycle IN ('weekly','monthly')),
  ADD COLUMN tds_percent numeric NOT NULL DEFAULT 0 CHECK (tds_percent BETWEEN 0 AND 50),
  ADD COLUMN kyc_required boolean NOT NULL DEFAULT true,
  ADD COLUMN hold_suspended boolean NOT NULL DEFAULT true;
ALTER TABLE public.admin_settings ADD CONSTRAINT admin_settings_withdraw_range CHECK (max_withdrawal >= min_withdrawal);
ALTER TABLE public.admin_settings ADD CONSTRAINT admin_settings_fixed_levels_check CHECK (jsonb_typeof(ref_fixed_levels)='array' AND jsonb_array_length(ref_fixed_levels) BETWEEN 1 AND 50);

CREATE TABLE public.referral_influencers (user_id uuid PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, DELETE ON public.referral_influencers TO authenticated;
GRANT ALL ON public.referral_influencers TO service_role;
ALTER TABLE public.referral_influencers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "influencers read" ON public.referral_influencers FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_panel_permission('commrules','view'));
CREATE POLICY "influencers add" ON public.referral_influencers FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_panel_permission('commrules','edit'));
CREATE POLICY "influencers remove" ON public.referral_influencers FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_panel_permission('commrules','edit'));

ALTER TABLE public.commission_entries DROP CONSTRAINT IF EXISTS commission_entries_order_id_key;
ALTER TABLE public.commission_entries
  ADD COLUMN level integer NOT NULL DEFAULT 1,
  ADD COLUMN status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','paid','rejected','reversed')),
  ADD COLUMN tds_amount integer NOT NULL DEFAULT 0,
  ADD COLUMN release_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN on_hold boolean NOT NULL DEFAULT false,
  ADD COLUMN currency text NOT NULL DEFAULT 'INR';
ALTER TABLE public.commission_entries ADD CONSTRAINT commission_entries_order_user_key UNIQUE (order_id, user_id);
GRANT UPDATE (status) ON public.commission_entries TO authenticated;
CREATE POLICY "commission review" ON public.commission_entries FOR UPDATE TO authenticated
  USING ((public.has_role(auth.uid(),'admin') OR public.has_panel_permission('commissions','edit')) AND status = 'pending')
  WITH CHECK ((public.has_role(auth.uid(),'admin') OR public.has_panel_permission('commissions','edit')) AND status IN ('approved','rejected'));

CREATE OR REPLACE FUNCTION public.process_order_commissions() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE st public.admin_settings; cur uuid; ref uuid; lvl int := 0; n int; base numeric; amt numeric; rate numeric; gst int; inf boolean;
BEGIN
  IF NEW.status IN ('refunded','failed') THEN
    UPDATE public.commission_entries SET status='reversed' WHERE order_id=NEW.id AND status <> 'reversed';
    RETURN NEW;
  END IF;
  IF NEW.status <> 'paid' OR NEW.provider_reference IS NULL OR NEW.amount <= 0 THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = 'paid' THEN RETURN NEW; END IF;
  IF EXISTS (SELECT 1 FROM public.commission_entries WHERE order_id=NEW.id) THEN RETURN NEW; END IF;
  SELECT * INTO st FROM public.admin_settings LIMIT 1;
  IF NOT FOUND OR NOT st.referral_enabled THEN RETURN NEW; END IF;
  IF NOT st.repurchase_enabled AND EXISTS (SELECT 1 FROM public.orders WHERE user_id=NEW.user_id AND status='paid' AND id<>NEW.id) THEN RETURN NEW; END IF;
  base := NEW.amount;
  IF st.commission_base = 'after_tax' THEN
    SELECT gst_rate INTO gst FROM public.invoices WHERE order_id=NEW.id LIMIT 1;
    base := NEW.amount * 100.0 / (100 + coalesce(gst, 18));
  END IF;
  n := CASE WHEN st.commission_type='fixed' THEN jsonb_array_length(st.ref_fixed_levels) ELSE jsonb_array_length(coalesce(st.ref_levels,'[]'::jsonb)) END;
  cur := NEW.user_id;
  WHILE lvl < n LOOP
    ref := NULL;
    SELECT referrer_id INTO ref FROM public.referral_relationships WHERE referred_id = cur;
    EXIT WHEN ref IS NULL;
    IF ref = NEW.user_id THEN EXIT; END IF; -- self-referral / circular chain
    lvl := lvl + 1;
    inf := st.influencer_enabled AND lvl = 1 AND EXISTS (SELECT 1 FROM public.referral_influencers WHERE user_id = ref);
    IF inf THEN
      amt := CASE WHEN st.influencer_type='fixed' THEN st.influencer_value ELSE base * st.influencer_value / 100 END;
    ELSIF st.commission_type = 'fixed' THEN
      amt := (st.ref_fixed_levels->>(lvl-1))::numeric;
    ELSE
      rate := (st.ref_levels->>(lvl-1))::numeric; amt := base * rate / 100;
    END IF;
    amt := least(floor(amt), NEW.amount);
    IF amt > 0 THEN
      INSERT INTO public.commission_entries(user_id, order_id, amount, level, status, tds_amount, release_at, on_hold, currency)
      VALUES (ref, NEW.id, amt, lvl, 'pending', floor(amt * st.tds_percent / 100), now() + make_interval(days => st.holding_days),
        st.hold_suspended AND EXISTS (SELECT 1 FROM public.profiles WHERE id = ref AND account_status <> 'active'), st.commission_currency)
      ON CONFLICT (order_id, user_id) DO NOTHING;
    END IF;
    cur := ref;
  END LOOP;
  RETURN NEW;
END $$;
CREATE TRIGGER process_order_commissions AFTER INSERT OR UPDATE OF status ON public.orders FOR EACH ROW EXECUTE FUNCTION public.process_order_commissions();

CREATE OR REPLACE FUNCTION public.reverse_refunded_commissions() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status IS DISTINCT FROM 'approved' THEN
    UPDATE public.commission_entries SET status='reversed' WHERE order_id=NEW.order_id AND status <> 'reversed';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER reverse_refunded_commissions AFTER UPDATE OF status ON public.refund_requests FOR EACH ROW EXECUTE FUNCTION public.reverse_refunded_commissions();

CREATE OR REPLACE FUNCTION public.release_commissions_for(_user uuid) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE st public.admin_settings; n int;
BEGIN
  SELECT * INTO st FROM public.admin_settings LIMIT 1;
  IF NOT FOUND OR st.approval_mode <> 'auto' THEN RETURN 0; END IF;
  UPDATE public.commission_entries c SET status='approved', on_hold=false
  WHERE c.status='pending' AND c.release_at <= now() AND (_user IS NULL OR c.user_id=_user)
    AND NOT EXISTS (SELECT 1 FROM public.refund_requests r WHERE r.order_id=c.order_id AND r.status='pending')
    AND EXISTS (SELECT 1 FROM public.orders o WHERE o.id=c.order_id AND o.status='paid')
    AND (NOT st.hold_suspended OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=c.user_id AND p.account_status='active'));
  GET DIAGNOSTICS n = ROW_COUNT; RETURN n;
END $$;
REVOKE ALL ON FUNCTION public.release_commissions_for(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.release_due_commissions() RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_panel_permission('commissions','edit')) THEN RAISE EXCEPTION 'Forbidden'; END IF;
  RETURN public.release_commissions_for(NULL);
END $$;
REVOKE ALL ON FUNCTION public.release_due_commissions() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.release_due_commissions() TO authenticated;

CREATE OR REPLACE FUNCTION public.my_wallet() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid := auth.uid(); st public.admin_settings; earned numeric; withdrawn numeric; used int;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
  PERFORM public.release_commissions_for(uid);
  SELECT * INTO st FROM public.admin_settings LIMIT 1;
  SELECT coalesce(sum(amount - tds_amount),0) INTO earned FROM public.commission_entries WHERE user_id=uid AND status IN ('approved','paid');
  SELECT coalesce(sum(amount),0) INTO withdrawn FROM public.payout_requests WHERE user_id=uid AND status IN ('pending','reviewed','paid');
  SELECT count(*) INTO used FROM public.payout_requests WHERE user_id=uid AND status <> 'rejected' AND created_at >= date_trunc('month', now());
  RETURN jsonb_build_object(
    'available', greatest(earned - withdrawn, 0),
    'pending', (SELECT coalesce(sum(amount - tds_amount),0) FROM public.commission_entries WHERE user_id=uid AND status='pending'),
    'tds', (SELECT coalesce(sum(tds_amount),0) FROM public.commission_entries WHERE user_id=uid AND status IN ('approved','paid')),
    'withdrawn', withdrawn, 'requests_this_month', used,
    'min', st.min_withdrawal, 'max', st.max_withdrawal, 'per_month', st.max_withdrawals_per_month,
    'currency', st.commission_currency, 'kyc_required', st.kyc_required, 'cycle', st.payout_cycle,
    'kyc', (SELECT verification_status FROM public.profiles WHERE id=uid));
END $$;
REVOKE ALL ON FUNCTION public.my_wallet() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_wallet() TO authenticated;

CREATE OR REPLACE FUNCTION public.request_payout(_amount integer) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid := auth.uid(); st public.admin_settings; w jsonb; pid uuid; prof public.profiles;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
  SELECT * INTO st FROM public.admin_settings LIMIT 1;
  SELECT * INTO prof FROM public.profiles WHERE id=uid;
  IF st.hold_suspended AND prof.account_status <> 'active' THEN RAISE EXCEPTION 'Account on hold: payouts are paused'; END IF;
  IF st.kyc_required AND prof.verification_status <> 'verified' THEN RAISE EXCEPTION 'KYC verification required before payout'; END IF;
  IF _amount < st.min_withdrawal THEN RAISE EXCEPTION 'Below minimum withdrawal of %', st.min_withdrawal; END IF;
  IF _amount > st.max_withdrawal THEN RAISE EXCEPTION 'Above maximum withdrawal of %', st.max_withdrawal; END IF;
  w := public.my_wallet();
  IF (w->>'requests_this_month')::int >= st.max_withdrawals_per_month THEN RAISE EXCEPTION 'Monthly withdrawal limit reached'; END IF;
  IF _amount > (w->>'available')::numeric THEN RAISE EXCEPTION 'Insufficient approved balance'; END IF;
  INSERT INTO public.payout_requests(user_id, amount) VALUES (uid, _amount) RETURNING id INTO pid;
  RETURN pid;
END $$;
REVOKE ALL ON FUNCTION public.request_payout(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_payout(integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.guard_delegated_settings() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE refcols text[] := ARRAY['ref_levels','referral_enabled','ref_level1_percent','ref_level2_percent','ref_level3_percent','min_withdrawal','max_withdrawal','max_withdrawals_per_month','repurchase_enabled','commission_type','ref_fixed_levels','commission_base','commission_currency','self_purchase_block','influencer_enabled','influencer_type','influencer_value','approval_mode','holding_days','payout_cycle','tds_percent','kyc_required','hold_suspended','commission_percent'];
BEGIN
  IF public.has_role(auth.uid(),'admin') THEN RETURN NEW; END IF;
  IF (to_jsonb(NEW) - refcols - ARRAY['updated_at','maintenance_mode','maintenance_message']) IS DISTINCT FROM (to_jsonb(OLD) - refcols - ARRAY['updated_at','maintenance_mode','maintenance_message']) AND NOT public.has_panel_permission('settings','edit') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF (to_jsonb(NEW) -> refcols) IS DISTINCT FROM (to_jsonb(OLD) -> refcols) THEN NULL; END IF;
  IF EXISTS (SELECT 1 FROM unnest(refcols) c WHERE to_jsonb(NEW)->c IS DISTINCT FROM to_jsonb(OLD)->c)
     AND NOT (public.has_panel_permission('settings','edit') OR public.has_panel_permission('refsettings','edit') OR public.has_panel_permission('commrules','edit')) THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF (NEW.maintenance_mode, NEW.maintenance_message) IS DISTINCT FROM (OLD.maintenance_mode, OLD.maintenance_message) AND NOT public.has_panel_permission('maintenance','edit') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER guard_delegated_settings BEFORE UPDATE ON public.admin_settings FOR EACH ROW EXECUTE FUNCTION public.guard_delegated_settings();