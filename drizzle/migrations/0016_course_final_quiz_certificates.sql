-- Any quiz can be the final quiz of any number of courses
ALTER TABLE public.courses ADD COLUMN final_quiz_id uuid REFERENCES public.quizzes(id) ON DELETE SET NULL;
UPDATE public.courses c SET final_quiz_id = q.id
FROM (SELECT DISTINCT ON (course_id) id, course_id FROM public.quizzes WHERE course_id IS NOT NULL ORDER BY course_id, (status = 'published') DESC, created_at DESC) q
WHERE q.course_id = c.id AND c.final_quiz_id IS NULL;
COMMENT ON COLUMN public.quizzes.course_id IS 'DEPRECATED: replaced by courses.final_quiz_id (one quiz can be linked to many courses)';

-- Attempts are counted per course, so a shared quiz has separate attempts in each course
ALTER TABLE public.quiz_attempts ADD COLUMN course_id uuid REFERENCES public.courses(id);
UPDATE public.quiz_attempts a SET course_id = q.course_id FROM public.quizzes q WHERE q.id = a.quiz_id AND a.course_id IS NULL;
CREATE INDEX quiz_attempts_user_course_idx ON public.quiz_attempts (user_id, course_id, quiz_id);

-- Lesson completion tracking
CREATE TABLE public.lesson_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);
GRANT SELECT, INSERT, DELETE ON public.lesson_completions TO authenticated;
GRANT ALL ON public.lesson_completions TO service_role;
ALTER TABLE public.lesson_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own completions read" ON public.lesson_completions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "admin completions read" ON public.lesson_completions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "own completions insert" ON public.lesson_completions FOR INSERT TO authenticated WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (SELECT 1 FROM public.course_lessons l WHERE l.id = lesson_id AND l.course_id = lesson_completions.course_id)
  AND EXISTS (SELECT 1 FROM public.enrollments e WHERE e.user_id = auth.uid() AND e.course_id = lesson_completions.course_id::text)
);
CREATE POLICY "own completions delete" ON public.lesson_completions FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.sync_lesson_progress()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _user uuid; _course uuid; _total int; _done int;
BEGIN
  IF TG_OP = 'DELETE' THEN _user := OLD.user_id; _course := OLD.course_id; ELSE _user := NEW.user_id; _course := NEW.course_id; END IF;
  SELECT count(*) INTO _total FROM public.course_lessons WHERE course_id = _course;
  SELECT count(*) INTO _done FROM public.lesson_completions lc JOIN public.course_lessons l ON l.id = lc.lesson_id WHERE lc.user_id = _user AND lc.course_id = _course;
  UPDATE public.enrollments SET progress = CASE WHEN _total = 0 THEN 0 ELSE LEAST(100, round(_done * 100.0 / _total)::int) END, updated_at = now()
  WHERE user_id = _user AND course_id = _course::text;
  RETURN NULL;
END $$;
CREATE TRIGGER sync_lesson_progress AFTER INSERT OR DELETE ON public.lesson_completions FOR EACH ROW EXECUTE FUNCTION public.sync_lesson_progress();

-- Students no longer read answer keys or write attempts directly; the functions below do it
DROP POLICY IF EXISTS "students read published quiz questions" ON public.quiz_questions;
DROP POLICY IF EXISTS "own attempt insert" ON public.quiz_attempts;

CREATE OR REPLACE FUNCTION public.get_course_quiz(_course_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _total int; _done int; _used int := 0; _best numeric;
  _qid uuid; _title text; _limit int; _pass int; _max int; _cert_no text; _cert_status text; _unlocked boolean;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Login required' USING ERRCODE = '42501'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.enrollments WHERE user_id = _uid AND course_id = _course_id::text) THEN
    RETURN jsonb_build_object('enrolled', false);
  END IF;
  SELECT count(*) INTO _total FROM public.course_lessons WHERE course_id = _course_id;
  SELECT count(*) INTO _done FROM public.lesson_completions lc JOIN public.course_lessons l ON l.id = lc.lesson_id WHERE lc.user_id = _uid AND lc.course_id = _course_id;
  _unlocked := _total > 0 AND _done >= _total;
  SELECT certificate_no, status INTO _cert_no, _cert_status FROM public.certificates WHERE user_id = _uid AND course_id = _course_id;
  SELECT q.id, q.title, q.time_limit_minutes, q.pass_percent, q.max_attempts INTO _qid, _title, _limit, _pass, _max
  FROM public.courses c JOIN public.quizzes q ON q.id = c.final_quiz_id
  WHERE c.id = _course_id AND q.status = 'published' AND EXISTS (SELECT 1 FROM public.quiz_questions qq WHERE qq.quiz_id = q.id);
  IF _qid IS NOT NULL THEN
    SELECT count(*), max(percent) INTO _used, _best FROM public.quiz_attempts WHERE user_id = _uid AND quiz_id = _qid AND course_id = _course_id;
  END IF;
  RETURN jsonb_build_object(
    'enrolled', true, 'totalLessons', _total, 'completedLessons', _done, 'unlocked', _unlocked,
    'certificate', CASE WHEN _cert_no IS NULL THEN NULL ELSE jsonb_build_object('certificate_no', _cert_no, 'status', _cert_status) END,
    'bestPercent', _best, 'attemptsUsed', _used, 'attemptsLeft', CASE WHEN _qid IS NULL THEN 0 ELSE GREATEST(0, _max - _used) END,
    'quiz', CASE WHEN _qid IS NULL THEN NULL ELSE jsonb_build_object('id', _qid, 'title', _title, 'time_limit_minutes', _limit, 'pass_percent', _pass, 'max_attempts', _max) END,
    'questions', CASE WHEN _qid IS NULL OR NOT _unlocked THEN '[]'::jsonb ELSE COALESCE((
      SELECT jsonb_agg(jsonb_build_object('id', id, 'topic', topic, 'question', question, 'option_a', option_a, 'option_b', option_b, 'option_c', option_c, 'option_d', option_d, 'marks', marks) ORDER BY created_at)
      FROM public.quiz_questions WHERE quiz_id = _qid), '[]'::jsonb) END
  );
END $$;

CREATE OR REPLACE FUNCTION public.submit_course_quiz(_course_id uuid, _answers jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _qz public.quizzes%ROWTYPE; _total int; _done int; _used int;
  _marks int := 0; _raw numeric := 0; _q record; _chosen text; _score numeric; _pct numeric;
  _correct jsonb := '{}'::jsonb; _cert_no text; _cert_status text;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Login required' USING ERRCODE = '42501'; END IF;
  IF _answers IS NULL OR jsonb_typeof(_answers) <> 'object' THEN RAISE EXCEPTION 'Invalid answers'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = _uid AND account_status = 'active') THEN RAISE EXCEPTION 'Account paused' USING ERRCODE = '42501'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.enrollments WHERE user_id = _uid AND course_id = _course_id::text) THEN RAISE EXCEPTION 'Not enrolled' USING ERRCODE = '42501'; END IF;
  SELECT q.* INTO _qz FROM public.courses c JOIN public.quizzes q ON q.id = c.final_quiz_id WHERE c.id = _course_id AND q.status = 'published';
  IF _qz.id IS NULL THEN RAISE EXCEPTION 'Quiz not available'; END IF;
  SELECT count(*) INTO _total FROM public.course_lessons WHERE course_id = _course_id;
  SELECT count(*) INTO _done FROM public.lesson_completions lc JOIN public.course_lessons l ON l.id = lc.lesson_id WHERE lc.user_id = _uid AND lc.course_id = _course_id;
  IF _total = 0 OR _done < _total THEN RAISE EXCEPTION 'Complete the course first'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext(_uid::text || ':' || _course_id::text));
  SELECT count(*) INTO _used FROM public.quiz_attempts WHERE user_id = _uid AND quiz_id = _qz.id AND course_id = _course_id;
  IF _used >= _qz.max_attempts THEN RAISE EXCEPTION 'No attempts left' USING ERRCODE = '42501'; END IF;
  FOR _q IN SELECT id, correct_option, marks FROM public.quiz_questions WHERE quiz_id = _qz.id LOOP
    _marks := _marks + _q.marks;
    _chosen := _answers ->> _q.id::text;
    IF _chosen IS NOT NULL AND _chosen <> '' THEN
      IF _chosen = _q.correct_option THEN _raw := _raw + _q.marks; ELSE _raw := _raw - _qz.negative_marks; END IF;
    END IF;
    _correct := _correct || jsonb_build_object(_q.id::text, _q.correct_option);
  END LOOP;
  IF _marks = 0 THEN RAISE EXCEPTION 'Quiz not available'; END IF;
  _score := GREATEST(0, round(_raw, 2));
  _pct := round(_score * 100 / _marks, 2);
  INSERT INTO public.quiz_attempts (quiz_id, user_id, course_id, score, total, percent, passed)
  VALUES (_qz.id, _uid, _course_id, _score, _marks, _pct, _pct >= _qz.pass_percent);
  SELECT certificate_no, status INTO _cert_no, _cert_status FROM public.certificates WHERE user_id = _uid AND course_id = _course_id;
  -- Certificate rule: at least 80% (e.g. 8 out of 10) after completing every lesson
  IF _cert_no IS NULL AND _pct >= 80 THEN
    LOOP
      _cert_no := 'CS-' || extract(year FROM now())::int || '-' || (SELECT string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + floor(random() * 32)::int, 1), '') FROM generate_series(1, 6));
      BEGIN
        INSERT INTO public.certificates (user_id, course_id, certificate_no) VALUES (_uid, _course_id, _cert_no);
        _cert_status := 'issued';
        EXIT;
      EXCEPTION WHEN unique_violation THEN
        SELECT certificate_no, status INTO _cert_no, _cert_status FROM public.certificates WHERE user_id = _uid AND course_id = _course_id;
        IF _cert_no IS NOT NULL THEN EXIT; END IF;
      END;
    END LOOP;
  END IF;
  RETURN jsonb_build_object('score', _score, 'total', _marks, 'percent', _pct, 'passed', _pct >= _qz.pass_percent, 'correct', _correct,
    'certificate', CASE WHEN _cert_no IS NULL THEN NULL ELSE jsonb_build_object('certificate_no', _cert_no, 'status', _cert_status) END);
END $$;

REVOKE EXECUTE ON FUNCTION public.get_course_quiz(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.submit_course_quiz(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_course_quiz(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_course_quiz(uuid, jsonb) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_lesson_progress() FROM PUBLIC, anon, authenticated;

-- Course deletion: quizzes are reusable, so detach them; student quiz attempts still block deletion
CREATE OR REPLACE FUNCTION public.delete_admin_course(_course_id uuid)
RETURNS void LANGUAGE plpgsql SET search_path TO 'public' AS $function$
BEGIN
 IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
 PERFORM id FROM public.courses WHERE id = _course_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Record not found'; END IF;
 IF EXISTS (SELECT 1 FROM public.enrollments WHERE course_id = _course_id::text)
 OR EXISTS (SELECT 1 FROM public.orders WHERE course_id = _course_id::text)
 OR EXISTS (SELECT 1 FROM public.certificates WHERE course_id = _course_id)
 OR EXISTS (SELECT 1 FROM public.course_reviews WHERE course_id = _course_id)
 OR EXISTS (SELECT 1 FROM public.quiz_attempts WHERE course_id = _course_id) THEN
 RAISE EXCEPTION 'Course has linked records';
 END IF;
 UPDATE public.quizzes SET course_id = NULL WHERE course_id = _course_id;
 DELETE FROM public.course_lessons WHERE course_id = _course_id;
 DELETE FROM public.course_modules WHERE course_id = _course_id;
 DELETE FROM public.courses WHERE id = _course_id;
END;
$function$;