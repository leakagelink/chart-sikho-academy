CREATE TABLE public.quizzes (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE, time_limit_minutes integer NOT NULL DEFAULT 10 CHECK (time_limit_minutes BETWEEN 1 AND 300), pass_percent integer NOT NULL DEFAULT 40 CHECK (pass_percent BETWEEN 0 AND 100), negative_marks numeric(4,2) NOT NULL DEFAULT 0 CHECK (negative_marks BETWEEN 0 AND 10), max_attempts integer NOT NULL DEFAULT 1 CHECK (max_attempts BETWEEN 1 AND 50), status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')), created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quizzes TO authenticated; GRANT ALL ON public.quizzes TO service_role;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin quizzes all" ON public.quizzes FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.quiz_questions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), quiz_id uuid REFERENCES public.quizzes(id) ON DELETE SET NULL, topic text NOT NULL DEFAULT '', question text NOT NULL, option_a text NOT NULL, option_b text NOT NULL, option_c text NOT NULL DEFAULT '', option_d text NOT NULL DEFAULT '', correct_option text NOT NULL CHECK (correct_option IN ('a','b','c','d')), marks integer NOT NULL DEFAULT 1 CHECK (marks BETWEEN 1 AND 100), created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_questions TO authenticated; GRANT ALL ON public.quiz_questions TO service_role;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin questions all" ON public.quiz_questions FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.certificates (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), certificate_no text NOT NULL UNIQUE, user_id uuid NOT NULL, course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE, status text NOT NULL DEFAULT 'issued' CHECK (status IN ('issued','revoked')), issued_at timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (user_id, course_id));
GRANT SELECT, INSERT, UPDATE ON public.certificates TO authenticated; GRANT ALL ON public.certificates TO service_role;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin certificates all" ON public.certificates FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "own certificates read" ON public.certificates FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.verify_certificate(_no text) RETURNS TABLE(certificate_no text, student_name text, course_title text, status text, issued_at timestamptz) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.certificate_no, COALESCE(p.full_name,''), co.title, c.status, c.issued_at FROM public.certificates c JOIN public.courses co ON co.id = c.course_id LEFT JOIN public.profiles p ON p.id = c.user_id WHERE c.certificate_no = upper(trim(_no)) LIMIT 1
$$;
GRANT EXECUTE ON FUNCTION public.verify_certificate(text) TO anon, authenticated;

CREATE TABLE public.course_reviews (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(), course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE, rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5), comment text NOT NULL DEFAULT '' CHECK (length(comment) <= 1000), status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','hidden')), created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (user_id, course_id));
GRANT SELECT ON public.course_reviews TO anon; GRANT SELECT, INSERT, UPDATE ON public.course_reviews TO authenticated; GRANT ALL ON public.course_reviews TO service_role;
ALTER TABLE public.course_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "approved reviews read" ON public.course_reviews FOR SELECT TO anon, authenticated USING (status = 'approved');
CREATE POLICY "own reviews read" ON public.course_reviews FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own enrolled review insert" ON public.course_reviews FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND status = 'pending' AND EXISTS (SELECT 1 FROM public.enrollments e WHERE e.user_id = auth.uid() AND e.course_id = course_reviews.course_id::text));
CREATE POLICY "admin reviews read" ON public.course_reviews FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin reviews moderate" ON public.course_reviews FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER audit_quizzes AFTER INSERT OR UPDATE OR DELETE ON public.quizzes FOR EACH ROW EXECUTE FUNCTION public.audit_admin_change();
CREATE TRIGGER audit_quiz_questions AFTER INSERT OR UPDATE OR DELETE ON public.quiz_questions FOR EACH ROW EXECUTE FUNCTION public.audit_admin_change();
CREATE TRIGGER audit_certificates AFTER INSERT OR UPDATE OR DELETE ON public.certificates FOR EACH ROW EXECUTE FUNCTION public.audit_admin_change();
CREATE TRIGGER audit_course_reviews AFTER UPDATE ON public.course_reviews FOR EACH ROW EXECUTE FUNCTION public.audit_admin_change();