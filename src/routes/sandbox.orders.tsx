import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useLang, type DictKey } from "@/lib/i18n";
import { inr } from "@/lib/courses";
import { pageMeta } from "@/lib/route-meta";
import educator from "@/assets/course-educator.jpg";

export const Route = createFileRoute("/sandbox/orders")({
  head: () => pageMeta("Sample Orders", "Preview order history with fictional purchases."),
  component: Screen,
});

type Kind = "courses" | "webinars" | "ebooks";
const orders: { id: string; kind: Kind; title: DictKey; price: number; date: string }[] = [
  { id: "o1", kind: "courses", title: "continue_course_t", price: 4999, date: "12 May 2024" },
  { id: "o2", kind: "courses", title: "mock_course", price: 1499, date: "10 Apr 2024" },
  { id: "o3", kind: "webinars", title: "live_sample", price: 499, date: "05 Apr 2024" },
  { id: "o4", kind: "ebooks", title: "cat_ebooks", price: 199, date: "01 Apr 2024" },
];

const tabs: { key: "all" | Kind; label: DictKey }[] = [
  { key: "all", label: "filter_all" },
  { key: "courses", label: "order_courses" },
  { key: "webinars", label: "order_webinars" },
  { key: "ebooks", label: "order_ebooks" },
];

function Screen() {
  const { t } = useLang();
  const [tab, setTab] = useState<(typeof tabs)[number]["key"]>("all");
  const list = orders.filter((o) => tab === "all" || o.kind === tab);
  return (
    <div className="orders-screen">
      <h1 className="screen-title font-display font-bold">{t("my_orders")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("order_sample_note")}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        {tabs.map((x) => (
          <Button key={x.key} variant={tab === x.key ? "default" : "secondary"} aria-pressed={tab === x.key} onClick={() => setTab(x.key)} className="rounded-full">
            {t(x.label)}
          </Button>
        ))}
      </div>
      <div className="mt-5 space-y-3">
        {list.map((o) => (
          <article key={o.id} className="order-row flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-card">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-navy to-royal font-display text-lg font-bold text-gold">
              <img src={educator} alt="" width={68} height={82} loading="lazy" className="h-full w-full rounded object-cover" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{t(o.title)}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{o.date}</p>
              <p className="mt-1 text-sm font-bold text-gold">{inr(o.price)} <span className="ml-1 rounded bg-success/15 px-1.5 py-0.5 text-[11px] font-bold text-success">{t("paid")}</span></p>
            </div>
            <Button variant="outline" size="sm" className="shrink-0" onClick={() => toast.info(t("test_mode"))}>
              {t("view_details")}
            </Button>
          </article>
        ))}
      </div>
    </div>
  );
}
