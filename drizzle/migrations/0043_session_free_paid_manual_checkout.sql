ALTER TABLE public.class_sessions ADD COLUMN access_mode text NOT NULL DEFAULT 'free', ADD COLUMN price integer NOT NULL DEFAULT 0;
ALTER TABLE public.class_sessions ADD CONSTRAINT session_pricing CHECK ((access_mode='free' AND price=0) OR (access_mode='paid' AND price BETWEEN 1 AND 1000000));
ALTER TABLE public.manual_payments ADD COLUMN session_id uuid REFERENCES public.class_sessions(id);
ALTER TABLE public.manual_payments DROP CONSTRAINT manual_payment_one_product;
ALTER TABLE public.manual_payments ADD CONSTRAINT manual_payment_one_product CHECK (num_nonnulls(course_id,ebook_id,session_id)=1);
ALTER TABLE public.orders ADD COLUMN session_id uuid REFERENCES public.class_sessions(id);
CREATE UNIQUE INDEX one_paid_session_per_user ON public.orders(user_id,session_id) WHERE status='paid' AND session_id IS NOT NULL;
ALTER POLICY "scheduled sessions read" ON public.class_sessions USING (status='scheduled' AND access_mode='free');
CREATE OR REPLACE FUNCTION public.session_catalog() RETURNS TABLE(id uuid,title text,kind text,starts_at timestamptz,thumbnail_url text,category_slug text,access_mode text,price integer) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT id,title,kind,starts_at,thumbnail_url,category_slug,access_mode,price FROM public.class_sessions WHERE status='scheduled' ORDER BY starts_at $$;
REVOKE ALL ON FUNCTION public.session_catalog() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.session_catalog() TO anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION public.my_session_access(_session_id uuid) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE s public.class_sessions; allowed boolean;
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND account_status='active') THEN RAISE EXCEPTION 'Not signed in or inactive'; END IF;
 SELECT * INTO s FROM public.class_sessions WHERE id=_session_id AND status='scheduled';
 IF NOT FOUND THEN RAISE EXCEPTION 'Session unavailable'; END IF;
 allowed := s.access_mode='free' OR EXISTS(SELECT 1 FROM public.orders WHERE user_id=auth.uid() AND session_id=s.id AND status='paid');
 RETURN jsonb_build_object('allowed',allowed,'youtube_url',CASE WHEN allowed THEN s.youtube_url ELSE '' END,'jitsi_url',CASE WHEN allowed THEN s.jitsi_url ELSE '' END,'recording_url',CASE WHEN allowed THEN s.recording_url ELSE '' END);
END $$;
REVOKE ALL ON FUNCTION public.my_session_access(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.my_session_access(uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.submit_session_payment(_session_id uuid,_utr text,_screenshot_path text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s public.class_sessions; v_id uuid; v_utr text:=upper(trim(_utr));
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND account_status='active') THEN RAISE EXCEPTION 'Not signed in or inactive'; END IF;
 IF v_utr IS NULL OR v_utr !~ '^[A-Z0-9]{6,30}$' THEN RAISE EXCEPTION 'Invalid UTR'; END IF;
 IF _screenshot_path IS NULL OR split_part(_screenshot_path,'/',1)<>auth.uid()::text OR NOT EXISTS(SELECT 1 FROM storage.objects WHERE bucket_id='payment-proofs' AND name=_screenshot_path) THEN RAISE EXCEPTION 'Invalid screenshot'; END IF;
 SELECT * INTO s FROM public.class_sessions WHERE id=_session_id AND status='scheduled' FOR UPDATE;
 IF NOT FOUND OR s.access_mode<>'paid' OR s.price<=0 THEN RAISE EXCEPTION 'Session unavailable'; END IF;
 IF EXISTS(SELECT 1 FROM public.orders WHERE user_id=auth.uid() AND session_id=s.id AND status='paid') THEN RAISE EXCEPTION 'Already purchased'; END IF;
 IF EXISTS(SELECT 1 FROM public.manual_payments WHERE user_id=auth.uid() AND session_id=s.id AND status='pending') THEN RAISE EXCEPTION 'Payment already pending'; END IF;
 IF EXISTS(SELECT 1 FROM public.manual_payments WHERE utr=v_utr) THEN RAISE EXCEPTION 'UTR already used'; END IF;
 INSERT INTO public.manual_payments(user_id,session_id,amount,utr,screenshot_path,product_title) VALUES(auth.uid(),s.id,s.price,v_utr,_screenshot_path,s.title) RETURNING id INTO v_id;
 RETURN v_id;
END $$;
REVOKE ALL ON FUNCTION public.submit_session_payment(uuid,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_session_payment(uuid,text,text) TO authenticated;
CREATE OR REPLACE FUNCTION public.review_manual_payment(_id uuid,_approve boolean,_note text DEFAULT '') RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE p public.manual_payments; v_order uuid;
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
  INSERT INTO public.orders(user_id,course_id,ebook_id,session_id,amount,status,provider_reference) VALUES(p.user_id,CASE WHEN p.session_id IS NOT NULL THEN 'session:'||p.session_id::text WHEN p.ebook_id IS NOT NULL THEN 'ebook:'||p.ebook_id::text ELSE p.course_id::text END,p.ebook_id,p.session_id,p.amount,'paid','UPI:'||p.utr) RETURNING id INTO v_order;
  IF p.course_id IS NOT NULL THEN INSERT INTO public.enrollments(user_id,course_id) VALUES(p.user_id,p.course_id::text) ON CONFLICT DO NOTHING; END IF;
  UPDATE public.manual_payments SET status='approved',order_id=v_order,admin_note=left(coalesce(_note,''),500),reviewed_at=now(),reviewed_by=auth.uid() WHERE id=_id;
 ELSE
  UPDATE public.manual_payments SET status='rejected',admin_note=left(coalesce(_note,''),500),reviewed_at=now(),reviewed_by=auth.uid() WHERE id=_id;
 END IF;
END $$;