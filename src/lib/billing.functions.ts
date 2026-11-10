import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { billingSettingsSchema } from './billing-rules';

export const getBillingSettings = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data: allowed, error: permissionError } = await context.supabase.rpc('has_panel_permission', { _section: 'invoices', _action: 'view' });
  if (permissionError || !allowed) throw new Error('Forbidden');
  const { data, error } = await context.supabase.from('billing_settings').select('seller_name,seller_address,seller_state,seller_gstin,gst_percent,sac_code').eq('id', true).maybeSingle();
  if (error) throw new Error('Billing settings unavailable');
  return data;
});
export const saveBillingSettings = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(v => billingSettingsSchema.parse(v)).handler(async ({ context, data }) => {
  const { data: allowed, error: permissionError } = await context.supabase.rpc('has_panel_permission', { _section: 'invoices', _action: 'edit' });
  if (permissionError || !allowed) throw new Error('Forbidden');
  const { error } = await context.supabase.from('billing_settings').upsert({ id: true, ...data, updated_at: new Date().toISOString() });
  if (error) throw new Error('Billing settings could not be saved');
  return { ok: true };
});