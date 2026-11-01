import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { requireAdminRole } from './admin-rules';

export const getAdminUserDetail = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ userId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const s = context.supabase;
    const role = await s.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
    requireAdminRole(!role.error && role.data === true);
    const id = data.userId;
    const [profile, enrollments, orders, certs, attempts, roles, refBy, team, comm, bonus, payouts, refunds, tickets, reviews, courses] = await Promise.all([
      s.from('profiles').select('*').eq('id', id).maybeSingle(),
      s.from('enrollments').select('*').eq('user_id', id).order('created_at', { ascending: false }),
      s.from('orders').select('*').eq('user_id', id).order('created_at', { ascending: false }),
      s.from('certificates').select('*').eq('user_id', id).order('issued_at', { ascending: false }),
      s.from('quiz_attempts').select('*').eq('user_id', id).order('created_at', { ascending: false }),
      s.from('user_roles').select('role').eq('user_id', id),
      s.from('referral_relationships').select('*').eq('referred_id', id).maybeSingle(),
      s.from('referral_relationships').select('*').eq('referrer_id', id),
      s.from('commission_entries').select('*').eq('user_id', id).order('created_at', { ascending: false }),
      s.from('bonus_entries').select('*').eq('user_id', id).order('created_at', { ascending: false }),
      s.from('payout_requests').select('*').eq('user_id', id).order('created_at', { ascending: false }),
      s.from('refund_requests').select('*').eq('user_id', id).order('created_at', { ascending: false }),
      s.from('support_tickets').select('*').eq('user_id', id).order('created_at', { ascending: false }),
      s.from('course_reviews').select('*').eq('user_id', id).order('created_at', { ascending: false }),
      s.from('courses').select('id,title,category,thumbnail_url'),
    ]);
    if (!profile.data) return null;
    const ids = [refBy.data?.referrer_id, ...(team.data ?? []).map(r => r.referred_id)].filter(Boolean) as string[];
    const names = ids.length ? (await s.from('profiles').select('id,full_name').in('id', ids)).data ?? [] : [];
    let email = '', lastSignIn: string | null = null;
    try {
      const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
      const u = await supabaseAdmin.auth.admin.getUserById(id);
      email = u.data.user?.email ?? ''; lastSignIn = u.data.user?.last_sign_in_at ?? null;
    } catch { /* email optional */ }
    return {
      profile: profile.data, email, lastSignIn, roles: (roles.data ?? []).map(r => r.role),
      enrollments: enrollments.data ?? [], orders: orders.data ?? [], certificates: certs.data ?? [], attempts: attempts.data ?? [],
      referredBy: refBy.data ? { id: refBy.data.referrer_id, at: refBy.data.created_at } : null,
      team: (team.data ?? []).map(r => ({ id: r.referred_id, at: r.created_at })), names,
      commissions: comm.data ?? [], bonuses: bonus.data ?? [], payouts: payouts.data ?? [],
      refunds: refunds.data ?? [], tickets: tickets.data ?? [], reviews: reviews.data ?? [], courses: courses.data ?? [],
    };
  });
