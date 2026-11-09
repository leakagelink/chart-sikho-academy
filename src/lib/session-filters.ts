export type SessionTiming = 'all' | 'upcoming' | 'past';
export type SessionPrice = 'all' | 'free' | 'paid';
type SessionRow = { title: string; starts_at: string; access_mode: string };

export function filterSessions<T extends SessionRow>(rows: T[], filters: { timing: SessionTiming; price: SessionPrice; search: string }, now = Date.now()): T[] {
  const search = filters.search.trim().toLocaleLowerCase();
  return rows.filter(row => {
    const starts = Date.parse(row.starts_at);
    return (filters.price === 'all' || row.access_mode === filters.price)
      && (filters.timing === 'all' || (filters.timing === 'upcoming' ? starts >= now : starts < now))
      && row.title.toLocaleLowerCase().includes(search);
  }).sort((a, b) => filters.timing === 'past' ? Date.parse(b.starts_at) - Date.parse(a.starts_at) : Date.parse(a.starts_at) - Date.parse(b.starts_at));
}