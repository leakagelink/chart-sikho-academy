import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import type { Database } from '@/integrations/supabase/types';

type QuizQuestion = { id: string; topic: string; question: string; option_a: string; option_b: string; option_c: string; option_d: string; marks: number };
type CertificateRef = { certificate_no: string; status: string } | null;
export type CourseQuizState = {
  enrolled: boolean; totalLessons: number; completedLessons: number; unlocked: boolean; certificate: CertificateRef; bestPercent: number | null;
  attemptsUsed: number; attemptsLeft: number; questions: QuizQuestion[];
  quiz: { id: string; title: string; time_limit_minutes: number; pass_percent: number; max_attempts: number } | null;
};

/** Final quiz linked to the course: unlocked after every lesson is complete; questions never include answer keys. */
export const getCourseQuiz = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { courseId: string }) => z.object({ courseId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const r = await context.supabase.rpc('get_course_quiz', { _course_id: data.courseId });
    if (r.error) throw new Error('Unable to load quiz');
    const v = r.data as Partial<CourseQuizState>;
    return { enrolled: !!v.enrolled, totalLessons: v.totalLessons ?? 0, completedLessons: v.completedLessons ?? 0, unlocked: !!v.unlocked, certificate: v.certificate ?? null, bestPercent: v.bestPercent ?? null, attemptsUsed: v.attemptsUsed ?? 0, attemptsLeft: v.attemptsLeft ?? 0, questions: v.questions ?? [], quiz: v.quiz ?? null } satisfies CourseQuizState;
  });

const quizErrors = ['No attempts left', 'Complete the course first', 'Quiz not available', 'Not enrolled', 'Account paused'];
/** Scored in the database; issues the certificate automatically at 80% or more. */
export const submitQuizAttempt = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { courseId: string; answers: Record<string, string> }) => z.object({ courseId: z.string().uuid(), answers: z.record(z.string().uuid(), z.enum(['a', 'b', 'c', 'd'])) }).parse(i))
  .handler(async ({ context, data }) => {
    const r = await context.supabase.rpc('submit_course_quiz', { _course_id: data.courseId, _answers: data.answers });
    if (r.error) throw new Error(quizErrors.find(m => r.error.message.includes(m)) ?? 'Unable to save attempt');
    return r.data as { score: number; total: number; percent: number; passed: boolean; correct: Record<string, string>; certificate: CertificateRef };
  });

/** Enrolled student writes one review per course; it shows after admin approval. */
export const submitReview = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { courseId: string; rating: number; comment: string }) => z.object({ courseId: z.string().uuid(), rating: z.number().int().min(1).max(5), comment: z.string().trim().max(1000).default('') }).parse(i))
  .handler(async ({ context, data }) => {
    const r = await context.supabase.from('course_reviews').insert({ user_id: context.userId, course_id: data.courseId, rating: data.rating, comment: data.comment }).select('id').single();
    if (r.error) throw new Error(r.error.code === '23505' ? 'Review already submitted' : 'Unable to save review');
    return { id: r.data.id };
  });

/** Approved reviews for a course, readable by everyone. */
export const getCourseReviews = createServerFn({ method: 'POST' })
  .inputValidator((i: { courseId: string }) => z.object({ courseId: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    const key = process.env['SUPABASE_PUBLISHABLE_KEY']!;
    const pub = createClient<Database>(process.env['SUPABASE_URL']!, key, {
      auth: { persistSession: false },
      global: { fetch: (input, init) => { const h = new Headers(init?.headers); if (key.startsWith('sb_') && h.get('Authorization') === `Bearer ${key}`) h.delete('Authorization'); h.set('apikey', key); return fetch(input, { ...init, headers: h }); } },
    });
    const r = await pub.from('course_reviews').select('id,rating,comment,created_at').eq('course_id', data.courseId).eq('status', 'approved').order('created_at', { ascending: false }).limit(50);
    if (r.error) throw new Error('Unable to load reviews');
    return r.data;
  });
