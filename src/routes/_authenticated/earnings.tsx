import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { studentWalletOptions } from '@/lib/student-wallet';
import { payoutTotals, uniquePayments } from '@/lib/wallet-rules';
import { PayoutDetails } from '@/components/site/PayoutDetails';

export const Route = createFileRoute("/_authenticated/earnings")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "My Earnings — Chartसीखो" },
      { name: "description", content: "Referral commissions, wallet balance and withdrawals on Chartसीखो." },
      { property: "og:title", content: "My Earnings — Chartसीखो" },
      { property: "og:description", content: "Referral commissions, wallet balance and withdrawals on Chartसीखो." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(studentWalletOptions(context.user.id)),
  component: EarningsPage,
});

function EarningsPage() {
  const { t, lang } = useLang();
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const { data } = useSuspenseQuery(studentWalletOptions(user.id));
  const [amount, setAmount] = useState('');
  const [tab, setTab] = useState('all');
  const [page, setPage] = useState(0);
  const refresh = () => qc.invalidateQueries({ queryKey: ['student-wallet', user.id] });
  const req = useMutation({
    mutationFn: async (n: number) => { const r = await supabase.rpc('request_payout', { _amount: n }); if (r.error) throw new Error(r.error.message); },
    onSuccess: async () => { setAmount(''); await refresh(); },
  });
  const w = data.wallet;
  const money = (n: number, currency = w.currency) => new Intl.NumberFormat(lang === 'hi' ? 'hi-IN' : 'en-IN', { style: 'currency', currency: currency === 'USD' ? 'USD' : 'INR', maximumFractionDigits: 0 }).format(n);
  const totals = payoutTotals(data.payouts);
  const earned = data.commissions.filter(c => ['approved','paid'].includes(c.status)).reduce((n,c) => n+c.amount-c.tds_amount,0);
  function status(s: string) {
    if (s === 'pending') return t('pending'); if (s === 'approved') return t('admin_approved');
    if (s === 'paid') return t('paid'); if (s === 'reviewed') return t('wallet_reviewed');
    if (s === 'rejected') return t('admin_rejected'); if (s === 'reversed') return t('wallet_reversed');
    if (s === 'failed') return t('wallet_failed'); if (s === 'refunded') return t('admin_refunded'); return s;
  }
  function destination(snapshot: unknown) {
    if (!snapshot || typeof snapshot !== 'object') return t('wallet_none');
    const d = snapshot as Record<string,unknown>;
    return d.method === 'upi' ? `${t('wallet_upi')} · ${String(d.upi_id || '')}` : `${String(d.bank_name || '')} · •••• ${String(d.account_number || '').slice(-4)}`;
  }
  type Activity = { id: string; type: string; amount: number; currency: string; status: string; date: string; reference: string; extra?: string };
  const activity: Activity[] = [
    ...data.commissions.map(c => ({ id:c.id, type:'commission',amount:c.amount, currency:c.currency,status:c.status,date:c.created_at,reference:`${t('admin_level')} ${c.level} · ${c.order_id}`,extra:`${t('admin_comm_tds')}: ${money(c.tds_amount,c.currency)} · ${t('wallet_available')}: ${money(c.amount-c.tds_amount,c.currency)}${c.on_hold ? ' · '+t('wallet_on_hold') : ''}${c.status === 'pending' ? ' · '+new Date(c.release_at).toLocaleDateString(lang==='hi'?'hi-IN':'en-IN') : ''}` })),
    ...data.payouts.map(p => ({ id:p.id,type:'withdrawal',amount:p.amount,currency:w.currency,status:p.status,date:p.created_at,reference:destination(p.destination_snapshot),extra:p.id })),
    ...data.payments.map(p => ({ id:p.id,type:'payment',amount:p.amount,currency:'INR',status:p.status,date:p.created_at,reference:`UTR: ${p.utr} · ${p.course_id}`,extra:p.admin_note })),
    ...uniquePayments(data.orders,data.payments).map(o => ({ id:o.id,type:'payment',amount:o.amount,currency:'INR',status:o.status,date:o.created_at,reference:o.provider_reference || o.id,extra:o.course_id })),
    ...data.bonuses.map(b => ({ id:b.id,type:'bonus',amount:b.amount,currency:'INR',status:b.status,date:b.created_at,reference:b.reason })),
    ...data.refunds.map(r => ({ id:r.id,type:'refund',amount:r.amount,currency:'INR',status:r.status,date:r.created_at,reference:r.reason,extra:r.order_id })),
  ].sort((a,b) => b.date.localeCompare(a.date));
  const filtered = activity.filter(a => tab === 'all' || a.type === tab);
  const rows = filtered.slice(page*20,(page+1)*20);
  const label = (type: string) => type==='commission' ? t('wallet_commission') : type==='withdrawal' ? t('wallet_withdrawal') : type==='payment' ? t('wallet_payment') : type==='bonus' ? t('wallet_bonus') : t('wallet_refund');
  const ready = data.preferences && data.preferences.preferred_method !== 'none';
  return <main className="min-w-0 w-full px-4 py-8">
    <h1 className="font-display text-3xl font-bold">{t('wallet_title')}</h1>
    <div className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-3">
      {[[t('wallet_total_earned'),earned],[t('wallet_available'),w.available],[t('wallet_pending'),w.pending],[t('wallet_paid_out'),totals.paid],[t('wallet_processing'),totals.processing],[t('admin_comm_tds'),w.tds]].map(([label,v]) => <div key={String(label)} className="min-w-0 border-l-2 border-primary py-2 pl-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 break-words font-display text-2xl font-bold">{money(Number(v))}</p></div>)}
    </div>
    <div className="my-8 grid min-w-0 gap-8 xl:grid-cols-2">
      <PayoutDetails value={data.preferences} onSaved={refresh} />
      <section className="min-w-0 border-t border-border pt-6"><form onSubmit={e => { e.preventDefault(); const n=Number(amount); if (Number.isInteger(n) && n>0) req.mutate(n); }}>
        <h2 className="font-display text-xl font-semibold">{t('wallet_request')}</h2>
        <p className="mt-3 text-xs text-muted-foreground">{t('wallet_limits')}: {money(w.min)} – {money(w.max)} · {w.requests_this_month}/{w.per_month}</p>
        {w.kyc_required && w.kyc !== 'verified' && <p className="mt-3 text-sm text-destructive">{t('wallet_kyc_needed')}</p>}
        {!ready && <p className="mt-3 text-sm text-muted-foreground">{t('wallet_details_needed')}</p>}
        <div className="mt-4 flex flex-wrap gap-3"><input aria-label={t('amount')} type="number" step="1" min={w.min} max={Math.min(w.max,w.available)} required value={amount} onChange={e => setAmount(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm sm:w-40" /><Button disabled={!ready || req.isPending || w.available<w.min || (w.kyc_required && w.kyc!=='verified')} type="submit"><ArrowUpRight className="h-4 w-4" />{t('wallet_request')}</Button></div>
        {req.error && <p role="alert" className="mt-3 text-sm text-destructive">{req.error.message}</p>}{req.isSuccess && <p role="status" className="mt-3 text-sm text-success">{t('wallet_sent')}</p>}
        <p className="mt-4 text-xs text-muted-foreground">{t('wallet_transfer_disabled')}</p>
      </form></section>
    </div>
    <section className="min-w-0 border-t border-border pt-6"><h2 className="font-display text-xl font-semibold">{t('wallet_activity')}</h2>
      <div className="my-4 flex flex-wrap gap-2">{[['all',t('wallet_activity')],['commission',t('wallet_ledger')],['payment',t('wallet_payments')],['withdrawal',t('wallet_withdrawal')],['bonus',t('wallet_bonus')],['refund',t('wallet_refund')],['deposit',t('wallet_deposits')]].map(([key,text]) => <Button key={key} variant={tab===key?'default':'outline'} size="sm" aria-pressed={tab===key} onClick={() => {setTab(key);setPage(0);}}>{text}</Button>)}</div>
      {tab==='deposit' ? <p className="py-6 text-sm text-muted-foreground">{t('wallet_deposits_unavailable')}</p> : <>
        <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm"><thead className="border-y border-border bg-muted/40"><tr>{[t('admin_date'),t('wallet_type'),t('amount'),t('status'),t('wallet_reference')].map(h => <th key={h} className="px-3 py-3">{h}</th>)}</tr></thead><tbody>{rows.length ? rows.map(a => <tr key={`${a.type}-${a.id}`} className="border-b border-border"><td className="whitespace-nowrap px-3 py-3">{new Date(a.date).toLocaleString(lang==='hi'?'hi-IN':'en-IN')}</td><td className="px-3 py-3">{label(a.type)}</td><td className="whitespace-nowrap px-3 py-3 font-semibold">{money(a.amount,a.currency)}</td><td className="px-3 py-3">{status(a.status)}</td><td className="max-w-80 break-words px-3 py-3"><span>{a.reference}</span>{a.extra && <p className="mt-1 break-all text-xs text-muted-foreground">{a.extra}</p>}</td></tr>) : <tr><td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">{t('wallet_no_activity')}</td></tr>}</tbody></table></div>
        <div className="mt-4 flex items-center justify-end gap-3"><Button variant="outline" size="icon" disabled={page===0} aria-label={t('wallet_previous')} title={t('wallet_previous')} onClick={() => setPage(page-1)}><ChevronLeft className="h-4 w-4" /></Button><span className="text-xs text-muted-foreground">{page+1} / {Math.max(1,Math.ceil(filtered.length/20))}</span><Button variant="outline" size="icon" disabled={(page+1)*20>=filtered.length} aria-label={t('wallet_next')} title={t('wallet_next')} onClick={() => setPage(page+1)}><ChevronRight className="h-4 w-4" /></Button></div>
      </>}
    </section>
    <p className="mt-8 text-xs text-muted-foreground">{t('admin_real_commission')}</p>
  </main>;
}
