DROP TRIGGER IF EXISTS guard_delegated_settings ON public.admin_settings;
ALTER TABLE public.admin_settings ADD COLUMN ref_levels jsonb;
UPDATE public.admin_settings SET ref_levels = to_jsonb(ARRAY[ref_level1_percent, ref_level2_percent, ref_level3_percent]);
ALTER TABLE public.admin_settings ALTER COLUMN ref_levels SET DEFAULT '[10,5,2]'::jsonb;
CREATE OR REPLACE FUNCTION public.valid_ref_levels(_levels jsonb) RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT _levels IS NULL OR (jsonb_typeof(_levels) = 'array' AND jsonb_array_length(_levels) BETWEEN 1 AND 50 AND NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(_levels) e
    WHERE jsonb_typeof(e) <> 'number' OR (e #>> '{}')::numeric > 100 OR (e #>> '{}')::numeric < 0));
$$;
ALTER TABLE public.admin_settings ADD CONSTRAINT admin_settings_ref_levels_check CHECK (public.valid_ref_levels(ref_levels));
COMMENT ON COLUMN public.admin_settings.ref_levels IS 'Dynamic referral level commission percents, e.g. [10,5,2,1]';
COMMENT ON COLUMN public.admin_settings.ref_level1_percent IS 'DEPRECATED: replaced by ref_levels (kept in sync for compatibility)';
COMMENT ON COLUMN public.admin_settings.ref_level2_percent IS 'DEPRECATED: replaced by ref_levels (kept in sync for compatibility)';
COMMENT ON COLUMN public.admin_settings.ref_level3_percent IS 'DEPRECATED: replaced by ref_levels (kept in sync for compatibility)';
CREATE OR REPLACE FUNCTION public.guard_delegated_settings() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
IF public.has_role(auth.uid(),'admin') THEN RETURN NEW; END IF;
IF (to_jsonb(NEW)-ARRAY['updated_at','ref_levels','referral_enabled','ref_level1_percent','ref_level2_percent','ref_level3_percent','maintenance_mode','maintenance_message']) IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['updated_at','ref_levels','referral_enabled','ref_level1_percent','ref_level2_percent','ref_level3_percent','maintenance_mode','maintenance_message']) AND NOT public.has_panel_permission('settings','edit') THEN RAISE EXCEPTION 'Forbidden'; END IF;
IF (NEW.ref_levels,NEW.referral_enabled,NEW.ref_level1_percent,NEW.ref_level2_percent,NEW.ref_level3_percent) IS DISTINCT FROM (OLD.ref_levels,OLD.referral_enabled,OLD.ref_level1_percent,OLD.ref_level2_percent,OLD.ref_level3_percent) AND NOT (public.has_panel_permission('settings','edit') OR public.has_panel_permission('refsettings','edit')) THEN RAISE EXCEPTION 'Forbidden'; END IF;
IF (NEW.maintenance_mode,NEW.maintenance_message) IS DISTINCT FROM (OLD.maintenance_mode,OLD.maintenance_message) AND NOT public.has_panel_permission('maintenance','edit') THEN RAISE EXCEPTION 'Forbidden'; END IF;
RETURN NEW; END $$;
CREATE TRIGGER guard_delegated_settings BEFORE UPDATE ON public.admin_settings FOR EACH ROW EXECUTE FUNCTION public.guard_delegated_settings();