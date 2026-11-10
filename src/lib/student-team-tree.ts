export type NetworkMember = { id: string; referred_id: string; referrer_id: string | null; level: number; full_name: string | null; member_code: string | null; created_at: string };

/** Builds the visible student tree: matching members plus their ancestors, so filtered nodes keep their branch. */
export function studentTreeView(own: NetworkMember, members: NetworkMember[], query: string, level: string) {
  const all = [own, ...members];
  const byId = new Map(all.map(m => [m.referred_id, m]));
  const q = query.trim().toLowerCase();
  const matching = new Set(all.filter(m => (level === 'all' || m.level === Number(level)) && `${m.full_name ?? ''} ${m.member_code ?? ''}`.toLowerCase().includes(q)).map(m => m.referred_id));
  const included = new Set(matching);
  for (const id of matching) {
    const seen = new Set<string>();
    let parent = byId.get(id)?.referrer_id ?? null;
    while (parent && !seen.has(parent) && byId.has(parent)) { seen.add(parent); included.add(parent); parent = byId.get(parent)?.referrer_id ?? null; }
  }
  if (included.size) included.add(own.referred_id);
  const children = new Map<string, NetworkMember[]>();
  for (const m of members) {
    if (!m.referrer_id || !included.has(m.referred_id) || !byId.has(m.referrer_id)) continue;
    const list = children.get(m.referrer_id) ?? [];
    list.push(m);
    children.set(m.referrer_id, list);
  }
  const levels = [...new Set(all.map(m => m.level))].sort((a, b) => a - b);
  return { matching, children, levels };
}
