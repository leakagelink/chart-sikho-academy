import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useLang } from '@/lib/i18n';
import { inr } from '@/lib/courses';
import { ManualPay } from './ManualPay';

export type PurchasableSession = { id: string; title: string; access_mode: string; price: number };
export function SessionPurchase({session,details=false}:{session:PurchasableSession;details?:boolean}) {
  const {session:auth}=useAuth();const {t}=useLang();
  const access=useQuery({queryKey:['session-access',auth?.user.id,session.id],enabled:!!auth,refetchInterval:15000,queryFn:async()=>{const r=await supabase.rpc('my_session_access',{_session_id:session.id});if(r.error)throw r.error;return r.data as {allowed:boolean;youtube_url:string;jitsi_url:string;recording_url:string};}});
  return <div className="mt-auto space-y-3 pt-3">
    <p className="text-lg font-bold text-primary">{session.access_mode==='free'?t('session_free'):inr(session.price)}</p>
    {!details?<Link to="/live/$classId" params={{classId:session.id}} className="font-semibold text-primary underline">{t('view_details')}</Link>:!auth?<Link to="/auth" className="font-semibold text-primary underline">{t('session_signin')}</Link>:access.isPending?<p>{t('loading')}</p>:access.isError?<p role="alert" className="text-destructive">{t('admin_error')}</p>:access.data?.allowed?<>
      <p className="font-semibold text-success">{t(session.access_mode==='paid'?'session_purchased':'session_free')}</p>
      {[access.data.youtube_url,access.data.jitsi_url,access.data.recording_url].filter(Boolean).map((url,i)=><a key={url} href={url} target="_blank" rel="noopener noreferrer" className="block font-semibold text-primary underline">{t(i===1?'doubt_session':'session_join')}</a>)}
      {!access.data.youtube_url&&!access.data.jitsi_url&&!access.data.recording_url&&<p className="text-sm text-muted-foreground">{t('session_not_started')}</p>}
    </>:<ManualPay course={session} userId={auth.user.id} productType="session"/>}
  </div>;
}