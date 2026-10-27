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
