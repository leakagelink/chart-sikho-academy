import { describe, expect, it } from 'vitest';
import { adminDeleteSchema, videoRemovalValues, liveClassSchema } from './admin-rules';
describe('admin deletion scope', () => {
  const id = '11111111-1111-4111-8111-111111111111';
  it('allows deleting courses', () => { expect(adminDeleteSchema.safeParse({ resource: 'courses', id }).success).toBe(true); });
  it('allows deleting lessons', () => { expect(adminDeleteSchema.safeParse({ resource: 'lessons', id }).success).toBe(true); });
  it('allows removing Video Library videos', () => { expect(adminDeleteSchema.safeParse({ resource: 'videos', id }).success).toBe(true); });
  it('rejects finance deletion', () => { expect(adminDeleteSchema.safeParse({ resource: 'orders', id }).success).toBe(false); });
  it('requires a specific valid record', () => { expect(adminDeleteSchema.safeParse({ resource: 'courses', id: '' }).success).toBe(false); });
});
describe('video removal', () => {
  it('preserves optional PDF notes', () => { expect(videoRemovalValues('lesson/notes.pdf')).toEqual({ video_url: '', resource_path: 'lesson/notes.pdf' }); });
  it('clears uploaded video sources', () => { for (const path of ['lesson/movie.mp4', 'lesson/movie.WEBM']) expect(videoRemovalValues(path)).toEqual({ video_url: '', resource_path: '' }); });
});
describe('live class recordings', () => {
  const row = { title:'Market class', kind:'class', starts_at:'2026-11-01T18:00:00Z', youtube_url:'', jitsi_url:'', status:'scheduled', category_slug:'basics', course_id:'11111111-1111-4111-8111-111111111111', module_id:'22222222-2222-4222-8222-222222222222', completion_state:'completed', recording_url:'https://youtu.be/recording' };
  it('accepts completed recording linked to course and module', () => { expect(liveClassSchema.safeParse(row).success).toBe(true); });
  it('requires a course for completed recordings', () => { expect(liveClassSchema.safeParse({ ...row, course_id:'' }).success).toBe(false); });
  it('requires a module for completed recordings', () => { expect(liveClassSchema.safeParse({ ...row, module_id:'' }).success).toBe(false); });
  it('requires recording before completion', () => { expect(liveClassSchema.safeParse({ ...row, recording_url:'' }).success).toBe(false); });
  it('cannot publish a cancelled class', () => { expect(liveClassSchema.safeParse({ ...row, status:'cancelled' }).success).toBe(false); });
  it('allows scheduling before a recording exists', () => { expect(liveClassSchema.safeParse({ ...row, completion_state:'pending', recording_url:'' }).success).toBe(true); });
});
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
  it('allows video lessons without an optional PDF', () => { expect(coursePublishIssues({ ...ok, lessons: [{ module_id: 'm', video_url: 'https://youtu.be/x', resource_path: '' }] })).toEqual([]); });
  it('allows a PDF alongside a video lesson', () => { expect(coursePublishIssues({ ...ok, lessons: [{ module_id: 'm', video_url: 'https://youtu.be/x', resource_path: 'lesson/notes.pdf' }] })).toEqual([]); });
  it('blocks a course without modules or lessons', () => { expect(coursePublishIssues({ ...ok, modules: [], lessons: [] })).toEqual(expect.arrayContaining(['modules','lessons'])); });
  it('blocks an empty module and a lesson without content', () => { expect(coursePublishIssues({ ...ok, modules: [{ id: 'm' }, { id: 'n' }], lessons: [{ module_id: 'm', video_url: '', resource_path: '' }] })).toEqual(expect.arrayContaining(['empty_module','lesson_content'])); });
  it('blocks a sale price not lower than price', () => { expect(coursePublishIssues({ ...ok, sale_price: 1999 })).toContain('sale_price'); });
});
describe('admin image upload envelope', () => {
  it('accepts uploaded thumbnails larger than the text limit', () => { expect(adminChangeSchema.safeParse({ resource: 'courses', values: { thumbnail_url: 'data:image/png;base64,' + 'A'.repeat(3000) } }).success).toBe(true); });
  it('keeps ordinary text bounded', () => { expect(adminChangeSchema.safeParse({ resource: 'courses', values: { description: 'A'.repeat(2001) } }).success).toBe(false); });
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
import { fraudFlags } from './admin-rules';
describe('fraud detection', () => {
  const orders = [{ id: 'o1', amount: 1000, status: 'paid', provider_reference: 'pay_1' }];
  it('flags self-referrals and duplicate pairs', () => {
    const flags = fraudFlags([{ referrer_id: 'a', referred_id: 'a' }, { referrer_id: 'a', referred_id: 'b' }, { referrer_id: 'a', referred_id: 'b' }], [], orders);
    expect(flags.map(f => f.kind)).toEqual(['self_referral', 'duplicate_pair']);
  });
  it('flags commission on unverified sales and commission above the sale amount', () => {
    const flags = fraudFlags([], [{ user_id: 'a', order_id: 'o2', amount: 100 }, { user_id: 'a', order_id: 'o1', amount: 2000 }], orders);
    expect(flags.map(f => f.kind)).toEqual(['unverified_sale_commission', 'commission_exceeds_sale']);
  });
  it('passes clean referral data', () => {
    expect(fraudFlags([{ referrer_id: 'a', referred_id: 'b' }], [{ user_id: 'a', order_id: 'o1', amount: 100 }], orders)).toEqual([]);
  });
});

import { adminSections } from './admin-rules';

describe('phase 6 admin resources', () => {
  it('includes engagement, growth and system sections', () => {
    for (const sec of ['templates','announcements','tickets','banners','campaigns','leads','seo','promocodes','maintenance']) {
      expect(adminSections).toContain(sec);
    }
  });
  it('accepts new resources in the change schema', () => {
    for (const res of ['templates','announcements','tickets','banners','campaigns','leads','seo','promocodes','maintenance']) {
      expect(adminChangeSchema.safeParse({ resource: res, values: {} }).success).toBe(true);
    }
  });
  it('rejects unknown resources', () => {
    expect(adminChangeSchema.safeParse({ resource: 'hacking', values: {} }).success).toBe(false);
  });
});
