import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useLang } from '@/lib/i18n';
import { inr } from '@/lib/courses';
import { Button } from '@/components/ui/button';
import { ManualPayForm, PaymentDialog } from './ManualPay';

type Course = { id: string; title: string };

/** Popup body for a course card: sign in, open if enrolled, membership/free enrol, or UPI payment. */
function CoursePurchaseBody({ course, amount, onDone }: { course: Course; amount: number; onDone: () => void }) {
  const { t } = useLang(); const { session } = useAuth(); const qc = useQueryClient();
  const userId = session?.user.id;
  const enrolled = useQuery({ queryKey: ['cloud-enrollment', userId, course.id], enabled: !!userId, queryFn: async () => { const r = await supabase.from('enrollments').select('id').eq('user_id', userId ?? '').eq('course_id', course.id).maybeSingle(); if (r.error) throw r.error; return r.data; } });
  const member = useQuery({ queryKey: ['membership-category', 'courses', userId], enabled: !!userId && amount > 0, queryFn: async () => { const r = await supabase.rpc('has_membership_category', { _category: 'courses' }); if (r.error) throw r.error; return r.data; } });
  const enroll = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('Login required');
      const r = amount === 0 ? await supabase.from('enrollments').insert({ user_id: userId, course_id: course.id }) : await supabase.rpc('member_enroll', { _course_id: course.id });
      if (r.error && r.error.code !== '23505') throw r.error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cloud-enrollment'] }),
  });
  const openCourse = <Button asChild className="w-full"><Link to="/courses/$courseId" params={{ courseId: course.id }}>{t('go_to_course')}</Link></Button>;
  if (!session) return <div className="space-y-3"><p className="text-sm text-muted-foreground">{t('purchase_signin')}</p><Button asChild className="w-full"><Link to="/auth" search={{ redirect: `/courses/${course.id}` }}>{t('session_signin')}</Link></Button></div>;
  if (enrolled.isPending || (amount > 0 && member.isPending)) return <p className="text-sm text-muted-foreground">{t('admin_loading')}</p>;
  if (enrolled.isError || member.isError) return <p role="alert" className="text-sm text-destructive">{t('admin_error')}</p>;
  if (enrolled.data) return <div className="space-y-3"><p className="font-semibold text-success">{t('enrolled')}</p>{openCourse}</div>;
  if (amount === 0 || member.data) return <div className="space-y-3">
    <Button className="w-full" disabled={enroll.isPending} onClick={() => enroll.mutate()}>{t(amount === 0 ? 'enroll_free' : 'member_enroll')}</Button>
    {enroll.isError && <p role="alert" className="text-sm text-destructive">{t('admin_error')}</p>}
  </div>;
  return <ManualPayForm course={{ id: course.id, title: course.title, price: amount }} userId={session.user.id} onDone={onDone} />;
}

/** Card CTA: Buy now / Enroll free opens the purchase popup instead of leaving the page. */
export function CoursePurchaseButton({ course, amount }: { course: Course; amount: number }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  return <>
    <Button className="course-cta mt-3 w-full gap-1.5" onClick={() => setOpen(true)}><BookOpen className="h-4 w-4" />{amount ? t('buy_now') : t('enroll_free')}</Button>
    <PaymentDialog open={open} onOpenChange={setOpen} title={amount ? t('pay_upi_title') : t('enroll_free')} description={`${course.title}${amount ? ` · ${inr(amount)}` : ''}`}>
      {open && <CoursePurchaseBody course={course} amount={amount} onDone={() => setOpen(false)} />}
    </PaymentDialog>
  </>;
}
