import { useQuery } from '@tanstack/react-query';
import { productQuery } from '@/lib/product-query';
import { SessionCard } from './LiveClassCard';

export function ScheduledLiveClasses({ kind = 'class' }: { kind?: 'class' | 'webinar' | 'seminar' }) {
  const { data } = useQuery(productQuery());
  return data?.sessions.filter(s => s.kind === kind).map(s => <SessionCard key={s.id} session={s} />);
}
