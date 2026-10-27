import { z } from 'zod';

export const adminSections = ['overview','users','categories','builder','courses','lessons','videos','classes','webinars','ebooks','bookings','orders','payments','affiliates','commissions','payouts','notifications','reports','settings','quizzes','questions','certificates','progress','reviews'] as const;
export type AdminSection = typeof adminSections[number];
export const adminChangeSchema = z.object({
  resource: z.enum(['categories','modules','courses','lessons','classes','ebooks','bookings','users','notifications','payouts','settings','quizzes','questions','certificates','reviews']),
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
