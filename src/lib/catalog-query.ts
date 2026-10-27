import {queryOptions} from '@tanstack/react-query';
import {getPublishedCatalog} from './catalog.functions';
export const catalogQuery=()=>queryOptions({queryKey:['published-catalog'],queryFn:()=>getPublishedCatalog(),staleTime:30000});