import { MapPin, Phone, Mail, User } from 'lucide-react';
import { useLang } from '@/lib/i18n';

type Venue = { venue?: string | null; address?: string | null; city?: string | null; state?: string | null; country?: string | null; pin_code?: string | null; support_name?: string | null; support_phone?: string | null; support_email?: string | null };

export function seminarPlace(s: Venue) {
  return [s.venue, s.city].filter(Boolean).join(', ');
}

export function SeminarVenue({ session }: { session: Venue }) {
  const { t } = useLang();
  const line = [session.address, session.city, session.state, session.pin_code, session.country].filter(Boolean).join(', ');
  const hasPlace = !!(session.venue || line);
  const hasSupport = !!(session.support_name || session.support_phone || session.support_email);
  if (!hasPlace && !hasSupport) return null;
  return <div className="mt-6 grid max-w-3xl gap-4 sm:grid-cols-2">
    {hasPlace && <div className="rounded-lg border border-border bg-card p-4">
      <h2 className="mb-2 font-display text-lg font-bold">{t('seminar_venue_heading')}</h2>
      <p className="flex items-start gap-2 text-sm"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>{session.venue && <strong className="block">{session.venue}</strong>}{line}</span></p>
    </div>}
    {hasSupport && <div className="rounded-lg border border-border bg-card p-4">
      <h2 className="mb-2 font-display text-lg font-bold">{t('seminar_support_heading')}</h2>
      <div className="space-y-1.5 text-sm">
        {session.support_name && <p className="flex items-center gap-2"><User className="h-4 w-4 text-primary" />{session.support_name}</p>}
        {session.support_phone && <a href={`tel:${session.support_phone.replace(/[^0-9+]/g, '')}`} className="flex items-center gap-2 hover:text-primary"><Phone className="h-4 w-4 text-primary" />{session.support_phone}</a>}
        {session.support_email && <a href={`mailto:${session.support_email}`} className="flex items-center gap-2 break-all hover:text-primary"><Mail className="h-4 w-4 text-primary" />{session.support_email}</a>}
      </div>
    </div>}
  </div>;
}
