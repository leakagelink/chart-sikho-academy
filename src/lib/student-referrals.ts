import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Wallet } from './student-wallet';

async function allRows<T>(fetch: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>) {
  const rows: T[] = [];
  for (let from = 0; ; from += 500) {
    const r = await fetch(from, from + 499);
    if (r.error) throw new Error(r.error.message);
    rows.push(...(r.data || []));
    if ((r.data?.length || 0) < 500) return rows;
  }
}

export const studentReferralsOptions = (userId: string) => queryOptions({
  queryKey: ['student-referrals', userId],
  queryFn: async () => {
    const wallet = await supabase.rpc('my_wallet');
    if (wallet.error) throw wallet.error;
    const [profile, team, commissions] = await Promise.all([
      supabase.from('profiles').select('full_name,referral_code,short_referral_code').eq('id', userId).maybeSingle(),
      allRows((a) => supabase.rpc('my_referral_network', { _offset: a })),
      allRows((a,b) => supabase.from('commission_entries').select('id,order_id,amount,tds_amount,level,status,created_at,currency,on_hold,release_at').eq('user_id', userId).order('created_at', { ascending: false }).order('id').range(a,b)),
    ]);
    if (profile.error) throw new Error(profile.error.message);
    return { profile: profile.data, members: team, commissions, wallet: wallet.data as unknown as Wallet };
  },
});