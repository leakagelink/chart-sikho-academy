import { expect, it } from 'vitest';
import { filterProducts, type ProductType } from './product-filters';
const rows = (['courses', 'ebooks', 'classes', 'webinars', 'seminars'] as ProductType[]).map(type => ({ type, title: type }));
it('All includes every product type', () => { expect(filterProducts(rows, 'all', '').map(r => r.type)).toEqual(['courses', 'ebooks', 'classes', 'webinars', 'seminars']); });
for (const type of ['courses', 'ebooks', 'classes', 'webinars', 'seminars'] as const) {
  it(`${type} includes only its matching products`, () => { expect(filterProducts(rows, type, '').map(r => r.type)).toEqual([type]); });
}