import type { ReactNode } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { ArrowLeft } from 'lucide-react';
import { getAdminUserDetail } from '@/lib/admin-user.functions';
import { useLang, type DictKey } from '@/lib/i18n';
import { pageMeta } from '@/lib/route-meta';

export const Route = createFileRoute('/_authenticated/admin/user/$userId')({
  head: () => pageMeta('Admin user profile', 'Full student profile, courses and purchase history for administrators.'),
  component: Screen,
});

const fmt = (d?: string | null) => (d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—');
const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

function Section({ title, children, empty }: { title: string; children: ReactNode; empty: boolean }) {
  const { t } = useLang();
  return <section className="rounded-lg border border-border bg-card p-4"><h2 className="mb-3 font-heading text-lg font-bold">{title}</h2>{empty ? <p className="text-sm text-muted-foreground">{t('up_none')}</p> : children}</section>;
}
function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-muted-foreground">{head.map(h => <th key={h} className="py-1 pr-3 font-medium">{h}</th>)}</tr></thead><tbody>{rows.map((r, i) => <tr key={i} className="border-t border-border">{r.map((c, j) => <td key={j} className="py-2 pr-3 align-top">{c}</td>)}</tr>)}</tbody></table></div>;
}

function Screen() {
  const { userId } = Route.useParams();
  const { t } = useLang();
  const fetchUser = useServerFn(getAdminUserDetail);
  const q = useQuery({ queryKey: ['admin-user', userId], queryFn: () => fetchUser({ data: { userId } }) });
  const back = <Link to="/admin/$section" params={{ section: 'users' }} search={{ q: '', status: 'all', cat: 'all', when: 'all', rank: 'all' }} className="inline-flex items-center gap-1 text-sm text-primary"><ArrowLeft size={16} />{t('up_back')}</Link>;
  if (q.isLoading) return <main className="mx-auto max-w-6xl p-4">{back}<p className="mt-6 text-muted-foreground">…</p></main>;
  if (q.error || !q.data) return <main className="mx-auto max-w-6xl p-4">{back}<p className="mt-6">{t('up_not_found')}</p></main>;
  const d = q.data; const p = d.profile;
  const course = (id: string) => d.courses.find(c => c.id === id)?.title ?? id;
  const name = (id: string) => d.names.find(n => n.id === id)?.full_name || id.slice(0, 8);
  const paid = d.orders.filter(o => o.status === 'paid').reduce((a, o) => a + o.amount, 0);
  const info: [DictKey, ReactNode][] = [
    ['up_email', d.email || '—'], ['up_phone', p.phone || '—'], ['up_location', [p.city, p.state].filter(Boolean).join(', ') || '—'],
    ['up_joined', fmt(p.created_at)], ['up_last_login', fmt(d.lastSignIn)], ['up_status', p.account_status],
    ['up_verify', p.verification_status], ['up_roles', d.roles.join(', ') || 'user'], ['up_language', p.preferred_language],
    ['up_ref_code', p.referral_code || '—'],
    ['up_referred_by', d.referredBy ? <Link to="/admin/user/$userId" params={{ userId: d.referredBy.id }} className="text-primary underline">{name(d.referredBy.id)} · {fmt(d.referredBy.at)}</Link> : t('up_direct')],
    ['up_total_paid', inr(paid)],
  ];
  return <main className="mx-auto max-w-6xl space-y-4 p-4">
    {back}
    <header><p className="text-sm text-muted-foreground">{t('up_title')}</p><h1 className="font-heading text-2xl font-bold">{p.full_name || d.email || p.id}</h1></header>
    <dl className="grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-3">{info.map(([k, v]) => <div key={k}><dt className="text-xs text-muted-foreground">{t(k)}</dt><dd className="font-semibold break-words">{v}</dd></div>)}</dl>
    <Section title={`${t('up_courses')} (${d.enrollments.length})`} empty={!d.enrollments.length}>
      <Table head={['Course', t('up_enrolled_on'), t('up_progress'), 'Updated']} rows={d.enrollments.map(e => [course(e.course_id), fmt(e.created_at), `${e.progress}%`, fmt(e.updated_at)])} />
    </Section>
    <Section title={`${t('up_orders')} (${d.orders.length})`} empty={!d.orders.length}>
      <Table head={['Order', 'Course', 'Amount', 'Status', 'Reference', 'Date']} rows={d.orders.map(o => [o.id.slice(0, 8), course(o.course_id), inr(o.amount), o.status, o.provider_reference || '—', fmt(o.created_at)])} />
    </Section>
    <Section title={`${t('up_certificates')} (${d.certificates.length})`} empty={!d.certificates.length}>
      <Table head={['No.', 'Course', 'Status', 'Issued']} rows={d.certificates.map(c => [<Link key="c" to="/verify/$certificateNo" params={{ certificateNo: c.certificate_no }} className="text-primary underline">{c.certificate_no}</Link>, course(c.course_id), c.status, fmt(c.issued_at)])} />
    </Section>
    <Section title={`${t('up_quiz')} (${d.attempts.length})`} empty={!d.attempts.length}>
      <Table head={['Course', 'Score', '%', 'Result', 'Date']} rows={d.attempts.map(a => [a.course_id ? course(a.course_id) : '—', `${a.score}/${a.total}`, `${Math.round(Number(a.percent))}%`, a.passed ? '✓' : '✗', fmt(a.created_at)])} />
    </Section>
    <Section title={`${t('up_team')} (${d.team.length})`} empty={!d.team.length}>
      <Table head={['User', 'Joined']} rows={d.team.map(m => [<Link key="m" to="/admin/user/$userId" params={{ userId: m.id }} className="text-primary underline">{name(m.id)}</Link>, fmt(m.at)])} />
    </Section>
    <Section title={t('up_earnings')} empty={!d.commissions.length && !d.bonuses.length && !d.payouts.length}>
      <Table head={['Type', 'Amount', 'Status / note', 'Date']} rows={[
        ...d.commissions.map(c => ['Commission', inr(c.amount), c.order_id.slice(0, 8), fmt(c.created_at)]),
        ...d.bonuses.map(b => ['Bonus', inr(b.amount), `${b.status} ${b.reason}`, fmt(b.created_at)]),
        ...d.payouts.map(x => ['Payout', inr(x.amount), x.status, fmt(x.created_at)]),
      ]} />
    </Section>
    <Section title={t('up_other')} empty={!d.refunds.length && !d.tickets.length && !d.reviews.length}>
      <Table head={['Type', 'Detail', 'Status', 'Date']} rows={[
        ...d.refunds.map(r => ['Refund', `${inr(r.amount)} — ${r.reason}`, r.status, fmt(r.created_at)]),
        ...d.tickets.map(x => ['Ticket', x.subject, x.status, fmt(x.created_at)]),
        ...d.reviews.map(r => ['Review', `${course(r.course_id)} — ${'★'.repeat(r.rating)} ${r.comment}`, r.status, fmt(r.created_at)]),
      ]} />
    </Section>
  </main>;
}
