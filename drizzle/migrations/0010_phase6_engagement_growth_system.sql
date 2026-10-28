CREATE TABLE public.message_templates (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), channel TEXT NOT NULL CHECK (channel IN ('email','whatsapp','sms','push')), name TEXT NOT NULL, subject TEXT NOT NULL DEFAULT '', body TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','archived')), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.message_templates TO authenticated;
GRANT ALL ON public.message_templates TO service_role;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage templates" ON public.message_templates FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.announcements (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), title TEXT NOT NULL, message TEXT NOT NULL, audience TEXT NOT NULL DEFAULT 'all', starts_at TIMESTAMPTZ, ends_at TIMESTAMPTZ, status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')), created_at TIMESTAMPTZ NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage announcements" ON public.announcements FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Students read published announcements" ON public.announcements FOR SELECT TO authenticated USING (status = 'published');

CREATE TABLE public.support_tickets (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID, subject TEXT NOT NULL, message TEXT NOT NULL, priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high')), status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','closed')), reply TEXT NOT NULL DEFAULT '', created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage tickets" ON public.support_tickets FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users read own tickets" ON public.support_tickets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create own tickets" ON public.support_tickets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.banners (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), title TEXT NOT NULL, image_url TEXT NOT NULL DEFAULT '', link_url TEXT NOT NULL DEFAULT '', placement TEXT NOT NULL DEFAULT 'home' CHECK (placement IN ('home','courses','dashboard')), position INT NOT NULL DEFAULT 1, active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.banners TO authenticated;
GRANT SELECT ON public.banners TO anon;
GRANT ALL ON public.banners TO service_role;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage banners" ON public.banners FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone reads active banners" ON public.banners FOR SELECT TO anon, authenticated USING (active = true);

CREATE TABLE public.campaigns (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, channel TEXT NOT NULL DEFAULT 'push' CHECK (channel IN ('email','whatsapp','sms','push')), audience TEXT NOT NULL DEFAULT 'all', template_id UUID REFERENCES public.message_templates(id) ON DELETE SET NULL, status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','sent','cancelled')), scheduled_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaigns TO authenticated;
GRANT ALL ON public.campaigns TO service_role;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage campaigns" ON public.campaigns FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.leads (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, phone TEXT NOT NULL DEFAULT '', email TEXT NOT NULL DEFAULT '', source TEXT NOT NULL DEFAULT 'website', status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','converted','lost')), note TEXT NOT NULL DEFAULT '', created_at TIMESTAMPTZ NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage leads" ON public.leads FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.seo_pages (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), path TEXT NOT NULL UNIQUE, meta_title TEXT NOT NULL DEFAULT '', meta_description TEXT NOT NULL DEFAULT '', keywords TEXT NOT NULL DEFAULT '', updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seo_pages TO authenticated;
GRANT SELECT ON public.seo_pages TO anon;
GRANT ALL ON public.seo_pages TO service_role;
ALTER TABLE public.seo_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage seo" ON public.seo_pages FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone reads seo" ON public.seo_pages FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.promo_codes (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), code TEXT NOT NULL UNIQUE, description TEXT NOT NULL DEFAULT '', coupon_id UUID REFERENCES public.coupons(id) ON DELETE SET NULL, active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.promo_codes TO authenticated;
GRANT ALL ON public.promo_codes TO service_role;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage promo codes" ON public.promo_codes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.admin_settings ADD COLUMN maintenance_mode BOOLEAN NOT NULL DEFAULT false, ADD COLUMN maintenance_message TEXT NOT NULL DEFAULT '';