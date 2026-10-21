import { createFileRoute } from "@tanstack/react-router";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { inr } from "@/lib/courses";
import { useMock } from "@/lib/mock-store";
import { pageMeta } from "@/lib/route-meta";
export const Route = createFileRoute("/sandbox/wallet")({ head: () => pageMeta("Test Wallet", "Simulate a withdrawal without transferring real money."), component: Screen });
function Screen() {
  const { t } = useLang(); const { state, update } = useMock();
  return <><h1 className="font-display text-3xl font-bold">{t("wallet")}</h1><section className="my-6 border-y border-border py-6"><Wallet className="text-success"/><p className="mt-3 text-sm text-muted-foreground">{t("balance")}</p><p className="my-2 text-4xl font-bold">{inr(state.withdrawal === "none" ? 200 : 0)}</p><Button disabled={state.withdrawal !== "none"} onClick={() => update((s) => ({ ...s, withdrawal: "pending" }))}>{t("withdraw")}</Button>{state.withdrawal !== "none" && <p role="status" className="mt-3 text-sm text-muted-foreground">{t(state.withdrawal === "approved" ? "test_payout_approved" : "withdraw_done")}</p>}</section>
    <h2 className="font-display text-xl font-bold">{t("transactions")}</h2>{state.withdrawal === "none" ? <p className="mt-3 text-muted-foreground">{t("no_transactions")}</p> : <div className="mt-3 flex justify-between gap-3 border-b border-border py-4"><span>{t("withdraw")}</span><span>{inr(200)}</span><span className="text-success">{t(state.withdrawal === "approved" ? "test_payout_approved" : "pending")}</span></div>}
  </>;
}