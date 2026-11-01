import { createFileRoute } from '@tanstack/react-router';
import { AdminPanel } from '@/components/site/AdminPanel';
import { pageMeta } from '@/lib/route-meta';
export const Route = createFileRoute('/_authenticated/admin/')({head:()=>pageMeta('Administration dashboard','Manage Chartसीखो courses, students, bookings and reports securely.'),component:()=> <AdminPanel section="overview" query="" status="all" cat="all" when="all"/>});