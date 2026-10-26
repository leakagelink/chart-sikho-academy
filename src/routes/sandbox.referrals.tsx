import { createFileRoute } from "@tanstack/react-router";
import { Copy, Check, Users, IndianRupee, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { inr } from "@/lib/courses";
import { saleCommission } from "@/lib/mock-rules";
import { pageMeta } from "@/lib/route-meta";

export const Route = createFileRoute("/sandbox/referrals")({
  head: () => pageMeta("Sample Referrals", "Preview referral sales with fictional commission amounts."),
  component: Screen,
});

const CODE = "CS-TEST-001";
const levels = [
  { level: 1, count: 15, people: 5 },
  { level: 2, count: 64, people: 4 },
  { level: 3, count: 64, people: 3 },
] as const;

function Screen() {
  const { t } = useLang();
  const [copied, setCopied] = useState(false);
  const rows = [
    { key: "verified_sale", kind: "sale", verified: true },
    { key: "pending_sale", kind: "sale", verified: false },
    { key: "signup_only", kind: "signup", verified: true },
  ] as const;

  return (
    <>
      <h1 className="font-display text-3xl font-bold">{t("referrals")}</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted-foreground">{t("commission_rule")}</p>

      {/* Referral code card — blueprint My Referral */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold/30 bg-gold/10 p-4">
        <p className="font-mono text-xl font-bold tracking-wider text-gold">{CODE}</p>
        <Button variant="outline" onClick={async () => { try { await navigator.clipboard.writeText(CODE); setCopied(true); } catch { setCopied(false); } }}>
          {copied ? <Check /> : <Copy />}{t(copied ? "copied" : "copy")}
        </Button>
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        {[
          { icon: UserPlus, value: "125", label: t("total_referrals") },
          { icon: Users, value: "482", label: t("team_members") },
          { icon: IndianRupee, value: inr(25430), label: t("total_earnings") },
        ].map(({ icon: Icon, value, label }) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-3 text-center shadow-card sm:p-4">
            <Icon className="mx-auto h-5 w-5 text-gold" />
            <p className="mt-2 font-display text-lg font-bold sm:text-2xl">{value}</p>
            <p className="text-[11px] text-muted-foreground sm:text-xs">{label}</p>
          </div>
        ))}
      </div>

      {/* Team tree */}
      <div className="mt-6 rounded-2xl border border-border bg-card p-4 shadow-card sm:p-6">
        <div className="flex flex-col items-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-gold font-display text-lg font-bold text-navy">{t("you").charAt(0)}</span>
          <p className="mt-1 text-sm font-semibold">{t("you")}</p>
        </div>
        {levels.map((l) => (
          <div key={l.level} className="mt-5">
            <div className="mx-auto h-6 w-px bg-border" />
            <p className="text-center text-sm font-semibold text-muted-foreground">{t("level")} {l.level} ({l.count})</p>
            <div className="mt-2 flex justify-center gap-2">
              {Array.from({ length: l.people }).map((_, i) => (
                <span key={i} className="grid h-10 w-10 place-items-center rounded-full border border-border bg-muted text-xs font-bold text-muted-foreground">
                  {String.fromCharCode(65 + i)}
                </span>
              ))}
              {l.count > l.people && (
                <span className="grid h-10 w-10 place-items-center rounded-full bg-gold/15 text-xs font-bold text-gold">+{l.count - l.people}</span>
              )}
            </div>
          </div>
        ))}
        <Button className="mt-6 w-full" onClick={() => toast.info(t("test_mode"))}>{t("view_full_team")}</Button>
        <p className="mt-3 text-center text-xs text-muted-foreground">{t("team_sample_note")}</p>
      </div>

      {/* Commission table */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border">
            <tr><th className="p-3">{t("sample_customer")}</th><th className="p-3">{t("status")}</th><th className="p-3 text-right">{t("commission")}</th></tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.key} className="border-b border-border">
                <td className="p-3">{t("sample_customer")} {i + 1}</td>
                <td className="p-3">{t(r.key)}</td>
                <td className="p-3 text-right font-semibold">{inr(saleCommission(r.kind, r.verified, 200))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
