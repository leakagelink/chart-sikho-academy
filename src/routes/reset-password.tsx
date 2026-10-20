import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
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
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) setErr(error.message);
    else navigate({ to: "/dashboard" });
  }
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <form onSubmit={submit} className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-card">
        <h1 className="font-display text-2xl font-bold text-navy">{t("new_password")}</h1>
        <input required type="password" minLength={6} value={pw} onChange={(e) => setPw(e.target.value)} placeholder={t("password")} className="w-full rounded-lg border border-input px-3 py-2.5 text-sm" />
        {err && <p className="text-sm text-destructive">{err}</p>}
        <button className="w-full rounded-lg bg-primary py-2.5 font-semibold text-primary-foreground">{t("save")}</button>
      </form>
    </div>
  );
}
