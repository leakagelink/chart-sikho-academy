import { describe, expect, it } from 'vitest';
import { categoryVisibility, visibleCategories } from './category-visibility';

describe('homepage category visibility', () => {
  it('shows newly created categories by default', () => {
    expect(categoryVisibility.parse(undefined)).toBe(true);
  });
  it('stores Hide as false and Show as true', () => {
    expect(categoryVisibility.parse('false')).toBe(false);
    expect(categoryVisibility.parse('true')).toBe(true);
  });
  it('hides only hidden categories and respects saved order', () => {
    expect(visibleCategories([
      { name: 'Courses', position: 2, is_visible: true },
      { name: 'Hidden category', position: 1, is_visible: false },
      { name: 'New category', position: 1, is_visible: true },
    ]).map(row => row.name)).toEqual(['New category', 'Courses']);
  });
});