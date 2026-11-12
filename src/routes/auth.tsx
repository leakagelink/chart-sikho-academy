import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import "@lovable.dev/cloud-auth-js/styles.css";
import { useBranding } from "@/lib/branding";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";
import { useLang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { normalizeSignupReferral, signupReferralFormatValid } from '@/lib/signup-referral';
import { useIsPhoneLayout } from "@/lib/native-app";
import { ArrowLeft, Eye, EyeOff, Gift, IdCard, Lock, Mail, Phone, type LucideIcon } from "lucide-react";

// Social buttons stay hidden while the client tests the app; flip to true at go-live.
const SHOW_SOCIAL_LOGIN = false;

const safePath = (p?: string) => (p && p.startsWith("/") && !p.startsWith("//") ? p : "/dashboard");

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string | undefined; ref?: string | undefined; mode?: 'signup' | undefined } => ({ redirect: typeof s["redirect"] === "string" ? s["redirect"] : undefined, ref: typeof s['ref'] === 'string' ? normalizeSignupReferral(s['ref']).slice(0,40) : undefined, mode: s['mode'] === 'signup' ? 'signup' : undefined }),
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Login / Sign up — Chartसीखो" },
      { name: "description", content: "Sign in or create your Chartसीखो student account to start learning." },
      { property: "og:title", content: "Login / Sign up — Chartसीखो" },
      { property: "og:description", content: "Sign in or create your Chartसीखो student account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { t, lang, setLang } = useLang();
  const native = useIsPhoneLayout();
  const [showPw, setShowPw] = useState(false);
  const { session } = useAuth();
  const brandLogo = useBranding();
  const { redirect, ref, mode: startMode } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">(ref || startMode === 'signup' ? 'signup' : 'login');
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "", referral: ref ?? '' });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const target = safePath(redirect);

  useEffect(() => {
    if (session) navigate({ to: target, replace: true });
  }, [session, target, navigate]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
      if (error) setMsg({ ok: false, text: error.message });
    } else if (mode === "signup") {
      const code = normalizeSignupReferral(form.referral);
      if (!signupReferralFormatValid(code)) {
        setMsg({ok:false,text:t('signup_referral_invalid')});setBusy(false);return;
      }
      const valid = await supabase.rpc('signup_referral_valid', {_code:code});
      if (valid.error || !valid.data) {
        setMsg({ok:false,text:t(valid.error?'signup_referral_error':'signup_referral_invalid')});setBusy(false);return;
      }
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { emailRedirectTo: window.location.origin + '/auth', data: { full_name: form.name, phone: form.phone, referral_code: code } },
      });
      setMsg(error ? { ok: false, text: error.message } : { ok: true, text: t("check_email") });
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(form.email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
      setMsg(error ? { ok: false, text: error.message } : { ok: true, text: t("reset_sent") });
    }
    } catch {
      setMsg({ ok: false, text: t('reset_request_failed') });
    } finally { setBusy(false); }
  }

  async function social(p: "google" | "lovable") {
    sessionStorage.setItem("cs-after-login", target);
    const r = await lovable.auth.signInWithOAuth(p, { redirect_uri: window.location.origin + "/auth" });
    if (r.error) setMsg({ ok: false, text: r.error.message ?? "Sign-in failed" });
  }

  useEffect(() => {
    const saved = sessionStorage.getItem("cs-after-login");
    if (session && saved) {
      sessionStorage.removeItem("cs-after-login");
      navigate({ to: safePath(saved), replace: true });
    }
  }, [session, navigate]);

  if (native) {
    const field = (Icon: LucideIcon, el: React.ReactNode, end?: React.ReactNode) => (
      <div className="flex items-center gap-3 rounded-2xl bg-paper px-4 py-3.5 text-ink shadow-card">
        <Icon className="size-5 shrink-0 opacity-60" aria-hidden="true" />
        {el}
        {end}
      </div>
    );
    const nativeInput = "min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink/50";
    return (
      <div className="native-auth fixed inset-0 z-50 overflow-y-auto bg-background text-foreground">
        <div className="mx-auto flex min-h-full w-full max-w-md flex-col px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-1.5 rounded-full px-2 py-1 text-sm font-semibold text-muted-foreground"><ArrowLeft className="size-4" aria-hidden="true" />{t("nav_home")}</Link>
            <div className="flex rounded-full border border-border p-0.5 text-xs font-semibold">
              {(["en", "hi"] as const).map((l) => (
                <button key={l} type="button" onClick={() => setLang(l)} aria-pressed={lang === l} className={`rounded-full px-3 py-1 ${lang === l ? "bg-gold text-primary-foreground" : "text-muted-foreground"}`}>
                  {l === "en" ? "EN" : "हिं"}
                </button>
              ))}
            </div>
          </div>
          {brandLogo ? <img src={brandLogo} alt="Chartसीखो" width={96} height={96} className="mx-auto mt-4 h-24 w-24 object-contain" /> : <div className="mx-auto mt-4 h-24 w-24" aria-hidden="true" />}
          <p className="mt-2 text-center font-display text-4xl font-bold leading-tight">Chart<span className="text-gold">सीखो</span></p>
          <p className="text-center text-sm">{t("splash_tagline")}</p>
          <div className="mx-auto mt-6 h-px w-full bg-gradient-to-r from-transparent via-gold to-transparent" aria-hidden="true" />
          {mode === "forgot" ? (
            <h1 className="mt-6 text-center font-display text-xl font-bold">{t("forgot_title")}</h1>
          ) : (
            <div className="mt-6 grid grid-cols-2" role="tablist">
              {(["login", "signup"] as const).map((m) => (
                <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => { setMode(m); setMsg(null); }} className={`flex flex-col items-center gap-2 py-2 font-display text-xl font-semibold ${mode === m ? "text-foreground" : "text-muted-foreground"}`}>
                  {m === "login" ? t("login") : t("signup")}
                  <span className={`h-1 w-24 rounded-full ${mode === m ? "bg-gold" : "bg-transparent"}`} aria-hidden="true" />
                </button>
              ))}
            </div>
          )}
          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === "signup" && (
              <>
                {field(IdCard, <input required aria-label={t("full_name")} placeholder={t("full_name")} value={form.name} onChange={set("name")} autoComplete="name" className={nativeInput} />)}
                {field(Phone, <input type="tel" aria-label={t("phone")} placeholder={t("phone")} value={form.phone} onChange={set("phone")} autoComplete="tel" className={nativeInput} />)}
              </>
            )}
            {field(Mail, <input required type="email" aria-label={t("email")} placeholder={t("email")} value={form.email} onChange={set("email")} autoComplete="email" inputMode="email" className={nativeInput} />)}
            {mode !== "forgot" && field(Lock,
              <input required type={showPw ? "text" : "password"} minLength={6} aria-label={mode === "signup" ? t("create_password") : t("password")} placeholder={mode === "signup" ? t("create_password") : t("password")} value={form.password} onChange={set("password")} autoComplete={mode === "signup" ? "new-password" : "current-password"} className={nativeInput} />,
              <button type="button" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? t("hide_password") : t("show_password")} className="shrink-0 opacity-60">
                {showPw ? <Eye className="size-5" /> : <EyeOff className="size-5" />}
              </button>,
            )}
            {mode === "signup" && field(Gift, <input aria-label={t("signup_referral_code")} placeholder={t("signup_referral_code")} autoCapitalize="characters" autoComplete="off" maxLength={40} value={form.referral} onChange={set("referral")} className={nativeInput} />)}
            {mode === "login" && (
              <div className="text-right"><button type="button" onClick={() => { setMode("forgot"); setMsg(null); }} className="text-sm font-semibold text-gold">{t("forgot_q")}</button></div>
            )}
            {msg && <p role="status" className={`text-center text-sm ${msg.ok ? "text-success" : "text-destructive"}`}>{msg.text}</p>}
            <button type="submit" disabled={busy} className="blueprint-gold w-full rounded-2xl py-4 font-display text-xl font-bold shadow-card disabled:opacity-60">
              {mode === "login" ? t("login") : mode === "signup" ? t("signup") : t("send_reset")}
            </button>
            {mode === "forgot" && (
              <div className="text-center"><button type="button" onClick={() => { setMode("login"); setMsg(null); }} className="text-sm font-semibold text-gold">← {t("login")}</button></div>
            )}
          </form>
        </div>
      </div>
    );
  }

  const input = "w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring";
  return (
    <div className="auth-screen px-4 py-6">
      <div className="rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8">
        {brandLogo ? <img src={brandLogo} alt="Chartसीखो" width={64} height={64} className="mx-auto h-24 w-24 object-contain" /> : <div className="mx-auto h-24 w-24" aria-hidden="true" />}
        <p className="mt-2 text-center font-display text-3xl font-bold text-gold">Chartसीखो</p>
        <p className="text-center text-sm text-gold">{t("splash_tagline")}</p>
        <h1 className="mt-3 text-center font-display text-2xl font-bold text-foreground">
          {mode === "login" ? t("welcome_back") : mode === "signup" ? t("create_account") : t("forgot_title")}
        </h1>
        {mode !== "forgot" && (
          <div className="mt-5 grid grid-cols-2 rounded-full bg-muted p-1 text-sm font-semibold">
            {(["login", "signup"] as const).map((m) => (
              <Button variant="ghost" key={m} onClick={() => { setMode(m); setMsg(null); }} className={`rounded-md py-2 ${mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                {m === "login" ? t("login") : t("signup")}
              </Button>
            ))}
          </div>
        )}
        <form onSubmit={submit} className="mt-5 space-y-3">
          {mode === "signup" && (
            <>
              <input required placeholder={t("full_name")} value={form.name} onChange={set("name")} className={input} />
              <input type="tel" placeholder={t("phone")} value={form.phone} onChange={set("phone")} className={input} />
              <label className="block space-y-1 text-sm"><span>{t('signup_referral_code')}</span><input aria-label={t('signup_referral_code')} autoCapitalize="characters" autoComplete="off" maxLength={40} value={form.referral} onChange={set('referral')} className={input}/></label>
            </>
          )}
          <input required type="email" placeholder={t("email")} value={form.email} onChange={set("email")} className={input} />
          {mode !== "forgot" && <input required type="password" minLength={6} placeholder={t("password")} value={form.password} onChange={set("password")} className={input} />}
          {msg && <p className={`text-sm ${msg.ok ? "text-success" : "text-destructive"}`}>{msg.text}</p>}
          <Button type="submit" disabled={busy} className="w-full rounded-lg bg-primary py-2.5 font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
            {mode === "login" ? t("login") : mode === "signup" ? t("create_account") : t("send_reset")}
          </Button>
        </form>
        <div className="mt-3 text-center text-sm">
          {mode === "login" && <button onClick={() => setMode("forgot")} className="text-primary">{t("forgot_q")}</button>}
          {mode === "forgot" && <button onClick={() => setMode("login")} className="text-primary">← {t("login")}</button>}
        </div>
        {SHOW_SOCIAL_LOGIN && mode !== "forgot" && (
          <>
            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />{t("or")}<span className="h-px flex-1 bg-border" /></div>
            <div className="space-y-3">
              <button onClick={() => social("google")} className="w-full rounded-lg border border-border bg-card py-2.5 text-sm font-semibold hover:bg-muted">
                {t("continue_google")}
              </button>
              <button type="button" className="lovable-auth-button w-full" onClick={() => social("lovable")}>Continue with Lovable</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
