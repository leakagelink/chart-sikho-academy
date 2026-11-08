import { queryOptions } from '@tanstack/react-query';
import { getWebsiteBanners } from './catalog.functions';
export const bannerQuery=()=>queryOptions({queryKey:['website-banners'],queryFn:()=>getWebsiteBanners(),staleTime:0});