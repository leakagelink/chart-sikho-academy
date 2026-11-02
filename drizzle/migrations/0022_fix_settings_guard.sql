CREATE OR REPLACE FUNCTION public.guard_delegated_settings() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE refcols text[] := ARRAY['ref_levels','referral_enabled','ref_level1_percent','ref_level2_percent','ref_level3_percent','min_withdrawal','max_withdrawal','max_withdrawals_per_month','repurchase_enabled','commission_type','ref_fixed_levels','commission_base','commission_currency','self_purchase_block','influencer_enabled','influencer_type','influencer_value','approval_mode','holding_days','payout_cycle','tds_percent','kyc_required','hold_suspended','commission_percent'];
BEGIN
  IF public.has_role(auth.uid(),'admin') THEN RETURN NEW; END IF;
  IF (to_jsonb(NEW) - refcols - ARRAY['updated_at','maintenance_mode','maintenance_message']) IS DISTINCT FROM (to_jsonb(OLD) - refcols - ARRAY['updated_at','maintenance_mode','maintenance_message']) AND NOT public.has_panel_permission('settings','edit') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF EXISTS (SELECT 1 FROM unnest(refcols) c WHERE to_jsonb(NEW)->c IS DISTINCT FROM to_jsonb(OLD)->c)
     AND NOT (public.has_panel_permission('settings','edit') OR public.has_panel_permission('refsettings','edit') OR public.has_panel_permission('commrules','edit')) THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF (NEW.maintenance_mode, NEW.maintenance_message) IS DISTINCT FROM (OLD.maintenance_mode, OLD.maintenance_message) AND NOT public.has_panel_permission('maintenance','edit') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  RETURN NEW;
END $$;