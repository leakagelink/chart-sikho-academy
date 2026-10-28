import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { adminChangeSchema, requireAdminRole, safeHttps, coursePublishIssues, makeCertificateNo, makeInvoiceNo, invoiceTotals } from './admin-rules';

export const getAdminData = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const s = context.supabase;
  const role = await s.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
  requireAdminRole(!role.error && role.data === true);
  const results = await Promise.all([
    s.from('profiles').select('*').order('created_at', { ascending: false }).limit(1000),
    s.from('courses').select('*').order('created_at', { ascending: false }).limit(1000),
    s.from('course_lessons').select('*').order('position').limit(1000),
    s.from('class_sessions').select('*').order('starts_at', { ascending: false }).limit(1000),
    s.from('ebooks').select('*').order('created_at', { ascending: false }).limit(1000),
    s.from('demo_bookings').select('*').order('created_at', { ascending: false }).limit(1000),
    s.from('enrollments').select('*').limit(1000),
    s.from('orders').select('*').order('created_at', { ascending: false }).limit(1000),
    s.from('referral_relationships').select('*').limit(1000),
    s.from('commission_entries').select('*').order('created_at', { ascending: false }).limit(1000),
    s.from('payout_requests').select('*').order('created_at', { ascending: false }).limit(1000),
    s.from('notification_campaigns').select('*').order('created_at', { ascending: false }).limit(1000),
    s.from('admin_settings').select('*').limit(1),
    s.from('admin_audit_log').select('*').order('created_at', { ascending: false }).limit(100),
    s.from('course_categories').select('*').order('position'),
    s.from('course_modules').select('*').order('position').limit(1000),
    s.from('quizzes').select('*').order('created_at', { ascending: false }).limit(1000),
    s.from('quiz_questions').select('*').order('created_at', { ascending: false }).limit(1000),
    s.from('certificates').select('*').order('issued_at', { ascending: false }).limit(1000),
    s.from('course_reviews').select('*').order('created_at', { ascending: false }).limit(1000),
    s.from('coupons').select('*').order('created_at', { ascending: false }).limit(1000),
    s.from('refund_requests').select('*').order('created_at', { ascending: false }).limit(1000),
    s.from('invoices').select('*').order('issued_at', { ascending: false }).limit(1000),
    s.from('abandoned_checkouts').select('*').order('created_at', { ascending: false }).limit(1000),
  ]);
  if (results.some(r => r.error)) throw new Error('Unable to load administration records');
  const [users,courses,lessons,classes,ebooks,bookings,enrollments,orders,affiliates,commissions,payouts,notifications,settings,audit,categories,modules,quizzes,questions,certificates,reviews,coupons,refunds,invoices,abandoned] = results;
  return { users: users.data ?? [], courses: courses.data ?? [], lessons: lessons.data ?? [], classes: classes.data ?? [], ebooks: ebooks.data ?? [], bookings: bookings.data ?? [], enrollments: enrollments.data ?? [], orders: orders.data ?? [], affiliates: affiliates.data ?? [], commissions: commissions.data ?? [], payouts: payouts.data ?? [], notifications: notifications.data ?? [], settings: settings.data ?? [], audit: audit.data ?? [], categories: categories.data ?? [], modules: modules.data ?? [], quizzes: quizzes.data ?? [], questions: questions.data ?? [], certificates: certificates.data ?? [], reviews: reviews.data ?? [], coupons: coupons.data ?? [], refunds: refunds.data ?? [], invoices: invoices.data ?? [], abandoned: abandoned.data ?? [], capped: results.some(r => (r.data?.length ?? 0) >= 1000) };
});

const title = z.string().trim().min(2).max(120);
const price = z.coerce.number().int().min(0).max(1000000);
const url = z.string().max(2000).transform(safeHttps);
const path = z.string().max(300).refine(v => !v.includes('..') && !v.startsWith('/'));
export const changeAdminRecord = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(input => adminChangeSchema.parse(input)).handler(async ({ context, data }) => {
  const s = context.supabase;
  const role = await s.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
  requireAdminRole(!role.error && role.data === true);
  const v = data.values;
  let result;
  switch (data.resource) {
    case 'categories': {
      const row = z.object({ name: title, slug: z.string().trim().regex(/^[a-z0-9-]{2,40}$/), position: z.coerce.number().int().min(1).max(1000) }).parse(v);
      result = data.id ? await s.from('course_categories').update(row).eq('id',data.id).select('id').single() : await s.from('course_categories').insert(row).select('id').single(); break;
    }
    case 'modules': {
      const row = z.object({ title, course_id: z.string().uuid(), position: z.coerce.number().int().min(1).max(10000), drip_days: z.coerce.number().int().min(0).max(3650) }).parse(v);
      result = data.id ? await s.from('course_modules').update(row).eq('id',data.id).select('id').single() : await s.from('course_modules').insert(row).select('id').single(); break;
    }
    case 'courses': {
      const row = z.object({ title, price, category: z.string().regex(/^[a-z0-9-]{2,40}$/), status: z.enum(['draft','published']), description: z.string().max(2000).default(''), thumbnail_url: url.default(''), instructor: z.string().max(120).default(''), objectives: z.string().max(2000).default(''), sale_price: z.union([z.literal('').transform(() => null), z.null(), price]).default(null), access_type: z.enum(['lifetime','fixed']).default('lifetime'), access_days: z.coerce.number().int().min(0).max(3650).default(0) }).parse(v);
      const cat = await s.from('course_categories').select('id').eq('slug',row.category).maybeSingle();
      if (!cat.data) throw new Error('Unknown category');
      if (row.status === 'published') {
        if (!data.id) throw new Error('Save as draft and build the curriculum before publishing');
        const [m,l] = await Promise.all([s.from('course_modules').select('id').eq('course_id',data.id), s.from('course_lessons').select('module_id,video_url,resource_path').eq('course_id',data.id)]);
        const issues = coursePublishIssues({ ...row, modules: m.data ?? [], lessons: l.data ?? [] });
        if (issues.length) throw new Error(`Cannot publish: ${issues.join(', ')}`);
      }
      result = data.id ? await s.from('courses').update({ ...row, updated_at: new Date().toISOString() }).eq('id',data.id).select('id').single() : await s.from('courses').insert(row).select('id').single(); break;
    }
    case 'lessons': {
      const row = z.object({ title, course_id: z.string().uuid(), module_id: z.union([z.literal('').transform(() => null), z.null(), z.string().uuid()]).default(null), position: z.coerce.number().int().min(1).max(10000), video_url: url, resource_path: path, duration_minutes: z.coerce.number().int().min(0).max(1000).default(0), is_preview: z.union([z.boolean(), z.enum(['true','false']).transform(x => x === 'true')]).default(false), allow_download: z.union([z.boolean(), z.enum(['true','false']).transform(x => x === 'true')]).default(false) }).parse(v);
      result = data.id ? await s.from('course_lessons').update(row).eq('id',data.id).select('id').single() : await s.from('course_lessons').insert(row).select('id').single(); break;
    }
    case 'classes': {
      const row = z.object({ title, kind: z.enum(['class','webinar']), starts_at: z.string().datetime(), youtube_url: url.refine(v => !v || ['youtube.com','www.youtube.com','youtu.be'].includes(new URL(v).hostname)), jitsi_url: url, status: z.enum(['draft','scheduled','cancelled']) }).parse(v);
      result = data.id ? await s.from('class_sessions').update(row).eq('id',data.id).select('id').single() : await s.from('class_sessions').insert(row).select('id').single(); break;
    }
    case 'ebooks': {
      const row = z.object({ title, price, resource_path: path, status: z.enum(['draft','published']) }).parse(v);
      result = data.id ? await s.from('ebooks').update(row).eq('id',data.id).select('id').single() : await s.from('ebooks').insert(row).select('id').single(); break;
    }
    case 'bookings': {
      if (!data.id) throw new Error('Record required');
      const row = z.object({ status: z.enum(['pending','confirmed','cancelled']) }).parse(v);
      result = await s.from('demo_bookings').update(row).eq('id',data.id).select('id').single(); break;
    }
    case 'users': {
      if (!data.id || data.id === context.userId) throw new Error('Cannot change your own access');
      const row = z.object({ account_status: z.enum(['active','paused']) }).parse(v);
      result = await s.from('profiles').update(row).eq('id',data.id).select('id').single(); break;
    }
    case 'notifications': {
      const row = z.object({ title, message: z.string().trim().min(2).max(1000), audience: z.string().min(1).max(200).refine(v => v === 'all' || /^(city|state|user|course):.+$/.test(v)), status: z.enum(['draft','published']) }).parse(v);
      result = data.id ? await s.from('notification_campaigns').update(row).eq('id',data.id).eq('status','draft').select('id').single() : await s.from('notification_campaigns').insert({ ...row, created_by: context.userId }).select('id').single(); break;
    }
    case 'payouts': {
      if (!data.id) throw new Error('Record required');
      const row = z.object({ status: z.enum(['reviewed','rejected']) }).parse(v);
      result = await s.from('payout_requests').update(row).eq('id',data.id).eq('status','pending').select('id').single(); break;
    }
    case 'quizzes': {
      const row = z.object({ title, course_id: z.union([z.literal('').transform(() => null), z.null(), z.string().uuid()]).default(null), time_limit_minutes: z.coerce.number().int().min(1).max(300), pass_percent: z.coerce.number().int().min(0).max(100), negative_marks: z.coerce.number().min(0).max(10), max_attempts: z.coerce.number().int().min(1).max(50), status: z.enum(['draft','published']) }).parse(v);
      if (row.status === 'published') {
        if (!data.id) throw new Error('Save as draft first, then add questions');
        const q = await s.from('quiz_questions').select('id', { count: 'exact', head: true }).eq('quiz_id', data.id);
        if (!q.count) throw new Error('Cannot publish: add at least one question');
      }
      result = data.id ? await s.from('quizzes').update(row).eq('id',data.id).select('id').single() : await s.from('quizzes').insert(row).select('id').single(); break;
    }
    case 'questions': {
      const opt = z.string().trim().max(500);
      const row = z.object({ quiz_id: z.union([z.literal('').transform(() => null), z.null(), z.string().uuid()]).default(null), topic: z.string().trim().max(100).default(''), question: z.string().trim().min(3).max(1000), option_a: opt.min(1), option_b: opt.min(1), option_c: opt.default(''), option_d: opt.default(''), correct_option: z.enum(['a','b','c','d']), marks: z.coerce.number().int().min(1).max(100) }).parse(v);
      if (!row[`option_${row.correct_option}`]) throw new Error('Correct option is empty');
      result = data.id ? await s.from('quiz_questions').update(row).eq('id',data.id).select('id').single() : await s.from('quiz_questions').insert(row).select('id').single(); break;
    }
    case 'certificates': {
      if (data.id) { const row = z.object({ status: z.enum(['issued','revoked']) }).parse(v); result = await s.from('certificates').update(row).eq('id',data.id).select('id').single(); break; }
      const row = z.object({ user_id: z.string().uuid(), course_id: z.string().uuid() }).parse(v);
      const en = await s.from('enrollments').select('id').eq('user_id', row.user_id).eq('course_id', row.course_id).maybeSingle();
      if (!en.data) throw new Error('Student is not enrolled in this course');
      const rand = Array.from(crypto.getRandomValues(new Uint8Array(6)), b => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b % 32]).join('');
      result = await s.from('certificates').insert({ ...row, certificate_no: makeCertificateNo(new Date().getFullYear(), rand) }).select('id').single(); break;
    }
    case 'reviews': {
      const row = z.object({ status: z.enum(['pending','approved','hidden']) }).parse(v);
      if (!data.id) throw new Error('Unable to save record');
      result = await s.from('course_reviews').update(row).eq('id',data.id).select('id').single(); break;
    }
    case 'coupons': {
      const row = z.object({ code: z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{3,24}$/), kind: z.enum(['percent','flat']), value: z.coerce.number().int().min(1).max(100000), min_order: z.coerce.number().int().min(0).max(1000000).default(0), max_uses: z.union([z.literal('').transform(() => null), z.null(), z.coerce.number().int().min(1).max(1000000)]).default(null), active: z.union([z.boolean(), z.enum(['true','false']).transform(x => x === 'true')]).default(true), expires_at: z.union([z.literal('').transform(() => null), z.null(), z.string().datetime()]).default(null) }).parse(v);
      if (row.kind === 'percent' && row.value > 90) throw new Error('Percent coupons are capped at 90%');
      result = data.id ? await s.from('coupons').update(row).eq('id',data.id).select('id').single() : await s.from('coupons').insert(row).select('id').single(); break;
    }
    case 'refunds': {
      if (!data.id) throw new Error('Record required');
      const row = z.object({ status: z.enum(['approved','rejected']) }).parse(v);
      result = await s.from('refund_requests').update({ ...row, reviewed_at: new Date().toISOString() }).eq('id',data.id).eq('status','pending').select('id').single(); break;
    }
    case 'invoices': {
      if (data.id) {
        const row = z.object({ status: z.enum(['issued','cancelled']) }).parse(v);
        result = await s.from('invoices').update(row).eq('id',data.id).select('id').single(); break;
      }
      const row = z.object({ order_id: z.string().uuid(), buyer_name: z.string().trim().min(2).max(120), buyer_gstin: z.string().trim().max(15).default(''), subtotal: z.coerce.number().int().min(0).max(10000000), gst_rate: z.coerce.number().int().min(0).max(28).default(18) }).parse(v);
      const order = await s.from('orders').select('id,status,provider_reference').eq('id', row.order_id).maybeSingle();
      if (!order.data || order.data.status !== 'paid' || !order.data.provider_reference) throw new Error('Invoice needs a verified paid order');
      const { gstAmount, total } = invoiceTotals(row.subtotal, row.gst_rate);
      const rand = Array.from(crypto.getRandomValues(new Uint8Array(6)), b => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b % 32]).join('');
      result = await s.from('invoices').insert({ ...row, invoice_no: makeInvoiceNo(new Date().getFullYear(), rand), gst_amount: gstAmount, total }).select('id').single(); break;
    }
    case 'abandoned': {
      if (!data.id) throw new Error('Record required');
      const row = z.object({ status: z.enum(['abandoned','recovered']) }).parse(v);
      result = await s.from('abandoned_checkouts').update(row).eq('id',data.id).select('id').single(); break;
    }
    case 'settings': {
      const row = z.object({ support_email: z.union([z.literal(''),z.string().email().max(200)]), support_phone: z.string().max(30), commission_percent: z.coerce.number().int().min(0).max(100) }).parse(v);
      result = data.id ? await s.from('admin_settings').update({ ...row, updated_at: new Date().toISOString() }).eq('id',data.id).select('id').single() : await s.from('admin_settings').insert(row).select('id').single(); break;
    }
  }
  if (result.error) throw new Error(result.error.code === '23505' ? 'Certificate already issued' : 'Unable to save record');
  return { id: result.data.id };
});

export const getStudentNotifications = createServerFn({ method:'POST' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const r = await context.supabase.from('user_notifications').select('id,read_at,notification_campaigns(title,message)').eq('user_id',context.userId).order('created_at',{ascending:false}).limit(50);
  if (r.error) throw new Error('Unable to load notifications');
  return r.data;
});
async function assertAdmin(s: any, userId: string) { const role = await s.rpc('has_role', { _user_id: userId, _role: 'admin' }); requireAdminRole(!role.error && role.data === true); }

/** Copies a course with its modules and lessons as a new draft. */
export const duplicateCourse = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator((i: { id: string }) => z.object({ id: z.string().uuid() }).parse(i)).handler(async ({ context, data }) => {
  const s = context.supabase; await assertAdmin(s, context.userId);
  const c = await s.from('courses').select('*').eq('id', data.id).single(); if (c.error) throw new Error('Course not found');
  const { id: _i, created_at: _c, updated_at: _u, ...rest } = c.data;
  const copy = await s.from('courses').insert({ ...rest, title: `${rest.title} (copy)`.slice(0, 120), status: 'draft' }).select('id').single(); if (copy.error) throw new Error('Unable to duplicate');
  const [mods, less] = await Promise.all([s.from('course_modules').select('*').eq('course_id', data.id), s.from('course_lessons').select('*').eq('course_id', data.id)]);
  const map: Record<string, string> = {};
  for (const m of mods.data ?? []) { const r = await s.from('course_modules').insert({ course_id: copy.data.id, title: m.title, position: m.position, drip_days: m.drip_days }).select('id').single(); if (r.data) map[m.id] = r.data.id; }
  const lessons = (less.data ?? []).map(({ id: _x, created_at: _y, ...l }) => ({ ...l, course_id: copy.data.id, module_id: l.module_id ? map[l.module_id] ?? null : null }));
  if (lessons.length) { const r = await s.from('course_lessons').insert(lessons); if (r.error) throw new Error('Unable to duplicate lessons'); }
  return { id: copy.data.id };
});

/** Swaps the position of a module or lesson with its neighbour. */
export const moveCurriculumItem = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator((i: { kind: 'modules'|'lessons'; id: string; dir: 'up'|'down' }) => z.object({ kind: z.enum(['modules','lessons']), id: z.string().uuid(), dir: z.enum(['up','down']) }).parse(i)).handler(async ({ context, data }) => {
  const s = context.supabase; await assertAdmin(s, context.userId);
  const table = data.kind === 'modules' ? 'course_modules' : 'course_lessons';
  const item = await s.from(table).select('*').eq('id', data.id).single(); if (item.error) throw new Error('Not found');
  let q: any = s.from(table).select('id,position').eq('course_id', item.data.course_id);
  if (data.kind === 'lessons') { const mid = (item.data as { module_id: string | null }).module_id; q = mid ? q.eq('module_id', mid) : q.is('module_id', null); }
  const siblings: { id: string; position: number }[] = ((await q).data ?? []).sort((a: { id: string; position: number }, b: { id: string; position: number }) => a.position - b.position || a.id.localeCompare(b.id));
  const idx = siblings.findIndex(x => x.id === data.id); const other = siblings[data.dir === 'up' ? idx - 1 : idx + 1];
  if (!other) return { ok: true };
  siblings.forEach((x, i) => { x.position = i + 1; });
  const a = siblings[idx]!; const tmp = a.position; a.position = other.position; other.position = tmp;
  for (const x of siblings) await s.from(table).update({ position: x.position }).eq('id', x.id);
  return { ok: true };
});
