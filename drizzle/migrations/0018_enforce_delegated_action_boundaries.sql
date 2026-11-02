CREATE OR REPLACE FUNCTION public.guard_delegated_settings() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
IF public.has_role(auth.uid(),'admin') THEN RETURN NEW; END IF;
IF (to_jsonb(NEW)-ARRAY['updated_at','referral_enabled','ref_level1_percent','ref_level2_percent','ref_level3_percent','maintenance_mode','maintenance_message']) IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['updated_at','referral_enabled','ref_level1_percent','ref_level2_percent','ref_level3_percent','maintenance_mode','maintenance_message']) AND NOT public.has_panel_permission('settings','edit') THEN RAISE EXCEPTION 'Forbidden'; END IF;
IF (NEW.referral_enabled,NEW.ref_level1_percent,NEW.ref_level2_percent,NEW.ref_level3_percent) IS DISTINCT FROM (OLD.referral_enabled,OLD.ref_level1_percent,OLD.ref_level2_percent,OLD.ref_level3_percent) AND NOT (public.has_panel_permission('settings','edit') OR public.has_panel_permission('refsettings','edit')) THEN RAISE EXCEPTION 'Forbidden'; END IF;
IF (NEW.maintenance_mode,NEW.maintenance_message) IS DISTINCT FROM (OLD.maintenance_mode,OLD.maintenance_message) AND NOT public.has_panel_permission('maintenance','edit') THEN RAISE EXCEPTION 'Forbidden'; END IF;
RETURN NEW; END $$;
CREATE TRIGGER guard_delegated_settings BEFORE UPDATE ON public.admin_settings FOR EACH ROW EXECUTE FUNCTION public.guard_delegated_settings();
CREATE OR REPLACE FUNCTION public.guard_video_removal() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
IF public.has_role(auth.uid(),'admin') OR public.has_panel_permission('lessons','edit') OR public.has_panel_permission('builder','edit') OR pg_trigger_depth()>1 THEN RETURN NEW; END IF;
IF public.has_panel_permission('videos','delete') THEN
IF NEW.video_url<>'' OR NEW.resource_path IS DISTINCT FROM (CASE WHEN OLD.resource_path ~* '\.(mp4|webm)$' THEN '' ELSE OLD.resource_path END) OR (to_jsonb(NEW)-ARRAY['video_url','resource_path']) IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['video_url','resource_path']) THEN RAISE EXCEPTION 'Forbidden'; END IF;
RETURN NEW; END IF;
RAISE EXCEPTION 'Forbidden'; END $$;
CREATE TRIGGER guard_video_removal BEFORE UPDATE ON public.course_lessons FOR EACH ROW EXECUTE FUNCTION public.guard_video_removal();
ALTER FUNCTION public.sync_class_recording() SECURITY DEFINER;
ALTER FUNCTION public.delete_admin_course(uuid) SECURITY DEFINER;
REVOKE ALL ON FUNCTION public.sync_class_recording() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.guard_delegated_settings() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.guard_video_removal() FROM PUBLIC,anon,authenticated;
CREATE POLICY "Delegated curriculum resource upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id='course-resources' AND (public.has_panel_permission('lessons','create') OR public.has_panel_permission('lessons','edit') OR public.has_panel_permission('builder','create') OR public.has_panel_permission('builder','edit') OR public.has_panel_permission('ebooks','create') OR public.has_panel_permission('ebooks','edit')));
CREATE POLICY "Delegated curriculum resource read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id='course-resources' AND (public.has_panel_permission('lessons','view') OR public.has_panel_permission('builder','view') OR public.has_panel_permission('ebooks','view') OR public.has_panel_permission('videos','view')));