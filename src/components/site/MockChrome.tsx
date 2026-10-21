import { Link, Outlet } from "@tanstack/react-router";
import { BookOpen, ClipboardCheck, Award, Users, Wallet, Shield, RotateCcw, Video, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { MockProvider, useMock } from "@/lib/mock-store";

function Frame() {
  const { t } = useLang();
  const { reset } = useMock();
  const links = [
    { to: "/sandbox", key: "student_demo", icon: BookOpen },
    { to: "/sandbox/learn", key: "mock_learning", icon: BookOpen },
    { to: "/sandbox/quiz", key: "quiz", icon: ClipboardCheck },
    { to: "/sandbox/certificates", key: "certificates", icon: Award },
    { to: "/sandbox/live", key: "live_sample", icon: Video },
    { to: "/sandbox/referrals", key: "referrals", icon: Users },
    { to: "/sandbox/wallet", key: "wallet", icon: Wallet },
    { to: "/sandbox/support", key: "support", icon: MessageCircle },
    { to: "/sandbox/admin", key: "admin_demo", icon: Shield },
  ] as const;
  return <div className="mx-auto max-w-6xl px-4 pt-6">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
      <div><p className="text-xs font-semibold text-success">{t("test_mode")}</p><p className="font-display text-2xl font-bold">Chartसीखो · {t("sandbox")}</p></div>
      <Button variant="outline" size="sm" onClick={() => { if (window.confirm(t("reset_confirm"))) reset(); }}><RotateCcw />{t("reset_demo")}</Button>
    </div>
    <nav className="flex flex-wrap gap-1 border-b border-border py-3" aria-label={t("sandbox")}>
      {links.map(({ to, key, icon: Icon }) => <Button key={to} asChild variant="ghost" size="sm"><Link to={to} activeOptions={{ exact: true }} activeProps={{ className: "bg-accent text-primary" }}><Icon />{t(key)}</Link></Button>)}
    </nav>
    <main className="py-6"><Outlet /></main>
  </div>;
}
export function MockChrome() { return <MockProvider><Frame /></MockProvider>; }