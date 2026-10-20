CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  state text,
  city text,
  preferred_language text NOT NULL DEFAULT 'en',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE TABLE public.enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id text NOT NULL,
  progress int NOT NULL DEFAULT 0,
  last_lesson int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id)
);
GRANT SELECT, INSERT, UPDATE ON public.enrollments TO authenticated;
GRANT ALL ON public.enrollments TO service_role;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own enroll select" ON public.enrollments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own enroll insert free" ON public.enrollments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND course_id IN ('basics') AND progress = 0);
CREATE POLICY "own enroll update" ON public.enrollments FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND progress BETWEEN 0 AND 100);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'), NEW.raw_user_meta_data->>'phone');
  INSERT INTO public.enrollments (user_id, course_id) VALUES (NEW.id, 'basics') ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();