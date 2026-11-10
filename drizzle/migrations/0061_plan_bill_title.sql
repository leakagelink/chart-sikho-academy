CREATE OR REPLACE FUNCTION public.issue_purchase_bill(_order_id uuid)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
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
 ELSIF o.plan_id IS NOT NULL THEN SELECT 'Membership: '||m.name_en INTO title FROM public.membership_plans m WHERE m.id=o.plan_id;
 ELSE SELECT c.title INTO title FROM public.courses c WHERE c.id::text=o.course_id; END IF;
 INSERT INTO public.invoices(order_id,invoice_no,buyer_name,buyer_gstin,subtotal,gst_rate,gst_amount,total,billing_snapshot)
 VALUES(o.id,CASE WHEN tax>0 THEN 'INV-' ELSE 'BILL-' END||to_char(now(),'YYYY')||'-'||lpad(nextval('public.purchase_bill_number_seq')::text,6,'0'),coalesce(nullif(p.full_name,''),'Member'),'',round((totals->>'subtotal')::numeric),round(tax),round((totals->>'gst_amount')::numeric),o.amount,
 totals||jsonb_build_object('seller_name',coalesce(b.seller_name,'ChartSikho'),'seller_address',coalesce(b.seller_address,''),'seller_state',coalesce(b.seller_state,''),'seller_gstin',CASE WHEN tax>0 THEN b.seller_gstin ELSE '' END,'sac_code',coalesce(b.sac_code,''),'buyer_address',coalesce(p.address,''),'buyer_state',coalesce(p.state,''),'buyer_phone',coalesce(p.phone,''),'product_title',coalesce(title,o.course_id),'payment_reference',o.provider_reference,'document_type',CASE WHEN tax>0 THEN 'gst_invoice' ELSE 'bill' END,'tax_type',CASE WHEN coalesce(p.state,'')='' THEN 'GST' WHEN lower(trim(p.state))=lower(trim(b.seller_state)) THEN 'CGST_SGST' ELSE 'IGST' END)) RETURNING id INTO result;
 RETURN result;
END $function$;