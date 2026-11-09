import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { BookOpen, Calendar, PlayCircle, Trophy, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CloudCourseCard } from "@/components/site/CloudCourseCard";
import { catalogQuery } from "@/lib/catalog-query";
import { productQuery } from "@/lib/product-query";
import { useLang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { ScheduledLiveClasses } from "@/components/site/ScheduledLiveClasses";
import { StudentCharts } from "@/components/site/StudentCharts";
import { KycStatus } from '@/components/site/KycStatus';
import { WebsiteBanners } from '@/components/site/WebsiteBanners';
import { bannerQuery } from '@/lib/banner-query';
import { ProductSocial } from '@/components/site/ProductSocial';

export const Route = createFileRoute("/_authenticated/dashboard")({
  loader:({context})=>Promise.all([context.queryClient.ensureQueryData(bannerQuery()),context.queryClient.ensureQueryData(catalogQuery()),context.queryClient.ensureQueryData(productQuery())]),
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "My Learning — Chartसीखो" },
      { name: "description", content: "Your Chartसीखो student portal: courses, progress and live classes." },
      { property: "og:title", content: "My Learning — Chartसीखो" },
      { property: "og:description", content: "Your Chartसीखो student portal." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { t, lang } = useLang();
  const { user } = Route.useRouteContext();
  const {data:catalog}=useSuspenseQuery(catalogQuery());const {data:products}=useSuspenseQuery(productQuery());

  const profile = useQuery({
    queryKey: ["profile", user.id],
    queryFn: async () => (await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle()).data,
  });
  const enrolls = useQuery({
    queryKey: ["enrollments", user.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("enrollments").select("course_id, progress, last_lesson").eq('user_id',user.id).order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const cloudCourses=useQuery({queryKey:['my-cloud-courses',user.id],queryFn:async()=>{const r=await supabase.from('courses').select('id,title');if(r.error)throw r.error;return r.data;}});

  const mine=(enrolls.data??[]).flatMap(e=>{const course=cloudCourses.data?.find(c=>c.id===e.course_id);return course?[{...e,course}]:[];});
  const enrolledIds=new Set(mine.map(m=>m.course_id));
  const name=profile.data?.full_name||user.email?.split('@')[0];
  const avg=mine.length?Math.round(mine.reduce((sum,m)=>sum+m.progress,0)/mine.length):0;
  return (
    <div className="w-full px-4 pt-8">
      <p className="text-muted-foreground">{t("namaste")} 👋</p>
      <h1 className="font-display text-3xl font-bold text-foreground">{name}</h1>
      <KycStatus />
      <WebsiteBanners page="dashboard" />

      <div className="mt-6 grid grid-cols-1 gap-3 min-[360px]:grid-cols-3">
        {[
          { icon: BookOpen, v: mine.length, l: t("my_courses") },
          { icon: Trophy, v: `${avg}%`, l: t("avg_progress") },
          { icon: Calendar, v: products.sessions.filter(s=>s.kind==='class').length, l: t("upcoming_short") },
        ].map(({ icon: I, v, l }) => (
          <div key={l} className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <I className="h-5 w-5 text-primary" />
            <p className="mt-2 text-2xl font-bold text-foreground">{v}</p>
            <p className="text-xs text-muted-foreground">{l}</p>
          </div>
        ))}
      </div>

      <StudentCharts userId={user.id} progress={mine.map(m=>({name:m.course.title.slice(0,22),progress:m.progress}))} />

      <section className="mt-8">
        <h2 className="font-display text-2xl font-bold text-foreground">{t("my_courses")}</h2>
        {(enrolls.data??[]).filter(e=>cloudCourses.data?.some(c=>c.id===e.course_id)).map(e=><article key={e.course_id} className="mt-4 border-b border-border py-4"><h3 className="font-semibold">{cloudCourses.data?.find(c=>c.id===e.course_id)?.title}</h3><Button asChild className="mt-3"><Link to="/courses/$courseId" params={{courseId:e.course_id}}>{t('open_lesson')}</Link></Button><ProductSocial kind="course" id={e.course_id} title={cloudCourses.data?.find(c=>c.id===e.course_id)?.title??''}/></article>)}
        {!enrolls.isLoading&&!mine.length&&<p className="mt-4 text-muted-foreground">{t('no_enrollments')}</p>}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-bold text-foreground">{t("upcoming")}</h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <ScheduledLiveClasses />
        </div>
      </section>

      <section className="mt-10">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <h2 className="font-display text-2xl font-bold text-foreground">{t("explore_more")}</h2>
          <Link to="/courses" className="text-sm font-semibold text-primary">{t("see_all")} →</Link>
        </div>
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {catalog.filter(c=>!enrolledIds.has(c.id)).slice(0,4).map(c=><CloudCourseCard key={c.id} course={c}/>)}
        </div>
      </section>
    </div>
  );
}
