import { queryOptions } from '@tanstack/react-query';
import { getPublishedPlans } from './plans.functions';

export const plansQuery = queryOptions({queryKey: ['membership-plans'], queryFn: () => getPublishedPlans(), staleTime: 0});