ALTER TABLE public.certificates ADD COLUMN archived_at timestamptz;
ALTER TABLE public.invoices ADD COLUMN archived_at timestamptz;
ALTER TABLE public.bonus_entries ADD COLUMN archived_at timestamptz;
CREATE OR REPLACE FUNCTION public.admin_record_remove(_resource text,_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE n integer; target public.user_roles;
BEGIN
 IF auth.uid() IS NULL OR _resource NOT IN ('modules','certificates','invoices','bonuses','roles') OR NOT public.has_panel_permission(CASE WHEN _resource='modules' THEN 'builder' ELSE _resource END,'delete') THEN RAISE EXCEPTION 'Forbidden'; END IF;
 CASE _resource
 WHEN 'modules' THEN
  PERFORM id FROM public.course_modules WHERE id=_id FOR UPDATE;
  IF EXISTS(SELECT 1 FROM public.course_lessons WHERE module_id=_id) OR EXISTS(SELECT 1 FROM public.class_sessions WHERE module_id=_id) THEN RAISE EXCEPTION 'Linked records'; END IF;
  DELETE FROM public.course_modules WHERE id=_id;
 WHEN 'certificates' THEN UPDATE public.certificates SET status='revoked',archived_at=now() WHERE id=_id AND archived_at IS NULL;
 WHEN 'invoices' THEN UPDATE public.invoices SET status='cancelled',archived_at=now() WHERE id=_id AND archived_at IS NULL;
 WHEN 'bonuses' THEN
  IF EXISTS(SELECT 1 FROM public.bonus_entries WHERE id=_id AND status='approved') THEN RAISE EXCEPTION 'Linked records'; END IF;
  UPDATE public.bonus_entries SET status='rejected',archived_at=now() WHERE id=_id AND archived_at IS NULL;
 WHEN 'roles' THEN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  SELECT * INTO target FROM public.user_roles WHERE id=_id FOR UPDATE;
  IF target.user_id=auth.uid() THEN RAISE EXCEPTION 'Protected administrator'; END IF;
  IF target.role='admin' AND NOT EXISTS(SELECT 1 FROM public.user_roles r JOIN public.profiles p ON p.id=r.user_id WHERE r.role='admin' AND r.id<>_id AND p.account_status='active') THEN RAISE EXCEPTION 'Protected administrator'; END IF;
  DELETE FROM public.user_roles WHERE id=_id;
 END CASE;
 GET DIAGNOSTICS n=ROW_COUNT;
 IF n=0 THEN RAISE EXCEPTION 'Record not found'; END IF;
 INSERT INTO public.admin_audit_log(actor_id,resource,record_id,action) VALUES(auth.uid(),_resource,_id,CASE WHEN _resource IN ('certificates','invoices','bonuses') THEN 'ARCHIVE' ELSE 'DELETE' END);
END; $$;
REVOKE ALL ON FUNCTION public.admin_record_remove(text,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_record_remove(text,uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.edit_admin_role(_id uuid,_role public.app_role) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE target public.user_roles; rid uuid;
BEGIN
 IF NOT public.has_panel_permission('roles','edit') OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
 SELECT * INTO target FROM public.user_roles WHERE id=_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Record not found'; END IF;
 IF target.user_id=auth.uid() THEN RAISE EXCEPTION 'Protected administrator'; END IF;
 IF target.role=_role THEN RETURN _id; END IF;
 IF target.role='admin' AND NOT EXISTS(SELECT 1 FROM public.user_roles r JOIN public.profiles p ON p.id=r.user_id WHERE r.role='admin' AND r.id<>_id AND p.account_status='active') THEN RAISE EXCEPTION 'Protected administrator'; END IF;
 DELETE FROM public.user_roles WHERE id=_id;
 INSERT INTO public.user_roles(user_id,role) VALUES(target.user_id,_role) ON CONFLICT(user_id,role) DO UPDATE SET role=excluded.role RETURNING id INTO rid;
 INSERT INTO public.admin_audit_log(actor_id,resource,record_id,action) VALUES(auth.uid(),'user_roles',rid,'UPDATE');
 RETURN rid;
END; $$;
REVOKE ALL ON FUNCTION public.edit_admin_role(uuid,public.app_role) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.edit_admin_role(uuid,public.app_role) TO authenticated;