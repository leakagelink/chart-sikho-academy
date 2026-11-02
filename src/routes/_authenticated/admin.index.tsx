import { createFileRoute } from '@tanstack/react-router';
import { AdminPanel } from '@/components/site/AdminPanel';
import { pageMeta } from '@/lib/route-meta';
import { useSuspenseQuery } from '@tanstack/react-query';
import { adminQuery } from '@/lib/admin-query';
import { adminSections } from '@/lib/admin-rules';
import { canAccess } from '@/lib/admin-permissions';
export const Route = createFileRoute('/_authenticated/admin/')({head:()=>pageMeta('Administration dashboard','Manage Chartसीखो courses, students and records securely.'),component:Screen});
function Screen(){const {data}=useSuspenseQuery(adminQuery());const section=adminSections.find(s=>canAccess(data.access,s))??'overview';return <AdminPanel section={section} query="" status="all" cat="all" when="all" rank="all"/>;}
