import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Download, ArrowRight, MessageCircleQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { sampleLessons } from "@/lib/courses";
import { useMock } from "@/lib/mock-store";
import { pageMeta } from "@/lib/route-meta";
import educator from "@/assets/course-educator.jpg";

export const Route = createFileRoute("/sandbox/learn")({
  head: () => pageMeta("Sample Learning Studio", "Study a sample chart lesson, take notes and complete practice lessons."),
  component: Screen,
});

function Screen() {
  const { t } = useLang();
  const { state, update } = useMock();
  const [index, setIndex] = useState(0);
  const [tab, setTab] = useState<"notes" | "downloads" | "qa">("notes");
  const lesson = sampleLessons[index];
  if (!lesson) return null;

  function download() {
    if (!lesson) return;
    const url = URL.createObjectURL(new Blob([`${t(lesson.title)}\n\n${t(lesson.body)}\n\n${t("disclaimer")}`], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "ChartSikho-sample-notes.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="lesson-screen">
      <h1 className="font-display text-3xl font-bold">{t("mock_learning")}</h1>
      <div className="lesson-grid mt-5 grid gap-6 lg:grid-cols-[1fr_280px]">
        <section className="min-w-0">
          <video key={index} poster={educator} controls playsInline preload="none" className="aspect-video w-full rounded-2xl bg-navy" aria-label={t("sample_video")}>
            <source src="/media/chart-sample.webm" type="video/webm" />
            <source src="/media/chart-sample.mp4" type="video/mp4" />
          </video>
          <p className="mt-2 text-xs text-muted-foreground">{t("sample_video")}</p>
          <h2 className="lesson-heading mt-4 font-display text-2xl font-bold">{index + 1}. {t(lesson.title)}</h2>
          <div className="lesson-actions mt-5 flex flex-wrap gap-2">
            <Button onClick={() => update((s) => ({ ...s, completed: [...new Set([...s.completed, index])] }))} disabled={state.completed.includes(index)}>
              <Check />{t(state.completed.includes(index) ? "completed" : "complete_lesson")}
            </Button>
            {index < 2 ? (
              <Button variant="outline" onClick={() => setIndex(index + 1)}>{t("next_lesson")}<ArrowRight /></Button>
            ) : (
              <Button variant="outline" asChild><Link to="/sandbox/quiz">{t("quiz")}<ArrowRight /></Link></Button>
            )}
          </div>

          {/* Notes / Downloads / Q&A tabs — blueprint video player */}
          <div className="mt-6 flex gap-1 border-b border-border" role="tablist">
            {(["notes", "downloads", "qa"] as const).map((k) => (
              <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
                className={`rounded-t-xl px-4 py-2.5 text-sm font-semibold ${tab === k ? "border border-b-0 border-border bg-card text-gold" : "text-muted-foreground hover:text-foreground"}`}>
                {t(k === "notes" ? "tab_notes" : k === "downloads" ? "tab_downloads" : "tab_qa")}
              </button>
            ))}
          </div>
          {tab === "notes" && (
            <div className="lesson-notes mt-4">
              <p className="leading-7 text-sm text-muted-foreground">{t(lesson.body)}</p>
              <label className="mt-4 block text-sm font-semibold" htmlFor="lesson-note">{t("personal_notes")}</label>
              <textarea id="lesson-note" value={state.notes[index] || ""} rows={4}
                onChange={(e) => { const value = e.target.value; update((s) => ({ ...s, notes: s.notes.map((note, i) => (i === index ? value : note)) })); }}
                className="mt-2 w-full rounded-md border border-input bg-background p-3" />
            </div>
          )}
          {tab === "downloads" && (
            <div className="lesson-tab-content mt-4 rounded-2xl border border-border bg-card p-4">
              <p className="text-sm font-semibold">{t(lesson.title)} — {t("tab_notes")}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("lesson_notes")} · TXT</p>
              <Button variant="outline" className="mt-3" onClick={download}><Download />{t("download_notes")}</Button>
            </div>
          )}
          {tab === "qa" && (
            <div className="lesson-tab-content mt-4 space-y-3">
              <article className="rounded-2xl border border-border bg-card p-4">
                <p className="flex items-start gap-2 text-sm font-semibold"><MessageCircleQuestion className="mt-0.5 h-4 w-4 shrink-0 text-gold" />{t("qa_sample_q")}</p>
                <p className="mt-2 pl-6 text-sm text-muted-foreground">{t("qa_sample_a")}</p>
              </article>
              <p className="text-xs text-muted-foreground">{t("chat_sample")}</p>
            </div>
          )}
        </section>

        <aside>
          <h2 className="font-display text-lg font-bold">{t("curriculum")}</h2>
          <div className="mt-3 flex flex-col gap-2">
            {sampleLessons.map((l, i) => (
              <button key={l.title} onClick={() => setIndex(i)} aria-pressed={index === i}
                className={`flex min-h-12 items-center gap-3 rounded-xl border p-3 text-left text-sm ${index === i ? "border-gold/40 bg-gold/10" : "border-border bg-card"}`}>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gold/15 font-bold text-gold">
                  {state.completed.includes(i) ? <Check className="h-4 w-4 text-success" /> : i + 1}
                </span>
                <span className="min-w-0 flex-1 font-medium">{t(l.title)}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{l.dur}</span>
              </button>
            ))}
          </div>
          <p className="mt-5 text-sm text-muted-foreground">{state.completed.length}/3 {t("completed")}</p>
        </aside>
      </div>
    </div>
  );
}
