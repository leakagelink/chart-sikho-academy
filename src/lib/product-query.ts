import { queryOptions } from '@tanstack/react-query';
import { getPublishedProducts } from './catalog.functions';
export const productQuery = () => queryOptions({ queryKey: ['published-products'], queryFn: () => getPublishedProducts(), staleTime: 30000 });