import { queryOptions } from '@tanstack/react-query';
import { getMyKyc } from './kyc.functions';
export const myKycQuery=()=>queryOptions({queryKey:['my-kyc'],queryFn:()=>getMyKyc(),staleTime:0});