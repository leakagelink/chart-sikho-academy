CREATE OR REPLACE FUNCTION public.validate_sale_commission() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF (to_jsonb(NEW) - ARRAY['status','on_hold']) IS DISTINCT FROM (to_jsonb(OLD) - ARRAY['status','on_hold']) THEN RAISE EXCEPTION 'Commission amounts are immutable'; END IF;
    IF NEW.status IN ('approved','paid') AND NOT EXISTS (SELECT 1 FROM public.orders WHERE id=NEW.order_id AND status='paid') THEN RAISE EXCEPTION 'Commission requires a verified genuine sale'; END IF;
    RETURN NEW;
  END IF;
  IF NOT EXISTS(SELECT 1 FROM public.orders WHERE id=NEW.order_id AND status='paid' AND amount>0 AND provider_reference IS NOT NULL AND amount>=NEW.amount) THEN RAISE EXCEPTION 'Commission requires a verified genuine sale'; END IF;
  RETURN NEW;
END $$;