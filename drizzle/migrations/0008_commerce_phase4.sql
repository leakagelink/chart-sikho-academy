CREATE TABLE public.coupons (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text NOT NULL UNIQUE CHECK(code ~ '^[A-Z0-9-]{3,24}$'), kind text NOT NULL CHECK(kind IN ('percent','flat')), value integer NOT NULL CHECK(value > 0), min_order integer NOT NULL DEFAULT 0 CHECK(min_order >= 0), max_uses integer CHECK(max_uses IS NULL OR max_uses > 0), used_count integer NOT NULL DEFAULT 0 CHECK(used_count >= 0), active boolean NOT NULL DEFAULT true, expires_at timestamptz, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coupons TO authenticated; GRANT ALL ON public.coupons TO service_role;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coupons admin" ON public.coupons FOR ALL TO authenticated USING(public.has_role(auth.uid(),'admin')) WITH CHECK(public.has_role(auth.uid(),'admin'));

CREATE TABLE public.refund_requests (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid NOT NULL REFERENCES public.orders(id), user_id uuid NOT NULL, amount integer NOT NULL CHECK(amount > 0), reason text NOT NULL DEFAULT '', status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')), created_at timestamptz NOT NULL DEFAULT now(), reviewed_at timestamptz);
GRANT SELECT, INSERT, UPDATE ON public.refund_requests TO authenticated; GRANT ALL ON public.refund_requests TO service_role;
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "refunds read own" ON public.refund_requests FOR SELECT TO authenticated USING(user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "refunds insert own" ON public.refund_requests FOR INSERT TO authenticated WITH CHECK(user_id = auth.uid() AND status = 'pending');
CREATE POLICY "refunds admin update" ON public.refund_requests FOR UPDATE TO authenticated USING(public.has_role(auth.uid(),'admin')) WITH CHECK(public.has_role(auth.uid(),'admin'));

CREATE TABLE public.invoices (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid NOT NULL UNIQUE REFERENCES public.orders(id), invoice_no text NOT NULL UNIQUE, buyer_name text NOT NULL, buyer_gstin text NOT NULL DEFAULT '', subtotal integer NOT NULL CHECK(subtotal >= 0), gst_rate integer NOT NULL DEFAULT 18 CHECK(gst_rate >= 0 AND gst_rate <= 28), gst_amount integer NOT NULL CHECK(gst_amount >= 0), total integer NOT NULL CHECK(total >= 0), status text NOT NULL DEFAULT 'issued' CHECK(status IN ('issued','cancelled')), issued_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE ON public.invoices TO authenticated; GRANT ALL ON public.invoices TO service_role;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invoices read own" ON public.invoices FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "invoices admin write" ON public.invoices FOR INSERT TO authenticated WITH CHECK(public.has_role(auth.uid(),'admin'));
CREATE POLICY "invoices admin update" ON public.invoices FOR UPDATE TO authenticated USING(public.has_role(auth.uid(),'admin')) WITH CHECK(public.has_role(auth.uid(),'admin'));

CREATE TABLE public.abandoned_checkouts (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid, email text NOT NULL DEFAULT '', course_id text NOT NULL, price integer NOT NULL CHECK(price >= 0), status text NOT NULL DEFAULT 'abandoned' CHECK(status IN ('abandoned','recovered')), created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE ON public.abandoned_checkouts TO authenticated; GRANT ALL ON public.abandoned_checkouts TO service_role;
ALTER TABLE public.abandoned_checkouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "abandoned insert own" ON public.abandoned_checkouts FOR INSERT TO authenticated WITH CHECK(user_id = auth.uid());
CREATE POLICY "abandoned admin read" ON public.abandoned_checkouts FOR SELECT TO authenticated USING(public.has_role(auth.uid(),'admin'));
CREATE POLICY "abandoned admin update" ON public.abandoned_checkouts FOR UPDATE TO authenticated USING(public.has_role(auth.uid(),'admin')) WITH CHECK(public.has_role(auth.uid(),'admin'));

CREATE TRIGGER audit_coupons AFTER INSERT OR UPDATE OR DELETE ON public.coupons FOR EACH ROW EXECUTE FUNCTION public.audit_admin_change();
CREATE TRIGGER audit_refunds AFTER INSERT OR UPDATE OR DELETE ON public.refund_requests FOR EACH ROW EXECUTE FUNCTION public.audit_admin_change();
CREATE TRIGGER audit_invoices AFTER INSERT OR UPDATE OR DELETE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.audit_admin_change();
CREATE TRIGGER audit_abandoned AFTER INSERT OR UPDATE OR DELETE ON public.abandoned_checkouts FOR EACH ROW EXECUTE FUNCTION public.audit_admin_change();