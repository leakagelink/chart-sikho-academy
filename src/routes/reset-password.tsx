import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { recoveryPasswordError } from '@/lib/password-recovery';

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Reset password — Chartसीखो" },
      { name: "description", content: "Set a new password for your Chartसीखो account." },
      { property: "og:title", content: "Reset password — Chartसीखो" },
      { property: "og:description", content: "Set a new password for your Chartसीखो account." },
    ],
  }),
  component: ResetPage,
});

function ResetPage() {
  const { t } = useLang();
  const { ready, session, recovery } = useAuth();
  const [pw, setPw] = useState("");
  const [confirmation, setConfirmation] = useState('');
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [verified, setVerified] = useState(false);
  const [checking, setChecking] = useState(false);
  const [success, setSuccess] = useState(false);
  useEffect(() => {
    let active = true;
    setVerified(false);
    setChecking(false);
    if (ready && session && recovery) {
      setChecking(true);
      supabase.auth.getUser().then(({ data, error }) => {
        if (active) { setVerified(!error && Boolean(data.user)); setChecking(false); }
      }).catch(() => { if (active) { setVerified(false); setChecking(false); } });
    }
    return () => { active = false; };
  }, [ready, session, recovery]);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!verified || busy) return;
    const validation = recoveryPasswordError(pw, confirmation);
    if (validation) { setErr(t(validation)); return; }
    setBusy(true);
    setErr('');
    try {
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) setErr(error.message);
      else { setPw(''); setConfirmation(''); setSuccess(true); }
    } catch {
      setErr(t('reset_request_failed'));
    } finally { setBusy(false); }
  }
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <form onSubmit={submit} className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-card">
        <h1 className="font-display text-2xl font-bold text-foreground">{t("new_password")}</h1>
        {success ? <><p role="status" className="text-success">{t('reset_success')}</p><Button asChild className="w-full"><Link to="/">{t('nav_home')}</Link></Button></> : verified ? <>
          <label className="block space-y-1 text-sm"><span>{t('password')}</span><input required type="password" autoComplete="new-password" minLength={6} value={pw} onChange={(e) => setPw(e.target.value)} className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm" /></label>
          <label className="block space-y-1 text-sm"><span>{t('reset_confirm_password')}</span><input required type="password" autoComplete="new-password" minLength={6} value={confirmation} onChange={(e) => setConfirmation(e.target.value)} className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm" /></label>
          {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
          <Button disabled={busy} className="w-full" type="submit">{t(busy ? 'reset_saving' : 'save')}</Button>
        </> : <><p role="status" className="text-sm text-muted-foreground">{t(!ready || checking ? 'reset_checking' : 'reset_invalid')}</p><Button asChild variant="outline" className="w-full"><Link to="/auth">{t('forgot_title')}</Link></Button></>}
      </form>
    </div>
  );
}
