import { describe, expect, it } from 'vitest';
import { billingSettingsSchema, defaultBillingSettings, inclusiveBillTotals } from './billing-rules';
describe('purchase bills', () => {
  it('charges no tax without a configured GST number', () => {
    expect(inclusiveBillTotals(3999, '', 18)).toEqual({ total: 3999, subtotal: 3999, gst_amount: 0, gst_rate: 0 });
  });
  it('keeps GST included in the paid product price', () => {
    expect(inclusiveBillTotals(3999, 'configured', 18)).toEqual({ total: 3999, subtotal: 3388.98, gst_amount: 610.02, gst_rate: 18 });
  });
  it('requires seller details for GST invoices', () => {
    expect(billingSettingsSchema.safeParse({ ...defaultBillingSettings, seller_gstin: '27ABCDE1234F1Z5', gst_percent: 18 }).success).toBe(false);
  });
});