import { z } from 'zod';

export const adminSections = ['overview','users','courses','lessons','classes','webinars','ebooks','bookings','orders','payments','affiliates','commissions','payouts','notifications','reports','settings'] as const;
export type AdminSection = typeof adminSections[number];
export const adminChangeSchema = z.object({
  resource: z.enum(['courses','lessons','classes','ebooks','bookings','users','notifications','payouts','settings']),
  id: z.string().uuid().optional(),
  values: z.record(z.union([z.string().max(2000), z.number().finite(), z.boolean(), z.null()])),
});
export function requireAdminRole(isAdmin: boolean) { if (!isAdmin) throw new Error('Forbidden'); }
export function safeHttps(value: string) { if (!value) return ''; const url = new URL(value); if (url.protocol !== 'https:' || url.username || url.password) throw new Error('HTTPS required'); return url.toString(); }
export function financeActionAllowed(action: string) { return action === 'reviewed' || action === 'rejected'; }