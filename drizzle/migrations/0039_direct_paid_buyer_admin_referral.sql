CREATE OR REPLACE FUNCTION public.direct_buyer_purchase_eligible(_status text, _reference text, _amount integer)
RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path=public AS $$
 SELECT coalesce(_status='paid' AND nullif(btrim(_reference),'') IS NOT NULL AND _amount>0,false);
$$;
REVOKE ALL ON FUNCTION public.direct_buyer_purchase_eligible(text,text,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.direct_buyer_purchase_eligible(text,text,integer) TO authenticated, service_role;
CREATE OR REPLACE FUNCTION public.assign_direct_paid_buyer()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE parent_id uuid := 'ad62e080-543e-45c3-ba44-f3002ed9df9b';
BEGIN
 IF NOT public.direct_buyer_purchase_eligible(NEW.status,NEW.provider_reference,NEW.amount) THEN RETURN NEW; END IF;
 IF NEW.user_id=parent_id OR NOT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=parent_id AND role='admin') THEN RETURN NEW; END IF;
 IF EXISTS(SELECT 1 FROM public.referral_relationships WHERE referred_id=NEW.user_id) THEN RETURN NEW; END IF;
 -- Serialize direct placement against the same parent; the buyer lock prevents duplicate purchases racing.
 PERFORM id FROM public.profiles WHERE id=parent_id FOR UPDATE;
 PERFORM id FROM public.profiles WHERE id=NEW.user_id FOR UPDATE;
 IF NOT FOUND THEN RETURN NEW; END IF;
 IF EXISTS (
  WITH RECURSIVE ancestors(id,path) AS (
   SELECT parent_id,ARRAY[parent_id]
   UNION ALL
   SELECT r.referrer_id,a.path||r.referrer_id FROM ancestors a JOIN public.referral_relationships r ON r.referred_id=a.id WHERE NOT r.referrer_id=ANY(a.path)
  ) SELECT 1 FROM ancestors WHERE id=NEW.user_id
 ) THEN RETURN NEW; END IF;
 INSERT INTO public.referral_relationships(referrer_id,referred_id) VALUES(parent_id,NEW.user_id) ON CONFLICT(referred_id) DO NOTHING;
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.assign_direct_paid_buyer() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER assign_direct_paid_buyer BEFORE INSERT OR UPDATE OF status,provider_reference ON public.orders FOR EACH ROW EXECUTE FUNCTION public.assign_direct_paid_buyer();
COMMENT ON FUNCTION public.assign_direct_paid_buyer() IS 'Assign verified direct paid buyers to designated Admin before commission processing; preserve existing referral parents and prevent self/circular placement.';