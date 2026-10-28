CREATE TABLE public.quiz_attempts (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE, user_id UUID NOT NULL DEFAULT auth.uid(), score NUMERIC(8,2) NOT NULL DEFAULT 0, total INTEGER NOT NULL DEFAULT 0, percent NUMERIC(5,2) NOT NULL DEFAULT 0, passed BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
GRANT SELECT, INSERT ON public.quiz_attempts TO authenticated;
GRANT ALL ON public.quiz_attempts TO service_role;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own attempts read" ON public.quiz_attempts FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own attempt insert" ON public.quiz_attempts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.quizzes q WHERE q.id = quiz_id AND q.status = 'published' AND (q.course_id IS NULL OR EXISTS (SELECT 1 FROM public.enrollments e WHERE e.user_id = auth.uid() AND e.course_id = q.course_id::text))) AND (SELECT count(*) FROM public.quiz_attempts a WHERE a.quiz_id = quiz_attempts.quiz_id AND a.user_id = auth.uid()) < (SELECT max_attempts FROM public.quizzes q2 WHERE q2.id = quiz_attempts.quiz_id));
CREATE POLICY "admin attempts read" ON public.quiz_attempts FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "students read published quizzes" ON public.quizzes FOR SELECT TO authenticated USING (status = 'published');
CREATE POLICY "students read published quiz questions" ON public.quiz_questions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.quizzes q WHERE q.id = quiz_id AND q.status = 'published'));