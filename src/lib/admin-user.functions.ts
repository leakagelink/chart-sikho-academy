import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { assertPanelAction } from './admin-access.server';
import { canReadDataset } from './admin-permissions';

export const getAdminUserDetail = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ userId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const s = context.supabase;
    const access = await assertPanelAction(s,context.userId,'users','view');
    async function read<T extends {data:unknown;error:unknown}>(key:string,fetcher:()=>PromiseLike<T>):Promise<T>{return canReadDataset(access,key)?await fetcher():{data:[],error:null} as T;}
    const id = data.userId;
    const [profile, enrollments, orders, certs, attempts, roles, refBy, team, comm, bonus, payouts, refunds, tickets, reviews, courses] = await Promise.all([
      read('users',()=>s.from('profiles').select('*').eq('id', id).maybeSingle()),
      read('enrollments',()=>s.from('enrollments').select('*').eq('user_id', id).order('created_at', { ascending: false })),
      read('orders',()=>s.from('orders').select('*').eq('user_id', id).order('created_at', { ascending: false })),
      read('certificates',()=>s.from('certificates').select('*').eq('user_id', id).order('issued_at', { ascending: false })),
      read('attempts',()=>s.from('quiz_attempts').select('*').eq('user_id', id).order('created_at', { ascending: false })),
      read('userRoles',()=>s.from('user_roles').select('role').eq('user_id', id)),
      read('affiliates',()=>s.from('referral_relationships').select('*').eq('referred_id', id).maybeSingle()),
      read('affiliates',()=>s.from('referral_relationships').select('*').eq('referrer_id', id)),
      read('commissions',()=>s.from('commission_entries').select('*').eq('user_id', id).order('created_at', { ascending: false })),
      read('bonuses',()=>s.from('bonus_entries').select('*').eq('user_id', id).order('created_at', { ascending: false })),
      read('payouts',()=>s.from('payout_requests').select('*').eq('user_id', id).order('created_at', { ascending: false })),
      read('refunds',()=>s.from('refund_requests').select('*').eq('user_id', id).order('created_at', { ascending: false })),
      read('tickets',()=>s.from('support_tickets').select('*').eq('user_id', id).order('created_at', { ascending: false })),
      read('reviews',()=>s.from('course_reviews').select('*').eq('user_id', id).order('created_at', { ascending: false })),
      read('courses',()=>s.from('courses').select('id,title,category,thumbnail_url')),
    ]);
    if (!profile.data) return null;
    const ids = [refBy.data?.referrer_id, ...(team.data ?? []).map(r => r.referred_id)].filter(Boolean) as string[];
    const names = ids.length ? (await s.from('profiles').select('id,full_name').in('id', ids)).data ?? [] : [];
    let email = '', lastSignIn: string | null = null;
    try {
      if(!access.isAdmin) return {profile:profile.data,email,lastSignIn,roles:(roles.data??[]).map(r=>r.role),enrollments:enrollments.data??[],orders:orders.data??[],certificates:certs.data??[],attempts:attempts.data??[],referredBy:refBy.data?{id:refBy.data.referrer_id,at:refBy.data.created_at}:null,team:(team.data??[]).map(r=>({id:r.referred_id,at:r.created_at})),names,commissions:comm.data??[],bonuses:bonus.data??[],payouts:payouts.data??[],refunds:refunds.data??[],tickets:tickets.data??[],reviews:reviews.data??[],courses:courses.data??[]};
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
