import { Link } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useLang } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, BookOpen, CheckCircle2, Circle, Star, User } from 'lucide-react';
import { useServerFn } from '@tanstack/react-start';
import { getCourseReviews } from '@/lib/student.functions';
import { inr } from '@/lib/courses';
import { ProductSocial } from './ProductSocial';
import { DetailBackLink, DetailCover, DetailDescription, ProductDetailLayout } from './ProductDetailLayout';
import { CourseQuiz } from './CourseQuiz';
import { CourseReviews } from './CourseReviews';
import { ManualPay } from './ManualPay';
import { coursePaymentAmount } from '@/lib/payment-upi';
export function CloudCourseDetail({course}:{course:{id:string;title:string;price:number;sale_price?:number|null;thumbnail_url?:string|null;description?:string|null;instructor?:string|null}}){
 const amount=coursePaymentAmount(course);const {t}=useLang();const [tab,setTab]=useState<'overview'|'curriculum'|'reviews'>('overview');const fetchReviews=useServerFn(getCourseReviews);
 const reviews=useQuery({queryKey:['course-reviews',course.id],queryFn:()=>fetchReviews({data:{courseId:course.id}})});
 const reviewCount=reviews.data?.length??0;const avg=reviewCount?(reviews.data??[]).reduce((n,r)=>n+Number(r.rating),0)/reviewCount:0;
 const only=(k:typeof tab)=>tab===k?'':'max-lg:hidden';const {session}=useAuth();const qc=useQueryClient();const [resource,setResource]=useState('');
 const enrolled=useQuery({queryKey:['cloud-enrollment',session?.user.id,course.id],enabled:!!session,queryFn:async()=>{const r=await supabase.from('enrollments').select('id').eq('user_id',session?.user.id??'').eq('course_id',course.id).maybeSingle();if(r.error)throw r.error;return r.data;}});
 const lessons=useQuery({queryKey:['cloud-lessons',session?.user.id,course.id],enabled:!!enrolled.data,queryFn:async()=>{const r=await supabase.from('course_lessons').select('*').eq('course_id',course.id).order('position');if(r.error)throw r.error;return r.data;}});
 const done=useQuery({queryKey:['lesson-completions',session?.user.id,course.id],enabled:!!enrolled.data,queryFn:async()=>{const r=await supabase.from('lesson_completions').select('lesson_id').eq('user_id',session?.user.id??'').eq('course_id',course.id);if(r.error)throw r.error;return new Set(r.data.map(x=>x.lesson_id));}});
 const toggle=useMutation({mutationFn:async(lessonId:string)=>{if(!session)throw new Error('Login required');const r=done.data?.has(lessonId)?await supabase.from('lesson_completions').delete().eq('user_id',session.user.id).eq('lesson_id',lessonId):await supabase.from('lesson_completions').insert({user_id:session.user.id,course_id:course.id,lesson_id:lessonId});if(r.error&&r.error.code!=='23505')throw r.error;},onSuccess:async()=>{await Promise.all([qc.invalidateQueries({queryKey:['lesson-completions']}),qc.invalidateQueries({queryKey:['course-quiz',course.id]})]);}});
 const member=useQuery({queryKey:['membership-category','courses',session?.user.id],enabled:!!session,queryFn:async()=>{const r=await supabase.rpc('has_membership_category',{_category:'courses'});if(r.error)throw r.error;return r.data;}});
 const memberEnroll=useMutation({mutationFn:async()=>{const r=await supabase.rpc('member_enroll',{_course_id:course.id});if(r.error)throw r.error;},onSuccess:()=>qc.invalidateQueries({queryKey:['cloud-enrollment']})});
 const enroll=useMutation({mutationFn:async()=>{if(!session)throw new Error('Login required');const r=await supabase.from('enrollments').insert({user_id:session.user.id,course_id:course.id});if(r.error&&r.error.code!=='23505')throw r.error;},onSuccess:()=>qc.invalidateQueries({queryKey:['cloud-enrollment']})});
 async function openResource(path:string){const r=await supabase.storage.from('course-resources').createSignedUrl(path,300);if(!r.error)setResource(r.data.signedUrl);}
 const off=amount<course.price&&course.price>0?Math.round((1-amount/course.price)*100):0;
 const action=!session?<Button asChild size="lg" className="w-full"><Link to="/auth" search={{redirect:`/courses/${course.id}`}}>{t('login_to_enroll')}</Link></Button>:enrolled.isPending?<p className="text-sm text-muted-foreground">{t('admin_loading')}</p>:enrolled.data?<p className="rounded-md border border-success/40 bg-success/10 p-3 text-sm font-semibold text-success">{t('enrolled')}</p>:member.data?<Button size="lg" className="w-full" disabled={memberEnroll.isPending} onClick={()=>memberEnroll.mutate()}>{t('member_enroll')}</Button>:amount===0?<Button size="lg" className="w-full" disabled={enroll.isPending} onClick={()=>enroll.mutate()}>{t('enroll_free')}</Button>:<ManualPay course={{...course,price:amount}} userId={session.user.id} className="w-full"/>;
 return <ProductDetailLayout
  back={<>
   <div className="hidden lg:block"><DetailBackLink to="/courses" label={t('all_courses')}/></div>
   <div className="flex items-center gap-3 lg:hidden"><Link to="/courses" aria-label={t('all_courses')} className="-ml-1 grid size-10 shrink-0 place-items-center rounded-full text-gold"><ArrowLeft className="size-6"/></Link><p className="truncate font-display text-2xl font-bold">{t('course_details')}</p></div>
  </>}
  asideClassName="max-lg:border-0 max-lg:bg-transparent max-lg:p-0 max-lg:shadow-none"
  header={<div className="flex flex-col gap-3">
   <h1 className="break-words font-display text-2xl font-bold leading-tight sm:text-3xl">{course.title}</h1>
   {course.instructor&&<p className="flex items-center gap-2 text-sm text-muted-foreground"><User className="h-4 w-4 shrink-0 text-primary"/>{course.instructor}</p>}
   {reviewCount>0&&<p className="flex items-center gap-2 text-sm text-muted-foreground"><Star className="size-4 fill-gold text-gold" aria-hidden="true"/><span className="font-bold text-gold">{avg.toFixed(1)}</span>({reviewCount} {t('reviews_count')})</p>}
   <div className="max-lg:order-first max-lg:rounded-2xl max-lg:ring-1 max-lg:ring-gold/50"><DetailCover src={course.thumbnail_url} alt={course.title} fallback={<BookOpen className="h-12 w-12"/>}/></div>
  </div>}
  aside={<div className="space-y-4">
   <div className="max-lg:hidden space-y-4">
   <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1"><span className="text-3xl font-bold text-gold">{amount?inr(amount):t('session_free')}</span>{amount!==course.price&&<s className="text-base text-muted-foreground">{inr(course.price)}</s>}{off>0&&<span className="rounded-full bg-gold/15 px-2.5 py-0.5 text-xs font-bold text-gold">{off}% off</span>}</div>
   {action}
   </div>
   {(toggle.isError||enroll.isError||memberEnroll.isError)&&<p role="alert" className="text-sm text-destructive">{t('admin_error')}</p>}
   <ProductSocial kind="course" id={course.id} title={course.title}/>
  </div>}>
   <div role="tablist" aria-label={t('course_details')} className="grid grid-cols-3 rounded-t-lg border-b border-border bg-card lg:hidden">
    {(['overview','curriculum','reviews'] as const).map(k=><button key={k} type="button" role="tab" aria-selected={tab===k} onClick={()=>setTab(k)} className={`border-b-2 px-2 py-3 text-sm font-semibold ${tab===k?'border-gold text-gold':'border-transparent text-muted-foreground'}`}>{t(k==='overview'?'tab_overview':k==='curriculum'?'tab_curriculum':'tab_reviews')}</button>)}
   </div>
  {course.description&&<section className={`rounded-xl border border-border bg-card p-4 sm:p-5 max-lg:border-0 max-lg:bg-transparent max-lg:p-0 ${only('overview')}`}><h2 className="mb-3 font-display text-xl font-bold lg:hidden">{t('about_course')}</h2><DetailDescription text={course.description}/></section>}
  <section className={`min-w-0 ${only('curriculum')}`}>
   <h2 className="font-display text-xl font-bold">{t('lessons')}</h2>
   <div className="mt-3 space-y-3">{lessons.data?.map(l=><article key={l.id} className="min-w-0 rounded-xl border border-border bg-card p-4">
    <h3 className="mb-3 break-words font-semibold">{l.position}. {l.title}</h3>
    {l.video_url&&(/\.(mp4|webm)(\?|$)/i.test(l.video_url)?<video controls preload="metadata" src={l.video_url} className="aspect-video w-full rounded-lg bg-muted"/>:<a href={l.video_url} target="_blank" rel="noopener noreferrer" className="break-all text-primary underline">{t('open_lesson')}</a>)}
    <div className="mt-3 flex flex-wrap gap-2">{l.resource_path&&<Button variant="outline" onClick={()=>openResource(l.resource_path)}>{t('tab_downloads')}</Button>}<Button variant={done.data?.has(l.id)?'secondary':'outline'} disabled={toggle.isPending||!done.data} aria-pressed={!!done.data?.has(l.id)} onClick={()=>toggle.mutate(l.id)}>{done.data?.has(l.id)?<CheckCircle2 className="text-success"/>:<Circle/>}{t(done.data?.has(l.id)?'lesson_completed':'lesson_mark_done')}</Button></div>
   </article>)}</div>
   {!enrolled.data&&<p className="mt-2 rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">{t('lessons_locked')}</p>}
   {enrolled.data&&!lessons.data?.length&&<p className="mt-4 text-muted-foreground">{t('admin_empty')}</p>}
   {resource&&<a href={resource} target="_blank" rel="noopener noreferrer" className="mt-4 block text-primary">{t('tab_downloads')}</a>}
  </section>
  {enrolled.data&&<div className={only('curriculum')}><CourseQuiz courseId={course.id}/></div>}
  <div className={`max-lg:[&>section]:mt-0 ${only('reviews')}`}><CourseReviews courseId={course.id} canReview={!!enrolled.data}/></div>
  <p className="text-xs text-muted-foreground">{t('disclaimer')}</p>
  <div className="h-24 lg:hidden" aria-hidden="true"/>
  <BodyPortal><div className="course-buy-bar fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 border-t border-border bg-card px-4 py-3 shadow-card lg:hidden">
   <div className="mx-auto grid max-w-3xl grid-cols-[minmax(0,1fr)_minmax(0,11rem)] items-center gap-3">
    <div className="min-w-0"><p className="text-xs text-muted-foreground">{t('course_fee')}</p><p className="flex flex-wrap items-baseline gap-x-2"><span className="font-display text-2xl font-bold text-gold">{amount?inr(amount):t('session_free')}</span>{amount!==course.price&&<s className="text-sm text-muted-foreground">{inr(course.price)}</s>}</p></div>
    <div className="min-w-0 [&_button]:w-full [&_a]:w-full">{action}</div>
   </div>
  </div></BodyPortal>
 </ProductDetailLayout>;
}

/** Fixed bars must live outside animated (transformed) page wrappers, or they scroll with the page. */
function BodyPortal({children}:{children:ReactNode}){const [el,setEl]=useState<HTMLElement|null>(null);useEffect(()=>setEl(document.body),[]);return el?createPortal(children,el):null;}
