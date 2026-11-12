import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation } from '@tanstack/react-router';
import { NotificationLink } from '@/components/site/NotificationLink';
import { Bell } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useLang } from '@/lib/i18n';
import { getStudentNotifications, markNotificationPopupSeen } from '@/lib/admin.functions';

/** Shows the newest unseen admin notification flagged as a popup on the homepage/dashboard. */
export function NotificationPopup() {
  const { session } = useAuth();
  const { t } = useLang();
  const { pathname } = useLocation();
  const qc = useQueryClient();
  const onHome = pathname === '/' || pathname === '/dashboard';
  const { data } = useQuery({ queryKey: ['notification-inbox'], queryFn: () => getStudentNotifications(), enabled: !!session && onHome });
  const item = data?.find(n => n.notification_campaigns?.show_popup && !n.popup_seen_at);
  if (!onHome || !item) return null;
  const close = async () => {
    qc.setQueryData(['notification-inbox'], (old: typeof data) => old?.map(n => n.id === item.id ? { ...n, popup_seen_at: new Date().toISOString() } : n));
    try { await markNotificationPopupSeen({ data: { id: item.id } }); } catch { /* retried next visit */ }
  };
  return (
    <Dialog open onOpenChange={o => { if (!o) void close(); }}>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-md overflow-y-auto rounded-2xl">
        <div className="flex items-center gap-2 text-primary"><Bell className="h-5 w-5" /></div>
        {item.notification_campaigns?.image_url&&<NotificationLink link={item.notification_campaigns.link_url} onNavigate={() => void close()} className="block"><img src={item.notification_campaigns.image_url} alt="" className="max-h-56 w-full rounded-md object-contain"/></NotificationLink>}
        <DialogTitle className="font-display text-xl">{item.notification_campaigns?.title}</DialogTitle>
        <DialogDescription className="whitespace-pre-wrap">{item.notification_campaigns?.message}</DialogDescription>
        <div className="mt-2 flex justify-end gap-2">
          <Button variant="outline" onClick={() => void close()}>{t('notif_popup_close')}</Button>
          <Button asChild><NotificationLink link={item.notification_campaigns?.link_url} onNavigate={() => void close()}>{t('notif_popup_view')}</NotificationLink></Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
