ALTER TABLE public.notification_campaigns ADD COLUMN IF NOT EXISTS show_popup boolean NOT NULL DEFAULT false;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS show_popup boolean NOT NULL DEFAULT false;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS notification_id uuid;
ALTER TABLE public.user_notifications ADD COLUMN IF NOT EXISTS popup_seen_at timestamptz;

CREATE OR REPLACE FUNCTION public.deliver_push_campaign()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE t record; nid uuid;
BEGIN
  IF NEW.channel='push' AND NEW.status='sent' AND NEW.notification_id IS NULL
     AND (TG_OP='INSERT' OR OLD.status<>'sent') THEN
    IF NOT (has_role(auth.uid(),'admin') OR has_panel_permission('campaigns','edit') OR has_panel_permission('campaigns','create')) THEN
      RAISE EXCEPTION 'Not allowed';
    END IF;
    SELECT subject, body INTO t FROM public.message_templates WHERE id=NEW.template_id;
    INSERT INTO public.notification_campaigns(title,message,audience,channel,status,show_popup,created_by)
    VALUES (left(COALESCE(NULLIF(t.subject,''),NEW.name),120), left(COALESCE(NULLIF(t.body,''),NEW.name),1000), NEW.audience,'in_app','published',NEW.show_popup,auth.uid())
    RETURNING id INTO nid;
    NEW.notification_id := nid;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS deliver_push_campaign ON public.campaigns;
CREATE TRIGGER deliver_push_campaign BEFORE INSERT OR UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.deliver_push_campaign();