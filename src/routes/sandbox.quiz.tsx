import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { sampleQuestions } from "@/lib/courses";
import { useMock } from "@/lib/mock-store";
import { quizPassed } from "@/lib/mock-rules";
import { pageMeta } from "@/lib/route-meta";
export const Route = createFileRoute("/sandbox/quiz")({ head: () => pageMeta("Practice Quiz", "Test sample chart and risk knowledge without a live exam."), component: Screen });
function Screen() {
  const { t } = useLang(); const { update } = useMock(); const [answers, setAnswers] = useState<number[]>([-1, -1, -1]); const [result, setResult] = useState<boolean | null>(null);
  return <section className="max-w-2xl"><h1 className="font-display text-3xl font-bold">{t("quiz")}</h1><p className="mt-2 text-sm text-muted-foreground">{t("quiz_rule")}</p>
    <form onSubmit={(e) => { e.preventDefault(); const passed = quizPassed(answers, sampleQuestions.map((q) => q.correct)); setResult(passed); update((s) => ({ ...s, passed })); }}>
      {sampleQuestions.map((q, i) => <fieldset className="my-6 border-b border-border pb-6" key={q.question}><legend className="mb-3 font-semibold">{i + 1}. {t(q.question)}</legend>{q.options.map((option, j) => <label key={option} className="mb-2 flex cursor-pointer items-center gap-3 rounded-md border border-border p-3"><input type="radio" required name={`question-${i}`} checked={answers[i] === j} onChange={() => setAnswers((a) => a.map((v, k) => k === i ? j : v))} value={j} disabled={result !== null} className="accent-primary"/>{t(option)}</label>)}</fieldset>)}
      {result === null && <Button type="submit">{t("submit_quiz")}</Button>}
    </form>
    {result !== null && <div role="status" className="mt-5"><p className={`font-semibold ${result ? "text-success" : "text-destructive"}`}>{t(result ? "quiz_pass" : "quiz_fail")}</p><div className="mt-3 flex gap-2"><Button variant="outline" onClick={() => { setResult(null); setAnswers([-1, -1, -1]); }}>{t("retry_quiz")}</Button>{result && <Button asChild><Link to="/sandbox/certificates">{t("certificates")}</Link></Button>}</div></div>}
  </section>;
}