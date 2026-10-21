import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Download, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { sampleLessons } from "@/lib/courses";
import { useMock } from "@/lib/mock-store";
import { pageMeta } from "@/lib/route-meta";
export const Route = createFileRoute("/sandbox/learn")({ head: () => pageMeta("Sample Learning Studio", "Study a sample chart lesson, take notes and complete practice lessons."), component: Screen });
function Screen() {
  const { t } = useLang(); const { state, update } = useMock(); const [index, setIndex] = useState(0);
  const lesson = sampleLessons[index]; if (!lesson) return null;
  function download() {
    if (!lesson) return;
    const url = URL.createObjectURL(new Blob([`${t(lesson.title)}\n\n${t(lesson.body)}\n\n${t("disclaimer")}`], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = "ChartSikho-sample-notes.txt"; a.click(); URL.revokeObjectURL(url);
  }
  return <><h1 className="font-display text-3xl font-bold">{t("mock_learning")}</h1>
    <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_280px]">
      <section className="min-w-0"><video key={index} controls playsInline preload="metadata" className="aspect-video w-full rounded-md bg-navy" aria-label={t("sample_video")}><source src="/media/chart-sample.webm" type="video/webm"/><source src="/media/chart-sample.mp4" type="video/mp4"/></video>
        <p className="mt-2 text-xs text-muted-foreground">{t("sample_video")}</p><h2 className="mt-4 font-display text-2xl font-bold">{index + 1}. {t(lesson.title)}</h2>
        <p className="mt-3 leading-7">{t(lesson.body)}</p>
        <div className="mt-5 flex flex-wrap gap-2"><Button onClick={() => update((s) => ({ ...s, completed: [...new Set([...s.completed, index])] }))} disabled={state.completed.includes(index)}><Check />{t(state.completed.includes(index) ? "completed" : "complete_lesson")}</Button>
          {index < 2 ? <Button variant="outline" onClick={() => setIndex(index + 1)}>{t("next_lesson")}<ArrowRight /></Button> : <Button variant="outline" asChild><Link to="/sandbox/quiz">{t("quiz")}<ArrowRight /></Link></Button>}
          <Button variant="ghost" onClick={download}><Download />{t("download_notes")}</Button></div>
        <label className="mt-6 block text-sm font-semibold" htmlFor="lesson-note">{t("personal_notes")}</label><textarea id="lesson-note" value={state.notes[index] || ""} onChange={(e) => { const value = e.target.value; update((s) => ({ ...s, notes: s.notes.map((note, i) => i === index ? value : note) })); }} rows={4} className="mt-2 w-full rounded-md border border-input bg-background p-3" />
      </section>
      <aside><h2 className="font-display text-lg font-bold">{t("curriculum")}</h2><div className="mt-3 flex flex-col gap-2">{sampleLessons.map((l, i) => <Button key={l.title} variant={index === i ? "secondary" : "ghost"} className="h-auto min-h-12 justify-start whitespace-normal text-left" onClick={() => setIndex(i)} aria-pressed={index === i}>{state.completed.includes(i) && <Check className="text-success"/>}{i + 1}. {t(l.title)}</Button>)}</div><p className="mt-5 text-sm text-muted-foreground">{state.completed.length}/3 {t("completed")}</p></aside>
    </div></>;
}