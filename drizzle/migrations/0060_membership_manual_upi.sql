ALTER TABLE public.manual_payments ADD COLUMN IF NOT EXISTS plan_id uuid REFERENCES public.membership_plans(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS plan_id uuid REFERENCES public.membership_plans(id);
ALTER TABLE public.manual_payments DROP CONSTRAINT manual_payment_one_product;
ALTER TABLE public.manual_payments ADD CONSTRAINT manual_payment_one_product CHECK (num_nonnulls(course_id, ebook_id, session_id, plan_id) = 1);

CREATE TABLE public.memberships (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL,
 plan_id uuid NOT NULL REFERENCES public.membership_plans(id),
 order_id uuid NOT NULL UNIQUE REFERENCES public.orders(id),
 plan_name text NOT NULL DEFAULT '',
 starts_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.memberships TO authenticated;
GRANT ALL ON public.memberships TO service_role;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own or reviewer memberships read" ON public.memberships FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_panel_permission('payments','view'));

ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS via_membership boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.has_active_membership(_user uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
 SELECT _user IS NOT NULL AND EXISTS(SELECT 1 FROM public.memberships m WHERE m.user_id=_user AND m.starts_at<=now() AND (m.expires_at IS NULL OR m.expires_at>now()))
 AND EXISTS(SELECT 1 FROM public.profiles WHERE id=_user AND account_status='active')
$$;

CREATE OR REPLACE FUNCTION public.my_membership() RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
 SELECT CASE WHEN public.has_active_membership(auth.uid()) THEN (SELECT jsonb_build_object('active',true,'plan_name',m.plan_name,'expires_at',m.expires_at) FROM public.memberships m WHERE m.user_id=auth.uid() AND (m.expires_at IS NULL OR m.expires_at>now()) ORDER BY m.expires_at DESC NULLS FIRST LIMIT 1) ELSE jsonb_build_object('active',false) END
$$;

CREATE OR REPLACE FUNCTION public.has_course_access(_course text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
 SELECT EXISTS(SELECT 1 FROM public.enrollments e WHERE e.user_id=auth.uid() AND e.course_id=_course AND (NOT e.via_membership OR public.has_active_membership(auth.uid())))
$$;

CREATE OR REPLACE FUNCTION public.member_enroll(_course_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
 IF NOT public.has_active_membership(auth.uid()) THEN RAISE EXCEPTION 'Membership required'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.courses WHERE id=_course_id AND status='published') THEN RAISE EXCEPTION 'Course unavailable'; END IF;
 INSERT INTO public.enrollments(user_id,course_id,via_membership) VALUES(auth.uid(),_course_id::text,true) ON CONFLICT DO NOTHING;
END $$;

DROP POLICY "enrolled lessons read" ON public.course_lessons;
CREATE POLICY "enrolled lessons read" ON public.course_lessons FOR SELECT TO authenticated USING (public.has_course_access(course_id::text));
DROP POLICY "enrolled course read" ON public.courses;
CREATE POLICY "enrolled course read" ON public.courses FOR SELECT TO authenticated USING (public.has_course_access(id::text));
DROP POLICY "enrolled modules read" ON public.course_modules;
CREATE POLICY "enrolled modules read" ON public.course_modules FOR SELECT TO authenticated USING (public.has_course_access(course_id::text));
DROP POLICY "own enrolled review insert" ON public.course_reviews;
CREATE POLICY "own enrolled review insert" ON public.course_reviews FOR INSERT TO authenticated WITH CHECK (user_id=auth.uid() AND status='pending' AND public.has_course_access(course_id::text));
DROP POLICY "own completions insert" ON public.lesson_completions;
CREATE POLICY "own completions insert" ON public.lesson_completions FOR INSERT TO authenticated WITH CHECK (user_id=auth.uid() AND EXISTS(SELECT 1 FROM public.course_lessons l WHERE l.id=lesson_completions.lesson_id AND l.course_id=lesson_completions.course_id) AND public.has_course_access(course_id::text));
DROP POLICY "enrolled resources read" ON storage.objects;
CREATE POLICY "enrolled resources read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id='course-resources' AND EXISTS(SELECT 1 FROM public.course_lessons l WHERE l.resource_path=objects.name AND public.has_course_access(l.course_id::text)));

CREATE OR REPLACE FUNCTION public.can_read_ebook_file(_path text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
 SELECT auth.uid() IS NOT NULL AND EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND account_status='active') AND EXISTS(SELECT 1 FROM public.ebooks b WHERE b.resource_path=_path AND ((b.status='published' AND (b.price=0 OR public.has_active_membership(auth.uid()))) OR EXISTS(SELECT 1 FROM public.orders o WHERE o.user_id=auth.uid() AND o.ebook_id=b.id AND o.status='paid')))
$$;

CREATE OR REPLACE FUNCTION public.my_ebook_resource(_ebook_id uuid) RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE b public.ebooks;
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND account_status='active') THEN RAISE EXCEPTION 'Forbidden'; END IF;
 SELECT * INTO b FROM public.ebooks WHERE id=_ebook_id;
 IF NOT FOUND OR NOT ((b.status='published' AND (b.price=0 OR public.has_active_membership(auth.uid()))) OR EXISTS(SELECT 1 FROM public.orders WHERE user_id=auth.uid() AND ebook_id=b.id AND status='paid')) THEN RAISE EXCEPTION 'Purchase required'; END IF;
 RETURN b.resource_path;
END $$;

CREATE OR REPLACE FUNCTION public.my_session_access(_session_id uuid) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE s public.class_sessions; allowed boolean;
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND account_status='active') THEN RAISE EXCEPTION 'Not signed in or inactive'; END IF;
 SELECT * INTO s FROM public.class_sessions WHERE id=_session_id AND status='scheduled';
 IF NOT FOUND THEN RAISE EXCEPTION 'Session unavailable'; END IF;
 allowed := s.access_mode='free' OR public.has_active_membership(auth.uid()) OR EXISTS(SELECT 1 FROM public.orders WHERE user_id=auth.uid() AND session_id=s.id AND status='paid');
 RETURN jsonb_build_object('allowed',allowed,'youtube_url',CASE WHEN allowed THEN s.youtube_url ELSE '' END,'jitsi_url',CASE WHEN allowed THEN s.jitsi_url ELSE '' END,'recording_url',CASE WHEN allowed THEN s.recording_url ELSE '' END);
END $$;

CREATE OR REPLACE FUNCTION public.submit_plan_payment(_plan_id uuid, _utr text, _screenshot_path text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE pl public.membership_plans; v_id uuid; v_utr text:=upper(trim(_utr));
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND account_status='active') THEN RAISE EXCEPTION 'Not signed in or inactive'; END IF;
 IF v_utr !~ '^[A-Z0-9]{6,30}$' THEN RAISE EXCEPTION 'Invalid UTR'; END IF;
 IF _screenshot_path IS NULL OR split_part(_screenshot_path,'/',1)<>auth.uid()::text OR NOT EXISTS(SELECT 1 FROM storage.objects WHERE bucket_id='payment-proofs' AND name=_screenshot_path) THEN RAISE EXCEPTION 'Invalid screenshot'; END IF;
 SELECT * INTO pl FROM public.membership_plans WHERE id=_plan_id AND status='published';
 IF NOT FOUND OR pl.price<=0 THEN RAISE EXCEPTION 'Plan unavailable'; END IF;
 IF EXISTS(SELECT 1 FROM public.manual_payments WHERE user_id=auth.uid() AND plan_id IS NOT NULL AND status='pending') THEN RAISE EXCEPTION 'Payment already pending'; END IF;
 IF EXISTS(SELECT 1 FROM public.manual_payments WHERE utr=v_utr) THEN RAISE EXCEPTION 'UTR already used'; END IF;
 INSERT INTO public.manual_payments(user_id,plan_id,amount,utr,screenshot_path,product_title) VALUES(auth.uid(),pl.id,pl.price,v_utr,_screenshot_path,pl.name_en) RETURNING id INTO v_id;
 RETURN v_id;
END $$;
GRANT EXECUTE ON FUNCTION public.submit_plan_payment(uuid,text,text), public.member_enroll(uuid), public.my_membership() TO authenticated;

CREATE OR REPLACE FUNCTION public.review_manual_payment(_id uuid, _approve boolean, _note text DEFAULT '') RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE p public.manual_payments; v_order uuid; pl public.membership_plans; v_start timestamptz;
BEGIN
 IF NOT public.has_panel_permission('payments','edit') THEN RAISE EXCEPTION 'Forbidden'; END IF;
 SELECT * INTO p FROM public.manual_payments WHERE id=_id AND status='pending' FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Payment not pending'; END IF;
 IF _approve THEN
  IF p.session_id IS NOT NULL THEN
   PERFORM 1 FROM public.class_sessions WHERE id=p.session_id AND status='scheduled' FOR UPDATE;
   IF NOT FOUND THEN RAISE EXCEPTION 'Session unavailable'; END IF;
   IF EXISTS(SELECT 1 FROM public.orders WHERE user_id=p.user_id AND session_id=p.session_id AND status='paid') THEN RAISE EXCEPTION 'Already purchased'; END IF;
  END IF;
  IF p.ebook_id IS NOT NULL AND EXISTS(SELECT 1 FROM public.orders WHERE user_id=p.user_id AND ebook_id=p.ebook_id AND status='paid') THEN RAISE EXCEPTION 'Already purchased'; END IF;
  INSERT INTO public.orders(user_id,course_id,ebook_id,session_id,plan_id,amount,status,provider_reference) VALUES(p.user_id,CASE WHEN p.plan_id IS NOT NULL THEN 'plan:'||p.plan_id::text WHEN p.session_id IS NOT NULL THEN 'session:'||p.session_id::text WHEN p.ebook_id IS NOT NULL THEN 'ebook:'||p.ebook_id::text ELSE p.course_id::text END,p.ebook_id,p.session_id,p.plan_id,p.amount,'paid','UPI:'||p.utr) RETURNING id INTO v_order;
  IF p.course_id IS NOT NULL THEN INSERT INTO public.enrollments(user_id,course_id) VALUES(p.user_id,p.course_id::text) ON CONFLICT DO NOTHING; END IF;
  IF p.plan_id IS NOT NULL THEN
   SELECT * INTO pl FROM public.membership_plans WHERE id=p.plan_id;
   SELECT greatest(now(),coalesce(max(expires_at),now())) INTO v_start FROM public.memberships WHERE user_id=p.user_id AND expires_at IS NOT NULL;
   INSERT INTO public.memberships(user_id,plan_id,order_id,plan_name,starts_at,expires_at) VALUES(p.user_id,p.plan_id,v_order,pl.name_en,v_start,
    CASE pl.billing_period WHEN 'monthly' THEN v_start+interval '1 month' WHEN 'yearly' THEN v_start+interval '1 year' ELSE NULL END);
  END IF;
  UPDATE public.manual_payments SET status='approved',order_id=v_order,admin_note=left(coalesce(_note,''),500),reviewed_at=now(),reviewed_by=auth.uid() WHERE id=_id;
 ELSE
  UPDATE public.manual_payments SET status='rejected',admin_note=left(coalesce(_note,''),500),reviewed_at=now(),reviewed_by=auth.uid() WHERE id=_id;
 END IF;
END $$;