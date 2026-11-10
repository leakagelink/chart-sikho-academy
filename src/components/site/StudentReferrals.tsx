import { Link } from '@tanstack/react-router';
import { useSuspenseQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Copy, Share2, GitBranch, Users, Wallet, LayoutDashboard, Crown, RotateCcw, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useLang } from '@/lib/i18n';
import { studentReferralsOptions } from '@/lib/student-referrals';
import { emptyAffiliateFilters, filterAffiliateRows, type AffiliateFilters } from '@/lib/affiliate-filters';
import { referralSignupLink } from '@/lib/signup-referral';
import { StudentTeamTree } from './StudentTeamTree';

export function StudentReferrals({ userId, mode }: { userId: string; mode: 'tree' | 'team' | 'dashboard' }) {
  const { t, lang } = useLang();
  const qc = useQueryClient();
  const { data } = useSuspenseQuery(studentReferralsOptions(userId));
  const [filters, setFilters] = useState<AffiliateFilters>(emptyAffiliateFilters);
  const [tab, setTab] = useState(mode === 'dashboard' ? 'commissions' : 'team');
  const [page,setPage] = useState(0);
  const [refreshing,setRefreshing] = useState(false);
  const code = data.profile?.short_referral_code || data.profile?.referral_code;
  const referralLink = code ? referralSignupLink(code) : '';
  const copy = async (value: string) => { try { await navigator.clipboard.writeText(value); toast.success(t('copied')); } catch { toast.error(t('admin_error')); } };
  const share = async () => {
    if (!referralLink) return;
    try { if (navigator.share) await navigator.share({ title: 'Chartसीखो', url: referralLink }); else await copy(referralLink); }
    catch (error) { if (!(error instanceof Error && error.name === 'AbortError')) await copy(referralLink); }
  };
  const members = filterAffiliateRows(data.members, {...filters,status:'all'}, m => `${m.full_name || ''} ${m.member_code || ""} ${m.referred_id}`);
  const commissions = filterAffiliateRows(data.commissions, filters, c => `${c.id} ${c.order_id}`);
  const money = (n: number, currency=data.wallet.currency) => new Intl.NumberFormat(lang==='hi'?'hi-IN':'en-IN',{style:'currency',currency:currency==='USD'?'USD':'INR',maximumFractionDigits:0}).format(n);
  const approved = data.commissions.filter(c=>['approved','paid'].includes(c.status)).reduce((n,c)=>n+c.amount-c.tds_amount,0);
  const sales = new Set(data.commissions.filter(c=>!['rejected','reversed'].includes(c.status)).map(c=>c.order_id)).size;
  const levels = [...new Set([1,...data.commissions.map(c=>c.level)])].sort((a,b)=>a-b);
  const teamLevels = [...new Set(data.members.map(m=>m.level))].sort((a,b)=>a-b);
  const change = (key: keyof AffiliateFilters,value:string) => {setFilters({...filters,[key]:value});setPage(0);};
  const input = 'mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm';
  const status = (s:string) => s==='pending'?t('pending'):s==='approved'?t('admin_approved'):s==='paid'?t('paid'):s==='rejected'?t('admin_rejected'):s==='reversed'?t('wallet_reversed'):s;
  const count = tab==='team'?members.length:commissions.length;
  return <main className="min-w-0 w-full px-4 py-8">
    <div className="flex items-center justify-between gap-3"><h1 className="font-display text-3xl font-bold">{t(mode==='dashboard'?'affiliate_dashboard':mode==='tree'?'student_referral_tree':'student_team')}</h1><Button variant="outline" size="icon" disabled={refreshing} title={t('affiliate_refresh')} aria-label={t('affiliate_refresh')} onClick={async()=>{setRefreshing(true);try{await qc.invalidateQueries({queryKey:['student-referrals',userId]});}finally{setRefreshing(false);}}}><RefreshCw className="h-4 w-4" /></Button></div>
    <nav className="mt-5 flex flex-wrap gap-2">{[
      {to:'/affiliate',icon:LayoutDashboard,label:t('affiliate_overview')},{to:'/referrals',icon:GitBranch,label:t('student_referral_tree')},{to:'/team',icon:Users,label:t('student_team')},{to:'/earnings',icon:Wallet,label:t('wallet')},{to:'/plans',icon:Crown,label:t('student_plans')},
    ].map(({to,icon:Icon,label})=><Button key={to} asChild variant="outline" size="sm"><Link to={to}><Icon className="h-4 w-4" />{label}</Link></Button>)}</nav>
    {mode !== 'tree' && <div className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-3">{[[t('affiliate_team_total'),String(data.members.length)],[t('affiliate_sales'),String(sales)],[t('affiliate_net'),money(approved)],[t('wallet_available'),money(data.wallet.available)],[t('wallet_pending'),money(data.wallet.pending)],[t('wallet_withdrawn'),money(data.wallet.withdrawn)]].map(([label,value])=><div key={label} className="min-w-0 border-l-2 border-primary py-2 pl-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 break-words font-display text-2xl font-bold">{value}</p></div>)}</div>}
    <div className="mt-6 flex items-center gap-3 border-y border-border py-4"><div className="min-w-0 flex-1"><p className="text-xs text-muted-foreground">{t('admin_ref_code')}</p><p className="break-all font-mono font-semibold">{code || t('student_code_missing')}</p></div>{code && <Button variant="outline" size="icon" title={t('copy')} aria-label={t('copy')} onClick={async()=>{try{await navigator.clipboard.writeText(code);toast.success(t('copied'));}catch{toast.error(t('admin_error'));}}}><Copy className="h-4 w-4" /></Button>}</div>
    <p className="mt-3 text-xs text-muted-foreground">{t('affiliate_scope')}</p>
    {referralLink && <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 border-b border-border pb-4">
      <label className="min-w-0 text-xs text-muted-foreground">{t('student_referral_link')}<input aria-label={t('student_referral_link')} readOnly value={referralLink} onFocus={e=>e.currentTarget.select()} className={input} /></label>
      <div className="flex shrink-0 gap-2"><Button variant="outline" size="icon" aria-label={t('student_copy_referral_link')} title={t('student_copy_referral_link')} onClick={()=>copy(referralLink)}><Copy className="h-4 w-4" /></Button><Button variant="outline" size="icon" aria-label={t('student_share_referral_link')} title={t('student_share_referral_link')} onClick={share}><Share2 className="h-4 w-4" /></Button></div>
    </div>}
    {mode === 'tree' ? <StudentTeamTree userId={userId} name={data.profile?.full_name || t('you')} code={code || ''} members={data.members} earnings={approved} available={data.wallet.available} currency={data.wallet.currency}/> : <section className="mt-6 min-w-0">
      <div className="flex gap-2"><Button variant={tab==='team'?'default':'outline'} onClick={()=>{setTab('team');setPage(0);setFilters({...filters,status:'all',level:'all'});}}><Users className="h-4 w-4" />{t('student_team')}</Button><Button variant={tab==='commissions'?'default':'outline'} onClick={()=>{setTab('commissions');setPage(0);}}>{t('affiliate_commissions')}</Button></div>
      <div className="mt-4 grid items-end gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <label className="text-xs">{t('affiliate_search')}<input aria-label={t('affiliate_search')} className={input} value={filters.search} onChange={e=>change('search',e.target.value)} /></label>
        <label className="text-xs">{t('affiliate_from')}<input aria-label={t('affiliate_from')} type="date" className={input} value={filters.from} onChange={e=>change('from',e.target.value)} /></label>
        <label className="text-xs">{t('affiliate_to')}<input aria-label={t('affiliate_to')} type="date" min={filters.from} className={input} value={filters.to} onChange={e=>change('to',e.target.value)} /></label>
        <label className="text-xs">{t('affiliate_sort')}<select aria-label={t('affiliate_sort')} className={input} value={filters.sort} onChange={e=>change('sort',e.target.value)}><option value="newest">{t('affiliate_newest')}</option><option value="oldest">{t('affiliate_oldest')}</option></select></label>
        {tab==='team' && <label className="text-xs">{t('admin_level')}<select aria-label={t('admin_level')} className={input} value={filters.level} onChange={e=>change('level',e.target.value)}><option value="all">{t('affiliate_all')}</option>{teamLevels.map(l=><option key={l} value={l}>{l}</option>)}</select></label>}
        {tab==='commissions' && <><label className="text-xs">{t('status')}<select aria-label={t('status')} className={input} value={filters.status} onChange={e=>change('status',e.target.value)}><option value="all">{t('affiliate_all')}</option>{['pending','approved','paid','rejected','reversed'].map(s=><option key={s} value={s}>{status(s)}</option>)}</select></label><label className="text-xs">{t('admin_level')}<select aria-label={t('admin_level')} className={input} value={filters.level} onChange={e=>change('level',e.target.value)}><option value="all">{t('affiliate_all')}</option>{levels.map(l=><option key={l} value={l}>{l}</option>)}</select></label></>}
        <Button variant="outline" title={t('affiliate_reset')} aria-label={t('affiliate_reset')} onClick={()=>{setFilters(emptyAffiliateFilters);setPage(0);}}><RotateCcw className="h-4 w-4" />{t('affiliate_reset')}</Button>
      </div>
      <p role="status" className="my-4 text-sm text-muted-foreground">{t('affiliate_results')}: {count}</p>
      {!count ? <p className="py-8 text-center text-muted-foreground">{t('wallet_no_activity')}</p> : <div className="overflow-x-auto"><table className="w-full min-w-[600px] text-left text-sm"><thead className="border-y border-border bg-muted/40"><tr>{(tab==='team'?[t('admin_name_label'),t('student_member_id'),t('admin_level'),t('up_joined')]:[t('admin_date'),t('wallet_reference'),t('admin_level'),t('affiliate_gross'),t('admin_comm_tds'),t('affiliate_net_column'),t('status')]).map(h=><th key={h} className="p-3">{h}</th>)}</tr></thead><tbody>{tab==='team'?members.slice(page*20,page*20+20).map(m=><tr key={m.id} className="border-b border-border"><td className="break-words p-3 font-semibold">{m.full_name?.trim() || '—'}</td><td className="break-all p-3 font-mono">{m.member_code || m.referred_id}</td><td className="p-3">{m.level}</td><td className="p-3">{new Date(m.created_at).toLocaleDateString(lang==='hi'?'hi-IN':'en-IN')}</td></tr>):commissions.slice(page*20,page*20+20).map(c=><tr key={c.id} className="border-b border-border"><td className="p-3">{new Date(c.created_at).toLocaleDateString(lang==='hi'?'hi-IN':'en-IN')}</td><td className="break-all p-3 text-xs">{c.order_id}</td><td className="p-3">{c.level}</td><td className="whitespace-nowrap p-3">{money(c.amount,c.currency)}</td><td className="whitespace-nowrap p-3">{money(c.tds_amount,c.currency)}</td><td className="whitespace-nowrap p-3 font-semibold">{money(c.amount-c.tds_amount,c.currency)}</td><td className="p-3">{status(c.status)}{c.on_hold && <p className="text-xs">{t('wallet_on_hold')}</p>}</td></tr>)}</tbody></table></div>}
      <div className="mt-4 flex items-center justify-end gap-3"><Button variant="outline" size="icon" aria-label={t('wallet_previous')} title={t('wallet_previous')} disabled={page===0} onClick={()=>setPage(page-1)}><ChevronLeft className="h-4 w-4" /></Button><span className="text-xs">{page+1} / {Math.max(1,Math.ceil(count/20))}</span><Button variant="outline" size="icon" aria-label={t('wallet_next')} title={t('wallet_next')} disabled={(page+1)*20>=count} onClick={()=>setPage(page+1)}><ChevronRight className="h-4 w-4" /></Button></div>
    </section>}
    <p className="mt-8 text-xs text-muted-foreground">{t('admin_real_commission')}</p>
  </main>;
}
