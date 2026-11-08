import { z } from 'zod';

export const categoryVisibility = z.union([z.boolean(), z.enum(['true', 'false']).transform(value => value === 'true')]).default(true);

export function visibleCategories<T extends { is_visible: boolean; position: number; name: string }>(rows: T[]): T[] {
  return rows.filter(row => row.is_visible).sort((a, b) => a.position - b.position || a.name.localeCompare(b.name));
}