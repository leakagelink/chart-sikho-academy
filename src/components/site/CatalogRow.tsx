import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useLang } from '@/lib/i18n';
import { inr } from '@/lib/courses';
import { Button } from '@/components/ui/button';
import { coursePaymentAmount } from '@/lib/payment-upi';
import { ProductSocial } from './ProductSocial';

/** Phone catalog card: small full thumbnail on the left, details on the right, footer row below. */
export function CatalogRow({ thumb, label, fallbackIcon, title, meta, footer }: { thumb?: string | null; label: string; fallbackIcon?: ReactNode; title: ReactNode; meta?: ReactNode; footer: ReactNode }) {
  return <article className="catalog-row flex min-w-0 flex-col rounded-2xl border border-gold/30 bg-card p-4 shadow-card">
    <div className="grid min-w-0 grid-cols-[6.5rem_minmax(0,1fr)] gap-4">
      <div className="grid aspect-square w-full place-items-center overflow-hidden rounded-xl border border-gold/30 bg-muted">
        {thumb ? <img src={thumb} alt="" loading="lazy" decoding="async" className="h-full w-full object-contain" /> : <span className="flex flex-col items-center gap-2 px-1 text-center text-xs font-semibold text-foreground">{fallbackIcon ?? <TrendingUp className="size-7 text-gold" aria-hidden="true" />}<span className="line-clamp-2">{label}</span></span>}
      </div>
      <div className="flex min-w-0 flex-col gap-1.5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gold">{label}</p>
        <h3 className="line-clamp-2 font-display text-lg font-bold leading-snug text-card-foreground">{title}</h3>
        {meta}
      </div>
    </div>
    <div className="mt-4 border-t border-border pt-3">{footer}</div>
  </article>;
}

/** Course ids the signed-in student is enrolled in (one query shared by all phone course cards). */
function useMyEnrolledCourses() {
  const { session } = useAuth();
  const userId = session?.user.id;
  return useQuery({ queryKey: ['my-enrolled-course-ids', userId], enabled: !!userId, staleTime: 30000, queryFn: async () => {
    const r = await supabase.from('enrollments').select('course_id').eq('user_id', userId ?? '');
    if (r.error) throw r.error;
    return new Set(r.data.map((x) => x.course_id));
  } });
}

type Course = { id: string; title: string; price: number; sale_price: number | null; thumbnail_url: string; instructor: string; description: string };

export function CourseRowCard({ course: c }: { course: Course }) {
  const { t } = useLang();
  const enrolled = useMyEnrolledCourses();
  const amount = coursePaymentAmount(c);
  const isEnrolled = !!enrolled.data?.has(c.id);
  const link = (child: ReactNode, cls: string) => <Link to="/courses/$courseId" params={{ courseId: c.id }} className={cls}>{child}</Link>;
  return <CatalogRow
    thumb={c.thumbnail_url}
    label={t('nav_courses')}
    title={link(c.title, 'hover:text-gold')}
    meta={<>
      {c.instructor && <p className="truncate text-sm text-muted-foreground">{t('course_by')} {c.instructor}</p>}
      <ProductSocial compact kind="course" id={c.id} title={c.title} className="-ml-2" />
    </>}
    footer={<div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
      <p className="flex min-w-0 flex-wrap items-baseline gap-x-2">
        <span className="font-display text-2xl font-bold text-gold">{amount ? inr(amount) : t('session_free')}</span>
        {amount !== c.price && c.price > 0 && <s className="text-sm text-muted-foreground">{inr(c.price)}</s>}
      </p>
      {isEnrolled
        ? link(t('enrolled'), 'rounded-xl border border-success/60 px-4 py-2.5 text-sm font-bold text-success')
        : <Button asChild className="blueprint-gold rounded-xl px-5 py-2.5 font-bold">{link(t('view_details'), '')}</Button>}
    </div>}
  />;
}
