ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_path text NOT NULL DEFAULT '', ADD COLUMN IF NOT EXISTS bio text NOT NULL DEFAULT '', ADD COLUMN IF NOT EXISTS address text NOT NULL DEFAULT '', ADD COLUMN IF NOT EXISTS date_of_birth date;
CREATE POLICY "Own profile photo upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text AND lower(storage.extension(name)) IN ('jpg','jpeg','png','webp'));
CREATE POLICY "Own profile photo read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Own profile photo delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE OR REPLACE FUNCTION public.save_my_profile(_full_name text, _phone text, _state text, _city text, _preferred_language text, _address text, _bio text, _date_of_birth date, _avatar_path text) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN
IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
IF length(_full_name)>120 OR length(_phone)>25 OR length(_state)>100 OR length(_city)>100 OR length(_address)>500 OR length(_bio)>500 OR _preferred_language NOT IN ('en','hi') OR (_date_of_birth IS NOT NULL AND _date_of_birth > CURRENT_DATE) THEN RAISE EXCEPTION 'Invalid profile details'; END IF;
IF _avatar_path <> '' AND (split_part(_avatar_path,'/',1) <> auth.uid()::text OR NOT EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id='profile-photos' AND name=_avatar_path)) THEN RAISE EXCEPTION 'Invalid profile photo'; END IF;
INSERT INTO public.profiles(id,full_name,phone,state,city,preferred_language,address,bio,date_of_birth,avatar_path,updated_at) VALUES (auth.uid(),trim(_full_name),trim(_phone),trim(_state),trim(_city),_preferred_language,trim(_address),trim(_bio),_date_of_birth,_avatar_path,now()) ON CONFLICT (id) DO UPDATE SET full_name=excluded.full_name,phone=excluded.phone,state=excluded.state,city=excluded.city,preferred_language=excluded.preferred_language,address=excluded.address,bio=excluded.bio,date_of_birth=excluded.date_of_birth,avatar_path=excluded.avatar_path,updated_at=now();
END; $$;
REVOKE ALL ON FUNCTION public.save_my_profile(text,text,text,text,text,text,text,date,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_my_profile(text,text,text,text,text,text,text,date,text) TO authenticated;
