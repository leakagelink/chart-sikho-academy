import { createFileRoute, Link, notFound } from '@tanstack/react-router';
import { SessionPurchase } from '@/components/site/SessionPurchase';
import { productQuery } from '@/lib/product-query';
import { pageMeta } from '@/lib/route-meta';
import { useLang } from '@/lib/i18n';
import { LiveClassThumbnail } from '@/components/site/LiveClassCard';
export const Route=createFileRoute('/live/$classId')({loader:async({context,params})=>{const data=await context.queryClient.ensureQueryData(productQuery());const session=data.sessions.find(s=>s.id===params.classId);if(!session)throw notFound();return session;},head:({loaderData})=>pageMeta(loaderData?.title??'Live class','Chartसीखो scheduled class details.'),component:Screen,notFoundComponent:()=> <Missing/>});
function Missing(){const {t}=useLang();return <p className="p-8">{t('no_results')}</p>;}
function Screen(){const session=Route.useLoaderData();const {t,lang}=useLang();return <section className="px-4 py-8"><Link to={session.kind==='seminar'?'/seminars':session.kind==='webinar'?'/webinars':'/live-classes'} className="text-primary">{t(session.kind==='seminar'?'cat_seminars':session.kind==='webinar'?'cat_webinars':'cat_live')}</Link><h1 className="my-5 font-display text-3xl font-bold">{session.title}</h1><div className="max-w-3xl"><LiveClassThumbnail title={session.title} thumbnailUrl={session.thumbnail_url}/></div><p className="mt-4">{new Date(session.starts_at).toLocaleString(lang==='hi'?'hi-IN':'en-IN')}</p><SessionPurchase session={session} details/><p className="mt-8 text-xs text-muted-foreground">{t('disclaimer')}</p></section>;}
