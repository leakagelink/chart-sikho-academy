import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, BookOpen, FileText, GraduationCap, LayoutDashboard, User, Video, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang, type DictKey } from "@/lib/i18n";

const items: { to: string; label: DictKey; icon: typeof BookOpen }[] = [
  { to: "/dashboard", label: "my_learning", icon: LayoutDashboard },
  { to: "/courses", label: "nav_courses", icon: BookOpen },
  { to: "/ebooks", label: "nav_ebooks", icon: FileText },
  { to: "/sandbox/live", label: "cat_live", icon: Video },
  { to: "/earnings", label: "wallet_title", icon: Wallet },
  { to: "/notifications", label: "notifications", icon: Bell },
  { to: "/profile", label: "my_profile", icon: User },
];

/** Admin-style left sidebar for the signed-in student portal (desktop only; mobile keeps the bottom bar). */
export function StudentShell({ children }: { children: ReactNode }) {
  const { t } = useLang();
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="grid w-full gap-4 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-4 lg:pt-6">
      <aside className="hidden border-r border-border pr-4 lg:block">
        <div className="mb-4 flex items-center gap-2 font-display text-xl font-bold"><GraduationCap className="text-primary" />{t("my_learning")}</div>
        <nav className="sticky top-20 space-y-1">
          {items.map(({ to, label, icon: Icon }) => (
            <Button asChild key={to} size="sm" variant={path === to ? "secondary" : "ghost"} className="w-full justify-start">
              <Link to={to}><Icon size={16} />{t(label)}</Link>
            </Button>
          ))}
        </nav>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
