import { createFileRoute, Outlet } from '@tanstack/react-router';
import { adminQuery } from '@/lib/admin-query';
import { AdminError } from '@/components/site/AdminPanel';
export const Route = createFileRoute('/_authenticated/admin')({
  loader:({context})=>context.queryClient.ensureQueryData(adminQuery()),
  errorComponent:AdminError,
  notFoundComponent:AdminError,
  component:()=> <div className="admin-surface"><Outlet/></div>,
});