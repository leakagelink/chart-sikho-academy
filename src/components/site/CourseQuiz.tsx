import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Award, ClipboardList, Clock, Lock, Trophy } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { getCourseQuiz, submitQuizAttempt } from '@/lib/student.functions';
import { CERTIFICATE_MIN_PERCENT, earnsCertificate } from '@/lib/admin-rules';

type Cert = { certificate_no: string; status: string } | null;
type Result = { score: number; total: number; percent: number; passed: boolean; correct: Record<string, string>; certificate: Cert };

function CertificateCard({ cert }: { cert: NonNullable<Cert> }) {
  const { t } = useLang();
  const revoked = cert.status !== 'issued';
  return (
    <div className={`mt-5 rounded-xl border p-4 ${revoked ? 'border-destructive/40 bg-destructive/5' : 'border-success/40 bg-success/10'}`}>
      <p className="flex items-center gap-2 font-display text-lg font-bold"><Award className={revoked ? 'text-destructive' : 'text-success'} />{t(revoked ? 'cert_revoked_msg' : 'cert_earned')}</p>
      <p className="mt-1 text-sm text-muted-foreground">{t('admin_cert_no')}: <span className="font-mono font-semibold text-foreground">{cert.certificate_no}</span></p>
      {!revoked && <Button asChild className="mt-3" size="sm"><Link to="/verify/$certificateNo" params={{ certificateNo: cert.certificate_no }}>{t('cert_view')}</Link></Button>}
    </div>
  );
}

export function CourseQuiz({ courseId }: { courseId: string }) {
  const { t } = useLang();
  const qc = useQueryClient();
  const fetchQuiz = useServerFn(getCourseQuiz);
  const submit = useServerFn(submitQuizAttempt);
  const q = useQuery({ queryKey: ['course-quiz', courseId], queryFn: () => fetchQuiz({ data: { courseId } }) });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<Result | null>(null);
  const mut = useMutation({
    mutationFn: () => submit({ data: { courseId, answers: answers as Record<string, 'a' | 'b' | 'c' | 'd'> } }),
    onSuccess: async (r) => { setResult(r); await qc.invalidateQueries({ queryKey: ['course-quiz', courseId] }); },
  });
  const d = q.data;
  if (!d?.enrolled || (!d.quiz && !d.certificate)) return null;
  const quiz = d.quiz;
  const questions = d.questions;
  const cert = result?.certificate ?? d.certificate;
  const opts = (question: { option_a: string; option_b: string; option_c: string; option_d: string }) =>
    (['a', 'b', 'c', 'd'] as const).filter((k) => question[`option_${k}`]);
  const pct = d.totalLessons ? Math.round((d.completedLessons / d.totalLessons) * 100) : 0;
  return (
    <section className="mt-10 rounded-2xl border border-border bg-card p-5" aria-label={t('final_quiz')}>
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">{t('final_quiz')}</p>
      {quiz && <h2 className="mt-1 flex items-center gap-2 font-display text-xl font-bold"><ClipboardList className="text-primary" />{quiz.title}</h2>}
      {quiz && (
        <p className="mt-1 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{quiz.time_limit_minutes} min</span>
          <span>{t('cert_rule').replace('{p}', String(CERTIFICATE_MIN_PERCENT))}</span>
          {d.unlocked && !cert && <span>{t('quiz_attempts_left')}: {d.attemptsLeft}</span>}
        </p>
      )}
      {cert ? null : !d.unlocked ? (
        <div className="mt-5 rounded-xl border border-dashed border-border p-4">
          <p className="flex items-center gap-2 font-semibold"><Lock className="h-4 w-4 text-muted-foreground" />{t('quiz_locked')}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t('lessons_done').replace('{d}', String(d.completedLessons)).replace('{t}', String(d.totalLessons))}</p>
          <Progress value={pct} className="mt-3 h-2" aria-label={t('lessons_done').replace('{d}', String(d.completedLessons)).replace('{t}', String(d.totalLessons))} />
        </div>
      ) : result ? (
        <div className="mt-5">
          <p className={`flex items-center gap-2 text-lg font-bold ${earnsCertificate(result.percent) ? 'text-success' : 'text-destructive'}`}>
            <Trophy className="h-5 w-5" />{result.score}/{result.total} ({result.percent}%)
          </p>
          {!earnsCertificate(result.percent) && <p className="mt-1 text-sm text-muted-foreground">{t('cert_need_more').replace('{p}', String(CERTIFICATE_MIN_PERCENT))}</p>}
          <ul className="mt-4 space-y-3">
            {questions.map((question, i) => (
              <li key={question.id} className="rounded-xl border border-border p-3 text-sm">
                <p className="font-medium">{i + 1}. {question.question}</p>
                <p className="mt-1 text-muted-foreground">{t('quiz_your_answer')}: {answers[question.id]?.toUpperCase() ?? '—'} · {t('admin_correct')}: {result.correct[question.id]?.toUpperCase()}</p>
              </li>
            ))}
          </ul>
          {d.attemptsLeft > 0 && <Button className="mt-4" variant="outline" onClick={() => { setResult(null); setAnswers({}); }}>{t('quiz_retry')}</Button>}
        </div>
      ) : d.attemptsLeft === 0 || !quiz ? (
        <p className="mt-4 text-muted-foreground">{t('quiz_no_attempts')}</p>
      ) : (
        <form className="mt-5 space-y-5" onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}>
          {questions.map((question, i) => (
            <fieldset key={question.id} className="rounded-xl border border-border p-4">
              <legend className="px-1 text-sm font-medium">{i + 1}. {question.question}</legend>
              <div className="mt-2 grid gap-2">
                {opts(question).map((k) => (
                  <label key={k} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${answers[question.id] === k ? 'border-primary bg-primary/10' : 'border-border'}`}>
                    <input type="radio" name={question.id} value={k} checked={answers[question.id] === k} onChange={() => setAnswers((a) => ({ ...a, [question.id]: k }))} />
                    <span className="font-bold">{k.toUpperCase()}.</span> {question[`option_${k}`]}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          {mut.isError && <p role="alert" className="text-destructive">{mut.error.message === 'No attempts left' ? t('quiz_no_attempts') : mut.error.message === 'Complete the course first' ? t('quiz_locked') : t('admin_error')}</p>}
          <Button type="submit" disabled={mut.isPending || !Object.keys(answers).length}>{t('quiz_submit')}</Button>
        </form>
      )}
      {cert && <CertificateCard cert={cert} />}
    </section>
  );
}
