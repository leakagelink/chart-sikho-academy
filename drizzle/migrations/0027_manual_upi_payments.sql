ALTER TABLE public.admin_settings ADD COLUMN IF NOT EXISTS upi_id text NOT NULL DEFAULT '', ADD COLUMN IF NOT EXISTS upi_payee_name text NOT NULL DEFAULT 'ChartSikho';

CREATE TABLE public.manual_payments(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid NOT NULL REFERENCES public.courses(id),
  amount integer NOT NULL CHECK (amount >= 0),
  utr text NOT NULL UNIQUE,
  screenshot_path text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  admin_note text NOT NULL DEFAULT '',
  order_id uuid REFERENCES public.orders(id),
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.manual_payments TO authenticated;
GRANT ALL ON public.manual_payments TO service_role;
ALTER TABLE public.manual_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own or reviewer read manual payments" ON public.manual_payments FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_panel_permission('payments','view'));

CREATE OR REPLACE FUNCTION public.payment_upi() RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT jsonb_build_object('upi_id',upi_id,'payee',upi_payee_name) FROM public.admin_settings ORDER BY updated_at DESC LIMIT 1 $$;

CREATE OR REPLACE FUNCTION public.set_upi_settings(_upi_id text, _payee text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.has_panel_permission('payments','edit') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF _upi_id !~ '^[A-Za-z0-9._-]{2,64}@[A-Za-z0-9.-]{2,64}$' THEN RAISE EXCEPTION 'Invalid UPI ID'; END IF;
  UPDATE public.admin_settings SET upi_id=_upi_id, upi_payee_name=left(trim(_payee),80), updated_at=now();
END $$;

CREATE OR REPLACE FUNCTION public.submit_manual_payment(_course_id uuid, _utr text, _screenshot_path text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c record; v_id uuid; v_utr text := upper(trim(_utr));
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  IF v_utr !~ '^[A-Z0-9]{6,30}$' THEN RAISE EXCEPTION 'Invalid UTR'; END IF;
  IF _screenshot_path IS NULL OR split_part(_screenshot_path,'/',1) <> auth.uid()::text THEN RAISE EXCEPTION 'Invalid screenshot'; END IF;
  SELECT * INTO c FROM public.courses WHERE id=_course_id AND status='published';
  IF NOT FOUND THEN RAISE EXCEPTION 'Course not found'; END IF;
  IF EXISTS(SELECT 1 FROM public.enrollments WHERE user_id=auth.uid() AND course_id=_course_id::text) THEN RAISE EXCEPTION 'Already enrolled'; END IF;
  IF EXISTS(SELECT 1 FROM public.manual_payments WHERE user_id=auth.uid() AND course_id=_course_id AND status='pending') THEN RAISE EXCEPTION 'Payment already pending'; END IF;
  IF EXISTS(SELECT 1 FROM public.manual_payments WHERE utr=v_utr) THEN RAISE EXCEPTION 'UTR already used'; END IF;
  INSERT INTO public.manual_payments(user_id,course_id,amount,utr,screenshot_path)
  VALUES (auth.uid(),_course_id,COALESCE(c.sale_price,c.price),v_utr,_screenshot_path) RETURNING id INTO v_id;
  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.review_manual_payment(_id uuid, _approve boolean, _note text DEFAULT '') RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE p record; v_order uuid;
BEGIN
  IF NOT public.has_panel_permission('payments','edit') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  SELECT * INTO p FROM public.manual_payments WHERE id=_id AND status='pending' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Payment not pending'; END IF;
  IF _approve THEN
    INSERT INTO public.orders(user_id,course_id,amount,status,provider_reference)
    VALUES (p.user_id,p.course_id::text,p.amount,'paid','UPI:'||p.utr) RETURNING id INTO v_order;
    INSERT INTO public.enrollments(user_id,course_id) VALUES (p.user_id,p.course_id::text)
    ON CONFLICT DO NOTHING;
    UPDATE public.manual_payments SET status='approved', order_id=v_order, admin_note=left(coalesce(_note,''),500), reviewed_at=now(), reviewed_by=auth.uid() WHERE id=_id;
  ELSE
    UPDATE public.manual_payments SET status='rejected', admin_note=left(coalesce(_note,''),500), reviewed_at=now(), reviewed_by=auth.uid() WHERE id=_id;
  END IF;
END $$;

REVOKE EXECUTE ON FUNCTION public.submit_manual_payment(uuid,text,text), public.review_manual_payment(uuid,boolean,text), public.set_upi_settings(text,text), public.payment_upi() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_manual_payment(uuid,text,text), public.review_manual_payment(uuid,boolean,text), public.set_upi_settings(text,text), public.payment_upi() TO authenticated;

CREATE POLICY "payment proof upload own" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id='payment-proofs' AND (storage.foldername(name))[1]=auth.uid()::text);
CREATE POLICY "payment proof read own or reviewer" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id='payment-proofs' AND ((storage.foldername(name))[1]=auth.uid()::text OR public.has_panel_permission('payments','view')));