import { useEffect, useState, type FormEvent } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/lib/i18n';

export function AdminAccountSettings() {
  const { t } = useI18n();
  const [current, setCurrent] = useState('');
  const [email, setEmail] = useState('');
  const [curPw, setCurPw] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { supabase.auth.getUser().then(({ data }) => setCurrent(data.user?.email ?? '')); }, []);

  async function changeEmail(e: FormEvent) {
    e.preventDefault(); setMsg(null);
    const next = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(next) || next === current) { setMsg({ ok: false, text: t('acct_email_invalid') }); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ email: next }, { emailRedirectTo: `${window.location.origin}/admin` });
    setBusy(false);
    if (error) setMsg({ ok: false, text: error.message }); else { setEmail(''); setMsg({ ok: true, text: t('acct_email_sent') }); }
  }
  async function changePassword(e: FormEvent) {
    e.preventDefault(); setMsg(null);
    if (pw.length < 8) { setMsg({ ok: false, text: t('acct_pw_short') }); return; }
    if (pw !== pw2) { setMsg({ ok: false, text: t('acct_pw_mismatch') }); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw, current_password: curPw } as { password: string });
    setBusy(false);
    if (error) setMsg({ ok: false, text: error.message }); else { setCurPw(''); setPw(''); setPw2(''); setMsg({ ok: true, text: t('acct_pw_done') }); }
  }

  return (
    <section className="mb-6 rounded-xl border border-border bg-card p-4 sm:p-5">
      <h2 className="font-display text-lg font-bold">{t('acct_title')}</h2>
      <p className="mb-4 text-sm text-muted-foreground">{t('acct_current_email')}: <b className="break-all text-foreground">{current}</b></p>
      {msg && <p role="status" className={`mb-4 text-sm ${msg.ok ? 'text-primary' : 'text-destructive'}`}>{msg.text}</p>}
      <div className="grid gap-5 md:grid-cols-2">
        <form onSubmit={changeEmail} className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="acct-email">{t('acct_new_email')}</label>
          <Input id="acct-email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required />
          <Button type="submit" disabled={busy}>{t('acct_change_email')}</Button>
        </form>
        <form onSubmit={changePassword} className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="acct-cur">{t('acct_cur_pw')}</label>
          <Input id="acct-cur" type="password" autoComplete="current-password" value={curPw} onChange={e => setCurPw(e.target.value)} required />
          <label className="text-sm font-medium" htmlFor="acct-pw">{t('acct_new_pw')}</label>
          <Input id="acct-pw" type="password" autoComplete="new-password" value={pw} onChange={e => setPw(e.target.value)} required />
          <label className="text-sm font-medium" htmlFor="acct-pw2">{t('acct_confirm_pw')}</label>
          <Input id="acct-pw2" type="password" autoComplete="new-password" value={pw2} onChange={e => setPw2(e.target.value)} required />
          <Button type="submit" disabled={busy}>{t('acct_change_pw')}</Button>
        </form>
      </div>
    </section>
  );
}
