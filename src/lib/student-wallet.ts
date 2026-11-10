import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
export type Wallet = { available: number; pending: number; tds: number; withdrawn: number; requests_this_month: number; min: number; max: number; per_month: number; currency: string; kyc_required: boolean; kyc: string; cycle: string; self_purchase_total:number; min_self_purchase_value:number; self_purchase_remaining:number; self_purchase_eligible:boolean };
async function allRows<T>(fetch: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>) {
  const rows: T[] = [];
  for (let from = 0; ; from += 500) {
    const result = await fetch(from, from + 499);
    if (result.error) throw new Error(result.error.message);
    rows.push(...(result.data || []));
    if ((result.data?.length || 0) < 500) return rows;
  }
}
export const studentWalletOptions = (uid: string) => queryOptions({
  queryKey: ['student-wallet', uid],
  refetchOnWindowFocus: 'always',
  refetchInterval: 15000,
  queryFn: async () => {
    const wallet = await supabase.rpc('my_wallet');
    if (wallet.error) throw wallet.error;
    const [commissions, payouts, orders, payments, bonuses, refunds, prefs] = await Promise.all([
      allRows((a,b) => supabase.from('commission_entries').select('id,amount,tds_amount,level,status,created_at,order_id,release_at,on_hold,currency').eq('user_id',uid).order('created_at',{ascending:false}).order('id').range(a,b)),
      allRows((a,b) => supabase.from('payout_requests').select('id,amount,status,created_at,destination_snapshot').eq('user_id',uid).order('created_at',{ascending:false}).order('id').range(a,b)),
      allRows((a,b) => supabase.from('orders').select('id,amount,status,created_at,course_id,provider_reference').eq('user_id',uid).order('created_at',{ascending:false}).order('id').range(a,b)),
      allRows((a,b) => supabase.from('manual_payments').select('id,amount,status,created_at,course_id,utr,order_id,admin_note').eq('user_id',uid).order('created_at',{ascending:false}).order('id').range(a,b)),
      allRows((a,b) => supabase.from('bonus_entries').select('id,amount,status,created_at,reason').eq('user_id',uid).order('created_at',{ascending:false}).order('id').range(a,b)),
      allRows((a,b) => supabase.from('refund_requests').select('id,amount,status,created_at,reason,order_id').eq('user_id',uid).order('created_at',{ascending:false}).order('id').range(a,b)),
      supabase.from('payout_preferences').select('account_holder,bank_name,account_number,ifsc,upi_id,preferred_method').eq('user_id',uid).maybeSingle(),
    ]);
    if (prefs.error) throw prefs.error;
    return { wallet: wallet.data as unknown as Wallet, commissions, payouts, orders, payments, bonuses, refunds, preferences: prefs.data };
  },
});