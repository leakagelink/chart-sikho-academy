ALTER TABLE public.class_sessions DROP CONSTRAINT class_sessions_kind_check;
ALTER TABLE public.class_sessions ADD CONSTRAINT class_sessions_kind_check CHECK (kind IN ('class','webinar','seminar'));
DO $$ DECLARE definition text; BEGIN
SELECT pg_get_constraintdef(oid) INTO definition FROM pg_constraint WHERE conrelid='public.user_panel_permissions'::regclass AND conname='user_panel_permissions_section_check';
IF definition IS NULL THEN RAISE EXCEPTION 'Missing section constraint'; END IF;
definition:=replace(definition,'''webinars''::text','''webinars''::text, ''seminars''::text');
ALTER TABLE public.user_panel_permissions DROP CONSTRAINT user_panel_permissions_section_check;
EXECUTE 'ALTER TABLE public.user_panel_permissions ADD CONSTRAINT user_panel_permissions_section_check '||definition;
END $$;
ALTER POLICY "Delegated panel read" ON public.class_sessions USING (public.has_panel_permission('overview','view') OR public.has_panel_permission(CASE kind WHEN 'webinar' THEN 'webinars' WHEN 'seminar' THEN 'seminars' ELSE 'classes' END,'view'));
ALTER POLICY "Delegated classes read scoped" ON public.class_sessions USING (public.has_panel_permission(CASE kind WHEN 'webinar' THEN 'webinars' WHEN 'seminar' THEN 'seminars' ELSE 'classes' END,'view'));
ALTER POLICY "Delegated classes create" ON public.class_sessions WITH CHECK (public.has_panel_permission(CASE kind WHEN 'webinar' THEN 'webinars' WHEN 'seminar' THEN 'seminars' ELSE 'classes' END,'create'));
ALTER POLICY "Delegated classes edit" ON public.class_sessions USING (public.has_panel_permission(CASE kind WHEN 'webinar' THEN 'webinars' WHEN 'seminar' THEN 'seminars' ELSE 'classes' END,'edit')) WITH CHECK (public.has_panel_permission(CASE kind WHEN 'webinar' THEN 'webinars' WHEN 'seminar' THEN 'seminars' ELSE 'classes' END,'edit'));
DO $$ DECLARE definition text; t text; condition text; BEGIN
SELECT pg_get_functiondef('public.sync_class_recording()'::regprocedure) INTO definition;
IF position('WHEN ''webinar'' THEN ''webinars''' IN definition)=0 THEN RAISE EXCEPTION 'Missing session permission mapping'; END IF;
EXECUTE replace(definition,'WHEN ''webinar'' THEN ''webinars''','WHEN ''webinar'' THEN ''webinars'' WHEN ''seminar'' THEN ''seminars''');
SELECT pg_get_functiondef('public.delete_admin_learning_record(text,uuid)'::regprocedure) INTO definition;
IF position('WHEN _kind = ''webinar''' IN definition)=0 THEN RAISE EXCEPTION 'Missing deletion mapping'; END IF;
definition:=replace(definition,'''classes'',''webinars''','''classes'',''webinars'',''seminars''');
definition:=replace(definition,'WHEN _kind = ''webinar'' THEN ''webinars''','WHEN _kind = ''webinar'' THEN ''webinars'' WHEN _kind = ''seminar'' THEN ''seminars''');
EXECUTE definition;
FOREACH t IN ARRAY ARRAY['courses','course_lessons','course_modules','course_categories'] LOOP
SELECT qual INTO condition FROM pg_policies WHERE schemaname='public' AND tablename=t AND policyname='Delegated panel read';
IF condition IS NULL THEN RAISE EXCEPTION 'Missing selector read policy'; END IF;
EXECUTE format('ALTER POLICY "Delegated panel read" ON public.%I USING ((%s) OR public.has_panel_permission(''seminars'',''view''))',t,condition);
END LOOP;
END $$;
COMMENT ON CONSTRAINT class_sessions_kind_check ON public.class_sessions IS 'Classes, webinars and seminars share scheduled catalog and purchase-gated access.';