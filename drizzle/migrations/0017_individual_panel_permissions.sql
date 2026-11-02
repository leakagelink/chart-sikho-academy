CREATE TABLE public.user_panel_permissions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, section text NOT NULL CHECK (section IN ('overview','users','categories','builder','courses','lessons','videos','classes','webinars','ebooks','orders','payments','affiliates','commissions','payouts','notifications','settings','quizzes','questions','certificates','progress','reviews','pricing','coupons','refunds','invoices','abandoned','instructors','roles','verification','blocked','bulk','refsettings','reflinks','teamtree','commrules','ranks','bonuses','fraud','templates','announcements','tickets','banners','campaigns','leads','seo','promocodes','maintenance')), action text NOT NULL CHECK (action IN ('view','create','edit','delete')), UNIQUE(user_id,section,action));
GRANT SELECT ON public.user_panel_permissions TO authenticated;
GRANT ALL ON public.user_panel_permissions TO service_role;
ALTER TABLE public.user_panel_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own permissions or admin" ON public.user_panel_permissions FOR SELECT TO authenticated USING (user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE OR REPLACE FUNCTION public.has_panel_permission(_section text, _action text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND account_status='active') AND (public.has_role(auth.uid(),'admin') OR EXISTS(SELECT 1 FROM public.user_panel_permissions WHERE user_id=auth.uid() AND section=_section AND action=_action AND NOT (section='roles' AND action<>'view'))) $$;
REVOKE ALL ON FUNCTION public.has_panel_permission(text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.has_panel_permission(text,text) TO authenticated;
CREATE OR REPLACE FUNCTION public.set_panel_permissions(_user_id uuid,_permissions jsonb) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE p jsonb; BEGIN
IF NOT public.has_panel_permission('roles','edit') OR _user_id=auth.uid() OR jsonb_typeof(_permissions)<>'array' OR jsonb_array_length(_permissions)>200 THEN RAISE EXCEPTION 'Forbidden'; END IF;
IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=_user_id) THEN RAISE EXCEPTION 'User not found'; END IF;
DELETE FROM public.user_panel_permissions WHERE user_id=_user_id;
FOR p IN SELECT value FROM jsonb_array_elements(_permissions) LOOP
IF p->>'section'='roles' AND p->>'action'<>'view' THEN RAISE EXCEPTION 'Only administrators assign access'; END IF;
INSERT INTO public.user_panel_permissions(user_id,section,action) VALUES(_user_id,p->>'section',p->>'action') ON CONFLICT DO NOTHING;
INSERT INTO public.user_panel_permissions(user_id,section,action) VALUES(_user_id,p->>'section','view') ON CONFLICT DO NOTHING;
END LOOP;
INSERT INTO public.admin_audit_log(actor_id,resource,record_id,action) VALUES(auth.uid(),'user_panel_permissions',_user_id,'UPDATE');
END $$;
REVOKE ALL ON FUNCTION public.set_panel_permissions(uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.set_panel_permissions(uuid,jsonb) TO authenticated;
DO $$ DECLARE t text; sections jsonb; cond text; v text; action_name text; command_name text;
read_map jsonb := '{"profiles":["users","roles","verification","blocked","bulk","reflinks","teamtree","affiliates","orders","payments","commissions","payouts","certificates","progress","reviews","refunds","bonuses","notifications","announcements","tickets","fraud"],"courses":["courses","builder","lessons","videos","classes","webinars","pricing","quizzes","certificates","progress","reviews","orders","payments","abandoned","notifications","announcements"],"course_lessons":["lessons","videos","builder","courses","classes","webinars"],"course_modules":["builder","lessons","classes","webinars","courses"],"course_categories":["categories","courses","builder","classes","webinars","pricing"],"class_sessions":["classes","webinars"],"ebooks":["ebooks"],"enrollments":["progress","courses","certificates","users","bulk"],"orders":["orders","payments","invoices","fraud"],"referral_relationships":["affiliates","teamtree","fraud"],"commission_entries":["commissions","fraud"],"payout_requests":["payouts"],"notification_campaigns":["notifications"],"admin_settings":["settings","refsettings","commrules","maintenance"],"admin_audit_log":[],"quizzes":["quizzes","questions","courses","builder"],"quiz_questions":["questions","quizzes"],"certificates":["certificates"],"course_reviews":["reviews"],"coupons":["coupons","promocodes"],"refund_requests":["refunds"],"invoices":["invoices"],"abandoned_checkouts":["abandoned"],"instructors":["instructors"],"ranks":["ranks"],"bonus_entries":["bonuses"],"user_roles":["roles"],"message_templates":["templates","campaigns"],"announcements":["announcements"],"support_tickets":["tickets"],"banners":["banners"],"campaigns":["campaigns"],"leads":["leads"],"seo_pages":["seo"],"promo_codes":["promocodes"]}';
write_map jsonb := '{"course_categories":["categories"],"courses":["courses","builder","pricing"],"course_modules":["builder"],"course_lessons":["lessons","builder"],"ebooks":["ebooks"],"quizzes":["quizzes"],"quiz_questions":["questions","quizzes"],"certificates":["certificates"],"coupons":["coupons"],"invoices":["invoices"],"instructors":["instructors"],"ranks":["ranks"],"bonus_entries":["bonuses"],"notification_campaigns":["notifications"],"message_templates":["templates"],"announcements":["announcements"],"support_tickets":["tickets"],"banners":["banners"],"campaigns":["campaigns"],"leads":["leads"],"seo_pages":["seo"],"promo_codes":["promocodes"],"course_reviews":["reviews"],"payout_requests":["payouts"],"refund_requests":["refunds"],"abandoned_checkouts":["abandoned"]}';
BEGIN
FOR t,sections IN SELECT key,value FROM jsonb_each(read_map) LOOP
cond := 'public.has_panel_permission(''overview'',''view'')';
FOR v IN SELECT jsonb_array_elements_text(sections) LOOP cond:=cond||format(' OR public.has_panel_permission(%L,''view'')',v); END LOOP;
EXECUTE format('GRANT SELECT ON public.%I TO authenticated',t);
EXECUTE format('CREATE POLICY "Delegated panel read" ON public.%I FOR SELECT TO authenticated USING (%s)',t,cond);
END LOOP;
FOR t,sections IN SELECT key,value FROM jsonb_each(write_map) LOOP
FOREACH action_name IN ARRAY ARRAY['create','edit','delete'] LOOP
IF action_name='delete' AND t NOT IN ('courses','course_modules','course_lessons') THEN CONTINUE; END IF;
IF action_name='create' AND t IN ('course_reviews','payout_requests','refund_requests','abandoned_checkouts') THEN CONTINUE; END IF;
cond:='false'; FOR v IN SELECT jsonb_array_elements_text(sections) LOOP cond:=cond||format(' OR public.has_panel_permission(%L,%L)',v,action_name); END LOOP;
IF t='course_lessons' AND action_name='edit' THEN cond:=cond||' OR public.has_panel_permission(''videos'',''delete'')'; END IF;
command_name:=CASE action_name WHEN 'create' THEN 'INSERT' WHEN 'edit' THEN 'UPDATE' ELSE 'DELETE' END;
EXECUTE format('GRANT %s ON public.%I TO authenticated',command_name,t);
EXECUTE format('CREATE POLICY %I ON public.%I FOR %s TO authenticated %s', 'Delegated panel '||action_name,t,command_name,CASE WHEN action_name='create' THEN format('WITH CHECK (%s)',cond) WHEN action_name='delete' THEN format('USING (%s)',cond) ELSE format('USING (%s) WITH CHECK (%s)',cond,cond) END);
END LOOP; END LOOP;
END $$;
CREATE POLICY "Delegated classes read scoped" ON public.class_sessions FOR SELECT TO authenticated USING (public.has_panel_permission(CASE kind WHEN 'webinar' THEN 'webinars' ELSE 'classes' END,'view'));
CREATE POLICY "Delegated classes create" ON public.class_sessions FOR INSERT TO authenticated WITH CHECK (public.has_panel_permission(CASE kind WHEN 'webinar' THEN 'webinars' ELSE 'classes' END,'create'));
CREATE POLICY "Delegated classes edit" ON public.class_sessions FOR UPDATE TO authenticated USING (public.has_panel_permission(CASE kind WHEN 'webinar' THEN 'webinars' ELSE 'classes' END,'edit')) WITH CHECK (public.has_panel_permission(CASE kind WHEN 'webinar' THEN 'webinars' ELSE 'classes' END,'edit'));
CREATE POLICY "Delegated profile edit" ON public.profiles FOR UPDATE TO authenticated USING (public.has_panel_permission('users','edit') OR public.has_panel_permission('blocked','edit') OR public.has_panel_permission('verification','edit')) WITH CHECK (public.has_panel_permission('users','edit') OR public.has_panel_permission('blocked','edit') OR public.has_panel_permission('verification','edit'));
CREATE POLICY "Delegated settings edit" ON public.admin_settings FOR UPDATE TO authenticated USING (public.has_panel_permission('settings','edit') OR public.has_panel_permission('refsettings','edit') OR public.has_panel_permission('maintenance','edit')) WITH CHECK (public.has_panel_permission('settings','edit') OR public.has_panel_permission('refsettings','edit') OR public.has_panel_permission('maintenance','edit'));
CREATE OR REPLACE FUNCTION public.protect_account_status() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN IF NEW.account_status IS DISTINCT FROM OLD.account_status AND NOT (public.has_panel_permission('users','edit') OR public.has_panel_permission('blocked','edit')) THEN RAISE EXCEPTION 'Forbidden'; END IF; IF NEW.verification_status IS DISTINCT FROM OLD.verification_status AND NOT public.has_panel_permission('verification','edit') THEN RAISE EXCEPTION 'Forbidden'; END IF; RETURN NEW; END $$;
DO $$ DECLARE definition text; BEGIN
SELECT pg_get_functiondef('public.sync_class_recording()'::regprocedure) INTO definition;
definition:=replace(definition,'IF NOT public.has_role(auth.uid(), ''admin'') THEN','IF NOT public.has_panel_permission(CASE NEW.kind WHEN ''webinar'' THEN ''webinars'' ELSE ''classes'' END, CASE TG_OP WHEN ''INSERT'' THEN ''create'' ELSE ''edit'' END) THEN');
EXECUTE definition;
SELECT pg_get_functiondef('public.delete_admin_course(uuid)'::regprocedure) INTO definition;
definition:=replace(definition,'IF NOT public.has_role(auth.uid(), ''admin'') THEN','IF NOT (public.has_panel_permission(''courses'',''delete'') OR public.has_panel_permission(''builder'',''delete'')) THEN');
EXECUTE definition;
END $$;