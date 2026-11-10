import { useQuery } from '@tanstack/react-query';
import { SessionPurchase } from './SessionPurchase';
import { Link } from '@tanstack/react-router';
import { productQuery } from '@/lib/product-query';
import { LiveClassThumbnail, SessionDateSocial } from './LiveClassCard';
import { MapPin } from 'lucide-react';
import { seminarPlace } from './SeminarVenue';

export function ScheduledLiveClasses({ kind = 'class' }: { kind?: 'class' | 'webinar' | 'seminar' }) {
  const { data } = useQuery(productQuery());
  return data?.sessions.filter(s => s.kind === kind).map(s => <article key={s.id} className="live-class-card flex h-full min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-card">
    <LiveClassThumbnail title={s.title} thumbnailUrl={s.thumbnail_url} />
    <div className="flex flex-1 flex-col gap-3 p-4">
      <h3 className="break-words font-semibold leading-snug"><Link to="/live/$classId" params={{ classId: s.id }} className="hover:text-primary hover:underline">{s.title}</Link></h3>
      <SessionDateSocial session={s} />
      {seminarPlace(s)&&<p className="flex items-start gap-2 text-xs text-muted-foreground"><MapPin className="h-4 w-4 shrink-0"/>{seminarPlace(s)}</p>}<SessionPurchase session={s}/>
    </div>
  </article>);
}