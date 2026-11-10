ALTER TABLE public.admin_settings ADD COLUMN min_self_purchase_value integer NOT NULL DEFAULT 3999 CHECK (min_self_purchase_value >= 0 AND min_self_purchase_value <= 10000000);
CREATE OR REPLACE FUNCTION public.own_course_purchase_total(_user uuid) RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT coalesce(sum(greatest(o.amount - coalesce((SELECT sum(r.amount) FROM public.refund_requests r WHERE r.order_id=o.id AND r.user_id=o.user_id AND r.status='approved'),0),0)),0)
 FROM public.orders o WHERE o.user_id=_user AND o.status='paid' AND nullif(btrim(o.provider_reference),'') IS NOT NULL AND o.ebook_id IS NULL AND o.session_id IS NULL AND EXISTS (SELECT 1 FROM public.courses c WHERE c.id::text=o.course_id);
$$;
REVOKE ALL ON FUNCTION public.own_course_purchase_total(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.own_course_purchase_total(uuid) TO service_role;
CREATE OR REPLACE FUNCTION public.purchase_withdrawal_eligible(_total numeric,_minimum integer) RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path=public AS $$ SELECT coalesce(_total>=_minimum,false); $$;
REVOKE ALL ON FUNCTION public.purchase_withdrawal_eligible(numeric,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.purchase_withdrawal_eligible(numeric,integer) TO authenticated,service_role;
CREATE OR REPLACE FUNCTION public.guard_payout_own_purchase() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE required integer; total numeric;
BEGIN
 SELECT min_self_purchase_value INTO required FROM public.admin_settings LIMIT 1;
 IF required IS NULL THEN RAISE EXCEPTION 'Withdrawal settings unavailable'; END IF;
 total:=public.own_course_purchase_total(NEW.user_id);
 IF NOT public.purchase_withdrawal_eligible(total,required) THEN RAISE EXCEPTION 'Minimum verified own course purchase of INR % required; current total INR %',required,total; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER payout_own_course_purchase BEFORE INSERT ON public.payout_requests FOR EACH ROW EXECUTE FUNCTION public.guard_payout_own_purchase();
CREATE OR REPLACE FUNCTION public.my_wallet() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid := auth.uid(); st public.admin_settings; earned numeric; withdrawn numeric; used int; purchased numeric;
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
 PERFORM public.release_commissions_for(uid);
 SELECT * INTO st FROM public.admin_settings LIMIT 1;
 SELECT coalesce(sum(amount-tds_amount),0) INTO earned FROM public.commission_entries WHERE user_id=uid AND status IN ('approved','paid');
 SELECT coalesce(sum(amount),0) INTO withdrawn FROM public.payout_requests WHERE user_id=uid AND status IN ('pending','reviewed','paid');
 SELECT count(*) INTO used FROM public.payout_requests WHERE user_id=uid AND status <> 'rejected' AND created_at >= date_trunc('month',now());
 purchased:=public.own_course_purchase_total(uid);
 RETURN jsonb_build_object('available',greatest(earned-withdrawn,0),'pending',(SELECT coalesce(sum(amount-tds_amount),0) FROM public.commission_entries WHERE user_id=uid AND status='pending'),'tds',(SELECT coalesce(sum(tds_amount),0) FROM public.commission_entries WHERE user_id=uid AND status IN ('approved','paid')),'withdrawn',withdrawn,'requests_this_month',used,'min',st.min_withdrawal,'max',st.max_withdrawal,'per_month',st.max_withdrawals_per_month,'currency',st.commission_currency,'kyc_required',st.kyc_required,'cycle',st.payout_cycle,'kyc',(SELECT verification_status FROM public.profiles WHERE id=uid),'self_purchase_total',purchased,'min_self_purchase_value',st.min_self_purchase_value,'self_purchase_remaining',greatest(st.min_self_purchase_value-purchased,0),'self_purchase_eligible',public.purchase_withdrawal_eligible(purchased,st.min_self_purchase_value));
END $$;
REVOKE ALL ON FUNCTION public.my_wallet() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.my_wallet() TO authenticated,service_role;
CREATE OR REPLACE FUNCTION public.guard_delegated_settings() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE refcols text[] := ARRAY['min_self_purchase_value','ref_levels','referral_enabled','ref_level1_percent','ref_level2_percent','ref_level3_percent','min_withdrawal','max_withdrawal','max_withdrawals_per_month','repurchase_enabled','commission_type','ref_fixed_levels','commission_base','commission_currency','self_purchase_block','influencer_enabled','influencer_type','influencer_value','approval_mode','holding_days','payout_cycle','tds_percent','kyc_required','hold_suspended','commission_percent'];
BEGIN
 IF public.has_role(auth.uid(),'admin') THEN RETURN NEW; END IF;
 IF (to_jsonb(NEW)-refcols-ARRAY['updated_at','maintenance_mode','maintenance_message']) IS DISTINCT FROM (to_jsonb(OLD)-refcols-ARRAY['updated_at','maintenance_mode','maintenance_message']) AND NOT public.has_panel_permission('settings','edit') THEN RAISE EXCEPTION 'Forbidden'; END IF;
 IF EXISTS (SELECT 1 FROM unnest(refcols) c WHERE to_jsonb(NEW)->c IS DISTINCT FROM to_jsonb(OLD)->c) AND NOT (public.has_panel_permission('settings','edit') OR public.has_panel_permission('refsettings','edit') OR public.has_panel_permission('commrules','edit')) THEN RAISE EXCEPTION 'Forbidden'; END IF;
 IF (NEW.maintenance_mode,NEW.maintenance_message) IS DISTINCT FROM (OLD.maintenance_mode,OLD.maintenance_message) AND NOT public.has_panel_permission('maintenance','edit') THEN RAISE EXCEPTION 'Forbidden'; END IF;
 RETURN NEW;
END $$;