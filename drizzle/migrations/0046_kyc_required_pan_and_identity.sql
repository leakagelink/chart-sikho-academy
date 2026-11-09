ALTER TABLE public.kyc_requests ADD COLUMN pan_document_path text;
COMMENT ON COLUMN public.kyc_requests.pan_document_path IS 'Required PAN for new KYC submissions; legacy requests retain their original documents.';
CREATE OR REPLACE FUNCTION public.submit_kyc(_type text, _path text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN RAISE EXCEPTION 'PAN and Aadhaar or Voter ID are required. Please reload and submit both documents.'; END $$;
CREATE OR REPLACE FUNCTION public.submit_kyc_documents(_pan_path text, _identity_type text, _identity_path text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE rid uuid; p public.profiles; doc text;
BEGIN
SELECT * INTO p FROM public.profiles WHERE id=auth.uid() FOR UPDATE;
IF auth.uid() IS NULL OR p.id IS NULL OR p.account_status<>'active' THEN RAISE EXCEPTION 'Forbidden'; END IF;
IF p.kyc_status='verified' OR EXISTS(SELECT 1 FROM public.kyc_requests WHERE user_id=auth.uid() AND status='pending') THEN RAISE EXCEPTION 'KYC already verified or pending'; END IF;
IF _identity_type IS NULL OR _identity_type NOT IN ('aadhaar','voter_id') OR _pan_path IS NULL OR _identity_path IS NULL OR _pan_path=_identity_path THEN RAISE EXCEPTION 'PAN and Aadhaar or Voter ID are required'; END IF;
FOREACH doc IN ARRAY ARRAY[_pan_path,_identity_path] LOOP
IF split_part(doc,'/',1)<>auth.uid()::text OR NOT EXISTS(SELECT 1 FROM storage.objects WHERE bucket_id='kyc-documents' AND name=doc AND lower(metadata->>'mimetype') IN ('application/pdf','image/png','image/jpeg','image/webp') AND coalesce((metadata->>'size')::bigint,0) BETWEEN 1 AND 10485760) THEN RAISE EXCEPTION 'Invalid KYC document'; END IF;
END LOOP;
INSERT INTO public.kyc_requests(user_id,document_type,document_path,pan_document_path) VALUES(auth.uid(),_identity_type,_identity_path,_pan_path) RETURNING id INTO rid;
PERFORM set_config('app.kyc_write','yes',true);
UPDATE public.profiles SET kyc_status='pending',updated_at=now() WHERE id=auth.uid();
PERFORM set_config('app.kyc_write','no',true);
RETURN rid;
END $$;
REVOKE ALL ON FUNCTION public.submit_kyc_documents(text,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.submit_kyc_documents(text,text,text) TO authenticated;
CREATE OR REPLACE FUNCTION public.guard_complete_kyc_approval() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
IF NEW.status='approved' AND OLD.status IS DISTINCT FROM 'approved' AND (nullif(NEW.pan_document_path,'') IS NULL OR NEW.document_type NOT IN ('aadhaar','voter_id') OR nullif(NEW.document_path,'') IS NULL OR NEW.pan_document_path=NEW.document_path) THEN RAISE EXCEPTION 'PAN and Aadhaar or Voter ID required before approval; reject incomplete legacy request for resubmission'; END IF;
RETURN NEW; END $$;
CREATE TRIGGER require_complete_kyc_approval BEFORE UPDATE OF status ON public.kyc_requests FOR EACH ROW EXECUTE FUNCTION public.guard_complete_kyc_approval();