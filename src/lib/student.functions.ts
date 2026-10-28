import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { quizScore } from './admin-rules';
import type { Database } from '@/integrations/supabase/types';

/** Published quiz for an enrolled student: questions without answer keys, plus attempts left. */
export const getCourseQuiz = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { courseId: string }) => z.object({ courseId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const s = context.supabase;
    const en = await s.from('enrollments').select('id').eq('user_id', context.userId).eq('course_id', data.courseId).maybeSingle();
    if (!en.data) return { quiz: null, questions: [], attemptsUsed: 0, attemptsLeft: 0 };
    const qz = await s.from('quizzes').select('id,title,time_limit_minutes,pass_percent,max_attempts').eq('course_id', data.courseId).eq('status', 'published').limit(1).maybeSingle();
    if (!qz.data) return { quiz: null, questions: [], attemptsUsed: 0, attemptsLeft: 0 };
    const [qs, at] = await Promise.all([
      s.from('quiz_questions').select('id,topic,question,option_a,option_b,option_c,option_d,marks').eq('quiz_id', qz.data.id).order('created_at'),
      s.from('quiz_attempts').select('id', { count: 'exact', head: true }).eq('quiz_id', qz.data.id).eq('user_id', context.userId),
    ]);
    const used = at.count ?? 0;
    return { quiz: qz.data, questions: qs.data ?? [], attemptsUsed: used, attemptsLeft: Math.max(0, qz.data.max_attempts - used) };
  });

/** Scores an attempt server-side and stores it; the database enforces the attempt limit. */
export const submitQuizAttempt = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { quizId: string; answers: Record<string, string> }) => z.object({ quizId: z.string().uuid(), answers: z.record(z.enum(['a', 'b', 'c', 'd'])) }).parse(i))
  .handler(async ({ context, data }) => {
    const s = context.supabase;
    const qz = await s.from('quizzes').select('id,pass_percent,negative_marks,max_attempts').eq('id', data.quizId).eq('status', 'published').maybeSingle();
    if (!qz.data) throw new Error('Quiz not available');
    const qs = await s.from('quiz_questions').select('id,correct_option,marks').eq('quiz_id', data.quizId);
    if (!qs.data?.length) throw new Error('Quiz not available');
    const answers = qs.data.map(q => ({ correct: q.correct_option, chosen: data.answers[q.id] ?? null, marks: q.marks }));
    const result = quizScore(answers, Number(qz.data.negative_marks), qz.data.pass_percent);
    const ins = await s.from('quiz_attempts').insert({ quiz_id: data.quizId, user_id: context.userId, score: result.score, total: result.total, percent: result.percent, passed: result.passed }).select('id').single();
    if (ins.error) throw new Error(ins.error.code === '42501' ? 'No attempts left' : 'Unable to save attempt');
    return { ...result, correct: Object.fromEntries(qs.data.map(q => [q.id, q.correct_option])) };
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
