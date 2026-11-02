import { useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { CircleCheck, Pencil, Search, Users, Wallet, Clock, BadgeCheck, Undo2, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLang, type DictKey } from '@/lib/i18n';
import { changeAdminRecord, releaseDueCommissions, type getAdminData } from '@/lib/admin.functions';
import { canAccess } from '@/lib/admin-permissions';
import { commissionSummary, teamStats } from '@/lib/admin-rules';

type AdminData = Awaited<ReturnType<typeof getAdminData>>;
const inputCls = 'w-full min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm';
const levelsText = (v: unknown, fallback: string) => Array.isArray(v) ? v.join(',') : fallback;

/** Referral overview: members, team, commission ledger totals and top referrers. */
export function ReferralDashboard({ data }: { data: AdminData }) {
  const { t } = useLang();
  const cur = data.settings[0]?.commission_currency === 'USD' ? '$' : '₹';
  const sum = commissionSummary(data.commissions);
  const referrers = [...new Set(data.affiliates.map(a => a.referrer_id))];
  const payoutPending = data.payouts.filter(p => p.status === 'pending').reduce((a, p) => a + p.amount, 0);
  const top = referrers.map(id => ({ id, ...teamStats(id, data.affiliates), earned: data.commissions.filter(c => c.user_id === id && ['approved', 'paid'].includes(c.status)).reduce((a, c) => a + c.amount, 0) }))
    .sort((a, b) => b.earned - a.earned || b.total - a.total).slice(0, 5);
  const name = (id: string) => data.users.find(u => u.id === id)?.full_name ?? id.slice(0, 8);
  const cards: { icon: typeof Users; label: DictKey; value: string }[] = [
    { icon: Users, label: 'admin_ref_affiliates', value: String(referrers.length) },
    { icon: Users, label: 'admin_ref_members', value: String(new Set(data.affiliates.map(a => a.referred_id)).size) },
    { icon: Clock, label: 'admin_comm_pending', value: `${cur}${sum.pending}` },
    { icon: BadgeCheck, label: 'admin_comm_approved', value: `${cur}${sum.approved}` },
    { icon: Wallet, label: 'admin_comm_paid', value: `${cur}${sum.paid}` },
    { icon: Undo2, label: 'admin_comm_reversed', value: `${cur}${sum.reversed}` },
    { icon: Receipt, label: 'admin_comm_tds', value: `${cur}${sum.tds}` },
    { icon: Wallet, label: 'admin_payout_pending_total', value: `${cur}${payoutPending}` },
  ];
  return <section className="mb-6 space-y-4">
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{cards.map(c => <div key={c.label} className="rounded-lg border border-border p-3"><div className="flex items-center gap-2 text-xs text-muted-foreground"><c.icon size={14} />{t(c.label)}</div><p className="mt-1 font-display text-xl font-bold">{c.value}</p></div>)}</div>
    <div className="rounded-lg border border-border p-3"><p className="mb-2 text-sm font-semibold">{t('admin_top_referrers')}</p>{top.length ? <ol className="space-y-1 text-sm">{top.map((r, i) => <li key={r.id} className="flex flex-wrap justify-between gap-2 border-b border-border py-1 last:border-0"><span>{i + 1}. {name(r.id)}</span><span className="text-muted-foreground">{t('admin_direct_members')} {r.direct} · {t('admin_total_members')} {r.total} · {cur}{r.earned}</span></li>)}</ol> : <p className="text-sm text-muted-foreground">{t('admin_empty')}</p>}</div>
  </section>;
}

/** Release button for the Commissions ledger (automatic approval after holding period). */
export function ReleaseCommissions({ data }: { data: AdminData }) {
  const { t } = useLang(); const qc = useQueryClient(); const fn = useServerFn(releaseDueCommissions);
  const m = useMutation({ mutationFn: () => fn(), onSuccess: () => qc.invalidateQueries({ queryKey: ['real-admin'] }) });
  if (!canAccess(data.access, 'commissions', 'edit')) return null;
  return <div className="mb-4 flex flex-wrap items-center gap-3"><Button variant="outline" size="sm" disabled={m.isPending} onClick={() => m.mutate()}><CircleCheck size={14} />{t('admin_release_due')}</Button>{m.data && <span className="text-sm text-muted-foreground">{t('admin_released')}: {m.data.released}</span>}{m.error && <span className="text-sm text-destructive">{m.error.message}</span>}<span className="text-xs text-muted-foreground">{t(data.settings[0]?.approval_mode === 'manual' ? 'admin_manual_note' : 'admin_auto_note')}</span></div>;
}

type F = { key: string; label: DictKey; type: 'number' | 'bool' | 'text' | 'select'; options?: string[] };
const groups: { title: DictKey; fields: F[] }[] = [
  { title: 'admin_cr_withdrawal', fields: [{ key: 'min_withdrawal', label: 'admin_cr_min_withdrawal', type: 'number' }, { key: 'max_withdrawal', label: 'admin_cr_max_withdrawal', type: 'number' }, { key: 'max_withdrawals_per_month', label: 'admin_cr_per_month', type: 'number' }, { key: 'payout_cycle', label: 'admin_cr_cycle', type: 'select', options: ['weekly', 'monthly'] }, { key: 'kyc_required', label: 'admin_cr_kyc', type: 'bool' }, { key: 'tds_percent', label: 'admin_cr_tds', type: 'number' }] },
  { title: 'admin_cr_calc', fields: [{ key: 'commission_type', label: 'admin_cr_type', type: 'select', options: ['percent', 'fixed'] }, { key: 'ref_levels', label: 'admin_cr_pct_levels', type: 'text' }, { key: 'ref_fixed_levels', label: 'admin_cr_fixed_levels', type: 'text' }, { key: 'commission_base', label: 'admin_cr_base', type: 'select', options: ['net', 'after_tax'] }, { key: 'commission_currency', label: 'admin_cr_currency', type: 'select', options: ['INR', 'USD'] }, { key: 'repurchase_enabled', label: 'admin_cr_repurchase', type: 'bool' }, { key: 'self_purchase_block', label: 'admin_cr_self', type: 'bool' }] },
  { title: 'admin_cr_release', fields: [{ key: 'approval_mode', label: 'admin_cr_approval', type: 'select', options: ['auto', 'manual'] }, { key: 'holding_days', label: 'admin_cr_holding', type: 'number' }, { key: 'hold_suspended', label: 'admin_cr_hold_suspended', type: 'bool' }] },
  { title: 'admin_cr_influencer', fields: [{ key: 'influencer_enabled', label: 'admin_cr_inf_enabled', type: 'bool' }, { key: 'influencer_type', label: 'admin_cr_type', type: 'select', options: ['percent', 'fixed'] }, { key: 'influencer_value', label: 'admin_cr_inf_value', type: 'number' }] },
];
const conditions: DictKey[] = ['admin_cc_success', 'admin_cc_verify', 'admin_cc_genuine', 'admin_cc_signup', 'admin_cc_cancel', 'admin_cc_refund', 'admin_cc_duplicate', 'admin_cc_selfref', 'admin_cc_suspended', 'admin_cc_kyc'];

/** Editable commission rules, enforced conditions and influencer selection. */
export function CommissionRules({ data }: { data: AdminData }) {
  const { t } = useLang(); const qc = useQueryClient(); const save = useServerFn(changeAdminRecord);
  const s0 = data.settings[0] as Record<string, unknown> | undefined;
  const canEdit = canAccess(data.access, 'commrules', 'edit');
  const initial = () => Object.fromEntries(groups.flatMap(g => g.fields).map(f => [f.key, f.key === 'ref_levels' ? levelsText(s0?.['ref_levels'], '10,5,2') : f.key === 'ref_fixed_levels' ? levelsText(s0?.['ref_fixed_levels'], '100,50,20') : String(s0?.[f.key] ?? '')]));
  const [form, setForm] = useState<Record<string, string> | null>(null);
  const [q, setQ] = useState('');
  const m = useMutation({ mutationFn: (values: Record<string, string>) => save({ data: { resource: 'commrules', id: String(s0?.['id'] ?? ''), values } }), onSuccess: async () => { await qc.invalidateQueries({ queryKey: ['real-admin'] }); setForm(null); } });
  const inf = useMutation({ mutationFn: (v: { user_id: string; on: boolean }) => save({ data: { resource: 'influencers', id: v.user_id, values: v } }), onSuccess: () => qc.invalidateQueries({ queryKey: ['real-admin'] }) });
  const infSet = new Set(data.influencers.map(i => i.user_id));
  const users = useMemo(() => data.users.filter(u => (u.full_name ?? '').toLowerCase().includes(q.toLowerCase()) || (u.referral_code ?? '').toLowerCase().includes(q.toLowerCase())).slice(0, 50), [data.users, q]);
  const show = (f: F) => { const v = f.key === 'ref_levels' || f.key === 'ref_fixed_levels' ? initial()[f.key] : String(s0?.[f.key] ?? '—'); return f.type === 'bool' ? t(v === 'true' ? 'admin_yes' : 'admin_no') : f.type === 'select' ? t(`admin_opt_${v}` as DictKey) : v; };
  function submit(e: FormEvent) { e.preventDefault(); if (form) m.mutate(form); }
  if (!s0) return <p className="border-y border-border py-10 text-center text-muted-foreground">{t('admin_empty')}</p>;
  return <div className="space-y-6">
    <p className="text-sm text-muted-foreground">{t('admin_comm_rules_note')}</p>
    <form onSubmit={submit} className="space-y-5">
      <div className="flex flex-wrap gap-2">{canEdit && !form && <Button type="button" variant="outline" onClick={() => setForm(initial())}><Pencil size={14} />{t('admin_edit')}</Button>}{form && <><Button type="submit" disabled={m.isPending}>{t('admin_save')}</Button><Button type="button" variant="ghost" onClick={() => setForm(null)}>{t('admin_cancel')}</Button></>}{m.error && <span className="self-center text-sm text-destructive">{m.error.message}</span>}</div>
      {groups.map(g => <fieldset key={g.title} className="rounded-lg border border-border p-4"><legend className="px-1 font-display font-semibold">{t(g.title)}</legend><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{g.fields.map(f => <label key={f.key} className="block text-sm"><span className="text-muted-foreground">{t(f.label)}</span>{form ? f.type === 'bool' ? <select value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} className={`${inputCls} mt-1`}><option value="true">{t('admin_yes')}</option><option value="false">{t('admin_no')}</option></select> : f.type === 'select' ? <select value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} className={`${inputCls} mt-1`}>{f.options!.map(o => <option key={o} value={o}>{t(`admin_opt_${o}` as DictKey)}</option>)}</select> : <input type={f.type === 'number' ? 'number' : 'text'} step="any" min={0} required value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} className={`${inputCls} mt-1`} /> : <span className="mt-1 block font-semibold">{show(f)}</span>}</label>)}</div></fieldset>)}
    </form>
    <section className="rounded-lg border border-border p-4"><h3 className="mb-3 font-display font-semibold">{t('admin_cc_title')}</h3><ul className="grid gap-2 sm:grid-cols-2">{conditions.map(c => <li key={c} className="flex items-start gap-2 text-sm"><CircleCheck size={16} className="mt-0.5 shrink-0 text-primary" />{t(c)}</li>)}</ul></section>
    <section className="rounded-lg border border-border p-4"><h3 className="mb-1 font-display font-semibold">{t('admin_cr_influencer_list')}</h3><p className="mb-3 text-xs text-muted-foreground">{t('admin_cr_influencer_hint')} ({infSet.size})</p>
      <label className="relative mb-3 block"><Search className="absolute left-3 top-2.5 text-muted-foreground" size={16} /><input aria-label={t('admin_search')} placeholder={t('admin_search')} value={q} onChange={e => setQ(e.target.value)} className={`${inputCls} pl-9`} /></label>
      <ul className="max-h-72 space-y-1 overflow-y-auto">{users.map(u => <li key={u.id}><label className="flex items-center gap-2 text-sm"><input type="checkbox" disabled={!canEdit || inf.isPending} checked={infSet.has(u.id)} onChange={e => inf.mutate({ user_id: u.id, on: e.target.checked })} />{u.full_name ?? u.id.slice(0, 8)}{u.referral_code && <span className="font-mono text-xs text-muted-foreground">{u.referral_code}</span>}</label></li>)}</ul>
    </section>
  </div>;
}
