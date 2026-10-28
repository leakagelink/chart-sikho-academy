import { describe, expect, it } from 'vitest';
import { adminChangeSchema, requireAdminRole, safeHttps, financeActionAllowed } from './admin-rules';
describe('real admin boundaries', () => {
  it('denies students access to admin operations', () => { expect(() => requireAdminRole(false)).toThrow('Forbidden'); expect(() => requireAdminRole(true)).not.toThrow(); });
  it('does not allow recording payments through admin mutations', () => { expect(adminChangeSchema.safeParse({ resource: 'payments', values: { status: 'paid' } }).success).toBe(false); });
  it('never settles a payout from a review', () => { expect(financeActionAllowed('paid')).toBe(false); expect(financeActionAllowed('approved')).toBe(false); expect(financeActionAllowed('reviewed')).toBe(true); });
  it('does not accept executable resource links', () => { expect(() => safeHttps('javascript:alert(1)')).toThrow(); expect(safeHttps('https://www.youtube.com/watch?v=abc')).toBe('https://www.youtube.com/watch?v=abc'); });
});import { coursePublishIssues } from './admin-rules';
describe('course publish validation', () => {
  const ok = { title: 'Stock basics', description: 'A complete beginner course on markets.', price: 1999, sale_price: 999, modules: [{ id: 'm' }], lessons: [{ module_id: 'm', video_url: 'https://youtu.be/x', resource_path: '' }] };
  it('allows a complete course', () => { expect(coursePublishIssues(ok)).toEqual([]); });
  it('blocks a course without modules or lessons', () => { expect(coursePublishIssues({ ...ok, modules: [], lessons: [] })).toEqual(expect.arrayContaining(['modules','lessons'])); });
  it('blocks an empty module and a lesson without content', () => { expect(coursePublishIssues({ ...ok, modules: [{ id: 'm' }, { id: 'n' }], lessons: [{ module_id: 'm', video_url: '', resource_path: '' }] })).toEqual(expect.arrayContaining(['empty_module','lesson_content'])); });
  it('blocks a sale price not lower than price', () => { expect(coursePublishIssues({ ...ok, sale_price: 1999 })).toContain('sale_price'); });
});
import { invoiceTotals, couponDiscount, makeInvoiceNo } from './admin-rules';
describe('commerce rules', () => {
  it('computes GST invoice totals in whole rupees', () => { expect(invoiceTotals(1999, 18)).toEqual({ gstAmount: 360, total: 2359 }); expect(invoiceTotals(100, 0)).toEqual({ gstAmount: 0, total: 100 }); });
  it('invoice numbers look like INV-2026-AB12CD', () => { expect(makeInvoiceNo(2026, 'ab12cd')).toBe('INV-2026-AB12CD'); });
  const coupon = { kind: 'percent' as const, value: 10, min_order: 500, max_uses: 2, used_count: 0, active: true, expires_at: null };
  it('applies a percent coupon within limits', () => { expect(couponDiscount(coupon, 1000)).toBe(100); });
  it('rejects inactive, expired, exhausted or below-minimum coupons', () => {
    expect(couponDiscount({ ...coupon, active: false }, 1000)).toBe(0);
    expect(couponDiscount({ ...coupon, expires_at: '2020-01-01T00:00:00Z' }, 1000)).toBe(0);
    expect(couponDiscount({ ...coupon, used_count: 2 }, 1000)).toBe(0);
    expect(couponDiscount(coupon, 499)).toBe(0);
  });
  it('caps percent coupons at 90% and flat coupons at the order total', () => {
    expect(couponDiscount({ ...coupon, value: 95 }, 1000)).toBe(900);
    expect(couponDiscount({ ...coupon, kind: 'flat', value: 5000, min_order: 0 }, 1000)).toBe(1000);
  });
});
