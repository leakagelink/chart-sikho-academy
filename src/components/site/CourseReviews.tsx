import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Star } from 'lucide-react';
import { toast } from 'sonner';
import { useLang } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { getCourseReviews, submitReview } from '@/lib/student.functions';

export function CourseReviews({ courseId, canReview }: { courseId: string; canReview: boolean }) {
  const { t, lang } = useLang();
  const qc = useQueryClient();
  const fetchReviews = useServerFn(getCourseReviews);
  const send = useServerFn(submitReview);
  const q = useQuery({ queryKey: ['course-reviews', courseId], queryFn: () => fetchReviews({ data: { courseId } }) });
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const mut = useMutation({
    mutationFn: () => send({ data: { courseId, rating, comment } }),
    onSuccess: () => { setComment(''); setRating(5); toast.success(t('review_pending_note')); },
    onError: (e: Error) => toast.error(e.message === 'Review already submitted' ? t('review_already') : t('admin_error')),
  });
  return (
    <section className="mt-10">
      <h2 className="font-display text-xl font-bold">{t('tab_reviews')}</h2>
      {canReview && (
        <form className="mt-4 rounded-2xl border border-border bg-card p-4" onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}>
          <div className="flex items-center gap-1" role="radiogroup" aria-label={t('admin_rating')}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" aria-label={`${n}`} aria-pressed={rating === n} onClick={() => setRating(n)}>
                <Star className={`h-6 w-6 ${n <= rating ? 'fill-gold text-gold' : 'text-muted-foreground'}`} />
              </button>
            ))}
          </div>
          <textarea className="mt-3 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" rows={3} maxLength={1000} placeholder={t('review_placeholder')} value={comment} onChange={(e) => setComment(e.target.value)} />
          <Button className="mt-3" type="submit" disabled={mut.isPending}>{t('review_submit')}</Button>
        </form>
      )}
      <div className="mt-5 space-y-3">
        {q.data?.map((r) => (
          <article key={r.id} className="rounded-xl border border-border bg-card p-4">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <span>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
              <span className="text-xs font-normal text-muted-foreground">{new Date(r.created_at).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN')}</span>
            </p>
            {r.comment && <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>}
          </article>
        ))}
        {q.data && !q.data.length && <p className="text-sm text-muted-foreground">{t('admin_empty')}</p>}
      </div>
    </section>
  );
}
