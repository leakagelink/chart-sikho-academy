import { createFileRoute, Link } from "@tanstack/react-router";
import { Award, Download, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { useMock } from "@/lib/mock-store";
import { certificateEligible } from "@/lib/mock-rules";
import { pageMeta } from "@/lib/route-meta";
export const Route = createFileRoute("/sandbox/certificates")({ head: () => pageMeta("Sample Certificates", "Preview a clearly marked sample completion certificate."), component: Screen });
function Screen() {
  const { t } = useLang(); const { state } = useMock(); const eligible = certificateEligible(state.completed, state.passed);
  function download() {
    const url = URL.createObjectURL(new Blob([`${t("certificate_sample")}\nChartसीखो\n${t("certificate_title")}\n${t("certificate_award")}: ${t("test_profile")}\n${t("mock_course")}\nID: SAMPLE-CS-001\n${t("disclaimer")}`], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = "ChartSikho-SAMPLE-certificate.txt"; a.click(); URL.revokeObjectURL(url);
  }
  return <><h1 className="font-display text-3xl font-bold">{t("certificates")}</h1>{!eligible ? <div className="py-12"><Lock className="mb-4 text-muted-foreground"/><p>{t("certificate_locked")}</p><Button asChild className="mt-4"><Link to="/sandbox/learn">{t("continue_learning")}</Link></Button></div> : <>
    <article className="mt-6 max-w-3xl border-4 border-gold bg-card px-6 py-10 text-center"><p className="text-xs font-semibold text-destructive">{t("certificate_sample")}</p><Award className="mx-auto my-6 h-12 w-12 text-gold"/><p className="font-display text-xl font-bold">Chartसीखो</p><h2 className="mt-2 font-display text-3xl font-bold">{t("certificate_title")}</h2><p className="mt-6 text-muted-foreground">{t("certificate_award")}</p><p className="mt-2 font-display text-2xl font-bold">{t("test_profile")}</p><p className="mt-4">{t("mock_course")}</p><p className="mt-6 text-xs text-muted-foreground">SAMPLE-CS-001</p><p className="mt-4 text-xs text-muted-foreground">{t("disclaimer")}</p></article>
    <Button onClick={download} className="mt-4"><Download/>{t("download_certificate")}</Button></>}</>;
}