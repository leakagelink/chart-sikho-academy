import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { Award, Bell, ChevronRight, ClipboardList, IndianRupee, LifeBuoy, LogOut, Settings, UserRound, Users, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { usePanelAccess } from '@/hooks/use-panel-access';

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
  const panelAccess = usePanelAccess();
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
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

  const name = f.full_name || user.email?.split("@")[0] || t("student_fallback");
  const menu = [
    { icon: Settings, label: t('admin_go'), to: '/admin' },
    { icon: ClipboardList, label: t("my_courses"), to: "/dashboard" },
    { icon: Award, label: t("my_certificates"), to: "/sandbox/certificates" },
    { icon: Users, label: t("referral_dashboard"), to: "/sandbox/referrals" },
    { icon: IndianRupee, label: t("my_earnings"), to: "/earnings" },
    { icon: Wallet, label: t("payout_requests"), to: "/earnings" },
    { icon: Bell, label: t("notifications"), to: "/sandbox/support" },
    { icon: LifeBuoy, label: t("support"), to: "/sandbox/support" },
  ] as const;

  const input = "w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm";
  const field = (k: "full_name" | "phone" | "state" | "city", label: string) => (
    <label className="block text-sm font-medium">{label}<input value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} className={`${input} mt-1`} /></label>
  );

  return (
    <div className="profile-screen w-full px-4 pt-0">
      {/* Header — blueprint My Profile */}
      <div className="profile-banner flex items-center gap-4">
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-gold font-display text-2xl font-bold text-navy">
          {name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <h1 className="truncate font-display text-2xl font-bold text-foreground">{name}</h1>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      {/* Menu list */}
      <div className="profile-menu mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <button onClick={() => setEditing(!editing)} aria-expanded={editing}
          className="flex w-full items-center gap-3 border-b border-border p-4 text-sm font-semibold hover:bg-muted/50">
          <UserRound className="h-5 w-5 shrink-0 text-gold" />
          <span className="flex-1 text-left">{t("edit_profile")}</span>
          <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${editing ? "rotate-90" : ""}`} />
        </button>
        {menu.filter(item=>item.to!=='/admin'||panelAccess).map(({ icon: Icon, label, to }) => (
          <Link key={label} to={to} className="flex items-center gap-3 border-b border-border p-4 text-sm font-semibold hover:bg-muted/50">
            <Icon className="h-5 w-5 shrink-0 text-gold" />
            <span className="flex-1">{label}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        ))}
        <div className="flex items-center gap-3 border-b border-border p-4 text-sm font-semibold">
          <Settings className="h-5 w-5 shrink-0 text-gold" />
          <span className="flex-1">{t("settings")}</span>
          <select value={f.preferred_language} aria-label={t("pref_lang")}
            onChange={(e) => { const v = e.target.value; setF({ ...f, preferred_language: v }); setLang(v === "hi" ? "hi" : "en"); }}
            className="rounded-md border border-input bg-background px-2 py-1 text-xs">
            <option value="en">English</option><option value="hi">हिंदी</option>
          </select>
        </div>
        <button onClick={signOut} className="flex w-full items-center gap-3 p-4 text-sm font-semibold text-destructive hover:bg-muted/50">
          <LogOut className="h-5 w-5 shrink-0" />
          <span className="flex-1 text-left">{t("logout")}</span>
        </button>
      </div>

      {/* Edit form */}
      {editing && (
        <form onSubmit={save} className="mt-4 space-y-4 rounded-2xl border border-border bg-card p-4 shadow-card sm:p-6">
          {field("full_name", t("full_name"))}
          {field("phone", t("phone"))}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{field("state", t("state"))}{field("city", t("city"))}</div>
          {saved && <p className="text-sm text-success">{saved}</p>}
          <Button type="submit" className="w-full">{t("save")}</Button>
        </form>
      )}
    </div>
  );
}
