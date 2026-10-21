import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { useMock } from "@/lib/mock-store";
import { pageMeta } from "@/lib/route-meta";
export const Route = createFileRoute("/sandbox/admin/")({ head: () => pageMeta("Mock Admin Overview", "Preview fictional course, student, booking and payout management."), component: Screen });
function Screen() {
  const { t } = useLang(); const { state } = useMock();
  const links = [{ to: "/sandbox/admin/courses", key: "admin_courses", value: state.catalog.length },{ to: "/sandbox/admin/students", key: "admin_students", value: 1 },{ to: "/sandbox/admin/bookings", key: "admin_bookings", value: 1 },{ to: "/sandbox/admin/sales", key: "admin_sales", value: 1 }] as const;
  return <><h1 className="font-display text-3xl font-bold">{t("admin_overview")}</h1><div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{links.map((l) => <article key={l.to} className="rounded-md border border-border bg-card p-5"><p className="text-3xl font-bold">{l.value}</p><h2 className="mt-2 font-semibold">{t(l.key)}</h2><Button variant="link" asChild className="mt-2 px-0"><Link to={l.to}>{t("see_all")} →</Link></Button></article>)}</div></>;
}