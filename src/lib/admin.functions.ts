import { assertPanelAction, resolvePanelAccess } from './admin-access.server';
import { canAccess, canReadDataset } from './admin-permissions';
import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { adminChangeSchema, adminDeleteSchema, videoRemovalValues, liveClassSchema, requireAdminRole, safeHttps, coursePublishIssues, makeCertificateNo, makeInvoiceNo, invoiceTotals } from './admin-rules';

export const deleteAdminRecord = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(input => adminDeleteSchema.parse(input)).handler(async ({ context, data }) => {
  const s = context.supabase;
  await assertPanelAction(s,context.userId,data.resource,'delete');
  if (data.resource === 'courses') {
    const result = await s.rpc('delete_admin_course', { _course_id: data.id });
    if (result.error) throw new Error(result.error.message.includes('Course has linked records') ? 'Course has linked records' : 'Unable to delete record');
  } else if (data.resource === 'videos') {
    const lesson = await s.from('course_lessons').select('resource_path').eq('id', data.id).single();
    if (lesson.error || !lesson.data) throw new Error('Unable to delete record');
    const result = await s.from('course_lessons').update(videoRemovalValues(lesson.data.resource_path)).eq('id', data.id).select('id').single();
    if (result.error) throw new Error('Unable to delete record');
  } else {
    const result = await s.from('course_lessons').delete().eq('id', data.id).select('id').single();
    if (result.error) throw new Error('Unable to delete record');
  }
  return { ok: true };
});

export const getAdminData = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const s = context.supabase;
  const access = await resolvePanelAccess(s,context.userId);
  if (!access.isAdmin && !access.permissions.some(p=>p.action==='view')) throw new Error('Forbidden');
  async function read<T extends {data:unknown;error:unknown}>(key:string, fetcher:()=>PromiseLike<T>):Promise<T> {
    return canReadDataset(access,key) ? await fetcher() : {data:[],error:null} as T;
  }
  const results = await Promise.all([
    read('users',async()=>{
      const profiles = await s.from('profiles').select('*').order('created_at', { ascending: false }).limit(1000);
      const emails = new Map<string,string>();
      if (access.isAdmin && profiles.data?.length) {
        try {
          const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
          for (let page = 1; page <= 4; page++) {
            const { data } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 500 });
            for (const u of data?.users ?? []) emails.set(u.id, u.email ?? '');
            if ((data?.users?.length ?? 0) < 500) break;
          }
        } catch { /* emails optional */ }
      }
      const data = (profiles.data ?? []).map(p => ({...p, email: emails.get(String(p.id)) ?? ''}));
      return {data,error:profiles.error};
    }),
    read('courses',()=>s.from('courses').select('*').order('created_at', { ascending: false }).limit(1000)),
    read('lessons',()=>s.from('course_lessons').select('*').order('position').limit(1000)),
    read('classes',()=>s.from('class_sessions').select('*').order('starts_at', { ascending: false }).limit(1000)),
    read('ebooks',()=>s.from('ebooks').select('*').order('created_at', { ascending: false }).limit(1000)),
    read('enrollments',()=>s.from('enrollments').select('*').limit(1000)),
    read('orders',async()=>{
      const [orders,profiles]=await Promise.all([
        s.from('orders').select('*').order('created_at', { ascending: false }).limit(1000),
        s.from('profiles').select('id,phone').limit(2000)
      ]);
      const byId=new Map((profiles.data??[]).map(p=>[p.id,p.phone as string|null]));
      const data=(orders.data??[]).map(o=>({...o,phone:byId.get(o.user_id)??null}));
      return {data,error:orders.error??profiles.error};
    }),
    read('affiliates',()=>s.from('referral_relationships').select('*').limit(1000)),
    read('commissions',()=>s.from('commission_entries').select('*').order('created_at', { ascending: false }).limit(1000)),
    read('payouts',async()=>{
      const [payouts,profiles]=await Promise.all([
        s.from('payout_requests').select('*').order('created_at', { ascending: false }).limit(1000),
        s.from('profiles').select('id,phone').limit(2000)
      ]);
      const byId=new Map((profiles.data??[]).map(p=>[p.id,p.phone as string|null]));
      const data=(payouts.data??[]).map(r=>({...r,phone:byId.get(r.user_id)??null}));
      return {data,error:payouts.error??profiles.error};
    }),
    read('notifications',()=>s.from('notification_campaigns').select('*').order('created_at', { ascending: false }).limit(1000)),
    read('settings',()=>s.from('admin_settings').select('*').limit(1)),
    read('audit',()=>s.from('admin_audit_log').select('*').order('created_at', { ascending: false }).limit(100)),
    read('categories',()=>s.from('course_categories').select('*').order('position')),
    read('modules',()=>s.from('course_modules').select('*').order('position').limit(1000)),
    read('quizzes',()=>s.from('quizzes').select('*').order('created_at', { ascending: false }).limit(1000)),
    read('questions',()=>s.from('quiz_questions').select('*').order('created_at', { ascending: false }).limit(1000)),
    read('certificates',()=>s.from('certificates').select('*').order('issued_at', { ascending: false }).limit(1000)),
    read('reviews',()=>s.from('course_reviews').select('*').order('created_at', { ascending: false }).limit(1000)),
    read('coupons',()=>s.from('coupons').select('*').order('created_at', { ascending: false }).limit(1000)),
    read('refunds',async()=>{
      const [refunds,profiles]=await Promise.all([
        s.from('refund_requests').select('*').order('created_at', { ascending: false }).limit(1000),
        s.from('profiles').select('id,phone').limit(2000)
      ]);
      const byId=new Map((profiles.data??[]).map(p=>[p.id,p.phone as string|null]));
      const data=(refunds.data??[]).map(r=>({...r,phone:byId.get(r.user_id)??null}));
      return {data,error:refunds.error??profiles.error};
    }),
    read('invoices',()=>s.from('invoices').select('*').order('issued_at', { ascending: false }).limit(1000)),
    read('instructors',()=>s.from('instructors').select('*').order('created_at', { ascending: false }).limit(1000)),
    read('ranks',()=>s.from('ranks').select('*').order('position').limit(1000)),
    read('bonuses',()=>s.from('bonus_entries').select('*').order('created_at', { ascending: false }).limit(1000)),
    read('userRoles',()=>s.from('user_roles').select('*').limit(1000)),
    read('templates',()=>s.from('message_templates').select('*').order('created_at', { ascending: false }).limit(1000)),
    read('announcements',()=>s.from('announcements').select('*').order('created_at', { ascending: false }).limit(1000)),
    read('tickets',()=>s.from('support_tickets').select('*').order('created_at', { ascending: false }).limit(1000)),
    read('banners',()=>s.from('banners').select('*').order('position').limit(1000)),
    read('campaigns',()=>s.from('campaigns').select('*').order('created_at', { ascending: false }).limit(1000)),
    read('leads',()=>s.from('leads').select('*').order('created_at', { ascending: false }).limit(1000)),
    read('seo',()=>s.from('seo_pages').select('*').order('path').limit(1000)),
    read('promocodes',()=>s.from('promo_codes').select('*').order('created_at', { ascending: false }).limit(1000)),
    read('influencers',()=>s.from('referral_influencers').select('*').limit(1000)),
  ]);
  if (results.some(r => r.error)) throw new Error('Unable to load administration records');
  const [users,courses,lessons,classes,ebooks,enrollments,orders,affiliates,commissions,payouts,notifications,settings,audit,categories,modules,quizzes,questions,certificates,reviews,coupons,refunds,invoices,instructors,ranks,bonuses,userRoles,templates,announcements,tickets,banners,campaigns,leads,seo,promocodes,influencers] = results;
  const grants = access.isAdmin ? await s.from('user_panel_permissions').select('user_id,section,action') : {data:[]};
  return { influencers: (influencers.data ?? []) as {user_id:string}[], access, panelPermissions:(grants.data ?? []) as ({user_id:string}&import('./admin-permissions').PanelPermission)[], users: users.data ?? [], courses: courses.data ?? [], lessons: lessons.data ?? [], classes: (classes.data ?? []).filter(c=>access.isAdmin||canAccess(access,'overview')||canAccess(access,c.kind==='webinar'?'webinars':'classes')), ebooks: ebooks.data ?? [], enrollments: enrollments.data ?? [], orders: orders.data ?? [], affiliates: affiliates.data ?? [], commissions: commissions.data ?? [], payouts: payouts.data ?? [], notifications: notifications.data ?? [], settings: settings.data ?? [], audit: audit.data ?? [], categories: categories.data ?? [], modules: modules.data ?? [], quizzes: quizzes.data ?? [], questions: questions.data ?? [], certificates: certificates.data ?? [], reviews: reviews.data ?? [], coupons: coupons.data ?? [], refunds: refunds.data ?? [], invoices: invoices.data ?? [], instructors: instructors.data ?? [], ranks: ranks.data ?? [], bonuses: bonuses.data ?? [], userRoles: userRoles.data ?? [], templates: templates.data ?? [], announcements: announcements.data ?? [], tickets: tickets.data ?? [], banners: banners.data ?? [], campaigns: campaigns.data ?? [], leads: leads.data ?? [], seo: seo.data ?? [], promocodes: promocodes.data ?? [], capped: results.some(r => (r.data?.length ?? 0) >= 1000) };
});
const title = z.string().trim().min(2).max(120);
const price = z.coerce.number().int().min(0).max(1000000);
const url = z.string().max(2000).transform(safeHttps);
const path = z.string().max(300).refine(v => !v.includes('..') && !v.startsWith('/'));
export const changeAdminRecord = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(input => adminChangeSchema.parse(input)).handler(async ({ context, data }) => {
  const s = context.supabase;
  await assertPanelAction(s,context.userId,data.resource,data.id?'edit':'create');
  if(data.resource==='classes'){const previous=data.id?await s.from('class_sessions').select('kind').eq('id',data.id).single():null;const section=data.values['kind']==='webinar'?'webinars':'classes';const access=await resolvePanelAccess(s,context.userId);if(!canAccess(access,section,data.id?'edit':'create')||(previous?.data&&!canAccess(access,previous.data.kind==='webinar'?'webinars':'classes','edit')))throw new Error('Forbidden');}
  const v = data.values;
  let result;
  switch (data.resource) {
    case 'categories': {
      const row = z.object({ name: title, slug: z.string().trim().toLowerCase().transform(x=>x.replace(/[^a-z0-9-]+/g,"-").replace(/^-+|-+$/g,"")).pipe(z.string().regex(/^[a-z0-9-]{2,40}$/)), position: z.coerce.number().int().min(1).max(1000), icon_url: z.union([z.literal(''), z.string().max(700000).regex(/^data:image\/(png|jpe?g|webp|gif|svg\+xml);base64,/), z.string().url().max(500).startsWith('https://')]).default('') }).parse(v);
      result = data.id ? await s.from('course_categories').update(row).eq('id',data.id).select('id').single() : await s.from('course_categories').insert(row).select('id').single(); break;
    }
    case 'modules': {
      const row = z.object({ title, course_id: z.string().uuid(), position: z.coerce.number().int().min(1).max(10000), drip_days: z.coerce.number().int().min(0).max(3650) }).parse(v);
      result = data.id ? await s.from('course_modules').update(row).eq('id',data.id).select('id').single() : await s.from('course_modules').insert(row).select('id').single(); break;
    }
    case 'courses': {
      const row = z.object({ title, price, category: z.string().regex(/^[a-z0-9-]{2,40}$/), status: z.enum(['draft','published']), description: z.string().max(2000).default(''), thumbnail_url: z.union([z.literal(''), z.string().max(700000).regex(/^data:image\/(png|jpeg|webp|svg\+xml);base64,/), z.string().url().max(500).startsWith('https://')]).default(''), instructor: z.string().max(120).default(''), objectives: z.string().max(2000).default(''), sale_price: z.union([z.literal('').transform(() => null), z.null(), price]).default(null), access_type: z.enum(['lifetime','fixed']).default('lifetime'), access_days: z.coerce.number().int().min(0).max(3650).default(0), final_quiz_id: z.union([z.literal('').transform(() => null), z.null(), z.string().uuid()]).default(null) }).parse(v);
      if (row.final_quiz_id) { const fq = await s.from('quizzes').select('id').eq('id', row.final_quiz_id).maybeSingle(); if (!fq.data) throw new Error('Unknown quiz'); }
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
      const parsed = liveClassSchema.safeParse(v);
      if (!parsed.success) throw new Error('Invalid class recording');
      const row = parsed.data;
      if (row.course_id) {
        const course = await s.from('courses').select('category,status').eq('id', row.course_id).single();
        if (course.error || course.data.category !== row.category_slug) throw new Error('Course category mismatch');
        if (row.completion_state === 'completed' && course.data.status !== 'published') throw new Error('Recording requires published course');
      }
      if (row.module_id) {
        const module = await s.from('course_modules').select('course_id').eq('id', row.module_id).single();
        if (module.error || module.data.course_id !== row.course_id) throw new Error('Module course mismatch');
      }
      result = data.id ? await s.from('class_sessions').update(row).eq('id',data.id).select('id').single() : await s.from('class_sessions').insert(row).select('id').single(); break;
    }
    case 'ebooks': {
      const row = z.object({ title, price, resource_path: path, description: z.string().max(4000).default(''), cover_url: z.union([z.literal(''), z.string().max(700000).regex(/^data:image\/(png|jpe?g|webp);base64,/), z.string().url().max(500).startsWith('https://')]).default(''), status: z.enum(['draft','published']) }).parse(v);
      result = data.id ? await s.from('ebooks').update(row).eq('id',data.id).select('id').single() : await s.from('ebooks').insert(row).select('id').single(); break;
    }
    case 'users': {
      if (!data.id || data.id === context.userId) throw new Error('Cannot change your own access');
      const row = z.object({ account_status: z.enum(['active','paused','blocked']) }).parse(v);
      result = await s.from('profiles').update(row).eq('id',data.id).select('id').single(); break;
    }
    case 'verification': {
      if (!data.id) throw new Error('Record required');
      const row = z.object({ verification_status: z.enum(['unverified','pending','verified','rejected']) }).parse(v);
      result = await s.from('profiles').update(row).eq('id',data.id).select('id').single(); break;
    }
    case 'roles': {
      if (data.id) {
        const target = await s.from('user_roles').select('user_id,role').eq('id', data.id).maybeSingle();
        if (!target.data) throw new Error('Unable to save record');
        if (target.data.user_id === context.userId) throw new Error('Cannot change your own access');
        result = await s.from('user_roles').delete().eq('id', data.id).select('id').single(); break;
      }
      const row = z.object({ user_id: z.string().uuid(), role: z.enum(['admin','instructor','user']) }).parse(v);
      if (row.user_id === context.userId) throw new Error('Cannot change your own access');
      result = await s.from('user_roles').insert(row).select('id').single(); break;
    }
    case 'instructors': {
      const row = z.object({ name: title, expertise: z.string().max(200).default(''), bio: z.string().max(2000).default(''), photo_url: url.default(''), status: z.enum(['active','inactive']).default('active') }).parse(v);
      result = data.id ? await s.from('instructors').update(row).eq('id',data.id).select('id').single() : await s.from('instructors').insert(row).select('id').single(); break;
    }
    case 'ranks': {
      const row = z.object({ name: z.string().trim().min(2).max(60), min_sales: z.coerce.number().int().min(0).max(1000000), bonus_amount: z.coerce.number().int().min(0).max(1000000), position: z.coerce.number().int().min(1).max(1000) }).parse(v);
      result = data.id ? await s.from('ranks').update(row).eq('id',data.id).select('id').single() : await s.from('ranks').insert(row).select('id').single(); break;
    }
    case 'bonuses': {
      if (data.id) {
        const row = z.object({ status: z.enum(['approved','rejected']) }).parse(v);
        result = await s.from('bonus_entries').update(row).eq('id',data.id).eq('status','pending').select('id').single(); break;
      }
      const row = z.object({ user_id: z.string().uuid(), amount: z.coerce.number().int().min(1).max(1000000), reason: z.string().trim().max(500).default('') }).parse(v);
      result = await s.from('bonus_entries').insert(row).select('id').single(); break;
    }
    case 'notifications': {
      const row = z.object({ title, message: z.string().trim().min(2).max(1000), audience: z.string().min(1).max(200).refine(v => v === 'all' || /^(city|state|user|course):.+$/.test(v)), status: z.enum(['draft','published']), image_url: z.union([z.literal(''), z.string().max(700000).regex(/^data:image\/(png|jpeg|webp);base64,/), z.string().url().max(500).startsWith('https://')]).default(''), show_popup: z.union([z.boolean(), z.enum(['true','false']).transform(x => x === 'true')]).default(false) }).parse(v);
      result = data.id ? await s.from('notification_campaigns').update(row).eq('id',data.id).eq('status','draft').select('id').single() : await s.from('notification_campaigns').insert({ ...row, created_by: context.userId }).select('id').single(); break;
    }
    case 'payouts': {
      if (!data.id) throw new Error('Record required');
      const row = z.object({ status: z.enum(['reviewed','rejected']) }).parse(v);
      result = await s.from('payout_requests').update(row).eq('id',data.id).eq('status','pending').select('id').single(); break;
    }
    case 'quizzes': {
      const row = z.object({ title, time_limit_minutes: z.coerce.number().int().min(1).max(300), pass_percent: z.coerce.number().int().min(0).max(100), negative_marks: z.coerce.number().min(0).max(10), max_attempts: z.coerce.number().int().min(1).max(50), status: z.enum(['draft','published']) }).parse(v);
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
    case 'settings': {
      const row = z.object({ support_email: z.union([z.literal(''),z.string().email().max(200)]), support_phone: z.string().max(30), commission_percent: z.coerce.number().int().min(0).max(100), referral_enabled: z.union([z.boolean(), z.enum(['true','false']).transform(x => x === 'true')]).optional(), ref_levels: z.union([z.literal(''), z.string().trim().regex(/^\d+(,\d+)*$/).refine(x => x.split(',').length <= 50, 'Maximum 50 referral levels')]).optional(), ref_level1_percent: z.coerce.number().int().min(0).max(100).optional(), ref_level2_percent: z.coerce.number().int().min(0).max(100).optional(), ref_level3_percent: z.coerce.number().int().min(0).max(100).optional(), logo_url: z.union([z.literal(''), z.string().regex(/^data:image\/(png|jpeg|webp);base64,/).max(700000), z.string().url().max(2000).refine(u => u.startsWith('https://'), 'HTTPS required')]).optional() }).parse(v);
      const { logo_url, referral_enabled, ref_levels, ref_level1_percent, ref_level2_percent, ref_level3_percent, ...rest } = row;
      const levels = ref_levels !== undefined && ref_levels !== '' ? ref_levels.split(',').map(x => Math.min(100, Math.max(0, parseInt(x, 10) || 0))) : null;
      const payload = { ...rest, ...(referral_enabled !== undefined ? { referral_enabled } : {}), ...(levels ? { ref_levels: levels, ref_level1_percent: levels[0], ref_level2_percent: levels[1] ?? 0, ref_level3_percent: levels[2] ?? 0 } : {}), ...(logo_url !== undefined ? { logo_url } : {}) };
      result = data.id ? await s.from('admin_settings').update({ ...payload, updated_at: new Date().toISOString() }).eq('id',data.id).select('id').single() : await s.from('admin_settings').insert(payload).select('id').single(); break;
    }
    case 'commrules': {
      if (!data.id) throw new Error('Record required');
      const bool = z.union([z.boolean(), z.enum(['true','false']).transform(x => x === 'true')]);
      const levels = z.string().trim().regex(/^\d+(\.\d+)?(,\d+(\.\d+)?)*$/).refine(x => x.split(',').length <= 50, 'Maximum 50 levels');
      const row = z.object({ min_withdrawal: z.coerce.number().int().min(0).max(10000000), max_withdrawal: z.coerce.number().int().min(1).max(10000000), max_withdrawals_per_month: z.coerce.number().int().min(1).max(31), repurchase_enabled: bool, commission_type: z.enum(['percent','fixed']), ref_levels: levels, ref_fixed_levels: levels, commission_base: z.enum(['net','after_tax']), commission_currency: z.enum(['INR','USD']), self_purchase_block: bool, influencer_enabled: bool, influencer_type: z.enum(['percent','fixed']), influencer_value: z.coerce.number().min(0).max(1000000), approval_mode: z.enum(['auto','manual']), holding_days: z.coerce.number().int().min(0).max(365), payout_cycle: z.enum(['weekly','monthly']), tds_percent: z.coerce.number().min(0).max(50), kyc_required: bool, hold_suspended: bool }).parse(v);
      if (row.max_withdrawal < row.min_withdrawal) throw new Error('Maximum withdrawal must be at least the minimum');
      if (row.commission_type === 'percent' && row.influencer_type === 'percent' && row.influencer_value > 100) throw new Error('Influencer percent cannot exceed 100');
      const pct = row.ref_levels.split(',').map(Number);
      if (pct.some(x => x > 100)) throw new Error('Level percent cannot exceed 100');
      const fixed = row.ref_fixed_levels.split(',').map(Number);
      result = await s.from('admin_settings').update({ ...row, ref_levels: pct, ref_level1_percent: Math.round(pct[0] ?? 0), ref_level2_percent: Math.round(pct[1] ?? 0), ref_level3_percent: Math.round(pct[2] ?? 0), ref_fixed_levels: fixed, updated_at: new Date().toISOString() }).eq('id',data.id).select('id').single(); break;
    }
    case 'commissions': {
      if (!data.id) throw new Error('Record required');
      const row = z.object({ status: z.enum(['approved','rejected']) }).parse(v);
      result = await s.from('commission_entries').update(row).eq('id',data.id).eq('status','pending').select('id').single(); break;
    }
    case 'influencers': {
      const row = z.object({ user_id: z.string().uuid(), on: z.union([z.boolean(), z.enum(['true','false']).transform(x => x === 'true')]) }).parse(v);
      if (row.on) { const r = await s.from('referral_influencers').upsert({ user_id: row.user_id }).select('user_id').single(); if (r.error) throw new Error('Unable to save record'); return { id: r.data.user_id }; }
      const r = await s.from('referral_influencers').delete().eq('user_id', row.user_id); if (r.error) throw new Error('Unable to save record'); return { id: row.user_id };
    }
    case 'maintenance': {
      if (!data.id) throw new Error('Record required');
      const row = z.object({ maintenance_mode: z.union([z.boolean(), z.enum(['true','false']).transform(x => x === 'true')]).default(false), maintenance_message: z.string().max(500).default('') }).parse(v);
      result = await s.from('admin_settings').update({ ...row, updated_at: new Date().toISOString() }).eq('id',data.id).select('id').single(); break;
    }
    case 'templates': {
      const row = z.object({ channel: z.enum(['email','whatsapp','sms','push']), name: z.string().trim().min(2).max(120), subject: z.string().max(200).default(''), body: z.string().max(4000).default(''), status: z.enum(['draft','active','archived']).default('draft') }).parse(v);
      result = data.id ? await s.from('message_templates').update({ ...row, updated_at: new Date().toISOString() }).eq('id',data.id).select('id').single() : await s.from('message_templates').insert(row).select('id').single(); break;
    }
    case 'announcements': {
      const row = z.object({ title, message: z.string().trim().min(2).max(1000), audience: z.string().min(1).max(200).refine(v => v === 'all' || /^(city|state|user|course):.+$/.test(v)), starts_at: z.union([z.literal('').transform(() => null), z.null(), z.string().datetime()]).default(null), ends_at: z.union([z.literal('').transform(() => null), z.null(), z.string().datetime()]).default(null), status: z.enum(['draft','published','archived']) }).parse(v);
      if (row.starts_at && row.ends_at && new Date(row.ends_at).getTime() <= new Date(row.starts_at).getTime()) throw new Error('End must be after start');
      result = data.id ? await s.from('announcements').update(row).eq('id',data.id).select('id').single() : await s.from('announcements').insert(row).select('id').single(); break;
    }
    case 'tickets': {
      if (data.id) {
        const row = z.object({ status: z.enum(['open','in_progress','resolved','closed']), reply: z.string().max(2000).default('') }).parse(v);
        result = await s.from('support_tickets').update({ ...row, updated_at: new Date().toISOString() }).eq('id',data.id).select('id').single(); break;
      }
      const row = z.object({ user_id: z.string().uuid(), subject: z.string().trim().min(2).max(200), message: z.string().trim().min(2).max(2000), priority: z.enum(['low','normal','high']).default('normal') }).parse(v);
      result = await s.from('support_tickets').insert(row).select('id').single(); break;
    }
    case 'banners': {
      const row = z.object({ title, image_url: url.default(''), link_url: url.default(''), placement: z.enum(['home','courses','dashboard']).default('home'), position: z.coerce.number().int().min(1).max(1000), active: z.union([z.boolean(), z.enum(['true','false']).transform(x => x === 'true')]).default(true) }).parse(v);
      result = data.id ? await s.from('banners').update(row).eq('id',data.id).select('id').single() : await s.from('banners').insert(row).select('id').single(); break;
    }
    case 'campaigns': {
      const row = z.object({ name: z.string().trim().min(2).max(120), channel: z.enum(['email','whatsapp','sms','push']).default('push'), audience: z.string().min(1).max(200).refine(v => v === 'all' || /^(city|state|user|course):.+$/.test(v)), template_id: z.union([z.literal('').transform(() => null), z.null(), z.string().uuid()]).default(null), status: z.enum(['draft','scheduled','sent','cancelled']).default('draft'), scheduled_at: z.union([z.literal('').transform(() => null), z.null(), z.string().datetime()]).default(null), show_popup: z.union([z.boolean(), z.enum(['true','false']).transform(x => x === 'true')]).default(false) }).parse(v);
      if (row.status === 'scheduled' && !row.scheduled_at) throw new Error('Scheduled campaigns need a date');
      result = data.id ? await s.from('campaigns').update(row).eq('id',data.id).select('id').single() : await s.from('campaigns').insert(row).select('id').single(); break;
    }
    case 'leads': {
      const row = z.object({ name: z.string().trim().min(2).max(120), phone: z.string().max(30).default(''), email: z.union([z.literal(''), z.string().email().max(200)]).default(''), source: z.string().trim().max(60).default('website'), status: z.enum(['new','contacted','converted','lost']).default('new'), note: z.string().max(1000).default('') }).parse(v);
      result = data.id ? await s.from('leads').update(row).eq('id',data.id).select('id').single() : await s.from('leads').insert(row).select('id').single(); break;
    }
    case 'seo': {
      const row = z.object({ path: z.string().trim().regex(/^\/[a-z0-9\-\/]{0,100}$/), meta_title: z.string().max(200).default(''), meta_description: z.string().max(500).default(''), keywords: z.string().max(500).default('') }).parse(v);
      result = data.id ? await s.from('seo_pages').update({ ...row, updated_at: new Date().toISOString() }).eq('id',data.id).select('id').single() : await s.from('seo_pages').insert(row).select('id').single(); break;
    }
    case 'promocodes': {
      const row = z.object({ code: z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{3,24}$/), description: z.string().max(500).default(''), coupon_id: z.union([z.literal('').transform(() => null), z.null(), z.string().uuid()]).default(null), active: z.union([z.boolean(), z.enum(['true','false']).transform(x => x === 'true')]).default(true) }).parse(v);
      result = data.id ? await s.from('promo_codes').update(row).eq('id',data.id).select('id').single() : await s.from('promo_codes').insert(row).select('id').single(); break;
    }
  }
  if (result.error) throw new Error(result.error.code === '23505' ? 'Certificate already issued' : 'Unable to save record');
  return { id: result.data.id };
});

export const getStudentNotifications = createServerFn({ method:'POST' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const r = await context.supabase.from('user_notifications').select('id,read_at,popup_seen_at,created_at,notification_campaigns(title,message,show_popup,image_url)').eq('user_id',context.userId).order('created_at',{ascending:false}).limit(50);
  if (r.error) throw new Error('Unable to load notifications');
  return r.data;
});
export const markNotificationPopupSeen = createServerFn({ method:'POST' }).middleware([requireSupabaseAuth]).inputValidator((i:{id:string})=>z.object({id:z.string().uuid()}).parse(i)).handler(async ({ context, data }) => {
  const r = await context.supabase.from('user_notifications').update({ popup_seen_at: new Date().toISOString(), read_at: new Date().toISOString() }).eq('id',data.id).eq('user_id',context.userId);
  if (r.error) throw new Error('Unable to update');
  return { ok: true };
});
async function assertAdmin(s: any, userId: string) { const role = await s.rpc('has_role', { _user_id: userId, _role: 'admin' }); requireAdminRole(!role.error && role.data === true); }

/** Copies a course with its modules and lessons as a new draft. */
export const duplicateCourse = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator((i: { id: string }) => z.object({ id: z.string().uuid() }).parse(i)).handler(async ({ context, data }) => {
  const s = context.supabase; await assertPanelAction(s, context.userId, 'courses','create');
  await assertPanelAction(s,context.userId,'modules','create');
  await assertPanelAction(s,context.userId,'lessons','create');
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
  const s = context.supabase; await assertPanelAction(s, context.userId, data.kind,'edit');
  const table = data.kind === 'modules' ? 'course_modules' : 'course_lessons';
  const item = await s.from(table).select('*').eq('id', data.id).single(); if (item.error) throw new Error('Not found');
  let q: any = s.from(table).select('id,position').eq('course_id', item.data.course_id);
  if (data.kind === 'lessons') { const mid = (item.data as { module_id: string | null }).module_id; q = mid ? q.eq('module_id', mid) : q.is('module_id', null); }
  const siblings: { id: string; position: number }[] = ((await q).data ?? []).sort((a: { id: string; position: number }, b: { id: string; position: number }) => a.position - b.position || a.id.localeCompare(b.id));
  const idx = siblings.findIndex(x => x.id === data.id); const other = siblings[data.dir === 'up' ? idx - 1 : idx + 1];
  if (!other) return { ok: true };
  siblings.forEach((x, i) => { x.position = i + 1; });
  const a = siblings[idx]; if(!a)return {ok:true}; const tmp = a.position; a.position = other.position; other.position = tmp;
  for (const x of siblings) await s.from(table).update({ position: x.position }).eq('id', x.id);
  return { ok: true };
});

/** Moves due pending commissions (holding period over, no open refund) to approved in automatic mode. */
export const releaseDueCommissions = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const r = await context.supabase.rpc('release_due_commissions');
  if (r.error) throw new Error(r.error.message.includes('Forbidden') ? 'Forbidden' : 'Unable to release commissions');
  return { released: r.data ?? 0 };
});
