import { queryOptions } from '@tanstack/react-query';
import { getHomeCategories } from './catalog.functions';

export const categoryQuery = () => queryOptions({ queryKey: ['home-categories'], queryFn: () => getHomeCategories(), staleTime: 0 });