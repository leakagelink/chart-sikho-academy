import { z } from 'zod';

export const adminSections = ['overview','users','categories','builder','courses','lessons','videos','classes','webinars','ebooks','orders','payments','affiliates','commissions','payouts','notifications','settings','quizzes','questions','certificates','progress','reviews','pricing','coupons','refunds','invoices','instructors','roles','verification','blocked','bulk','refsettings','reflinks','teamtree','commrules','ranks','bonuses','fraud','templates','announcements','tickets','banners','campaigns','leads','seo','promocodes','maintenance'] as const;
export type AdminSection = typeof adminSections[number];
export const adminDeleteResources = ['courses', 'lessons', 'videos', 'categories', 'classes', 'webinars', 'ebooks', 'quizzes', 'questions'] as const;
export type AdminDeleteResource = typeof adminDeleteResources[number];
export function deleteResourceForSection(section: string): AdminDeleteResource | null {
  return adminDeleteResources.find(resource => resource === section) ?? null;
}
export const adminDeleteSchema = z.object({ resource: z.enum(adminDeleteResources), id: z.string().uuid() });
/** Video Library removal clears video sources without deleting the lesson or its PDF. */
export function videoRemovalValues(resourcePath: string) {
  return { video_url: '', resource_path: /\.(mp4|webm)$/i.test(resourcePath) ? '' : resourcePath };
}
export const adminChangeSchema = z.object({
  resource: z.enum(['categories','modules','courses','lessons','classes','ebooks','users','notifications','payouts','settings','quizzes','questions','certificates','reviews','coupons','refunds','invoices','instructors','roles','verification','ranks','bonuses','templates','announcements','tickets','banners','campaigns','leads','seo','promocodes','maintenance','commrules','commissions','influencers']),
  id: z.string().uuid().optional(),
  values: z.record(z.union([z.string().max(700000), z.number().finite(), z.boolean(), z.null()])).superRefine((values, ctx) => {
    for (const [key, value] of Object.entries(values)) {
      if (typeof value === 'string' && value.length > 2000 && !['thumbnail_url', 'icon_url', 'logo_url', 'cover_url'].includes(key)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: [key], message: 'Text exceeds 2000 characters' });
      }
    }
  }),
});
export function requireAdminRole(isAdmin: boolean) { if (!isAdmin) throw new Error('Forbidden'); }
export function safeHttps(value: string) { if (!value) return ''; const url = new URL(value); if (url.protocol !== 'https:' || url.username || url.password) throw new Error('HTTPS required'); return url.toString(); }
export const liveClassSchema = z.object({
  title: z.string().trim().min(2).max(120), kind: z.enum(['class','webinar']), starts_at: z.string().datetime(),
  youtube_url: z.string().max(2000).transform(safeHttps).refine(v => !v || ['youtube.com','www.youtube.com','youtu.be'].includes(new URL(v).hostname)),
  jitsi_url: z.string().max(2000).transform(safeHttps), status: z.enum(['draft','scheduled','cancelled']),
  category_slug: z.string().max(40).default(''),
  course_id: z.union([z.literal('').transform(() => null), z.null(), z.string().uuid()]).default(null),
  module_id: z.union([z.literal('').transform(() => null), z.null(), z.string().uuid()]).default(null),
  completion_state: z.enum(['pending','completed']).default('pending'),
  recording_url: z.string().max(2000).transform(safeHttps).default(''),
}).superRefine((v, ctx) => {
  if (v.completion_state === 'completed' && (!v.course_id || !v.module_id || !v.recording_url || v.status !== 'scheduled')) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Completed class requires course module and recording' });
  }
});
export function financeActionAllowed(action: string) { return action === 'reviewed' || action === 'rejected'; }
export type RankRow = { name: string; min_sales: number; position: number };
/** Total paid order amount (₹) placed by users this user directly referred. */
export function referralSalesTotal(userId: string, affiliates: { referrer_id: string; referred_id: string }[], orders: { user_id: string; status: string; amount: number }[]) {
  const referred = new Set(affiliates.filter(a => a.referrer_id === userId).map(a => a.referred_id));
  return orders.filter(o => o.status === 'paid' && referred.has(o.user_id)).reduce((sum, o) => sum + Number(o.amount || 0), 0);
}
/** Highest-threshold rank the user's referral sales reach; null when none qualifies. */
export function rankFor(userId: string, ranks: RankRow[], affiliates: { referrer_id: string; referred_id: string }[], orders: { user_id: string; status: string; amount: number }[]) {
  const sales = referralSalesTotal(userId, affiliates, orders);
  return [...ranks].sort((a, b) => b.min_sales - a.min_sales).find(r => sales >= r.min_sales) ?? null;
}
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
/** Certificates are issued automatically at 80% or more (8 of 10) on the course's final quiz; the database function submit_course_quiz enforces it. */
export const CERTIFICATE_MIN_PERCENT = 80;
export function earnsCertificate(percent: number) { return percent >= CERTIFICATE_MIN_PERCENT; }
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
/** Direct referrals and whole downline size (all levels) for a referrer; cycle-safe. */
export function teamStats(userId: string, affiliates: { referrer_id: string; referred_id: string }[]) {
  const kids = new Map<string, string[]>();
  affiliates.forEach(a => { const l = kids.get(a.referrer_id) ?? []; l.push(a.referred_id); kids.set(a.referrer_id, l); });
  const direct = new Set(kids.get(userId) ?? []).size;
  const seen = new Set<string>([userId]);
  const stack = [...(kids.get(userId) ?? [])];
  while (stack.length) { const id = stack.pop()!; if (seen.has(id)) continue; seen.add(id); stack.push(...(kids.get(id) ?? [])); }
  return { direct, total: seen.size - 1 };
}
/** Ledger totals by commission status; TDS counts only on approved/paid entries. */
export function commissionSummary(rows: { amount: number; status: string; tds_amount?: number }[]) {
  const by = (s: string) => rows.filter(r => r.status === s).reduce((a, r) => a + Number(r.amount || 0), 0);
  return { pending: by('pending'), approved: by('approved'), paid: by('paid'), reversed: by('reversed'), rejected: by('rejected'), tds: rows.filter(r => r.status === 'approved' || r.status === 'paid').reduce((a, r) => a + Number(r.tds_amount || 0), 0) };
}
