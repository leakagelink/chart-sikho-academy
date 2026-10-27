import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { adminChangeSchema, requireAdminRole, safeHttps } from './admin-rules';

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
  ]);
  if (results.some(r => r.error)) throw new Error('Unable to load administration records');
  const [users,courses,lessons,classes,ebooks,bookings,enrollments,orders,affiliates,commissions,payouts,notifications,settings,audit] = results;
  return { users: users.data ?? [], courses: courses.data ?? [], lessons: lessons.data ?? [], classes: classes.data ?? [], ebooks: ebooks.data ?? [], bookings: bookings.data ?? [], enrollments: enrollments.data ?? [], orders: orders.data ?? [], affiliates: affiliates.data ?? [], commissions: commissions.data ?? [], payouts: payouts.data ?? [], notifications: notifications.data ?? [], settings: settings.data ?? [], audit: audit.data ?? [], capped: results.some(r => (r.data?.length ?? 0) >= 1000) };
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
    case 'courses': {
      const row = z.object({ title, price, category: z.enum(['basics','technical','options','fundamental']), status: z.enum(['draft','published']) }).parse(v);
      result = data.id ? await s.from('courses').update({ ...row, updated_at: new Date().toISOString() }).eq('id',data.id).select('id').single() : await s.from('courses').insert(row).select('id').single(); break;
    }
    case 'lessons': {
      const row = z.object({ title, course_id: z.string().uuid(), position: z.coerce.number().int().min(1).max(10000), video_url: url, resource_path: path }).parse(v);
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
    case 'settings': {
      const row = z.object({ support_email: z.union([z.literal(''),z.string().email().max(200)]), support_phone: z.string().max(30), commission_percent: z.coerce.number().int().min(0).max(100) }).parse(v);
      result = data.id ? await s.from('admin_settings').update({ ...row, updated_at: new Date().toISOString() }).eq('id',data.id).select('id').single() : await s.from('admin_settings').insert(row).select('id').single(); break;
    }
  }
  if (result.error) throw new Error('Unable to save record');
  return { id: result.data.id };
});

export const getStudentNotifications = createServerFn({ method:'POST' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const r = await context.supabase.from('user_notifications').select('id,read_at,notification_campaigns(title,message)').eq('user_id',context.userId).order('created_at',{ascending:false}).limit(50);
  if (r.error) throw new Error('Unable to load notifications');
  return r.data;
});