import { createFileRoute } from '@tanstack/react-router';
import { productQuery } from '@/lib/product-query';
import { SessionListing } from '@/components/site/SessionListing';
import { pageMeta } from '@/lib/route-meta';

export const Route = createFileRoute('/seminars')({
  loader: ({ context }) => context.queryClient.ensureQueryData(productQuery()),
  head: () => pageMeta('Seminars', 'Browse scheduled Chartसीखो seminars, dates and free or paid access.'),
  component: () => <SessionListing kind="seminar" />,
});