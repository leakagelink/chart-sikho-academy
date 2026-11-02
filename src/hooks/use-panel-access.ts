import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { useAuth } from './use-auth';
import { getPanelAccess } from '@/lib/admin-permissions.functions';

export function usePanelAccess(){
  const {session}=useAuth();const fetchAccess=useServerFn(getPanelAccess);
  const q=useQuery({queryKey:['panel-access',session?.user.id],queryFn:()=>fetchAccess(),enabled:!!session,retry:false,staleTime:0,refetchInterval:15_000});
  return !!session&&!!q.data&&(q.data.isAdmin||q.data.permissions.some(p=>p.action==='view'));
}