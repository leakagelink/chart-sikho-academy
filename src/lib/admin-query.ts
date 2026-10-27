import { queryOptions } from '@tanstack/react-query';
import { getAdminData } from './admin.functions';
export const adminQuery = () => queryOptions({ queryKey:['real-admin'],queryFn:()=>getAdminData(),staleTime:30_000,retry:false });