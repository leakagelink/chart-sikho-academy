import { describe, expect, it } from 'vitest';
import { canOpenEbook } from './ebook-access';
describe('ebook access', () => {
  it('does not unlock a paid ebook before payment approval', () => {
    expect(canOpenEbook(499, false)).toBe(false);
  });
  it('unlocks an ebook with verified paid access', () => {
    expect(canOpenEbook(499, true)).toBe(true);
  });
  it('allows free ebooks without payment', () => {
    expect(canOpenEbook(0, false)).toBe(true);
  });
});