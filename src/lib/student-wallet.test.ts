import { expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ scopes: [] as { table: string; field: string; uid: string }[] }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  rpc: async () => ({ data: { available: 0 }, error: null }),
  from: (table: string) => {
    const chain = {
      select: () => chain,
      eq: (field: string, uid: string) => { mocks.scopes.push({ table, field, uid }); return chain; },
      order: () => chain,
      range: async () => ({ data: [], error: null }),
      maybeSingle: async () => ({ data: null, error: null }),
    };
    return chain;
  },
} }));
import { studentWalletOptions } from './student-wallet';
it('scopes all earnings, payments, withdrawals and bank details to the current user', async () => {
  mocks.scopes.length = 0;
  const options = studentWalletOptions('current-student');
  if (typeof options.queryFn !== 'function') throw new Error('Missing wallet query');
  await options.queryFn({} as never);
  expect(mocks.scopes).toEqual([
    { table: 'commission_entries', field: 'user_id', uid: 'current-student' },
    { table: 'payout_requests', field: 'user_id', uid: 'current-student' },
    { table: 'orders', field: 'user_id', uid: 'current-student' },
    { table: 'manual_payments', field: 'user_id', uid: 'current-student' },
    { table: 'bonus_entries', field: 'user_id', uid: 'current-student' },
    { table: 'refund_requests', field: 'user_id', uid: 'current-student' },
    { table: 'payout_preferences', field: 'user_id', uid: 'current-student' },
    { table: 'invoices', field: 'orders.user_id', uid: 'current-student' },
  ]);
});