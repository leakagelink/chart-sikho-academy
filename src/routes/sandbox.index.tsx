import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Award, Play, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { useMock } from "@/lib/mock-store";
import { pageMeta } from "@/lib/route-meta";
import { certificateEligible } from "@/lib/mock-rules";
import { courses, inr } from "@/lib/courses";
export const Route = createFileRoute("/sandbox/")({ head: () => pageMeta("Student Test Portal", "Explore sample learning and local-only test progress."), component: Screen });
function Screen() {
  const { t, lang } = useLang(); const { state } = useMock();
  return <>
    <p className="text-muted-foreground">{t("namaste")}</p><h1 className="font-display text-3xl font-bold">{t("test_profile")}</h1>
    <div className="my-6 grid grid-cols-3 gap-3">
      {([{ icon: BookOpen, value: "1", label: "my_courses" }, { icon: Play, value: `${Math.round(state.completed.length / 3 * 100)}%`, label: "test_progress" }, { icon: Award, value: certificateEligible(state.completed, state.passed) ? "1" : "0", label: "certificates" }] as const).map((item) => <div key={item.label} className="border-l-4 border-primary px-4 py-2"><item.icon className="h-5 w-5 text-primary"/><p className="mt-2 text-2xl font-semibold">{item.value}</p><p className="text-sm text-muted-foreground">{t(item.label)}</p></div>)}
    </div>
    <section className="grid items-center gap-6 border-y border-border py-6 md:grid-cols-[1fr_260px]">
      <div><h2 className="font-display text-2xl font-bold">{t("mock_course")}</h2><p className="my-3 text-muted-foreground">{state.completed.length} / 3 {t("lessons")}</p><progress className="h-2 w-full accent-primary" value={state.completed.length} max={3}/><Button asChild className="mt-4"><Link to="/sandbox/learn"><Play />{t("continue_learning")}</Link></Button></div>
      <video muted playsInline controls className="aspect-video w-full rounded-md bg-navy" aria-label={t("sample_video")}><source src="/media/chart-sample.webm" type="video/webm"/><source src="/media/chart-sample.mp4" type="video/mp4"/></video>
    </section>
    <h2 className="mt-8 font-display text-xl font-bold">{t("explore_more")}</h2>
    <div className="mt-4 flex flex-wrap gap-3">{([{ to: "/sandbox/live", key: "live_sample" },{ to: "/sandbox/quiz", key: "quiz" },{ to: "/sandbox/certificates", key: "certificates" },{ to: "/sandbox/referrals", key: "referrals" },{ to: "/sandbox/wallet", key: "wallet" },{ to: "/sandbox/admin", key: "admin_demo" }] as const).map((item) => <Button asChild variant="outline" key={item.to}><Link to={item.to}>{t(item.key)}<ArrowRight /></Link></Button>)}</div>
    <h2 className="mt-8 font-display text-xl font-bold">{t("sample_catalog")}</h2><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{state.catalog.filter((c) => c.visible).map((c) => <article key={c.id} className="rounded-md border border-border bg-card p-4"><h3 className="break-words font-semibold">{courses.find((original) => original.id === c.id)?.title[lang] || c.title}</h3><p className="my-2 text-sm text-muted-foreground">{t("sample_price")}: {inr(c.price)}</p><Button asChild variant="link" className="px-0"><Link to="/sandbox/learn">{t("preview_mock")}<ArrowRight/></Link></Button></article>)}</div>
  </>;
}