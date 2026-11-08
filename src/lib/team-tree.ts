export type TeamLink = {referrer_id: string; referred_id: string};
export type TeamNode = {id: string; parentId: string | null; level: number; rootId: string};

/** Iterative traversal preserves every depth and stops malformed cycles. */
export function teamTreeNodes(links: TeamLink[], rootId?: string): TeamNode[] {
  const children = new Map<string, Set<string>>();
  const referred = new Set<string>();
  for (const link of links) {
    if (link.referrer_id === link.referred_id) continue;
    const kids = children.get(link.referrer_id) ?? new Set<string>();
    kids.add(link.referred_id);
    children.set(link.referrer_id, kids);
    referred.add(link.referred_id);
  }
  const roots = rootId ? [rootId] : [...children.keys()].filter(id=>!referred.has(id));
  const seen = new Set<string>();
  const nodes: TeamNode[] = [];
  function walk(root: string) {
    const queue: TeamNode[] = [{id:root,parentId:null,level:0,rootId:root}];
    for (let i=0; i<queue.length; i++) {
      const node = queue[i];
      if (!node || seen.has(node.id)) continue;
      seen.add(node.id); nodes.push(node);
      for (const id of children.get(node.id) ?? []) queue.push({id,parentId:node.id,level:node.level+1,rootId:root});
    }
  }
  roots.forEach(walk);
  if (!rootId) for (const id of children.keys()) if (!seen.has(id)) walk(id);
  return nodes;
}