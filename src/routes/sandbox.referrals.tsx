import { createFileRoute } from "@tanstack/react-router";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { inr } from "@/lib/courses";
import { saleCommission } from "@/lib/mock-rules";
import { pageMeta } from "@/lib/route-meta";
export const Route = createFileRoute("/sandbox/referrals")({ head: () => pageMeta("Sample Referrals", "Preview referral sales with fictional commission amounts."), component: Screen });
function Screen() {
  const { t } = useLang(); const [copied, setCopied] = useState(false);
  const rows = [{ key: "verified_sale", kind: "sale", verified: true }, { key: "pending_sale", kind: "sale", verified: false }, { key: "signup_only", kind: "signup", verified: true }] as const;
  return <><h1 className="font-display text-3xl font-bold">{t("referrals")}</h1><p className="mt-3 max-w-2xl text-sm text-muted-foreground">{t("commission_rule")}</p>
    <div className="my-6 flex flex-wrap items-end gap-4"><div><p className="text-sm text-muted-foreground">{t("referral_code")}</p><p className="mt-1 font-mono text-xl font-bold">CS-TEST-001</p></div><Button variant="outline" onClick={async () => { try { await navigator.clipboard.writeText("CS-TEST-001"); setCopied(true); } catch { setCopied(false); } }}>{copied ? <Check/> : <Copy/>}{t(copied ? "copied" : "copy")}</Button></div>
    <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-border"><tr><th className="p-3">{t("sample_customer")}</th><th className="p-3">{t("status")}</th><th className="p-3 text-right">{t("commission")}</th></tr></thead><tbody>{rows.map((r, i) => <tr key={r.key} className="border-b border-border"><td className="p-3">{t("sample_customer")} {i + 1}</td><td className="p-3">{t(r.key)}</td><td className="p-3 text-right font-semibold">{inr(saleCommission(r.kind, r.verified, 200))}</td></tr>)}</tbody></table></div>
  </>;
}