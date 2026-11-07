export type ProductType = 'courses' | 'ebooks' | 'classes' | 'webinars';
export type ProductFilter = 'all' | ProductType;
export function filterProducts<T extends { type: ProductType; title: string }>(rows: T[], filter: ProductFilter, search: string): T[] {
  const text = search.trim().toLowerCase();
  return rows.filter(row => (filter === 'all' || row.type === filter) && row.title.toLowerCase().includes(text));
}