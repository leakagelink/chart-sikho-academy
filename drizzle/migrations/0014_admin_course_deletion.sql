CREATE OR REPLACE FUNCTION public.delete_admin_course(_course_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN
 IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
 PERFORM id FROM public.courses WHERE id = _course_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Record not found'; END IF;
 IF EXISTS (SELECT 1 FROM public.enrollments WHERE course_id = _course_id::text)
 OR EXISTS (SELECT 1 FROM public.orders WHERE course_id = _course_id::text)
 OR EXISTS (SELECT 1 FROM public.certificates WHERE course_id = _course_id)
 OR EXISTS (SELECT 1 FROM public.course_reviews WHERE course_id = _course_id)
 OR EXISTS (SELECT 1 FROM public.quizzes WHERE course_id = _course_id) THEN
 RAISE EXCEPTION 'Course has linked records';
 END IF;
 DELETE FROM public.course_lessons WHERE course_id = _course_id;
 DELETE FROM public.course_modules WHERE course_id = _course_id;
 DELETE FROM public.courses WHERE id = _course_id;
END;
$$;
REVOKE ALL ON FUNCTION public.delete_admin_course(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_admin_course(uuid) TO authenticated;
