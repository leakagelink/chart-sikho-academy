CREATE OR REPLACE FUNCTION public.delete_admin_learning_record(_resource text, _id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _section text; _kind text; _slug text; _quiz uuid;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Forbidden'; END IF;
 IF _resource NOT IN ('categories','classes','webinars','ebooks','quizzes','questions') THEN RAISE EXCEPTION 'Unsupported resource'; END IF;
 _section := _resource;
 IF _resource IN ('classes','webinars') THEN
  SELECT kind INTO _kind FROM public.class_sessions WHERE id = _id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Record not found'; END IF;
  _section := CASE WHEN _kind = 'webinar' THEN 'webinars' ELSE 'classes' END;
  IF _section <> _resource THEN RAISE EXCEPTION 'Forbidden'; END IF;
 END IF;
 IF NOT (public.has_role(auth.uid(),'admin') OR public.has_panel_permission(_section,'delete') OR (_resource='questions' AND public.has_panel_permission('quizzes','delete'))) THEN RAISE EXCEPTION 'Forbidden'; END IF;
 CASE _resource
 WHEN 'categories' THEN
  SELECT slug INTO _slug FROM public.course_categories WHERE id=_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Record not found'; END IF;
  IF EXISTS(SELECT 1 FROM public.courses WHERE category=_slug) OR EXISTS(SELECT 1 FROM public.class_sessions WHERE category_slug=_slug) THEN RAISE EXCEPTION 'Linked records'; END IF;
  DELETE FROM public.course_categories WHERE id=_id;
 WHEN 'classes','webinars' THEN
  DELETE FROM public.class_sessions WHERE id=_id;
 WHEN 'ebooks' THEN
  PERFORM id FROM public.ebooks WHERE id=_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Record not found'; END IF;
  IF EXISTS(SELECT 1 FROM public.orders WHERE course_id IN (_id::text,'ebook:'||_id::text)) THEN RAISE EXCEPTION 'Linked records'; END IF;
  DELETE FROM public.ebooks WHERE id=_id;
 WHEN 'quizzes' THEN
  PERFORM id FROM public.quizzes WHERE id=_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Record not found'; END IF;
  IF EXISTS(SELECT 1 FROM public.quiz_attempts WHERE quiz_id=_id) OR EXISTS(SELECT 1 FROM public.courses WHERE final_quiz_id=_id) THEN RAISE EXCEPTION 'Linked records'; END IF;
  DELETE FROM public.quizzes WHERE id=_id;
 WHEN 'questions' THEN
  SELECT quiz_id INTO _quiz FROM public.quiz_questions WHERE id=_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Record not found'; END IF;
  IF _quiz IS NOT NULL THEN
   PERFORM id FROM public.quizzes WHERE id=_quiz FOR UPDATE;
   IF EXISTS(SELECT 1 FROM public.quiz_attempts WHERE quiz_id=_quiz) THEN RAISE EXCEPTION 'Linked records'; END IF;
  END IF;
  DELETE FROM public.quiz_questions WHERE id=_id;
 END CASE;
END;
$$;
REVOKE ALL ON FUNCTION public.delete_admin_learning_record(text,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.delete_admin_learning_record(text,uuid) TO authenticated;
COMMENT ON FUNCTION public.delete_admin_learning_record(text,uuid) IS 'Permission-checked learning deletion; protects linked history and preserves stored files and course recordings.';