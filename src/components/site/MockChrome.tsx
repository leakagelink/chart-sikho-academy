import { Link, Outlet } from "@tanstack/react-router";
import { BookOpen, ClipboardCheck, Award, Shield, RotateCcw, Video, ShoppingBag } from "lucide-react";
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
    { to: "/sandbox/orders", key: "my_orders", icon: ShoppingBag },
    { to: "/sandbox/admin", key: "admin_demo", icon: Shield },
  ] as const;
  return <div className="sandbox-frame w-full px-4 pt-6">
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border pb-4 sm:flex sm:justify-between">
      <div className="min-w-0"><p className="text-xs font-semibold text-success">{t("test_mode")}</p><p className="font-display text-xl font-bold sm:text-2xl">Chartसीखो · {t("sandbox")}</p></div>
      <Button variant="outline" size="sm" className="shrink-0" title={t("reset_demo")} aria-label={t("reset_demo")} onClick={() => { if (window.confirm(t("reset_confirm"))) reset(); }}><RotateCcw /><span className="hidden sm:inline">{t("reset_demo")}</span></Button>
    </div>
    <nav className="sandbox-navigation flex gap-1 overflow-x-auto border-b border-border py-3 sm:flex-wrap" aria-label={t("sandbox")}>
      {links.map(({ to, key, icon: Icon }) => <Button key={to} asChild variant="ghost" size="sm" className="shrink-0"><Link to={to} activeOptions={{ exact: true }} activeProps={{ className: "bg-accent text-primary" }}><Icon />{t(key)}</Link></Button>)}
    </nav>
    <div className="min-w-0 py-6"><Outlet /></div>
  </div>;
}
export function MockChrome() { return <MockProvider><Frame /></MockProvider>; }