import { useQuery } from '@tanstack/react-query';
import { SessionPurchase } from './SessionPurchase';
import { Calendar } from 'lucide-react';
import { productQuery } from '@/lib/product-query';
import { useLang } from '@/lib/i18n';
import { LiveClassThumbnail } from './LiveClassCard';

export function ScheduledLiveClasses() {
  const { data } = useQuery(productQuery());
  const { lang } = useLang();
  return data?.sessions.filter(s => s.kind === 'class').map(s => <article key={s.id} className="live-class-card flex h-full min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-card">
    <LiveClassThumbnail title={s.title} thumbnailUrl={s.thumbnail_url} />
    <div className="flex flex-1 flex-col gap-3 p-4">
      <h3 className="break-words font-semibold leading-snug">{s.title}</h3>
      <p className="flex items-start gap-2 text-xs text-muted-foreground"><Calendar className="h-4 w-4 shrink-0" />{new Intl.DateTimeFormat(lang === 'hi' ? 'hi-IN' : 'en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }).format(new Date(s.starts_at))}</p>
      <SessionPurchase session={s}/>
    </div>
  </article>);
}