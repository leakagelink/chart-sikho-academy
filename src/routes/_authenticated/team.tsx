import { createFileRoute } from '@tanstack/react-router';
import { StudentReferrals } from '@/components/site/StudentReferrals';
import { studentReferralsOptions } from '@/lib/student-referrals';
import { pageMeta } from '@/lib/route-meta';

export const Route = createFileRoute('/_authenticated/team')({
  head: () => pageMeta('My Affiliate Team', 'Your ChartSikho direct team members and joining dates.'),
  loader: async ({ context }) => { await context.queryClient.ensureQueryData(studentReferralsOptions(context.user.id)); },
  component: Page,
});
function Page() { const { user } = Route.useRouteContext(); return <StudentReferrals userId={user.id} mode="team" />; }