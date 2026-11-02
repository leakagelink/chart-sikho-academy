import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/earnings")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "My Earnings — Chartसीखो" },
      { name: "description", content: "Referral commissions, wallet balance and withdrawals on Chartसीखो." },
      { property: "og:title", content: "My Earnings — Chartसीखो" },
      { property: "og:description", content: "Referral commissions, wallet balance and withdrawals on Chartसीखो." },
    ],
  }),
  component: EarningsPage,
});

type Wallet = { available: number; pending: number; tds: number; withdrawn: number; requests_this_month: number; min: number; max: number; per_month: number; currency: string; kyc_required: boolean; kyc: string; cycle: string };

function EarningsPage() {
  const { t } = useLang();
  const qc = useQueryClient();
  const [amount, setAmount] = useState("");
  const wallet = useQuery({ queryKey: ["my-wallet"], queryFn: async () => { const r = await supabase.rpc("my_wallet"); if (r.error) throw new Error(r.error.message); return r.data as unknown as Wallet; } });
  const ledger = useQuery({ queryKey: ["my-ledger"], queryFn: async () => {
    const [c, p] = await Promise.all([
      supabase.from("commission_entries").select("id,amount,tds_amount,level,status,created_at").order("created_at", { ascending: false }).limit(200),
      supabase.from("payout_requests").select("id,amount,status,created_at").order("created_at", { ascending: false }).limit(100),
    ]);
    if (c.error || p.error) throw new Error("Unable to load");
    return { commissions: c.data, payouts: p.data };
  } });
  const req = useMutation({
    mutationFn: async (n: number) => { const r = await supabase.rpc("request_payout", { _amount: n }); if (r.error) throw new Error(r.error.message); },
    onSuccess: () => { setAmount(""); qc.invalidateQueries({ queryKey: ["my-wallet"] }); qc.invalidateQueries({ queryKey: ["my-ledger"] }); },
  });
  const w = wallet.data;
  const cur = w?.currency === "USD" ? "$" : "₹";
  function submit(e: FormEvent) { e.preventDefault(); const n = parseInt(amount, 10); if (n > 0) req.mutate(n); }
  const status = (s: string) => t(`admin_${s}` as never) || s;
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-display text-3xl font-bold">{t("wallet_title")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("wallet_desc")}</p>
      {wallet.error && <p className="mt-4 text-sm text-destructive">{wallet.error.message}</p>}
      {w && <>
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[["wallet_available", w.available], ["wallet_pending", w.pending], ["wallet_withdrawn", w.withdrawn], ["admin_comm_tds", w.tds]].map(([k, v]) => (
            <div key={k as string} className="rounded-lg border border-border p-3"><p className="text-xs text-muted-foreground">{t(k as never)}</p><p className="mt-1 font-display text-xl font-bold">{cur}{Number(v)}</p></div>
          ))}
        </div>
        <form onSubmit={submit} className="mt-6 rounded-lg border border-border p-4">
          <h2 className="font-display text-lg font-semibold">{t("wallet_request")}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{t("wallet_limits")}: {cur}{w.min} – {cur}{w.max} · {w.requests_this_month}/{w.per_month} · {t(`admin_opt_${w.cycle}` as never)}</p>
          {w.kyc_required && w.kyc !== "verified" && <p className="mt-2 text-sm text-destructive">{t("wallet_kyc_needed")}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <input type="number" min={w.min} max={w.max} required value={amount} onChange={(e) => setAmount(e.target.value)} aria-label={t("amount")} className="w-40 rounded-md border border-input bg-background px-3 py-2 text-sm" />
            <Button type="submit" disabled={req.isPending}>{t("wallet_request")}</Button>
          </div>
          {req.error && <p className="mt-2 text-sm text-destructive">{req.error.message}</p>}
          {req.isSuccess && <p className="mt-2 text-sm text-primary">{t("wallet_sent")}</p>}
        </form>
      </>}
      <section className="mt-6">
        <h2 className="mb-2 font-display text-lg font-semibold">{t("wallet_ledger")}</h2>
        <div className="overflow-x-auto border-y border-border"><table className="w-full text-left text-sm"><thead className="bg-muted/40"><tr><th className="px-3 py-2">{t("admin_date")}</th><th className="px-3 py-2">{t("admin_level")}</th><th className="px-3 py-2">{t("amount")}</th><th className="px-3 py-2">{t("admin_comm_tds")}</th><th className="px-3 py-2">{t("status")}</th></tr></thead>
          <tbody>{ledger.data?.commissions.length ? ledger.data.commissions.map((c) => <tr key={c.id} className="border-t border-border"><td className="px-3 py-2">{new Date(c.created_at).toLocaleDateString()}</td><td className="px-3 py-2">{c.level}</td><td className="px-3 py-2">{cur}{c.amount}</td><td className="px-3 py-2">{cur}{c.tds_amount}</td><td className="px-3 py-2">{status(c.status)}</td></tr>) : <tr><td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">{t("admin_empty")}</td></tr>}</tbody></table></div>
      </section>
      <section className="mt-6">
        <h2 className="mb-2 font-display text-lg font-semibold">{t("wallet_payouts")}</h2>
        <div className="overflow-x-auto border-y border-border"><table className="w-full text-left text-sm"><tbody>{ledger.data?.payouts.length ? ledger.data.payouts.map((p) => <tr key={p.id} className="border-t border-border"><td className="px-3 py-2">{new Date(p.created_at).toLocaleDateString()}</td><td className="px-3 py-2">{cur}{p.amount}</td><td className="px-3 py-2">{status(p.status)}</td></tr>) : <tr><td className="px-3 py-6 text-center text-muted-foreground">{t("admin_empty")}</td></tr>}</tbody></table></div>
      </section>
      <p className="mt-6 text-xs text-muted-foreground">{t("admin_real_commission")}</p>
    </main>
  );
}
