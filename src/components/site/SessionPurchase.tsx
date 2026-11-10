import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useLang } from '@/lib/i18n';
import { inr } from '@/lib/courses';
import { Button } from '@/components/ui/button';
import { ManualPay, ManualPayForm, PaymentDialog } from './ManualPay';
import { ProductSocial } from './ProductSocial';

export type PurchasableSession = { id: string; title: string; access_mode: string; price: number };

/** Access state for one session: sign-in prompt, join links, or UPI payment (inline form inside the popup). */
function SessionAccess({ session, inDialog, onDone }: { session: PurchasableSession; inDialog: boolean; onDone?: () => void }) {
  const { session: auth } = useAuth(); const { t } = useLang();
  const access = useQuery({ queryKey: ['session-access', auth?.user.id, session.id], enabled: !!auth, refetchInterval: 15000, queryFn: async () => { const r = await supabase.rpc('my_session_access', { _session_id: session.id }); if (r.error) throw r.error; return r.data as { allowed: boolean; youtube_url: string; jitsi_url: string; recording_url: string }; } });
  if (!auth) return <div className="space-y-3">{inDialog && <p className="text-sm text-muted-foreground">{t('purchase_signin')}</p>}<Button asChild className="w-full"><Link to="/auth" search={{ redirect: `/live/${session.id}` }}>{t('session_signin')}</Link></Button></div>;
  if (access.isPending) return <p className="text-sm text-muted-foreground">{t('admin_loading')}</p>;
  if (access.isError) return <p role="alert" className="text-destructive">{t('admin_error')}</p>;
  if (access.data?.allowed) return <div className="space-y-2">
    <p className="font-semibold text-success">{t(session.access_mode === 'paid' ? 'session_purchased' : 'session_free')}</p>
    {[access.data.youtube_url, access.data.jitsi_url, access.data.recording_url].filter(Boolean).map((url, i) => <Button key={url} asChild variant={i === 0 ? 'default' : 'outline'} className="w-full"><a href={url} target="_blank" rel="noopener noreferrer">{t(i === 1 ? 'doubt_session' : 'session_join')}</a></Button>)}
    {!access.data.youtube_url && !access.data.jitsi_url && !access.data.recording_url && <p className="text-sm text-muted-foreground">{t('session_not_started')}</p>}
  </div>;
  return inDialog ? <ManualPayForm course={session} userId={auth.user.id} productType="session" onDone={onDone} /> : <ManualPay course={session} userId={auth.user.id} productType="session" className="w-full" />;
}

export function SessionPurchase({ session, details = false }: { session: PurchasableSession; details?: boolean }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const paid = session.access_mode !== 'free';
  const price = <p className={`${details ? 'text-3xl' : 'text-lg'} font-bold text-primary`}>{paid ? inr(session.price) : t('session_free')}</p>;
  if (details) return <div className="mt-4 space-y-4 border-t border-border pt-4">{price}<SessionAccess session={session} inDialog={false} /><ProductSocial kind="session" id={session.id} title={session.title} /></div>;
  return <div className="mt-auto space-y-3 pt-3">
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">{price}<Link to="/live/$classId" params={{ classId: session.id }} className="shrink-0 text-sm font-semibold text-primary underline">{t('view_details')}</Link></div>
    <Button className="w-full" onClick={() => setOpen(true)}>{t('join_now_btn')}</Button>
    <PaymentDialog open={open} onOpenChange={setOpen} title={paid ? t('pay_upi_title') : t('join_now_btn')} description={`${session.title}${paid ? ` · ${inr(session.price)}` : ''}`}>
      {open && <SessionAccess session={session} inDialog onDone={() => setOpen(false)} />}
    </PaymentDialog>
  </div>;
}
