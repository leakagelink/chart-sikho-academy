import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Crown, Lock } from "lucide-react";
import { toast } from "sonner";
import { inr } from "@/lib/courses";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/plans")({
  head: () => ({
    meta: [
      { title: "Membership Plans — Chartसीखो" },
      { name: "description", content: "Chartसीखो membership: every recorded course, weekly live sessions and members-only notes." },
      { property: "og:title", content: "Membership Plans — Chartसीखो" },
      { property: "og:description", content: "Chartसीखो membership: every recorded course, weekly live sessions and members-only notes." },
    ],
  }),
  component: PlansPage,
});

// Sample pricing for the test build — real plans/prices to be confirmed before launch.
const plans = [
  { id: "monthly", name: "plan_monthly" as const, price: 499, per: "per_month" as const, popular: false },
  { id: "yearly", name: "plan_yearly" as const, price: 3999, per: "per_year" as const, popular: true },
];

function PlansPage() {
  const { t } = useLang();
  return (
    <div className="mx-auto max-w-3xl px-4 pt-8">
      <div className="text-center">
        <Crown className="mx-auto h-10 w-10 text-gold" />
        <h1 className="mt-2 font-display text-3xl font-bold text-navy">{t("membership_t")}</h1>
        <p className="mt-2 text-muted-foreground">{t("membership_s")}</p>
      </div>
      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {plans.map((p) => (
          <div key={p.id} className={`relative rounded-3xl border bg-card p-6 shadow-card ${p.popular ? "border-primary" : "border-border"}`}>
            {p.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-bold text-primary-foreground">{t("most_popular")}</span>}
            <h2 className="font-display text-lg font-bold text-navy">{t(p.name)}</h2>
            <p className="mt-2"><span className="text-3xl font-bold text-navy">{inr(p.price)}</span> <span className="text-sm text-muted-foreground">/ {t(p.per)}</span></p>
            <ul className="mt-4 space-y-2 text-sm">
              {(["pf_1", "pf_2", "pf_3"] as const).map((k) => (
                <li key={k} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />{t(k)}</li>
              ))}
            </ul>
            <button onClick={() => toast.info(t("payments_soon_s"), { description: t("payments_soon_t") })} className={`mt-5 w-full rounded-lg py-2.5 font-semibold ${p.popular ? "bg-primary text-primary-foreground hover:bg-primary/90" : "border border-primary text-primary"}`}>
              {t("choose_plan")}
            </button>
          </div>
        ))}
      </div>
      <p className="mt-6 flex items-start justify-center gap-1.5 text-center text-xs text-muted-foreground">
        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {t("payments_soon_t")}
      </p>
    </div>
  );
}
