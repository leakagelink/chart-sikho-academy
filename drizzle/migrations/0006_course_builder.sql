CREATE TABLE public.course_categories (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), slug text NOT NULL UNIQUE, name text NOT NULL, position integer NOT NULL DEFAULT 1, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.course_categories TO anon, authenticated; GRANT INSERT, UPDATE, DELETE ON public.course_categories TO authenticated; GRANT ALL ON public.course_categories TO service_role;
ALTER TABLE public.course_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories read" ON public.course_categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin categories all" ON public.course_categories FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
INSERT INTO public.course_categories (slug,name,position) VALUES ('basics','Basics',1),('technical','Technical Analysis',2),('options','Options',3),('fundamental','Fundamental Analysis',4);

CREATE TABLE public.course_modules (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE, title text NOT NULL, position integer NOT NULL DEFAULT 1, drip_days integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_modules TO authenticated; GRANT ALL ON public.course_modules TO service_role;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin modules all" ON public.course_modules FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "enrolled modules read" ON public.course_modules FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.enrollments e WHERE e.user_id = auth.uid() AND e.course_id = course_modules.course_id::text));

ALTER TABLE public.courses ADD COLUMN description text NOT NULL DEFAULT '', ADD COLUMN thumbnail_url text NOT NULL DEFAULT '', ADD COLUMN instructor text NOT NULL DEFAULT '', ADD COLUMN objectives text NOT NULL DEFAULT '', ADD COLUMN sale_price integer, ADD COLUMN access_type text NOT NULL DEFAULT 'lifetime', ADD COLUMN access_days integer NOT NULL DEFAULT 0;
ALTER TABLE public.course_lessons ADD COLUMN module_id uuid REFERENCES public.course_modules(id) ON DELETE SET NULL, ADD COLUMN duration_minutes integer NOT NULL DEFAULT 0, ADD COLUMN is_preview boolean NOT NULL DEFAULT false, ADD COLUMN allow_download boolean NOT NULL DEFAULT false;

CREATE TRIGGER audit_change AFTER INSERT OR UPDATE OR DELETE ON public.course_categories FOR EACH ROW EXECUTE FUNCTION public.audit_admin_change();
CREATE TRIGGER audit_change AFTER INSERT OR UPDATE OR DELETE ON public.course_modules FOR EACH ROW EXECUTE FUNCTION public.audit_admin_change();