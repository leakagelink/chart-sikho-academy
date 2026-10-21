import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { useMock } from "@/lib/mock-store";
import { inr } from "@/lib/courses";
import { pageMeta } from "@/lib/route-meta";
export const Route = createFileRoute("/sandbox/admin/sales")({ head: () => pageMeta("Mock Sales and Payouts", "Inspect fictional sales and simulate payout approval without sending money."), component: Screen });
function Screen() { const { t } = useLang(); const { state, update } = useMock(); return <><h1 className="font-display text-3xl font-bold">{t("admin_sales")}</h1><section className="my-6 border-y border-border py-5"><p className="font-semibold">SAMPLE-SALE-001 · {t("verified_sale")}</p><p className="mt-2">{t("sample_price")}: {inr(1999)} · {t("commission")}: {inr(200)}</p><p className="mt-3 text-sm text-muted-foreground">{t("commission_rule")}</p></section>{state.withdrawal === "none" ? <p>{t("no_transactions")}</p> : <div><p>{t("withdraw")}: {inr(200)}</p><p role="status" className="my-3 text-sm text-success">{t(state.withdrawal === "approved" ? "test_payout_approved" : "pending")}</p><Button disabled={state.withdrawal === "approved"} onClick={() => update((s) => ({ ...s, withdrawal: "approved" }))}>{t("approve_test")}</Button></div>}</>; }