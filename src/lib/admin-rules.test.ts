import { describe, expect, it } from 'vitest';
import { adminChangeSchema, requireAdminRole, safeHttps, financeActionAllowed } from './admin-rules';
describe('real admin boundaries', () => {
  it('denies students access to admin operations', () => { expect(() => requireAdminRole(false)).toThrow('Forbidden'); expect(() => requireAdminRole(true)).not.toThrow(); });
  it('does not allow recording payments through admin mutations', () => { expect(adminChangeSchema.safeParse({ resource: 'payments', values: { status: 'paid' } }).success).toBe(false); });
  it('never settles a payout from a review', () => { expect(financeActionAllowed('paid')).toBe(false); expect(financeActionAllowed('approved')).toBe(false); expect(financeActionAllowed('reviewed')).toBe(true); });
  it('does not accept executable resource links', () => { expect(() => safeHttps('javascript:alert(1)')).toThrow(); expect(safeHttps('https://www.youtube.com/watch?v=abc')).toBe('https://www.youtube.com/watch?v=abc'); });
});