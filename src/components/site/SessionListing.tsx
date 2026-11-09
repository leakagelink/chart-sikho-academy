import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { Calendar, RefreshCw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { filterSessions, type SessionPrice, type SessionTiming } from '@/lib/session-filters';
import { productQuery } from '@/lib/product-query';
import { useLang } from '@/lib/i18n';
import { SessionPurchase } from './SessionPurchase';
import { LiveClassThumbnail } from './LiveClassCard';
export function SessionListing({kind}:{kind:'class'|'webinar'}) {
  const {data}=useSuspenseQuery(productQuery());
  const {t,lang}=useLang();
  const client=useQueryClient();
  const [timing,setTiming]=useState<SessionTiming>('all');
  const [price,setPrice]=useState<SessionPrice>('all');
  const [search,setSearch]=useState('');
  const [refreshing,setRefreshing]=useState(false);
  const sessions=filterSessions(data.sessions.filter(s=>s.kind===kind),{timing,price,search});
  const refresh=async()=>{setRefreshing(true);try{await client.invalidateQueries({queryKey:productQuery().queryKey});}finally{setRefreshing(false);}};
  return <section className="min-w-0 px-4 py-8">
    <div className="flex items-start justify-between gap-3"><h1 className="font-display text-3xl font-bold">{t(kind==='class'?'cat_live':'cat_webinars')}</h1><Button variant="outline" size="icon" aria-label={t('affiliate_refresh')} title={t('affiliate_refresh')} disabled={refreshing} onClick={refresh}><RefreshCw className={refreshing?'animate-spin':''}/></Button></div>
    <div className="mt-6 flex flex-col gap-4 border-y border-border py-4">
      <label className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><input type="search" aria-label={t('session_search')} placeholder={t('session_search')} value={search} onChange={e=>setSearch(e.target.value)} className="w-full rounded-md border border-input bg-card py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"/></label>
      <div className="flex flex-wrap items-end gap-5">
        <div className="space-y-2"><p className="text-xs font-semibold text-muted-foreground">{t('session_timing')}</p><div className="flex flex-wrap gap-2" role="group" aria-label={t('session_timing')}>{(['all','upcoming','past'] as const).map(value=><Button key={value} variant={timing===value?'default':'outline'} aria-pressed={timing===value} onClick={()=>setTiming(value)}>{t(value==='all'?'filter_all':value==='upcoming'?'upcoming_tab':'session_past')}</Button>)}</div></div>
        <div className="space-y-2"><p className="text-xs font-semibold text-muted-foreground">{t('session_access_mode')}</p><div className="flex flex-wrap gap-2" role="group" aria-label={t('session_access_mode')}>{(['all','free','paid'] as const).map(value=><Button key={value} variant={price===value?'default':'outline'} aria-pressed={price===value} onClick={()=>setPrice(value)}>{t(value==='all'?'filter_all':value==='free'?'session_free':'session_paid')}</Button>)}</div></div>
        {(search||timing!=='all'||price!=='all')&&<Button variant="ghost" onClick={()=>{setSearch('');setTiming('all');setPrice('all');}}>{t('affiliate_reset')}</Button>}
      </div>
    </div>
    <p aria-live="polite" className="mt-4 text-sm text-muted-foreground">{t('admin_records_count')}: {sessions.length}</p>
    <div className="live-class-grid mt-4 grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">{sessions.map(s=><article key={s.id} className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-card"><LiveClassThumbnail title={s.title} thumbnailUrl={s.thumbnail_url}/><div className="flex flex-1 flex-col gap-3 p-4"><h2 className="break-words font-semibold"><Link to="/live/$classId" params={{classId:s.id}} className="hover:text-primary">{s.title}</Link></h2><p className="flex items-start gap-2 text-sm text-muted-foreground"><Calendar className="h-4 w-4 shrink-0"/>{new Intl.DateTimeFormat(lang==='hi'?'hi-IN':'en-IN',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Kolkata'}).format(new Date(s.starts_at))}</p><SessionPurchase session={s}/></div></article>)}</div>
    {!sessions.length&&<p className="py-10 text-center text-muted-foreground">{t('session_empty')}</p>}
  </section>;
}