ALTER TYPE public.app_role ADD VALUE 'instructor';

ALTER TABLE public.profiles ADD COLUMN referral_code text UNIQUE;
UPDATE public.profiles SET referral_code = 'CS' || upper(substr(replace(id::text,'-',''),1,8)) WHERE referral_code IS NULL;
ALTER TABLE public.profiles ADD COLUMN verification_status text NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified','pending','verified','rejected'));
ALTER TABLE public.profiles DROP CONSTRAINT profiles_account_status_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_account_status_check CHECK (account_status IN ('active','paused','blocked'));

ALTER TABLE public.admin_settings ADD COLUMN referral_enabled boolean NOT NULL DEFAULT true;
ALTER TABLE public.admin_settings ADD COLUMN ref_level1_percent integer NOT NULL DEFAULT 10 CHECK (ref_level1_percent BETWEEN 0 AND 100);
ALTER TABLE public.admin_settings ADD COLUMN ref_level2_percent integer NOT NULL DEFAULT 5 CHECK (ref_level2_percent BETWEEN 0 AND 100);
ALTER TABLE public.admin_settings ADD COLUMN ref_level3_percent integer NOT NULL DEFAULT 2 CHECK (ref_level3_percent BETWEEN 0 AND 100);

CREATE TABLE public.instructors (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 120), expertise text NOT NULL DEFAULT '', bio text NOT NULL DEFAULT '', photo_url text NOT NULL DEFAULT '', status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')), created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.instructors TO authenticated; GRANT SELECT ON public.instructors TO anon; GRANT ALL ON public.instructors TO service_role;
ALTER TABLE public.instructors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "instructors read" ON public.instructors FOR SELECT TO anon, authenticated USING (status = 'active' OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "instructors admin insert" ON public.instructors FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "instructors admin update" ON public.instructors FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "instructors admin delete" ON public.instructors FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.ranks (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 60), min_sales integer NOT NULL DEFAULT 0 CHECK (min_sales >= 0), bonus_amount integer NOT NULL DEFAULT 0 CHECK (bonus_amount >= 0), position integer NOT NULL DEFAULT 1, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ranks TO authenticated; GRANT ALL ON public.ranks TO service_role;
ALTER TABLE public.ranks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ranks read" ON public.ranks FOR SELECT TO authenticated USING (true);
CREATE POLICY "ranks admin insert" ON public.ranks FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "ranks admin update" ON public.ranks FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "ranks admin delete" ON public.ranks FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.bonus_entries (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, amount integer NOT NULL CHECK (amount > 0), reason text NOT NULL DEFAULT '', status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')), created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE ON public.bonus_entries TO authenticated; GRANT ALL ON public.bonus_entries TO service_role;
ALTER TABLE public.bonus_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bonuses read own" ON public.bonus_entries FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "bonuses admin insert" ON public.bonus_entries FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "bonuses admin update" ON public.bonus_entries FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

GRANT INSERT, DELETE ON public.user_roles TO authenticated;
CREATE POLICY "admin roles insert" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin roles delete" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER audit_instructors AFTER INSERT OR UPDATE OR DELETE ON public.instructors FOR EACH ROW EXECUTE FUNCTION public.audit_admin_change();
CREATE TRIGGER audit_ranks AFTER INSERT OR UPDATE OR DELETE ON public.ranks FOR EACH ROW EXECUTE FUNCTION public.audit_admin_change();
CREATE TRIGGER audit_bonuses AFTER INSERT OR UPDATE OR DELETE ON public.bonus_entries FOR EACH ROW EXECUTE FUNCTION public.audit_admin_change();
CREATE TRIGGER audit_user_roles AFTER INSERT OR UPDATE OR DELETE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.audit_admin_change();