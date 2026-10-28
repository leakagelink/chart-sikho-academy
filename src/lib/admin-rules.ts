import { z } from 'zod';

export const adminSections = ['overview','users','categories','builder','courses','lessons','videos','classes','webinars','ebooks','bookings','orders','payments','affiliates','commissions','payouts','notifications','reports','settings','quizzes','questions','certificates','progress','reviews','pricing','coupons','refunds','invoices','abandoned','instructors','roles','verification','blocked','bulk','refsettings','reflinks','teamtree','commrules','ranks','bonuses','fraud'] as const;
export type AdminSection = typeof adminSections[number];
export const adminChangeSchema = z.object({
  resource: z.enum(['categories','modules','courses','lessons','classes','ebooks','bookings','users','notifications','payouts','settings','quizzes','questions','certificates','reviews','coupons','refunds','invoices','abandoned','instructors','roles','verification','ranks','bonuses']),
  id: z.string().uuid().optional(),
  values: z.record(z.union([z.string().max(2000), z.number().finite(), z.boolean(), z.null()])),
});
export function requireAdminRole(isAdmin: boolean) { if (!isAdmin) throw new Error('Forbidden'); }
export function safeHttps(value: string) { if (!value) return ''; const url = new URL(value); if (url.protocol !== 'https:' || url.username || url.password) throw new Error('HTTPS required'); return url.toString(); }
export function financeActionAllowed(action: string) { return action === 'reviewed' || action === 'rejected'; }
export type PublishCheck = { title: string; description: string; price: number; sale_price: number | null; modules: { id: string }[]; lessons: { module_id: string | null; video_url: string; resource_path: string }[] };
/** Returns the failed checks; a course may be published only when this is empty. */
export function coursePublishIssues(c: PublishCheck) {
  const issues: ('title'|'description'|'modules'|'lessons'|'empty_module'|'lesson_content'|'sale_price')[] = [];
  if (c.title.trim().length < 2) issues.push('title');
  if (c.description.trim().length < 20) issues.push('description');
  if (!c.modules.length) issues.push('modules');
  if (!c.lessons.length) issues.push('lessons');
  if (c.modules.some(m => !c.lessons.some(l => l.module_id === m.id))) issues.push('empty_module');
  if (c.lessons.some(l => !l.video_url && !l.resource_path)) issues.push('lesson_content');
  if (c.sale_price !== null && c.sale_price >= c.price) issues.push('sale_price');
  return issues;
}

export type QuizAnswer = { correct: string; chosen: string | null; marks: number };
/** Scores a quiz attempt: correct adds marks, wrong subtracts negative marks, unanswered is 0; score never below 0. */
export function quizScore(answers: QuizAnswer[], negative: number, passPercent: number) {
  const total = answers.reduce((a, q) => a + q.marks, 0);
  const raw = answers.reduce((a, q) => a + (q.chosen === null ? 0 : q.chosen === q.correct ? q.marks : -negative), 0);
  const score = Math.max(0, Math.round(raw * 100) / 100);
  const percent = total ? Math.round((score / total) * 10000) / 100 : 0;
  return { score, total, percent, passed: percent >= passPercent };
}
/** Certificate IDs look like CS-2026-AB12CD. */
export function makeCertificateNo(year: number, rand: string) { return `CS-${year}-${rand.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 6).padEnd(6, '0')}`; }

/** GST invoice totals: tax is rounded to whole rupees and added to the subtotal. */
export function invoiceTotals(subtotal: number, gstRate: number) {
  const gst = Math.round(subtotal * gstRate / 100);
  return { gstAmount: gst, total: subtotal + gst };
}
/** Invoice numbers look like INV-2026-AB12CD. */
export function makeInvoiceNo(year: number, rand: string) { return `INV-${year}-${rand.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 6).padEnd(6, '0')}`; }

export type CouponCheck = { kind: 'percent' | 'flat'; value: number; min_order: number; max_uses: number | null; used_count: number; active: boolean; expires_at: string | null };
/** Returns the rupee discount for an order total, or 0 when the coupon cannot be used. Percent coupons cap at 90%. */
export function couponDiscount(c: CouponCheck, orderTotal: number, now: Date = new Date()) {
  if (!c.active || orderTotal < c.min_order) return 0;
  if (c.expires_at && new Date(c.expires_at).getTime() < now.getTime()) return 0;
  if (c.max_uses !== null && c.used_count >= c.max_uses) return 0;
  const raw = c.kind === 'percent' ? Math.floor(orderTotal * Math.min(c.value, 90) / 100) : c.value;
  return Math.min(raw, orderTotal);
}

export type ReferralPair = { referrer_id: string; referred_id: string };
export type CommissionRow = { user_id: string; order_id: string; amount: number };
export type OrderRow = { id: string; amount: number; status: string; provider_reference: string | null };
export type FraudFlag = { kind: 'self_referral' | 'duplicate_pair' | 'commission_exceeds_sale' | 'unverified_sale_commission'; detail: string };
/** Flags suspicious referral and commission patterns for admin review. */
export function fraudFlags(rels: ReferralPair[], commissions: CommissionRow[], orders: OrderRow[]): FraudFlag[] {
  const flags: FraudFlag[] = [];
  for (const r of rels) if (r.referrer_id === r.referred_id) flags.push({ kind: 'self_referral', detail: r.referrer_id });
  const seen = new Set<string>();
  for (const r of rels) { const k = `${r.referrer_id}:${r.referred_id}`; if (seen.has(k)) flags.push({ kind: 'duplicate_pair', detail: k }); seen.add(k); }
  const orderMap = new Map(orders.map(o => [o.id, o]));
  for (const c of commissions) {
    const o = orderMap.get(c.order_id);
    if (!o || o.status !== 'paid' || !o.provider_reference) flags.push({ kind: 'unverified_sale_commission', detail: c.order_id });
    else if (c.amount > o.amount) flags.push({ kind: 'commission_exceeds_sale', detail: c.order_id });
  }
  return flags;
}
