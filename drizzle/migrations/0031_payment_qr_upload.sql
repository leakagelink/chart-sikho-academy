ALTER TABLE public.admin_settings ADD COLUMN IF NOT EXISTS upi_qr_path text NOT NULL DEFAULT '';

CREATE POLICY "payment qr signed-in read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'payment-qr');
CREATE POLICY "payment qr editor upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'payment-qr' AND public.has_panel_permission('payments','edit'));
CREATE POLICY "payment qr editor delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'payment-qr' AND public.has_panel_permission('payments','edit'));

DROP FUNCTION IF EXISTS public.set_upi_settings(text, text);
CREATE FUNCTION public.set_upi_settings(_upi_id text, _payee text, _qr_path text DEFAULT '')
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_panel_permission('payments','edit') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  _upi_id := trim(coalesce(_upi_id,''));
  _qr_path := trim(coalesce(_qr_path,''));
  IF _upi_id = '' AND _qr_path = '' THEN RAISE EXCEPTION 'Add a UPI ID or QR image'; END IF;
  IF _upi_id <> '' AND _upi_id !~ '^[A-Za-z0-9._-]{2,64}@[A-Za-z0-9.-]{2,64}$' THEN RAISE EXCEPTION 'Invalid UPI ID'; END IF;
  IF _qr_path <> '' AND _qr_path !~ '^qr/[A-Za-z0-9-]+\.(png|jpe?g|webp)$' THEN RAISE EXCEPTION 'Invalid QR image'; END IF;
  UPDATE public.admin_settings SET upi_id=_upi_id, upi_payee_name=left(trim(coalesce(_payee,'')),80), upi_qr_path=_qr_path, updated_at=now() WHERE id IS NOT NULL;
END $$;
REVOKE ALL ON FUNCTION public.set_upi_settings(text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_upi_settings(text, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.payment_upi()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object('upi_id',upi_id,'payee',upi_payee_name,'qr_path',upi_qr_path) FROM public.admin_settings ORDER BY updated_at DESC LIMIT 1
$$;