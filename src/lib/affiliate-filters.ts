export type AffiliateFilters = { search: string; from: string; to: string; status: string; level: string; sort: string };
export const emptyAffiliateFilters: AffiliateFilters = { search: '', from: '', to: '', status: 'all', level: 'all', sort: 'newest' };
export function filterAffiliateRows<T extends { created_at: string; status?: string; level?: number }>(rows: T[], filters: AffiliateFilters, searchText: (row: T) => string) {
  return rows.filter(row => {
    const date = row.created_at.slice(0,10);
    return (!filters.from || date >= filters.from) && (!filters.to || date <= filters.to)
      && (!filters.search || searchText(row).toLowerCase().includes(filters.search.trim().toLowerCase()))
      && (filters.status === 'all' || row.status === filters.status)
      && (filters.level === 'all' || row.level === Number(filters.level));
  }).sort((a,b) => filters.sort === 'oldest' ? a.created_at.localeCompare(b.created_at) : b.created_at.localeCompare(a.created_at));
}