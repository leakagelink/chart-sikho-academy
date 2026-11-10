import { Calendar, Video } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { ProductSocial } from './ProductSocial';

export function LiveClassThumbnail({ title, thumbnailUrl }: { title: string; thumbnailUrl?: string }) {
  return <div className="live-class-cover relative aspect-video w-full shrink-0 overflow-hidden bg-muted">
    {thumbnailUrl?<img src={thumbnailUrl} alt={title} loading="lazy" decoding="async" className="block h-full w-full object-contain" />:<div className="grid h-full place-items-center"><Video className="h-10 w-10 text-muted-foreground" /></div>}
  </div>;
}

/** Session card date row with compact Like / Comment / Share on the right. */
export function SessionDateSocial({ session }: { session: { id: string; title: string; starts_at: string } }) {
  const { lang } = useLang();
  return <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
    <p className="flex min-w-0 items-start gap-1.5 text-xs text-muted-foreground"><Calendar className="mt-px h-4 w-4 shrink-0" /><span className="min-w-0 break-words">{new Intl.DateTimeFormat(lang === 'hi' ? 'hi-IN' : 'en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }).format(new Date(session.starts_at))}</span></p>
    <ProductSocial compact kind="session" id={session.id} title={session.title} className="-mr-2 shrink-0" />
  </div>;
}
