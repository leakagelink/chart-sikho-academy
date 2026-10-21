import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "My Profile — Chartसीखो" },
      { name: "description", content: "Manage your Chartसीखो student profile." },
      { property: "og:title", content: "My Profile — Chartसीखो" },
      { property: "og:description", content: "Manage your Chartसीखो student profile." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { t, setLang } = useLang();
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [f, setF] = useState({ full_name: "", phone: "", state: "", city: "", preferred_language: "en" });
  const [saved, setSaved] = useState("");

  const q = useQuery({
    queryKey: ["profile-full", user.id],
    queryFn: async () => (await supabase.from("profiles").select("full_name, phone, state, city, preferred_language").eq("id", user.id).maybeSingle()).data,
  });
  useEffect(() => {
    if (q.data) setF({ full_name: q.data.full_name ?? "", phone: q.data.phone ?? "", state: q.data.state ?? "", city: q.data.city ?? "", preferred_language: q.data.preferred_language });
  }, [q.data]);

  async function save(e: FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("profiles").upsert({ id: user.id, ...f, updated_at: new Date().toISOString() });
    setSaved(error ? error.message : t("saved"));
    if (!error) {
      setLang(f.preferred_language === "hi" ? "hi" : "en");
      qc.invalidateQueries({ queryKey: ["profile", user.id] });
    }
  }

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", search: { redirect: undefined }, replace: true });
  }

  const input = "w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm";
  const field = (k: "full_name" | "phone" | "state" | "city", label: string) => (
    <label className="block text-sm font-medium">{label}<input value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} className={`${input} mt-1`} /></label>
  );
  return (
    <div className="mx-auto max-w-xl px-4 pt-8">
      <h1 className="font-display text-3xl font-bold text-navy">{t("my_profile")}</h1>
      <p className="text-sm text-muted-foreground">{user.email}</p>
      <form onSubmit={save} className="mt-6 space-y-4 rounded-3xl border border-border bg-card p-6 shadow-card">
        {field("full_name", t("full_name"))}
        {field("phone", t("phone"))}
        <div className="grid grid-cols-2 gap-3">{field("state", t("state"))}{field("city", t("city"))}</div>
        <label className="block text-sm font-medium">{t("pref_lang")}
          <select value={f.preferred_language} onChange={(e) => setF({ ...f, preferred_language: e.target.value })} className={`${input} mt-1`}>
            <option value="en">English</option><option value="hi">हिंदी</option>
          </select>
        </label>
        {saved && <p className="text-sm text-success">{saved}</p>}
        <button className="w-full rounded-lg bg-primary py-2.5 font-semibold text-primary-foreground">{t("save")}</button>
      </form>
      <button onClick={signOut} className="mt-4 w-full rounded-lg border border-destructive py-2.5 font-semibold text-destructive">{t("logout")}</button>
    </div>
  );
}
