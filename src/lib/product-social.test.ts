import { expect, it } from 'vitest';
import { productSharePath, validProductComment } from './product-social';
it('shares each product destination', () => {
  expect(productSharePath('course','123')).toBe('/courses/123');
  expect(productSharePath('ebook','123')).toBe('/ebooks#ebook-123');
  expect(productSharePath('session','123')).toBe('/live/123');
  expect(productSharePath('plan','123')).toBe('/plans#plan-123');
});
it('rejects blank comments', () => expect(validProductComment('  ')).toBe(false));
it('allows a 1000 character comment', () => expect(validProductComment('a'.repeat(1000))).toBe(true));
it('rejects more than 1000 characters', () => expect(validProductComment('a'.repeat(1001))).toBe(false));