import { createFileRoute } from '@tanstack/react-router';
import { MobilePageBar } from '@/components/site/MobilePageBar';
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { getStudentNotifications } from '@/lib/admin.functions';
import { useLang } from '@/lib/i18n';
import { pageMeta } from '@/lib/route-meta';
const options=()=>queryOptions({queryKey:['notification-inbox'],queryFn:()=>getStudentNotifications()});
export const Route=createFileRoute('/_authenticated/notifications')({head:()=>pageMeta('My notifications','Read Chartसीखो announcements sent to your account.'),loader:({context})=>context.queryClient.ensureQueryData(options()),errorComponent:()=> <InboxError/>,notFoundComponent:()=> <InboxError/>,component:Inbox});
function InboxError(){const {t}=useLang();return <p className="p-8">{t('admin_error')}</p>;}
function Inbox(){const {t}=useLang();const {data}=useSuspenseQuery(options());return <main className="app-list w-full px-4 py-8"><MobilePageBar title={t('notifications')}/><h1 className="mb-6 hidden font-display text-3xl font-bold lg:block">{t('notifications')}</h1>{data.map(n=><article key={n.id} className="border-b border-border py-5">{n.notification_campaigns?.image_url&&<img src={n.notification_campaigns.image_url} alt="" className="mb-3 max-h-64 rounded-md object-contain"/>}<h2 className="font-semibold">{n.notification_campaigns?.title}</h2><p className="mt-2 whitespace-pre-wrap text-muted-foreground">{n.notification_campaigns?.message}</p></article>)}{!data.length&&<p className="text-muted-foreground">{t('admin_empty')}</p>}</main>;}