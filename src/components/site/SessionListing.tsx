import { useSuspenseQuery } from '@tanstack/react-query';
import { productQuery } from '@/lib/product-query';
import { useLang } from '@/lib/i18n';
import { LiveClassThumbnail } from './LiveClassCard';
export function SessionListing({kind}:{kind:'class'|'webinar'}) {
  const {data}=useSuspenseQuery(productQuery());const {t,lang}=useLang();const sessions=data.sessions.filter(s=>s.kind===kind);
  return <section className="px-4 py-8"><h1 className="font-display text-3xl font-bold">{t(kind==='class'?'cat_live':'cat_webinars')}</h1><div className="live-class-grid mt-6 grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">{sessions.map(s=><article key={s.id} className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-card"><LiveClassThumbnail title={s.title} thumbnailUrl={s.thumbnail_url}/><div className="space-y-3 p-4"><h2 className="break-words font-semibold">{s.title}</h2><p className="text-sm text-muted-foreground">{new Intl.DateTimeFormat(lang==='hi'?'hi-IN':'en-IN',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Kolkata'}).format(new Date(s.starts_at))}</p></div></article>)}</div>{!sessions.length&&<p className="mt-6 text-muted-foreground">{t('admin_empty')}</p>}</section>;
}