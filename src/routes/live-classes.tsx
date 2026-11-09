import { createFileRoute } from '@tanstack/react-router';
import { productQuery } from '@/lib/product-query';
import { SessionListing } from '@/components/site/SessionListing';
import { pageMeta } from '@/lib/route-meta';
export const Route=createFileRoute('/live-classes')({loader:({context})=>context.queryClient.ensureQueryData(productQuery()),head:()=>pageMeta('Live Classes','Scheduled Chartसीखो live classes.'),component:()=> <SessionListing kind="class"/>});