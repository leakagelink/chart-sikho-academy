import { describe, it, expect } from 'vitest';
import { summarize, rangeBounds } from './admin-dashboard';
const base = { users: [], courses: [], enrollments: [], payouts: [], commissions: [] };
describe('admin dashboard money', () => {
  it('keeps gross, refunds, commission and net separate; unverified paid orders are not sales', () => {
    const d = { ...base, orders: [
      { id: 'a', course_id: 'c', user_id: 'u', amount: 1000, status: 'paid', provider_reference: 'pay_1', created_at: '2026-10-10T10:00:00Z' },
      { id: 'b', course_id: 'c', user_id: 'u', amount: 500, status: 'paid', provider_reference: null, created_at: '2026-10-10T10:00:00Z' },
      { id: 'r', course_id: 'c', user_id: 'u', amount: 200, status: 'refunded', provider_reference: 'pay_2', created_at: '2026-10-11T10:00:00Z' },
    ], commissions: [{ user_id: 'x', order_id: 'a', amount: 100, created_at: '2026-10-10T10:00:00Z' }] };
    const s = summarize(d, new Date('2026-10-01'), new Date('2026-11-01'));
    expect(s.gross).toBe(1000); expect(s.refunds).toBe(200); expect(s.commission).toBe(100); expect(s.net).toBe(700);
  });
  it('month range starts on the 1st', () => {
    expect(rangeBounds('month', new Date(2026, 9, 27)).start.getDate()).toBe(1);
  });
});

import { dailyCounts as dc } from './admin-dashboard';
import { test as t2, expect as e2 } from 'vitest';
t2('dailyCounts sums per day in date order', () => {
  e2(dc([{ at: '2026-01-02T10:00:00Z', v: 5 }, { at: '2026-01-01T09:00:00Z', v: 1 }, { at: '2026-01-02T23:00:00Z', v: 2 }]))
    .toEqual([{ label: '2026-01-01', value: 1 }, { label: '2026-01-02', value: 7 }]);
});
