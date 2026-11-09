import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Award, Bell, BookOpen, Crown, FileText, GitBranch, GraduationCap, Home, LayoutDashboard, User, Users, Video, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang, type DictKey } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";

type Item = { to: string; label: DictKey; icon: typeof BookOpen };
const groups: { title: DictKey; items: Item[] }[] = [
  { title: "my_learning", items: [
    { to: "/", label: "nav_home", icon: Home },
  ] },
  { title: "student_products_services", items: [
    { to: "/courses", label: "nav_courses", icon: BookOpen },
    { to: "/ebooks", label: "nav_ebooks", icon: FileText },
    { to: "/live-classes", label: "cat_live", icon: Video },
    { to: "/certificates", label: "up_certificates", icon: Award },
    { to: "/webinars", label: "cat_webinars", icon: Video },
    { to: "/seminars", label: "cat_seminars", icon: Users },
  ] },
  { title: "my_learning", items: [
    { to: "/dashboard", label: "my_learning", icon: LayoutDashboard },
  ] },
  { title: "student_affiliate", items: [
    { to: "/affiliate", label: "affiliate_dashboard", icon: LayoutDashboard },
    { to: "/referrals", label: "student_referral_tree", icon: GitBranch },
    { to: "/earnings", label: "wallet", icon: Wallet },
    { to: "/team", label: "student_team", icon: Users },
    { to: "/plans", label: "student_plans", icon: Crown },
  ] },
  { title: "my_profile", items: [
    { to: "/kyc", label: "kyc_title", icon: FileText },
    { to: "/notifications", label: "notifications", icon: Bell },
    { to: "/profile", label: "my_profile", icon: User },
  ] },
];

const EXCLUDED = ["/admin", "/auth", "/reset-password"];

/** Admin-style left sidebar for signed-in students (desktop only; mobile keeps the bottom bar). */
export function StudentShell({ children }: { children: ReactNode }) {
  const { t } = useLang();
  const { session } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  if (!session || EXCLUDED.some((p) => path.startsWith(p))) return <>{children}</>;
  const active = (to: string) => (to === "/" ? path === "/" : path === to || path.startsWith(to + "/"));
  return (
    <div className="w-full lg:grid lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[250px_minmax(0,1fr)] lg:gap-0">
      <aside className="hidden lg:block lg:min-h-[calc(100dvh-4rem)] lg:border-r lg:border-border lg:px-4 lg:pt-6">
        <div className="sticky top-20">
          <div className="mb-4 flex items-center gap-2 font-display text-xl font-bold"><GraduationCap className="text-primary" />{t("my_learning")}</div>
          <nav className="max-h-[calc(100dvh-8rem)] overflow-y-auto pr-1">
            {groups.map((g) => (
              <div key={g.title} className="mb-4">
                {g.items[0]?.to !== '/' && <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t(g.title)}</p>}
                {g.items.map(({ to, label, icon: Icon }) => (
                  <Button asChild key={label} size="sm" variant={active(to) ? "secondary" : "ghost"} className="w-full justify-start">
                    <Link to={to} ><Icon size={16} />{t(label)}</Link>
                  </Button>
                ))}
              </div>
            ))}
          </nav>
        </div>
      </aside>
      <div className="student-main min-w-0 lg:px-6 xl:px-8 2xl:px-10">{children}</div>
    </div>
  );
}
