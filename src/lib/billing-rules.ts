import { z } from 'zod';

export const billingSettingsSchema = z.object({
  seller_name: z.string().trim().min(2).max(160),
  seller_address: z.string().trim().max(600),
  seller_state: z.string().trim().max(80),
  seller_gstin: z.string().trim().toUpperCase().refine(v => !v || /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(v)),
  gst_percent: z.coerce.number().min(0).max(28).multipleOf(0.01),
  sac_code: z.string().trim().max(8),
}).superRefine((v, ctx) => {
  if (v.seller_gstin && (!v.seller_address || !v.seller_state || !/^\d{4,8}$/.test(v.sac_code))) ctx.addIssue({ code: 'custom', message: 'GST invoice requires seller address, state and SAC code' });
});
export type BillingSettingsValue = z.infer<typeof billingSettingsSchema>;
export const defaultBillingSettings: BillingSettingsValue = { seller_name: 'ChartSikho', seller_address: '', seller_state: '', seller_gstin: '', gst_percent: 0, sac_code: '' };
export function inclusiveBillTotals(total: number, gstin: string, rate: number) {
  const gstRate = gstin ? rate : 0;
  const totalPaise = Math.round(total * 100);
  const subtotalPaise = Math.round(totalPaise * 100 / (100 + gstRate));
  return { total: totalPaise / 100, subtotal: subtotalPaise / 100, gst_amount: (totalPaise - subtotalPaise) / 100, gst_rate: gstRate };
}