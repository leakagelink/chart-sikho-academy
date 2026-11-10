CREATE TABLE public.billing_settings (id boolean PRIMARY KEY DEFAULT true CHECK(id), seller_name text NOT NULL DEFAULT 'ChartSikho', seller_address text NOT NULL DEFAULT '', seller_state text NOT NULL DEFAULT '', seller_gstin text NOT NULL DEFAULT '', gst_percent numeric(5,2) NOT NULL DEFAULT 0 CHECK(gst_percent BETWEEN 0 AND 28), sac_code text NOT NULL DEFAULT '', updated_at timestamptz NOT NULL DEFAULT now(), CHECK(seller_gstin='' OR seller_gstin ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$'), CHECK(seller_gstin='' OR (seller_name<>'' AND seller_address<>'' AND seller_state<>'' AND sac_code ~ '^[0-9]{4,8}$')));
GRANT SELECT,INSERT,UPDATE ON public.billing_settings TO authenticated;
GRANT ALL ON public.billing_settings TO service_role;
ALTER TABLE public.billing_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY billing_settings_read ON public.billing_settings FOR SELECT TO authenticated USING(public.has_panel_permission('invoices','view'));
CREATE POLICY billing_settings_insert ON public.billing_settings FOR INSERT TO authenticated WITH CHECK(public.has_panel_permission('invoices','edit'));
CREATE POLICY billing_settings_update ON public.billing_settings FOR UPDATE TO authenticated USING(public.has_panel_permission('invoices','edit')) WITH CHECK(public.has_panel_permission('invoices','edit'));
ALTER TABLE public.invoices ADD COLUMN billing_snapshot jsonb;
CREATE UNIQUE INDEX invoices_one_automatic_bill_per_order ON public.invoices(order_id) WHERE billing_snapshot IS NOT NULL;
CREATE SEQUENCE public.purchase_bill_number_seq;
CREATE FUNCTION public.inclusive_bill_totals(_total numeric,_gst numeric) RETURNS jsonb LANGUAGE sql IMMUTABLE SET search_path=public AS $$ SELECT jsonb_build_object('total',round(_total,2),'subtotal',round(_total*100/(100+_gst),2),'gst_amount',round(_total,2)-round(_total*100/(100+_gst),2),'gst_rate',_gst) $$;
REVOKE ALL ON FUNCTION public.inclusive_bill_totals(numeric,numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.inclusive_bill_totals(numeric,numeric) TO authenticated,service_role;
CREATE FUNCTION public.issue_purchase_bill(_order_id uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o public.orders; b public.billing_settings; p public.profiles; tax numeric:=0; totals jsonb; title text; result uuid;
BEGIN
 SELECT * INTO o FROM public.orders WHERE id=_order_id FOR UPDATE;
 IF NOT FOUND OR o.status<>'paid' OR coalesce(o.provider_reference,'')='' THEN RAISE EXCEPTION 'Verified payment required'; END IF;
 SELECT id INTO result FROM public.invoices WHERE order_id=o.id LIMIT 1;
 IF result IS NOT NULL THEN RETURN result; END IF;
 SELECT * INTO b FROM public.billing_settings WHERE id=true;
 SELECT * INTO p FROM public.profiles WHERE id=o.user_id;
 IF coalesce(b.seller_gstin,'')<>'' THEN tax:=coalesce(b.gst_percent,0); END IF;
 totals:=public.inclusive_bill_totals(o.amount,tax);
 IF o.ebook_id IS NOT NULL THEN SELECT e.title INTO title FROM public.ebooks e WHERE e.id=o.ebook_id;
 ELSIF o.session_id IS NOT NULL THEN SELECT s.title INTO title FROM public.class_sessions s WHERE s.id=o.session_id;
 ELSE SELECT c.title INTO title FROM public.courses c WHERE c.id::text=o.course_id; END IF;
 INSERT INTO public.invoices(order_id,invoice_no,buyer_name,buyer_gstin,subtotal,gst_rate,gst_amount,total,billing_snapshot)
 VALUES(o.id,CASE WHEN tax>0 THEN 'INV-' ELSE 'BILL-' END||to_char(now(),'YYYY')||'-'||lpad(nextval('public.purchase_bill_number_seq')::text,6,'0'),coalesce(nullif(p.full_name,''),'Member'),'',round((totals->>'subtotal')::numeric),round(tax),round((totals->>'gst_amount')::numeric),o.amount,
 totals||jsonb_build_object('seller_name',coalesce(b.seller_name,'ChartSikho'),'seller_address',coalesce(b.seller_address,''),'seller_state',coalesce(b.seller_state,''),'seller_gstin',CASE WHEN tax>0 THEN b.seller_gstin ELSE '' END,'sac_code',coalesce(b.sac_code,''),'buyer_address',coalesce(p.address,''),'buyer_state',coalesce(p.state,''),'buyer_phone',coalesce(p.phone,''),'product_title',coalesce(title,o.course_id),'payment_reference',o.provider_reference,'document_type',CASE WHEN tax>0 THEN 'gst_invoice' ELSE 'bill' END,'tax_type',CASE WHEN coalesce(p.state,'')='' THEN 'GST' WHEN lower(trim(p.state))=lower(trim(b.seller_state)) THEN 'CGST_SGST' ELSE 'IGST' END)) RETURNING id INTO result;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.issue_purchase_bill(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.issue_purchase_bill(uuid) TO service_role;
CREATE FUNCTION public.auto_bill_successful_order() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN IF NEW.status='paid' AND coalesce(NEW.provider_reference,'')<>'' THEN PERFORM public.issue_purchase_bill(NEW.id); END IF; RETURN NEW; END $$;
REVOKE ALL ON FUNCTION public.auto_bill_successful_order() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER automatic_purchase_bill AFTER INSERT OR UPDATE OF status,provider_reference ON public.orders FOR EACH ROW EXECUTE FUNCTION public.auto_bill_successful_order();
CREATE FUNCTION public.create_verified_order_bill(_order_id uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN IF NOT public.has_panel_permission('invoices','create') THEN RAISE EXCEPTION 'Forbidden'; END IF; RETURN public.issue_purchase_bill(_order_id); END $$;
REVOKE ALL ON FUNCTION public.create_verified_order_bill(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.create_verified_order_bill(uuid) TO authenticated,service_role;
COMMENT ON COLUMN public.invoices.billing_snapshot IS 'Immutable issuance-time seller/product details and authoritative decimal GST-inclusive totals. Legacy integer amount fields are compatibility projections.';
CREATE FUNCTION public.guard_bill_snapshot() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN IF OLD.billing_snapshot IS NOT NULL AND (NEW.billing_snapshot,NEW.order_id,NEW.invoice_no,NEW.subtotal,NEW.gst_rate,NEW.gst_amount,NEW.total,NEW.issued_at) IS DISTINCT FROM (OLD.billing_snapshot,OLD.order_id,OLD.invoice_no,OLD.subtotal,OLD.gst_rate,OLD.gst_amount,OLD.total,OLD.issued_at) THEN RAISE EXCEPTION 'Issued bill amounts and seller details are immutable'; END IF; RETURN NEW; END $$;
CREATE TRIGGER preserve_bill_snapshot BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.guard_bill_snapshot();