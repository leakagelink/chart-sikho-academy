import { Link } from '@tanstack/react-router';
import { Calendar, MapPin, Video } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { inr } from '@/lib/courses';
import { ProductSocial } from './ProductSocial';
import { SessionPurchase, type PurchasableSession } from './SessionPurchase';
import { seminarPlace } from './SeminarVenue';

export function LiveClassThumbnail({ title, thumbnailUrl }: { title: string; thumbnailUrl?: string | undefined }) {
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

type SessionCardData = PurchasableSession & { starts_at: string; thumbnail_url?: string; venue?: string | null; city?: string | null };

/** Shared live class / webinar / seminar card: full thumbnail on top (phones add Upcoming and price badges), then details and the Join action. */
export function SessionCard({ session: s, heading = 'h3' }: { session: SessionCardData; heading?: 'h2' | 'h3' }) {
  const { t } = useLang();
  const Heading = heading;
  const upcoming = Date.parse(s.starts_at) >= Date.now();
  const place = seminarPlace(s);
  return <article className="live-class-card session-card flex h-full min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-card">
    <div className="relative">
      <LiveClassThumbnail title={s.title} thumbnailUrl={s.thumbnail_url} />
      <div className="session-badges pointer-events-none absolute inset-x-2 top-2 flex items-start justify-between gap-2 lg:hidden">
        <span className={`session-badge ${upcoming ? 'session-badge-live' : ''}`}>{upcoming && <span className="session-dot" aria-hidden="true" />}{t(upcoming ? 'upcoming_tab' : 'session_past')}</span>
        <span className="session-badge session-badge-price">{s.access_mode === 'free' ? t('session_free') : inr(s.price)}</span>
      </div>
    </div>
    <div className="flex flex-1 flex-col gap-3 p-4">
      <Heading className="break-words font-semibold leading-snug"><Link to="/live/$classId" params={{ classId: s.id }} className="hover:text-primary hover:underline">{s.title}</Link></Heading>
      <SessionDateSocial session={s} />
      {place && <p className="flex items-start gap-2 text-xs text-muted-foreground"><MapPin className="h-4 w-4 shrink-0" />{place}</p>}
      <SessionPurchase session={s} />
    </div>
  </article>;
}
