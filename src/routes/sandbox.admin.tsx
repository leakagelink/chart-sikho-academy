import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
export const Route = createFileRoute("/sandbox/admin")({ component: Layout });
function Layout() {
  const { t } = useLang();
  const links = [{ to: "/sandbox/admin", key: "admin_overview" },{ to: "/sandbox/admin/courses", key: "admin_courses" },{ to: "/sandbox/admin/students", key: "admin_students" },{ to: "/sandbox/admin/bookings", key: "admin_bookings" },{ to: "/sandbox/admin/sales", key: "admin_sales" }] as const;
  return <><p className="mb-3 text-sm font-semibold text-destructive">{t("test_only_admin")}</p><nav className="mb-6 flex flex-wrap gap-2">{links.map((l) => <Button asChild key={l.to} size="sm" variant="outline"><Link to={l.to} activeOptions={{ exact: true }} activeProps={{ className: "bg-accent" }}>{t(l.key)}</Link></Button>)}</nav><Outlet/></>;
}