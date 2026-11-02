export type RangeKey = 'today' | 'week' | 'month' | 'all' | 'custom';
type Order = { id?: string; course_id: string; user_id: string; amount: number; status: string; provider_reference: string | null; created_at: string };
type Data = {
  orders: Order[]; users: { id: string; created_at: string; account_status: string }[];
  courses: { status: string }[]; enrollments: { user_id: string; progress: number; course_id: string }[];
  commissions: { user_id: string; order_id: string; amount: number; created_at: string }[];
  payouts: { amount: number; status: string }[];
};
const DAY = 86_400_000;
/** Sums values per calendar day (YYYY-MM-DD), sorted ascending. */
export function dailyCounts(items: { at: string; v: number }[]) {
  const m: Record<string, number> = {};
  items.forEach(i => { const k = i.at.slice(0, 10); m[k] = (m[k] ?? 0) + i.v; });
  return Object.entries(m).sort().map(([label, value]) => ({ label, value }));
}
export function rangeBounds(range: RangeKey, now: Date, from = '', to = '') {
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(now.getTime() + 1);
  if (range === 'today') return { start: startOfDay, end, prevStart: new Date(startOfDay.getTime() - DAY) };
  if (range === 'week') { const s = new Date(startOfDay.getTime() - ((startOfDay.getDay() + 6) % 7) * DAY); return { start: s, end, prevStart: new Date(s.getTime() - 7 * DAY) }; }
  if (range === 'month') { const s = new Date(now.getFullYear(), now.getMonth(), 1); return { start: s, end, prevStart: new Date(now.getFullYear(), now.getMonth() - 1, 1) }; }
  if (range === 'custom' && from) {
    const s = new Date(`${from}T00:00:00`); const e = to ? new Date(new Date(`${to}T00:00:00`).getTime() + DAY) : end;
    return { start: s, end: e, prevStart: new Date(s.getTime() - (e.getTime() - s.getTime())) };
  }
  return { start: new Date(0), end, prevStart: null as Date | null };
}
/** Only verified (paid + gateway reference) orders count as sales. */
export const isVerifiedSale = (o: Order) => o.status === 'paid' && !!o.provider_reference;
export function summarize(d: Data, start: Date, end: Date) {
  const inRange = (iso: string) => { const t = new Date(iso).getTime(); return t >= start.getTime() && t < end.getTime(); };
  const orders = d.orders.filter(o => inRange(o.created_at));
  const paid = orders.filter(isVerifiedSale);
  const gross = paid.reduce((n, o) => n + o.amount, 0);
  const refunds = orders.filter(o => o.status === 'refunded').reduce((n, o) => n + o.amount, 0);
  const comms = d.commissions.filter(c => inRange(c.created_at));
  const commission = comms.reduce((n, c) => n + c.amount, 0);
  const statusCounts = { paid: 0, pending: 0, failed: 0, refunded: 0 } as Record<'paid'|'pending'|'failed'|'refunded', number>;
  orders.forEach(o => { if (o.status in statusCounts) statusCounts[o.status as 'paid']++; });
  const byCourse: Record<string, number> = {}; paid.forEach(o => { byCourse[o.course_id] = (byCourse[o.course_id] ?? 0) + o.amount; });
  const byDay: Record<string, number> = {}; paid.forEach(o => { const k = o.created_at.slice(0, 10); byDay[k] = (byDay[k] ?? 0) + o.amount; });
  const byAff: Record<string, number> = {}; comms.forEach(c => { byAff[c.user_id] = (byAff[c.user_id] ?? 0) + c.amount; });
  const refOrderIds = new Set(comms.map(c => c.order_id));
  const activeIds = new Set(d.users.filter(u => u.account_status === 'active').map(u => u.id));
  const enrolledUsers = new Set(d.enrollments.map(e => e.user_id));
  return {
    gross, refunds, commission, net: gross - refunds - commission,
    pendingPayouts: d.payouts.filter(p => p.status === 'pending').reduce((n, p) => n + p.amount, 0),
    reviewedPayouts: d.payouts.filter(p => p.status === 'reviewed').reduce((n, p) => n + p.amount, 0),
    pendingPayoutCount: d.payouts.filter(p => p.status === 'pending').length,
    newMembers: d.users.filter(u => inRange(u.created_at)).length,
    activeStudents: [...enrolledUsers].filter(id => activeIds.has(id)).length,
    inactive: d.users.filter(u => u.account_status !== 'active').length,
    publishedCourses: d.courses.filter(c => c.status === 'published').length,
    completions: d.enrollments.filter(e => e.progress >= 100).length,
    statusCounts,
    topCourses: Object.entries(byCourse).map(([id, amount]) => ({ id, amount })).sort((a, b) => b.amount - a.amount),
    topAffiliates: Object.entries(byAff).map(([id, amount]) => ({ id, amount })).sort((a, b) => b.amount - a.amount).slice(0, 5),
    referralSales: paid.filter(o => refOrderIds.has(o.id ?? '')).reduce((n, o) => n + o.amount, 0),
    conversion: enrolledUsers.size ? Math.round(new Set(paid.map(o => o.user_id)).size / enrolledUsers.size * 100) : 0,
    trend: Object.entries(byDay).sort().map(([label, amount]) => ({ label, amount })),
    signupTrend: dailyCounts(d.users.filter(u => inRange(u.created_at)).map(u => ({ at: u.created_at, v: 1 }))),
    commissionTrend: dailyCounts(comms.map(c => ({ at: c.created_at, v: c.amount }))),
    enrollmentsByCourse: Object.entries(d.enrollments.reduce<Record<string, number>>((m, e) => { m[e.course_id] = (m[e.course_id] ?? 0) + 1; return m; }, {}))
      .map(([id, count]) => ({ id, count })).sort((a, b) => b.count - a.count).slice(0, 8),
  };
}
