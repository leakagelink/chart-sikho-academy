import { createFileRoute } from '@tanstack/react-router';
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { BadgeCheck, CircleX } from 'lucide-react';
import { verifyCertificate } from '@/lib/catalog.functions';
import { useLang } from '@/lib/i18n';

const certQuery = (no: string) => queryOptions({ queryKey: ['verify-cert', no], queryFn: () => verifyCertificate({ data: { no } }) });

export const Route = createFileRoute('/verify/$certificateNo')({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(certQuery(params.certificateNo)),
  head: ({ params }) => ({ meta: [
    { title: `Certificate ${params.certificateNo} — ChartSikho` },
    { name: 'description', content: 'Check whether a ChartSikho course certificate is genuine.' },
    { property: 'og:title', content: `Verify certificate ${params.certificateNo} — ChartSikho` },
    { property: 'og:description', content: 'Check whether a ChartSikho course certificate is genuine.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
  ] }),
  component: VerifyPage,
});

function VerifyPage() {
  const { certificateNo } = Route.useParams(); const { t, lang } = useLang();
  const { data } = useSuspenseQuery(certQuery(certificateNo));
  const ok = data?.status === 'issued';
  return <section className="mx-auto max-w-lg px-4 py-14">
    <h1 className="mb-6 font-display text-3xl font-bold">{t('verify_title')}</h1>
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="mb-4 flex items-center gap-3">{ok ? <BadgeCheck className="text-success" size={32}/> : <CircleX className="text-destructive" size={32}/>}<p className="font-semibold">{!data ? t('verify_missing') : ok ? t('verify_valid') : t('verify_revoked')}</p></div>
      <p className="font-mono text-sm text-muted-foreground">{certificateNo.toUpperCase()}</p>
      {data && <dl className="mt-4 grid gap-3 text-sm">
        <div><dt className="text-muted-foreground">{t('verify_name')}</dt><dd className="font-semibold">{data.student_name || '—'}</dd></div>
        <div><dt className="text-muted-foreground">{t('verify_course')}</dt><dd className="font-semibold">{data.course_title}</dd></div>
        <div><dt className="text-muted-foreground">{t('verify_date')}</dt><dd className="font-semibold">{new Date(data.issued_at).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN')}</dd></div>
      </dl>}
    </div>
  </section>;
}
