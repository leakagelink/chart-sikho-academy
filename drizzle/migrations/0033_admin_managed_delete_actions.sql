CREATE OR REPLACE FUNCTION public.delete_admin_managed_record(_resource text, _id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE n integer; rel public.referral_relationships;
BEGIN
 IF auth.uid() IS NULL OR _resource NOT IN ('coupons','affiliates','instructors','ranks','templates','announcements','tickets','banners','campaigns','leads','seo','promocodes','reviews','notifications') OR NOT public.has_panel_permission(_resource,'delete') THEN RAISE EXCEPTION 'Forbidden'; END IF;
 CASE _resource
 WHEN 'coupons' THEN
  PERFORM id FROM public.coupons WHERE id=_id AND used_count=0 FOR UPDATE;
  IF NOT FOUND AND EXISTS(SELECT 1 FROM public.coupons WHERE id=_id) THEN RAISE EXCEPTION 'Linked records'; END IF;
  IF EXISTS(SELECT 1 FROM public.promo_codes WHERE coupon_id=_id) THEN RAISE EXCEPTION 'Linked records'; END IF;
  DELETE FROM public.coupons WHERE id=_id;
 WHEN 'affiliates' THEN
  SELECT * INTO rel FROM public.referral_relationships WHERE id=_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Record not found'; END IF;
  IF EXISTS(SELECT 1 FROM public.orders WHERE user_id=rel.referred_id) OR EXISTS(SELECT 1 FROM public.commission_entries WHERE user_id IN (rel.referrer_id,rel.referred_id)) OR EXISTS(SELECT 1 FROM public.referral_relationships WHERE referrer_id=rel.referred_id) THEN RAISE EXCEPTION 'Linked records'; END IF;
  DELETE FROM public.referral_relationships WHERE id=_id;
 WHEN 'instructors' THEN
  IF EXISTS(SELECT 1 FROM public.courses c JOIN public.instructors i ON c.instructor=i.name WHERE i.id=_id) THEN RAISE EXCEPTION 'Linked records'; END IF;
  DELETE FROM public.instructors WHERE id=_id;
 WHEN 'ranks' THEN DELETE FROM public.ranks WHERE id=_id;
 WHEN 'templates' THEN
  IF EXISTS(SELECT 1 FROM public.campaigns WHERE template_id=_id) THEN RAISE EXCEPTION 'Linked records'; END IF;
  DELETE FROM public.message_templates WHERE id=_id;
 WHEN 'announcements' THEN DELETE FROM public.announcements WHERE id=_id;
 WHEN 'tickets' THEN DELETE FROM public.support_tickets WHERE id=_id;
 WHEN 'banners' THEN DELETE FROM public.banners WHERE id=_id;
 WHEN 'campaigns' THEN
  IF EXISTS(SELECT 1 FROM public.campaigns WHERE id=_id AND (status='sent' OR notification_id IS NOT NULL)) THEN RAISE EXCEPTION 'Linked records'; END IF;
  DELETE FROM public.campaigns WHERE id=_id;
 WHEN 'leads' THEN DELETE FROM public.leads WHERE id=_id;
 WHEN 'seo' THEN DELETE FROM public.seo_pages WHERE id=_id;
 WHEN 'promocodes' THEN DELETE FROM public.promo_codes WHERE id=_id;
 WHEN 'reviews' THEN DELETE FROM public.course_reviews WHERE id=_id;
 WHEN 'notifications' THEN
  IF EXISTS(SELECT 1 FROM public.user_notifications WHERE campaign_id=_id) OR EXISTS(SELECT 1 FROM public.campaigns WHERE notification_id=_id) THEN RAISE EXCEPTION 'Linked records'; END IF;
  DELETE FROM public.notification_campaigns WHERE id=_id;
 END CASE;
 GET DIAGNOSTICS n=ROW_COUNT;
 IF n=0 THEN RAISE EXCEPTION 'Record not found'; END IF;
 INSERT INTO public.admin_audit_log(actor_id,resource,record_id,action) VALUES(auth.uid(),_resource,_id,'DELETE');
END; $$;
REVOKE ALL ON FUNCTION public.delete_admin_managed_record(text,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.delete_admin_managed_record(text,uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.guard_profile_history_deletion()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=OLD.id AND role='admin') THEN RAISE EXCEPTION 'Protected administrator'; END IF;
 IF EXISTS(SELECT 1 FROM public.orders WHERE user_id=OLD.id) OR EXISTS(SELECT 1 FROM public.manual_payments WHERE user_id=OLD.id OR reviewed_by=OLD.id) OR EXISTS(SELECT 1 FROM public.commission_entries WHERE user_id=OLD.id) OR EXISTS(SELECT 1 FROM public.payout_requests WHERE user_id=OLD.id) OR EXISTS(SELECT 1 FROM public.bonus_entries WHERE user_id=OLD.id) OR EXISTS(SELECT 1 FROM public.refund_requests WHERE user_id=OLD.id) OR EXISTS(SELECT 1 FROM public.referral_relationships WHERE referrer_id=OLD.id OR referred_id=OLD.id) OR EXISTS(SELECT 1 FROM public.certificates WHERE user_id=OLD.id) OR EXISTS(SELECT 1 FROM public.quiz_attempts WHERE user_id=OLD.id) OR EXISTS(SELECT 1 FROM public.lesson_completions WHERE user_id=OLD.id) OR EXISTS(SELECT 1 FROM public.enrollments WHERE user_id=OLD.id AND (course_id<>'basics' OR progress>0 OR last_lesson>0)) OR EXISTS(SELECT 1 FROM public.course_reviews WHERE user_id=OLD.id) OR EXISTS(SELECT 1 FROM public.support_tickets WHERE user_id=OLD.id) OR EXISTS(SELECT 1 FROM public.notification_campaigns WHERE created_by=OLD.id) THEN RAISE EXCEPTION 'Linked records'; END IF;
 DELETE FROM public.enrollments WHERE user_id=OLD.id;
 DELETE FROM public.payout_preferences WHERE user_id=OLD.id;
 DELETE FROM public.user_notifications WHERE user_id=OLD.id;
 DELETE FROM public.referral_influencers WHERE user_id=OLD.id;
 RETURN OLD;
END; $$;
CREATE TRIGGER guard_profile_history_deletion BEFORE DELETE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.guard_profile_history_deletion();