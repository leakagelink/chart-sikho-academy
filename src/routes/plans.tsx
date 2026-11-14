import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Crown, Lock } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ManualPay } from '@/components/site/ManualPay';
import { useEffect, useState } from 'react';
import { inr } from "@/lib/courses";
import { useLang } from "@/lib/i18n";
import { useSuspenseQuery } from '@tanstack/react-query';
import { plansQuery } from '@/lib/plans-query';
import { Button } from '@/components/ui/button';
import { planCategories } from '@/lib/plans';
import { ProductSocial } from '@/components/site/ProductSocial';

export const Route = createFileRoute("/plans")({
  loader: ({context}) => context.queryClient.ensureQueryData(plansQuery),
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Membership Plans — Chartसीखो" },
      { name: "description", content: "Compare Chartसीखो membership prices, included product categories and access durations." },
      { property: "og:title", content: "Membership Plans — Chartसीखो" },
      { property: "og:description", content: "Compare Chartसीखो membership prices, included product categories and access durations." },
    ],
  }),
  component: PlansPage,
});

function PlansPage() {
  const { t, lang } = useLang();
  const {data: plans} = useSuspenseQuery(plansQuery);
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => { supabase.auth.getUser().then(r => setUserId(r.data.user?.id ?? null)); }, []);
  const member = useQuery({ queryKey: ['my-membership', userId], enabled: !!userId, queryFn: async () => { const r = await supabase.rpc('my_membership'); if (r.error) throw r.error; return r.data as { active: boolean; plan_name?: string; expires_at?: string | null; plan_ids?: string[] }; } });
  return (
    <div className="w-full px-4 pt-8">
      <div className="text-center">
        <Crown className="mx-auto h-10 w-10 text-gold" />
        <h1 className="mt-2 font-display text-3xl font-bold text-foreground">{t("membership_t")}</h1>
        <p className="mt-2 text-muted-foreground">{t("membership_s")}</p>
      </div>
      {member.data?.active && <p className="mx-auto mt-6 max-w-xl rounded-lg border border-success bg-card p-3 text-center text-sm text-foreground">{t('member_active')}: <b>{member.data.plan_name}</b> — {member.data.expires_at ? `${t('member_until')} ${new Date(member.data.expires_at).toLocaleDateString(lang==='hi'?'hi-IN':'en-IN')}` : t('plan_lifetime')}</p>}
      {!plans.length && <p className="mt-8 text-center text-muted-foreground">{t('plans_empty')}</p>}
      <div className="mx-auto mt-8 grid max-w-6xl items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3">
        {plans.map((p) => (
          <div key={p.id} id={`plan-${p.id}`} className={`relative flex min-w-0 flex-col rounded-lg border bg-card p-6 shadow-card ${p.popular ? "border-primary" : "border-border"}`}>
            {p.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-bold text-primary-foreground">{t("most_popular")}</span>}
            <h2 className="break-words font-display text-lg font-bold text-foreground">{lang==='hi' ? p.name_hi || p.name_en : p.name_en}</h2>
            <p className="mt-2 flex flex-wrap items-baseline gap-2"><span className="text-3xl font-bold text-foreground">{inr(p.price)}</span> <span className="text-sm text-muted-foreground">/ {p.access_days>0 ? `${p.access_days} ${t('admin_access_days')}` : t(p.billing_period==='monthly'?'per_month':p.billing_period==='yearly'?'per_year':'plan_lifetime')}</span></p>
            <ul className="mb-5 mt-4 flex-1 space-y-2 text-sm">
              {planCategories.filter(c=>p.access_categories.includes(c)).map(c=><li key={c} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success"/><span>{t(`plan_category_${c}`)}</span></li>)}
              {(lang==='hi' ? p.features_hi || p.features_en : p.features_en).split('\n').map(k=>k.trim()).filter(Boolean).map((k,i) => (
                <li key={i} className="flex items-start gap-2 break-words"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /><span className="min-w-0 break-words">{k}</span></li>
              ))}
            </ul>
            {userId && member.data?.plan_ids?.includes(p.id) ? <Button size="lg" variant="outline" disabled className="w-full border-success text-success disabled:opacity-100"><CheckCircle2 className="h-4 w-4" />{t('current_plan')}</Button> : userId ? <ManualPay productType="plan" userId={userId} course={{ id: p.id, title: p.name_en, price: p.price }} /> : <Button asChild variant={p.popular?'default':'outline'} className="w-full"><Link to="/auth" search={{ redirect: '/plans' }}>{t("choose_plan")}</Link></Button>}
            <ProductSocial kind="plan" id={p.id} title={p.name_en}/>
          </div>
        ))}
      </div>
      <p className="mt-6 flex items-start justify-center gap-1.5 text-center text-xs text-muted-foreground"><Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {t("plan_pay_note")}</p>
    </div>
  );
}
