import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Award, Bell, BookOpen, Crown, FileText, GraduationCap, Home, LayoutDashboard, User, Video, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang, type DictKey } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";

type Item = { to: string; label: DictKey; icon: typeof BookOpen };
const groups: { title: DictKey; items: Item[] }[] = [
  { title: "my_learning", items: [
    { to: "/", label: "nav_home", icon: Home },
    { to: "/dashboard", label: "my_learning", icon: LayoutDashboard },
    { to: "/courses", label: "nav_courses", icon: BookOpen },
    { to: "/ebooks", label: "nav_ebooks", icon: FileText },
    { to: "/sandbox/live", label: "cat_live", icon: Video },
    { to: "/sandbox/certificates", label: "up_certificates", icon: Award },
  ] },
  { title: "my_profile", items: [
    { to: "/plans", label: "membership_cta", icon: Crown },
    { to: "/earnings", label: "wallet_title", icon: Wallet },
    { to: "/notifications", label: "notifications", icon: Bell },
    { to: "/profile", label: "my_profile", icon: User },
  ] },
];

const EXCLUDED = ["/admin", "/sandbox", "/auth", "/reset-password", "/verify"];

/** Admin-style left sidebar for signed-in students (desktop only; mobile keeps the bottom bar). */
export function StudentShell({ children }: { children: ReactNode }) {
  const { t } = useLang();
  const { session } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  if (!session || EXCLUDED.some((p) => path.startsWith(p))) return <>{children}</>;
  const active = (to: string) => (to === "/" ? path === "/" : path === to || path.startsWith(to + "/"));
  return (
    <div className="w-full lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-2">
      <aside className="hidden lg:block lg:border-r lg:border-border lg:px-4 lg:pt-6">
        <div className="sticky top-20">
          <div className="mb-4 flex items-center gap-2 font-display text-xl font-bold"><GraduationCap className="text-primary" />{t("my_learning")}</div>
          <nav className="max-h-[calc(100dvh-8rem)] overflow-y-auto pr-1">
            {groups.map((g) => (
              <div key={g.title} className="mb-4">
                <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t(g.title)}</p>
                {g.items.map(({ to, label, icon: Icon }) => (
                  <Button asChild key={to} size="sm" variant={active(to) ? "secondary" : "ghost"} className="w-full justify-start">
                    <Link to={to}><Icon size={16} />{t(label)}</Link>
                  </Button>
                ))}
              </div>
            ))}
          </nav>
        </div>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
