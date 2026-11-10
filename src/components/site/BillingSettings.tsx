import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLang } from '@/lib/i18n';
import { getBillingSettings, saveBillingSettings } from '@/lib/billing.functions';
import { billingSettingsSchema, defaultBillingSettings, type BillingSettingsValue } from '@/lib/billing-rules';

export function BillingSettings({ canEdit }: { canEdit: boolean }) {
  const { t } = useLang();
  const qc = useQueryClient();
  const fetchSettings = useServerFn(getBillingSettings);
  const save = useServerFn(saveBillingSettings);
  const query = useQuery({ queryKey: ['billing-settings'], queryFn: () => fetchSettings() });
  const [draft, setDraft] = useState<BillingSettingsValue | null>(null);
  const [invalid, setInvalid] = useState(false);
  const value = draft ?? query.data ?? defaultBillingSettings;
  const mutation = useMutation({ mutationFn: (data: BillingSettingsValue) => save({ data }), onSuccess: async () => { await qc.invalidateQueries({ queryKey: ['billing-settings'] }); setDraft(null); } });
  const fields = [['seller_name', 'billing_seller'], ['seller_gstin', 'billing_gstin'], ['seller_address', 'seminar_address'], ['seller_state', 'seminar_state'], ['sac_code', 'billing_sac']] as const;
  return <section className="mb-8 min-w-0 border-y border-border py-6">
    <h2 className="font-display text-xl font-semibold">{t('billing_settings')}</h2>
    {query.isPending ? <p className="mt-4 text-muted-foreground">{t('admin_loading')}</p> : query.error ? <p role="alert" className="mt-4 text-destructive">{t('admin_error')}</p> : <form className="mt-4 space-y-4" onSubmit={e => { e.preventDefault(); const result = billingSettingsSchema.safeParse(value); setInvalid(!result.success); if (result.success) mutation.mutate(result.data); }}>
      <div className="grid min-w-0 gap-4 sm:grid-cols-2">{fields.map(([key, label]) => <label key={key} className="min-w-0 space-y-1 text-sm"><span>{t(label)}</span><input disabled={!canEdit} required={key === 'seller_name' || Boolean(value.seller_gstin) && ['seller_address', 'seller_state', 'sac_code'].includes(key)} className="w-full min-w-0 rounded-md border border-input bg-background px-3 py-2" value={value[key]} maxLength={key === 'seller_gstin' ? 15 : key === 'sac_code' ? 8 : 600} onChange={e => { setDraft({ ...value, [key]: key === 'seller_gstin' ? e.target.value.toUpperCase() : e.target.value }); mutation.reset(); }} /></label>)}
        <label className="space-y-1 text-sm"><span>{t('admin_gst_rate')}</span><input disabled={!canEdit} className="w-full rounded-md border border-input bg-background px-3 py-2" type="number" min="0" max="28" step="0.01" value={value.gst_percent} onChange={e => { setDraft({ ...value, gst_percent: Number(e.target.value) }); mutation.reset(); }} /></label>
      </div>
      <p className="text-sm text-muted-foreground">{t('billing_inclusive')}</p>
      {canEdit && <Button disabled={mutation.isPending} type="submit"><Save size={16} />{t('save')}</Button>}
      {invalid && <p role="alert" className="text-sm text-destructive">{t('billing_invalid')}</p>}
      {mutation.error && <p role="alert" className="text-sm text-destructive">{t('admin_error')}</p>}
      {mutation.isSuccess && <p role="status" className="text-sm text-success">{t('billing_saved')}</p>}
    </form>}
  </section>;
}