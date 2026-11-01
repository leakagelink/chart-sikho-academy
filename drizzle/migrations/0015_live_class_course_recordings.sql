ALTER TABLE public.class_sessions ADD COLUMN category_slug text NOT NULL DEFAULT '', ADD COLUMN course_id uuid REFERENCES public.courses(id), ADD COLUMN module_id uuid REFERENCES public.course_modules(id), ADD COLUMN completion_state text NOT NULL DEFAULT 'pending' CHECK (completion_state IN ('pending','completed')), ADD COLUMN recording_url text NOT NULL DEFAULT '';
ALTER TABLE public.course_lessons ADD COLUMN source_class_id uuid UNIQUE REFERENCES public.class_sessions(id) ON DELETE SET NULL;
CREATE FUNCTION public.sync_class_recording() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE target_course public.courses; target_lesson uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF NEW.course_id IS NOT NULL THEN
    SELECT * INTO target_course FROM public.courses WHERE id = NEW.course_id FOR UPDATE;
    IF NOT FOUND OR NEW.category_slug <> target_course.category THEN RAISE EXCEPTION 'Course category mismatch'; END IF;
  END IF;
  IF NEW.module_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.course_modules WHERE id = NEW.module_id AND course_id = NEW.course_id) THEN RAISE EXCEPTION 'Module course mismatch'; END IF;
  IF TG_OP = 'UPDATE' AND OLD.completion_state = 'completed' THEN
    IF NEW.course_id IS DISTINCT FROM OLD.course_id OR NEW.completion_state <> 'completed' THEN RAISE EXCEPTION 'Published recording course cannot change'; END IF;
  END IF;
  IF NEW.completion_state = 'completed' THEN
    IF NEW.status <> 'scheduled' OR NEW.course_id IS NULL OR NEW.module_id IS NULL OR NEW.recording_url = '' THEN RAISE EXCEPTION 'Completed class requires course module and recording'; END IF;
    IF target_course.status <> 'published' THEN RAISE EXCEPTION 'Recording requires published course'; END IF;
    IF NEW.recording_url !~ '^https://[^[:space:]]+$' THEN RAISE EXCEPTION 'HTTPS recording required'; END IF;
    SELECT id INTO target_lesson FROM public.course_lessons WHERE source_class_id = NEW.id;
    INSERT INTO public.course_lessons (id, course_id, module_id, title, position, video_url, source_class_id)
      VALUES (COALESCE(target_lesson, gen_random_uuid()), NEW.course_id, NEW.module_id, NEW.title, COALESCE((SELECT MAX(position) FROM public.course_lessons WHERE course_id = NEW.course_id), 0) + 1, NEW.recording_url, NEW.id)
      ON CONFLICT (source_class_id) DO UPDATE SET title = EXCLUDED.title, video_url = EXCLUDED.video_url, module_id = EXCLUDED.module_id;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER sync_class_recording AFTER INSERT OR UPDATE ON public.class_sessions FOR EACH ROW EXECUTE FUNCTION public.sync_class_recording();
REVOKE ALL ON FUNCTION public.sync_class_recording() FROM PUBLIC;