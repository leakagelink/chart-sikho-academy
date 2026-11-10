import { createFileRoute, notFound } from '@tanstack/react-router';
import { Calendar, Video } from 'lucide-react';
import { SessionPurchase } from '@/components/site/SessionPurchase';
import { productQuery } from '@/lib/product-query';
import { pageMeta } from '@/lib/route-meta';
import { useLang } from '@/lib/i18n';
import { SeminarVenue } from '@/components/site/SeminarVenue';
import { DetailBackLink, DetailCover, ProductDetailLayout } from '@/components/site/ProductDetailLayout';

export const Route=createFileRoute('/live/$classId')({loader:async({context,params})=>{const data=await context.queryClient.ensureQueryData(productQuery());const session=data.sessions.find(s=>s.id===params.classId);if(!session)throw notFound();return session;},head:({loaderData})=>pageMeta(loaderData?.title??'Live class','Chartसीखो scheduled class details.'),component:Screen,notFoundComponent:()=> <Missing/>});
function Missing(){const {t}=useLang();return <p className="p-8">{t('no_results')}</p>;}
function Screen(){
  const session=Route.useLoaderData();const {t,lang}=useLang();
  const label=t(session.kind==='seminar'?'cat_seminars':session.kind==='webinar'?'cat_webinars':'cat_live');
  const when=new Intl.DateTimeFormat(lang==='hi'?'hi-IN':'en-IN',{dateStyle:'full',timeStyle:'short',timeZone:'Asia/Kolkata'}).format(new Date(session.starts_at));
  return <ProductDetailLayout
    back={<DetailBackLink to={session.kind==='seminar'?'/seminars':session.kind==='webinar'?'/webinars':'/live-classes'} label={label}/>}
    header={<>
      <span className="inline-flex rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-gold">{label}</span>
      <h1 className="break-words font-display text-2xl font-bold leading-tight sm:text-3xl">{session.title}</h1>
      <DetailCover src={session.thumbnail_url} alt={session.title} fallback={<Video className="h-12 w-12"/>}/>
    </>}
    aside={<>
      <p className="flex items-start gap-2 text-sm text-muted-foreground"><Calendar className="mt-0.5 h-4 w-4 shrink-0 text-primary"/><span className="min-w-0 break-words">{when}</span></p>
      <SessionPurchase session={session} details/>
    </>}>
    <SeminarVenue session={session}/>
    <p className="text-xs text-muted-foreground">{t('disclaimer')}</p>
  </ProductDetailLayout>;
}
