import { useState, type FormEvent } from 'react';
import { Landmark, Save, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLang } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { emptyPayoutDetails, validPayoutDetails, type PayoutDetails as Details } from '@/lib/wallet-rules';

export function PayoutDetails({ value, onSaved }: { value: Details | null; onSaved: () => Promise<unknown> }) {
  const { t } = useLang();
  const [editing, setEditing] = useState(!value);
  const [f, setF] = useState<Details>(value || emptyPayoutDetails);
  const [confirm, setConfirm] = useState(value?.account_number || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const input = 'mt-1 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm';
  const field = (key: keyof Details, label: string) => <label className="block text-sm">{label}<input aria-label={label} className={input} value={f[key]} maxLength={key === 'account_number' ? 18 : 120} autoComplete="off" onChange={e => setF({ ...f, [key]: key === 'ifsc' ? e.target.value.toUpperCase() : e.target.value })} /></label>;
  async function save(e: FormEvent) {
    e.preventDefault(); setError(''); setSaved(false);
    if (!validPayoutDetails(f) || (f.account_number && confirm !== f.account_number)) { setError(t('wallet_details_error')); return; }
    setBusy(true);
    try {
      const r = await supabase.rpc('save_payout_preferences', { _account_holder: f.account_holder.trim(), _bank_name: f.bank_name.trim(), _account_number: f.account_number, _ifsc: f.ifsc, _upi_id: f.upi_id, _preferred_method: f.preferred_method });
      if (r.error) throw r.error;
      await onSaved(); setEditing(false); setSaved(true);
    } catch { setError(t('wallet_save_error')); } finally { setBusy(false); }
  }
  return <section className="min-w-0 border-t border-border pt-6">
    <div className="mb-4 flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 font-display text-xl font-semibold"><Landmark className="h-5 w-5" />{t('wallet_destination')}</h2>{!editing && <Button variant="outline" size="icon" aria-label={t('edit_profile')} title={t('edit_profile')} onClick={() => { setF(value || emptyPayoutDetails); setConfirm(value?.account_number || ''); setEditing(true); setSaved(false); }}><Pencil className="h-4 w-4" /></Button>}</div>
    {editing ? <form onSubmit={save}><fieldset disabled={busy} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">{field('account_holder',t('wallet_holder'))}{field('bank_name',t('wallet_bank_name'))}{field('account_number',t('wallet_account_number'))}<label className="block text-sm">{t('wallet_confirm_account')}<input aria-label={t('wallet_confirm_account')} className={input} value={confirm} maxLength={18} autoComplete="off" onChange={e => setConfirm(e.target.value)} /></label>{field('ifsc',t('wallet_ifsc'))}{field('upi_id',t('wallet_upi_id'))}</div>
      <label className="block text-sm">{t('wallet_preferred')}<select aria-label={t('wallet_preferred')} className={input} value={f.preferred_method} onChange={e => setF({ ...f, preferred_method: e.target.value })}><option value="none">{t('wallet_none')}</option><option value="bank">{t('wallet_bank')}</option><option value="upi">{t('wallet_upi')}</option></select></label>
      <div className="flex gap-2"><Button type="submit"><Save className="h-4 w-4" />{busy ? t('profile_saving') : t('save')}</Button><Button type="button" variant="outline" onClick={() => { setEditing(false); setError(''); }}>{t('pay_cancel')}</Button></div>
    </fieldset></form> : <dl className="grid gap-4 sm:grid-cols-2">{[
      [t('wallet_holder'),value?.account_holder], [t('wallet_bank_name'),value?.bank_name], [t('wallet_account_number'),value?.account_number ? `•••• ${value.account_number.slice(-4)}` : ''], [t('wallet_ifsc'),value?.ifsc], [t('wallet_upi_id'),value?.upi_id], [t('wallet_preferred'),value?.preferred_method === 'bank' ? t('wallet_bank') : value?.preferred_method === 'upi' ? t('wallet_upi') : t('wallet_none')],
    ].map(([label,v]) => <div key={label} className="min-w-0"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 break-all text-sm font-medium">{v || t('profile_empty')}</dd></div>)}</dl>}
    {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}{saved && <p role="status" className="mt-3 text-sm text-success">{t('saved')}</p>}
  </section>;
}