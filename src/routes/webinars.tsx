import { createFileRoute } from '@tanstack/react-router';
import { productQuery } from '@/lib/product-query';
import { SessionListing } from '@/components/site/SessionListing';
import { pageMeta } from '@/lib/route-meta';
export const Route=createFileRoute('/webinars')({loader:({context})=>context.queryClient.ensureQueryData(productQuery()),head:()=>pageMeta('Webinars','Scheduled Chartसीखो webinars.'),component:()=> <SessionListing kind="webinar"/>});