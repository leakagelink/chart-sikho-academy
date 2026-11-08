ALTER TABLE public.manual_payments ALTER COLUMN course_id DROP NOT NULL;
ALTER TABLE public.manual_payments ADD COLUMN ebook_id uuid REFERENCES public.ebooks(id), ADD COLUMN product_title text NOT NULL DEFAULT '';
ALTER TABLE public.manual_payments ADD CONSTRAINT manual_payment_one_product CHECK (num_nonnulls(course_id,ebook_id)=1);
CREATE UNIQUE INDEX manual_ebook_pending ON public.manual_payments(user_id,ebook_id) WHERE status='pending' AND ebook_id IS NOT NULL;
ALTER TABLE public.orders ADD COLUMN ebook_id uuid REFERENCES public.ebooks(id);
CREATE OR REPLACE FUNCTION public.submit_ebook_payment(_ebook_id uuid,_utr text,_screenshot_path text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE b public.ebooks; v_id uuid; v_utr text:=upper(trim(_utr));
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND account_status='active') THEN RAISE EXCEPTION 'Not signed in or inactive'; END IF;
 IF v_utr !~ '^[A-Z0-9]{6,30}$' THEN RAISE EXCEPTION 'Invalid UTR'; END IF;
 IF _screenshot_path IS NULL OR split_part(_screenshot_path,'/',1)<>auth.uid()::text OR NOT EXISTS(SELECT 1 FROM storage.objects WHERE bucket_id='payment-proofs' AND name=_screenshot_path) THEN RAISE EXCEPTION 'Invalid screenshot'; END IF;
 SELECT * INTO b FROM public.ebooks WHERE id=_ebook_id AND status='published' FOR UPDATE;
 IF NOT FOUND OR b.price<=0 OR b.resource_path='' THEN RAISE EXCEPTION 'Ebook unavailable'; END IF;
 IF EXISTS(SELECT 1 FROM public.orders WHERE user_id=auth.uid() AND ebook_id=b.id AND status='paid') THEN RAISE EXCEPTION 'Already purchased'; END IF;
 IF EXISTS(SELECT 1 FROM public.manual_payments WHERE user_id=auth.uid() AND ebook_id=b.id AND status='pending') THEN RAISE EXCEPTION 'Payment already pending'; END IF;
 IF EXISTS(SELECT 1 FROM public.manual_payments WHERE utr=v_utr) THEN RAISE EXCEPTION 'UTR already used'; END IF;
 INSERT INTO public.manual_payments(user_id,ebook_id,amount,utr,screenshot_path,product_title) VALUES(auth.uid(),b.id,b.price,v_utr,_screenshot_path,b.title) RETURNING id INTO v_id;
 RETURN v_id;
END $$;
CREATE OR REPLACE FUNCTION public.review_manual_payment(_id uuid,_approve boolean,_note text DEFAULT '') RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE p public.manual_payments; v_order uuid;
BEGIN
 IF NOT public.has_panel_permission('payments','edit') THEN RAISE EXCEPTION 'Forbidden'; END IF;
 SELECT * INTO p FROM public.manual_payments WHERE id=_id AND status='pending' FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Payment not pending'; END IF;
 IF _approve THEN
  IF p.ebook_id IS NOT NULL AND EXISTS(SELECT 1 FROM public.orders WHERE user_id=p.user_id AND ebook_id=p.ebook_id AND status='paid') THEN RAISE EXCEPTION 'Already purchased'; END IF;
  INSERT INTO public.orders(user_id,course_id,ebook_id,amount,status,provider_reference) VALUES(p.user_id,CASE WHEN p.ebook_id IS NOT NULL THEN 'ebook:'||p.ebook_id::text ELSE p.course_id::text END,p.ebook_id,p.amount,'paid','UPI:'||p.utr) RETURNING id INTO v_order;
  IF p.course_id IS NOT NULL THEN INSERT INTO public.enrollments(user_id,course_id) VALUES(p.user_id,p.course_id::text) ON CONFLICT DO NOTHING; END IF;
  UPDATE public.manual_payments SET status='approved',order_id=v_order,admin_note=left(coalesce(_note,''),500),reviewed_at=now(),reviewed_by=auth.uid() WHERE id=_id;
 ELSE
  UPDATE public.manual_payments SET status='rejected',admin_note=left(coalesce(_note,''),500),reviewed_at=now(),reviewed_by=auth.uid() WHERE id=_id;
 END IF;
END $$;
CREATE OR REPLACE FUNCTION public.my_ebook_resource(_ebook_id uuid) RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE b public.ebooks;
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND account_status='active') THEN RAISE EXCEPTION 'Forbidden'; END IF;
 SELECT * INTO b FROM public.ebooks WHERE id=_ebook_id;
 IF NOT FOUND OR NOT ((b.price=0 AND b.status='published') OR EXISTS(SELECT 1 FROM public.orders WHERE user_id=auth.uid() AND ebook_id=b.id AND status='paid')) THEN RAISE EXCEPTION 'Purchase required'; END IF;
 RETURN b.resource_path;
END $$;
CREATE OR REPLACE FUNCTION public.can_read_ebook_file(_path text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT auth.uid() IS NOT NULL AND EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND account_status='active') AND EXISTS(SELECT 1 FROM public.ebooks b WHERE b.resource_path=_path AND ((b.price=0 AND b.status='published') OR EXISTS(SELECT 1 FROM public.orders o WHERE o.user_id=auth.uid() AND o.ebook_id=b.id AND o.status='paid')))
$$;
REVOKE ALL ON FUNCTION public.submit_ebook_payment(uuid,text,text),public.my_ebook_resource(uuid),public.can_read_ebook_file(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.submit_ebook_payment(uuid,text,text),public.my_ebook_resource(uuid),public.can_read_ebook_file(text) TO authenticated;
CREATE POLICY "Purchased ebook file read" ON storage.objects FOR SELECT TO authenticated USING(bucket_id='course-resources' AND public.can_read_ebook_file(name));