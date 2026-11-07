import { createFileRoute } from '@tanstack/react-router';
import { StudentReferrals } from '@/components/site/StudentReferrals';
import { studentReferralsOptions } from '@/lib/student-referrals';
import { pageMeta } from '@/lib/route-meta';

export const Route = createFileRoute('/_authenticated/referrals')({
  head: () => pageMeta('My Referral Tree', 'Your ChartSikho direct referrals and personal referral code.'),
  loader: async ({ context }) => { await context.queryClient.ensureQueryData(studentReferralsOptions(context.user.id)); },
  component: Page,
});
function Page() { const { user } = Route.useRouteContext(); return <StudentReferrals userId={user.id} mode="tree" />; }