export function selectedVisibleIds(selected: string[], visible: string[]): string[] {
  return visible.filter(id => selected.includes(id));
}

export async function applyMemberBatch(ids: string[], apply: (id: string) => Promise<unknown>) {
  const failed: string[] = [];
  let succeeded = 0;
  for (const id of [...new Set(ids)]) {
    try { await apply(id); succeeded += 1; } catch { failed.push(id); }
  }
  return { succeeded, failed };
}