import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { ClipboardList, Clock, Trophy } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { getCourseQuiz, submitQuizAttempt } from '@/lib/student.functions';

type Result = { score: number; total: number; percent: number; passed: boolean; correct: Record<string, string> };

export function CourseQuiz({ courseId }: { courseId: string }) {
  const { t } = useLang();
  const qc = useQueryClient();
  const fetchQuiz = useServerFn(getCourseQuiz);
  const submit = useServerFn(submitQuizAttempt);
  const q = useQuery({ queryKey: ['course-quiz', courseId], queryFn: () => fetchQuiz({ data: { courseId } }) });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<Result | null>(null);
  const mut = useMutation({
    mutationFn: () => submit({ data: { quizId: q.data!.quiz!.id, answers: answers as Record<string, 'a' | 'b' | 'c' | 'd'> } }),
    onSuccess: async (r) => { setResult(r); await qc.invalidateQueries({ queryKey: ['course-quiz', courseId] }); },
  });
  if (!q.data?.quiz) return null;
  const quiz = q.data.quiz;
  const questions = q.data.questions;
  if (!questions.length) return null;
  const opts = (question: { option_a: string; option_b: string; option_c: string; option_d: string }) =>
    (['a', 'b', 'c', 'd'] as const).filter((k) => question[`option_${k}`]);
  return (
    <section className="mt-10 rounded-2xl border border-border bg-card p-5">
      <h2 className="flex items-center gap-2 font-display text-xl font-bold"><ClipboardList className="text-primary" />{quiz.title}</h2>
      <p className="mt-1 flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{quiz.time_limit_minutes} min</span>
        <span>{t('admin_pass_percent')}: {quiz.pass_percent}%</span>
        <span>{t('quiz_attempts_left')}: {q.data.attemptsLeft}</span>
      </p>
      {result ? (
        <div className="mt-5">
          <p className={`flex items-center gap-2 text-lg font-bold ${result.passed ? 'text-success' : 'text-destructive'}`}>
            <Trophy className="h-5 w-5" />{result.passed ? t('quiz_passed') : t('quiz_failed')} — {result.score}/{result.total} ({result.percent}%)
          </p>
          <ul className="mt-4 space-y-3">
            {questions.map((question, i) => {
              const chosen = answers[question.id];
              const right = result.correct[question.id];
              return (
                <li key={question.id} className="rounded-xl border border-border p-3 text-sm">
                  <p className="font-medium">{i + 1}. {question.question}</p>
                  <p className="mt-1 text-muted-foreground">{t('quiz_your_answer')}: {chosen ? chosen.toUpperCase() : '—'} · {t('admin_correct')}: {right?.toUpperCase()}</p>
                </li>
              );
            })}
          </ul>
          {q.data.attemptsLeft > 0 && <Button className="mt-4" variant="outline" onClick={() => { setResult(null); setAnswers({}); }}>{t('quiz_retry')}</Button>}
        </div>
      ) : q.data.attemptsLeft === 0 ? (
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
          {mut.isError && <p role="alert" className="text-destructive">{mut.error.message === 'No attempts left' ? t('quiz_no_attempts') : t('admin_error')}</p>}
          <Button type="submit" disabled={mut.isPending || !Object.keys(answers).length}>{t('quiz_submit')}</Button>
        </form>
      )}
    </section>
  );
}
