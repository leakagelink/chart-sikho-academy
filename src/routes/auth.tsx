import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import "@lovable.dev/cloud-auth-js/styles.css";
import logo from "@/assets/logo.png";
import { useBranding } from "@/lib/branding";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";
import { useLang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

// Social buttons stay hidden while the client tests the app; flip to true at go-live.
const SHOW_SOCIAL_LOGIN = false;

const safePath = (p?: string) => (p && p.startsWith("/") && !p.startsWith("//") ? p : "/dashboard");

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({ redirect: typeof s["redirect"] === "string" ? s["redirect"] : undefined }),
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
  const { t } = useLang();
  const { session } = useAuth();
  const brandLogo = useBranding();
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "" });
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
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
      if (error) setMsg({ ok: false, text: error.message });
    } else if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { emailRedirectTo: window.location.origin + target, data: { full_name: form.name, phone: form.phone } },
      });
      setMsg(error ? { ok: false, text: error.message } : { ok: true, text: t("check_email") });
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(form.email, { redirectTo: `${window.location.origin}/reset-password` });
      setMsg(error ? { ok: false, text: error.message } : { ok: true, text: t("reset_sent") });
    }
    setBusy(false);
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

  const input = "w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring";
  return (
    <div className="auth-screen px-4 py-6">
      <div className="rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8">
        <img src={brandLogo || logo} alt="Chartसीखो" width={64} height={64} className="mx-auto h-24 w-24 object-contain" />
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
